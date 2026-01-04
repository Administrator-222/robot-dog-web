<!-- 修改后的完整 PathMap.vue -->
<template>
  <div class="map-wrapper">
    <div class="map-header">
      <span class="title">2D 路径与位置监控</span>
      <div class="legend">
        <span class="item"><i class="dot planning"></i> 规划路径</span>
        <span class="item"><i class="dot real"></i> 实时轨迹</span>
        <span class="item"><i class="dot current"></i> 当前位置</span>
      </div>
    </div>

    <div id="leaflet-map" class="leaflet-container"></div>

    <div class="map-overlay">
      <div v-if="isDrawMode" class="draw-tip">点击地图添加路径点...</div>

      <el-button-group>
        <el-button
          :type="isDrawMode ? 'danger' : 'primary'"
          size="small"
          @click="toggleDrawMode"
          :disabled="isExecuting"
        >
          {{ isDrawMode ? "完成选点" : "手动选点" }}
        </el-button>

        <el-button
          v-if="!isExecuting"
          type="success"
          size="small"
          @click="executePath"
          :disabled="plannedPoints.length === 0"
        >
          执行路径
        </el-button>

        <template v-else>
          <el-button
            v-if="!store.isPaused"
            type="warning"
            size="small"
            @click="pausePath"
          >
            暂停
          </el-button>
          <el-button v-else type="success" size="small" @click="resumePath">
            继续
          </el-button>

          <el-button type="danger" size="small" @click="stopPath">
            终止
          </el-button>
        </template>

        <el-button
          type="info"
          size="small"
          @click="resetMap"
          :disabled="isExecuting"
        >
          重置地图
        </el-button>
      </el-button-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { useRobotStore } from '@/stores/robotStore'
// import { storeToRefs } from 'pinia'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  currentPos: [number, number] // [x, y] 米为单位
}>()

const store = useRobotStore()
// const { isPaused } = storeToRefs(store)
const isExecuting = ref(false)
const isDrawMode = ref(false)

// Leaflet相关变量
let map: L.Map | null = null
let currentMarker: L.CircleMarker | null = null
let realPolyline: L.Polyline | null = null
let plannedPolyline: L.Polyline | null = null
let markers: L.Marker[] = []

const realPathPoints: [number, number][] = []
const plannedPoints = ref<[number, number][]>([])

// ✅ 修复关键：坐标转换函数
// 米坐标 -> 经纬度（使用A项目的scale和offset逻辑）
const toLatLng = (pos: [number, number]): [number, number] => {
  // 使用A项目原来的转换逻辑，但转换为经纬度
  const scale = 0.0001  // 1米 = 0.0001度（大约）
  const offsetX = 106.78753148477476  // 经度偏移
  const offsetY = 29.715071369111868   // 纬度偏移
  
  // 注意：Leaflet是[纬度, 经度]，而A项目是[x, y]
  // 假设x对应经度，y对应纬度
  return [
    offsetY + pos[1] * scale,  // 纬度 = offsetY + y * scale
    offsetX + pos[0] * scale   // 经度 = offsetX + x * scale
  ]
}

// 经纬度 -> 米坐标
const fromLatLng = (latlng: [number, number]): [number, number] => {
  const scale = 0.0001
  const offsetX = 106.78753148477476
  const offsetY = 29.715071369111868
  
  return [
    (latlng[1] - offsetX) / scale,  // x = (经度 - offsetX) / scale
    (latlng[0] - offsetY) / scale   // y = (纬度 - offsetY) / scale
  ]
}

// 初始化Leaflet地图
const initMap = () => {
  if (!document.getElementById("leaflet-map")) return;
  
  // 使用初始位置（转换为经纬度）
  const initialPos = toLatLng([0, 0])  // 从(0,0)米开始
  map = L.map("leaflet-map").setView(initialPos, 18);

  // 添加OpenStreetMap图层
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 21,
  }).addTo(map);

  // 创建实时轨迹线
  realPolyline = L.polyline([], { 
    color: "#409EFF", 
    weight: 4,
    opacity: 0.8
  }).addTo(map);

  // 创建规划路径线（虚线）
  plannedPolyline = L.polyline([], {
    color: "#67C23A",
    weight: 4,
    dashArray: "10, 10",
    opacity: 0.8
  }).addTo(map);

  // 创建当前位置标记（更大的红点）
  currentMarker = L.circleMarker(initialPos, {
    color: "#fff",
    fillColor: "#F56C6C",
    fillOpacity: 1,
    radius: 12,  // 增大半径，更明显
    weight: 3,
  }).addTo(map);

  // 添加点击事件（选点模式）
  map.on("click", onMapClick);
  
  console.log("地图初始化完成，初始位置:", initialPos);
};

// 地图点击处理
const onMapClick = (e: L.LeafletMouseEvent) => {
  if (!isDrawMode.value || !map) return;
  const { lat, lng } = e.latlng;
  const newPoint: [number, number] = [lat, lng];

  plannedPoints.value.push(newPoint);
  plannedPolyline?.setLatLngs(plannedPoints.value);

  // 添加路径点标记
  const marker = L.marker(newPoint, {
    icon: L.divIcon({
      className: "custom-div-icon",
      html: `<div style="background-color:#67C23A;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    }),
  }).addTo(map);
  markers.push(marker);
  
  console.log("添加路径点:", newPoint, "转换回米坐标:", fromLatLng(newPoint));
};

// 切换选点模式
const toggleDrawMode = () => {
  isDrawMode.value = !isDrawMode.value;
  if (isDrawMode.value) {
    ElMessage.info("已进入选点模式，请在地图上点击添加路径点");
    if (map) {
      map.dragging.disable();  // 选点时禁用地图拖拽
    }
  } else {
    ElMessage.success("选点模式已结束");
    if (map) {
      map.dragging.enable();  // 恢复地图拖拽
    }
  }
};

// 执行路径
const executePath = () => {
  if (plannedPoints.value.length === 0) return;
  isExecuting.value = true;
  store.isPaused = false;
  
  // 将经纬度坐标转换回米坐标
  const pathInMeters = plannedPoints.value.map(point => fromLatLng(point));
  
  store.sendCommand({
    type: "EXEC_PATH",
    points: pathInMeters,
  });
  
  ElMessage.success("开始执行路径规划");
  console.log("执行路径，点数:", pathInMeters.length, "路径数据:", pathInMeters);
};

// 暂停路径
const pausePath = () => {
  if (!isExecuting.value) return;
  store.isPaused = true;
  store.sendCommand({
    type: "PAUSE_PATH",
    params: "HOLD",
  });
  ElMessage.warning("路径执行已暂停");
};

// 恢复路径
const resumePath = () => {
  store.isPaused = false;
  store.sendCommand({ type: "RESUME_PATH" });
  ElMessage.success("继续执行路径");
};

// 停止路径
const stopPath = () => {
  isExecuting.value = false;
  store.isPaused = false;
  
  // 通知后端终止运动
  store.sendCommand({ type: "STOP_PATH" });
  store.sendCommand({ type: "MOVE", direction: "STOP" });
  
  // 清空规划数据
  plannedPoints.value = [];
  plannedPolyline?.setLatLngs([]);
  clearMarkers();
  
  // 退出选点模式
  isDrawMode.value = false;
  
  ElMessage.info("路径执行已终止");
};

// 清空标记
const clearMarkers = () => {
  if (map) {
    markers.forEach((m) => map!.removeLayer(m));
  }
  markers = [];
};

const resetMap = () => {
  // 清空所有数据
  realPathPoints.length = 0;
  plannedPoints.value = [];
  clearMarkers();
  
  if (realPolyline) realPolyline.setLatLngs([]);
  if (plannedPolyline) plannedPolyline.setLatLngs([]);
  
  isExecuting.value = false;
  isDrawMode.value = false;
  store.isPaused = false;

  // 发送重置命令
  store.sendCommand({ type: "RESET_MAP" });
  
  // 重置红点到原点
  if (currentMarker && map) {
    const origin = toLatLng([0, 0]);
    currentMarker.setLatLng(origin);
    map.setView(origin, 17);
  }
  
  ElMessage.success("地图已重置");
};

// 监听当前位置变化，更新地图显示
watch(
  () => props.currentPos,
  (newPos) => {
    // 暂停时不更新地图
    if (store.isPaused) {
      console.log("地图更新暂停中");
      return;
    }

    if (!map || !currentMarker || !realPolyline) {
      console.error("地图组件未初始化");
      return;
    }

    // 转换坐标为经纬度
    const latlng = toLatLng(newPos);
    
    console.log("当前位置更新 - 米坐标:", newPos, "-> 经纬度:", latlng);
    
    // 更新当前位置标记
    currentMarker.setLatLng(latlng);
    
    // 如果红点离开视野，自动调整地图中心
    const bounds = map.getBounds();
    if (!bounds.contains(latlng)) {
      map.panTo(latlng);
    }

    // 更新实时轨迹
    const lastPos = realPathPoints[realPathPoints.length - 1];
    if (!lastPos || 
        Math.abs(lastPos[0] - latlng[0]) > 0.000001 || 
        Math.abs(lastPos[1] - latlng[1]) > 0.000001) {
      realPathPoints.push(latlng);
      // 限制轨迹长度，防止卡顿
      if (realPathPoints.length > 500) realPathPoints.shift();
      realPolyline.setLatLngs(realPathPoints);
    }
  },
  { deep: true, immediate: true }
);

onMounted(() => {
  // 延迟初始化，确保DOM加载完成
  nextTick(() => {
    initMap();
    // 延迟调整地图大小，确保容器正确渲染
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
        console.log("地图大小调整完成");
      }
    }, 300);
  });
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style scoped>
.map-wrapper {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  height: 560px;
  display: flex;
  flex-direction: column;
}
.map-header {
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  flex-shrink: 0;
}
.leaflet-container {
  flex: 1;
  width: 100%;
  background: #f0f0f0;
  z-index: 1;
  cursor: crosshair;
}
.map-overlay {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 12px;
  border-radius: 6px;
  z-index: 500;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.draw-tip {
  font-size: 12px;
  color: #f56c6c;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 4px;
}
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
}
.planning {
  background: #67C23A;
}
.real {
  background: #409EFF;
}
.current {
  background: #F56C6C;
}
.legend {
  font-size: 13px;
  color: #666;
}
.legend .item {
  margin-left: 15px;
  display: inline-flex;
  align-items: center;
}
</style>