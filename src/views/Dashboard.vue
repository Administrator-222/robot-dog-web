<template>
  <div class="dashboard-container" :class="{ 'mobile-view': isMobile }">
    <!-- 连接状态栏 -->
    <div class="status-bar" :class="connectionStatus.class">
      <el-alert
        :title="connectionStatus.title"
        :type="connectionStatus.type"
        :closable="false"
        center
        show-icon
      >
        <template #default>
          <span v-if="connectionStatus.reconnectCount > 0">
            正在尝试重连...({{ connectionStatus.reconnectCount }})
          </span>
          <el-button v-if="!store.isConnected" size="small" @click="reconnect" :loading="isReconnecting">
            重新连接
          </el-button>
        </template>
      </el-alert>
    </div>

    <!-- 第一行：关键指标 -->
    <el-row :gutter="responsiveGutter" style="margin-bottom: 20px;">
      <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="metric-card" shadow="hover">
          <GaugeBoard
            label="电池电量"
            unit="%"
            :value="store.status.battery"
            :min-value="0"
            :max-value="100"
            :show-limits="true"
            :show-status="true"
            :thresholds="[
              { value: 20, color: '#F56C6C', label: '低电量' },
              { value: 40, color: '#E6A23C', label: '中等' },
              { value: 80, color: '#67C23A', label: '正常' }
            ]"
          />
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="metric-card" shadow="hover">
          <GaugeBoard
            label="环境温度"
            unit="℃"
            :value="store.status.env.temp"
            :min-value="0"
            :max-value="50"
            :show-limits="true"
            :show-status="true"
            :thresholds="[
              { value: 35, color: '#F56C6C', label: '高温' },
              { value: 25, color: '#67C23A', label: '正常' },
              { value: 15, color: '#409EFF', label: '低温' }
            ]"
          />
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="metric-card" shadow="hover">
          <GaugeBoard
            label="环境湿度"
            unit="%"
            :value="store.status.env.humidity"
            :min-value="0"
            :max-value="100"
            :show-limits="true"
            :show-status="true"
          />
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="metric-card" shadow="hover">
          <GaugeBoard
            label="避障距离"
            unit="cm"
            :value="store.status.env.distance"
            :min-value="0"
            :max-value="300"
            :show-limits="true"
            :thresholds="[
              { value: 50, color: '#F56C6C', label: '危险' },
              { value: 100, color: '#E6A23C', label: '警告' },
              { value: 150, color: '#67C23A', label: '安全' }
            ]"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 第二行：环境传感器数据 -->
    <el-row :gutter="responsiveGutter" style="margin-bottom: 20px;">
      <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="metric-card" shadow="hover">
          <GaugeBoard
            label="大气压强"
            unit="hPa"
            :value="store.status.env.pressure || 1013"
            :min-value="950"
            :max-value="1050"
            :show-limits="true"
            :show-status="true"
            :thresholds="[
              { value: 980, color: '#F56C6C', label: '低气压' },
              { value: 1000, color: '#67C23A', label: '正常' },
              { value: 1030, color: '#409EFF', label: '高气压' }
            ]"
          />
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="metric-card" shadow="hover">
          <div class="sensor-summary">
            <h4>环境传感器概览</h4>
            <div class="sensor-values">
              <div class="sensor-item">
                <span class="label">温度：</span>
                <span class="value">{{ store.status.env.temp.toFixed(1) }}℃</span>
              </div>
              <div class="sensor-item">
                <span class="label">湿度：</span>
                <span class="value">{{ store.status.env.humidity.toFixed(1) }}%</span>
              </div>
              <div class="sensor-item">
                <span class="label">距离：</span>
                <span class="value">{{ store.status.env.distance.toFixed(1) }}cm</span>
              </div>
              <div class="sensor-item">
                <span class="label">气压：</span>
                <span class="value">{{ (store.status.env.pressure || 1013).toFixed(1) }}hPa</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="metric-card" shadow="hover">
          <div class="sensor-status">
            <h4>传感器状态</h4>
            <div class="status-list">
              <div class="status-item status-ok">
                <el-icon><SuccessFilled /></el-icon>
                <span>IMU传感器正常</span>
              </div>
              <div class="status-item status-ok">
                <el-icon><SuccessFilled /></el-icon>
                <span>环境传感器正常</span>
              </div>
              <div class="status-item status-ok">
                <el-icon><SuccessFilled /></el-icon>
                <span>位置传感器正常</span>
              </div>
              <div class="status-item status-ok">
                <el-icon><SuccessFilled /></el-icon>
                <span>电池传感器正常</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="metric-card" shadow="hover">
          <div class="quick-actions">
            <h4>快速操作</h4>
            <el-button-group>
              <el-button type="primary" size="small" @click="exportSensorData">
                导出数据
              </el-button>
              <el-button type="success" size="small" @click="refreshData">
                刷新
              </el-button>
              <el-button type="warning" size="small" @click="showChartPlayback">
                图表回放
              </el-button>
            </el-button-group>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第三行：传感器数据监控 -->
    <el-card class="sensor-section" shadow="hover">
      <template #header>
        <div class="section-header">
          <span class="section-title">传感器数据监控</span>
          <div class="section-controls">
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              :size="isMobile ? 'small' : 'default'"
              @change="filterData"
              style="margin-right: 10px; width: 300px;"
            />
            <el-button 
              type="primary" 
              @click="exportSensorData"
              :size="isMobile ? 'small' : 'default'"
            >
              导出数据
            </el-button>
          </div>
        </div>
      </template>

      <div class="sensor-grid">
        <!-- 加速度传感器 -->
        <div class="sensor-chart-container">
          <div class="sensor-chart-header">
            <h3>加速度传感器</h3>
            <span class="sensor-unit">m/s²</span>
          </div>
          <SensorChart
            :title="''"
            unit="m/s²"
            :data="filteredImu.accel"
            :alert-thresholds="[
              { axis: 'x', value: 15, direction: 'above', level: 'error', message: 'X轴加速度超限' },
              { axis: 'y', value: 15, direction: 'above', level: 'error', message: 'Y轴加速度超限' },
              { axis: 'z', value: 20, direction: 'above', level: 'error', message: 'Z轴加速度超限' }
            ]"
            :enable-playback="false"
            :min-value="-20"
            :max-value="20"
            :show-legend="false"
          />
          <div class="axis-labels">
            <div class="axis-label">
              <span class="axis-dot x-axis"></span>
              <span class="axis-text">X轴</span>
            </div>
            <div class="axis-label">
              <span class="axis-dot y-axis"></span>
              <span class="axis-text">Y轴</span>
            </div>
            <div class="axis-label">
              <span class="axis-dot z-axis"></span>
              <span class="axis-text">Z轴</span>
            </div>
          </div>
        </div>

        <!-- 陀螺仪传感器 -->
        <div class="sensor-chart-container">
          <div class="sensor-chart-header">
            <h3>陀螺仪传感器</h3>
            <span class="sensor-unit">rad/s</span>
          </div>
          <SensorChart
            :title="''"
            unit="rad/s"
            :data="filteredImu.gyro"
            :alert-thresholds="[
              { axis: 'x', value: 5, direction: 'above', level: 'error', message: 'X轴角速度超限' },
              { axis: 'y', value: 5, direction: 'above', level: 'error', message: 'Y轴角速度超限' },
              { axis: 'z', value: 5, direction: 'above', level: 'error', message: 'Z轴角速度超限' }
            ]"
            :enable-playback="false"
            :min-value="-10"
            :max-value="10"
            :show-legend="false"
          />
          <div class="axis-labels">
            <div class="axis-label">
              <span class="axis-dot x-axis"></span>
              <span class="axis-text">X轴</span>
            </div>
            <div class="axis-label">
              <span class="axis-dot y-axis"></span>
              <span class="axis-text">Y轴</span>
            </div>
            <div class="axis-label">
              <span class="axis-dot z-axis"></span>
              <span class="axis-text">Z轴</span>
            </div>
          </div>
        </div>

        <!-- 磁力计传感器 -->
        <div class="sensor-chart-container">
          <div class="sensor-chart-header">
            <h3>磁力计传感器</h3>
            <span class="sensor-unit">µT</span>
          </div>
          <SensorChart
            :title="''"
            unit="µT"
            :data="filteredImu.mag"
            :alert-thresholds="[
              { axis: 'x', value: 100, direction: 'above', level: 'warning', message: 'X轴磁场异常' },
              { axis: 'y', value: 100, direction: 'above', level: 'warning', message: 'Y轴磁场异常' },
              { axis: 'z', value: 100, direction: 'above', level: 'warning', message: 'Z轴磁场异常' }
            ]"
            :enable-playback="false"
            :min-value="0"
            :max-value="200"
            :show-legend="false"
          />
          <div class="axis-labels">
            <div class="axis-label">
              <span class="axis-dot x-axis"></span>
              <span class="axis-text">X轴</span>
            </div>
            <div class="axis-label">
              <span class="axis-dot y-axis"></span>
              <span class="axis-text">Y轴</span>
            </div>
            <div class="axis-label">
              <span class="axis-dot z-axis"></span>
              <span class="axis-text">Z轴</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 第四行：导航数据和视频（HLS流） -->
    <el-row :gutter="responsiveGutter" style="margin-top: 20px;">
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card header="导航数据" shadow="hover" class="navigation-card">
          <div class="navigation-container">
            <div class="position-display">
              <div class="position-axis">
                <div class="axis-label">X坐标</div>
                <div class="axis-value">{{ store.status.position[0].toFixed(2) }} m</div>
                <div class="axis-progress">
                  <el-progress 
                    :percentage="getPositionPercentage(store.status.position[0], 'x')"
                    :color="getPositionColor(store.status.position[0], 'x')"
                    :show-text="false"
                  />
                </div>
              </div>
              <div class="position-axis">
                <div class="axis-label">Y坐标</div>
                <div class="axis-value">{{ store.status.position[1].toFixed(2) }} m</div>
                <div class="axis-progress">
                  <el-progress 
                    :percentage="getPositionPercentage(store.status.position[1], 'y')"
                    :color="getPositionColor(store.status.position[1], 'y')"
                    :show-text="false"
                  />
                </div>
              </div>
            </div>
            <div class="flow-data">
              <div class="flow-header">
                <span class="flow-title">流量</span>
                <span class="flow-unit">m³/s</span>
              </div>
              <div class="flow-axis">
                <div class="axis-label">Y轴</div>
                <div class="axis-value">{{ store.status.imu.accel[1].toFixed(3) }}</div>
              </div>
              <div class="flow-axis">
                <div class="axis-label">Z轴</div>
                <div class="axis-value">{{ store.status.imu.accel[2].toFixed(3) }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card header="实时视频监控（HLS协议）" shadow="hover">
          <div class="video-section">
            <!-- HLS视频流容器 -->
            <video
              ref="videoEl"
              muted
              playsinline
              @error="handleVideoError"
              @canplay="handleVideoReady"
              @play="handleVideoPlay"
              @pause="handleVideoPause"
            ></video>
            
            <div class="video-overlay">
              <el-tag type="danger" effect="dark" size="small">LIVE (HLS)</el-tag>
              <span>FPS: {{ fps.toFixed(1) }}</span>
              <span>延迟: {{ networkLatency }}ms</span>
              
              <div class="video-controls">
                <el-button 
                  :type="isPlaying ? 'warning' : 'success'" 
                  size="small" 
                  @click="togglePlay"
                >
                  {{ isPlaying ? '暂停' : '播放' }}
                </el-button>
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="toggleFullscreen"
                  v-if="!isFullscreen"
                >
                  全屏
                </el-button>
                <el-button 
                  type="info" 
                  size="small" 
                  @click="toggleFullscreen"
                  v-else
                >
                  退出全屏
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第五行：告警日志 -->
    <el-card header="系统告警与日志" shadow="hover" style="margin-top: 20px;">
      <div class="alert-container">
        <el-table
          :data="filteredAlerts"
          height="250"
          stripe
          :size="isMobile ? 'small' : 'default'"
          style="width: 100%"
        >
          <el-table-column prop="time" label="时间" width="140">
            <template #default="{ row }">
              {{ new Date(row.time).toLocaleTimeString() }}
            </template>
          </el-table-column>
          <el-table-column prop="level" label="级别" width="80">
            <template #default="{ row }">
              <el-tag :type="row.level === 'error' ? 'danger' : 'warning'" size="small">
                {{ row.level === 'error' ? '严重' : '警告' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="描述" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="text" size="small" @click="acknowledgeAlert(row)">
                确认
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="alert-actions">
          <el-button @click="exportAlerts" type="primary" size="small">
            导出告警日志
          </el-button>
          <el-button @click="clearAcknowledgedAlerts" size="small">
            清空已确认
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElNotification, ElMessage } from 'element-plus'
import { SuccessFilled } from '@element-plus/icons-vue'
import Hls from 'hls.js' // 引入HLS解析库
import { useRobotStore } from '@/stores/robotStore'
import { useHistoryStore } from '@/stores/historyStore'
import type { RobotData } from '@/utils/mockSocket'
import GaugeBoard from '@/components/charts/GaugeBoard.vue'
import SensorChart from '@/components/charts/SensorChart.vue'

const store = useRobotStore()
const historyStore = useHistoryStore()

// 响应式状态
const isMobile = ref(false)
const isReconnecting = ref(false)
const isPlaying = ref(true) // 视频播放状态
const isFullscreen = ref(false) // 全屏状态
const fps = ref(30) // 视频帧率
const networkLatency = ref(120) // 模拟网络延迟

// HLS核心实例
const videoEl = ref<HTMLVideoElement | null>(null)
const hlsInstance = ref<Hls | null>(null)
// 公开的HLS测试流地址（无需本地服务器，直接访问）
const mockHlsUrl = ref('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8')

// 数据状态
const dateRange = ref<[Date, Date] | null>(null)
const filteredImu = ref({
  accel: { x: [], y: [], z: [], labels: [] },
  gyro: { x: [], y: [], z: [], labels: [] },
  mag: { x: [], y: [], z: [], labels: [] }
})

const alerts = ref<Array<{
  id: string
  time: number
  level: 'error' | 'warning'
  message: string
  acknowledged: boolean
}>>([])

// 听觉告警状态
const lastLowBatteryAlert = ref(0)
const ALERT_INTERVAL = 10000 // 10秒间隔
const alertAudio = ref<HTMLAudioElement | null>(null)

// 视觉告警状态（电池电量）
const batteryAlerts = ref<Set<string>>(new Set())

// 响应式计算
const responsiveGutter = computed(() => {
  if (isMobile.value) return 10
  return 20
})

const connectionStatus = computed(() => {
  if (store.isConnected) {
    return {
      title: '设备已连接',
      type: 'success' as const,
      class: 'connected',
      reconnectCount: 0
    }
  } else {
    return {
      title: '设备连接已断开',
      type: 'error' as const,
      class: 'disconnected',
      reconnectCount: 0
    }
  }
})

const filteredAlerts = computed(() => {
  return alerts.value
    .filter(alert => !alert.acknowledged)
    .slice(0, 10) // 只显示最近10条
})

// ========== HLS视频流核心逻辑 ==========
// 初始化HLS播放器
const initHlsPlayer = () => {
  if (!videoEl.value) return

  // 1. 检查浏览器是否支持HLS
  if (Hls.isSupported()) {
    hlsInstance.value = new Hls({
      maxBufferLength: 3, // 减小缓存，降低实时流延迟
      reconnectDelay: 1000, // 断流后重连延迟（1秒）
      maxReconnect: 10, // 最大重连次数
      startLevel: 0 // 从最低清晰度开始加载（加快首屏）
    })

    // 2. 加载HLS测试流
    hlsInstance.value.loadSource(mockHlsUrl.value)
    hlsInstance.value.attachMedia(videoEl.value)

    // 3. 监听HLS事件（模拟真实场景异常）
    hlsInstance.value.on(Hls.Events.ERROR, (event, data) => {
      console.error('HLS流错误:', data)
      // 视觉告警：流异常提示
      addAlert('error', `视频流异常: ${data.type === 'network' ? '网络断连，正在重连' : '解码错误'}`)
      
      // 网络异常自动重连
      if (data.fatal && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        ElMessage.warning('HLS流断连，正在尝试重连...')
        hlsInstance.value?.startLoad()
      }
      // 解码异常重建播放器
      else if (data.fatal && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hlsInstance.value?.recoverMediaError()
      }
    })

    // 4. HLS流解析完成，自动播放
    hlsInstance.value.on(Hls.Events.MANIFEST_PARSED, () => {
      videoEl.value?.play().catch(() => {
        ElMessage.warning('自动播放失败（浏览器策略限制），请手动点击播放')
        isPlaying.value = false
      })
    })
  } 
  // 兼容Safari/iOS（原生支持HLS）
  else if (videoEl.value.canPlayType('application/vnd.apple.mpegurl')) {
    videoEl.value.src = mockHlsUrl.value
    videoEl.value.play().catch(() => {
      isPlaying.value = false
    })
  } 
  // 浏览器不支持HLS
  else {
    ElMessage.error('当前浏览器不支持HLS协议，无法播放实时视频流')
    addAlert('error', '浏览器不支持HLS协议，视频流播放失败')
  }
}

// 视频播放/暂停切换
const togglePlay = () => {
  if (!videoEl.value) return

  if (isPlaying.value) {
    videoEl.value.pause()
  } else {
    videoEl.value.play().catch((e) => {
      ElMessage.error(`播放失败: ${e.message}`)
    })
  }
}

// 全屏切换
const toggleFullscreen = () => {
  if (!videoEl.value) return

  if (!isFullscreen.value) {
    // 兼容不同浏览器全屏API
    if (videoEl.value.requestFullscreen) {
      videoEl.value.requestFullscreen()
    } else if ((videoEl.value as any).webkitRequestFullscreen) {
      (videoEl.value as any).webkitRequestFullscreen()
    } else if ((videoEl.value as any).mozRequestFullScreen) {
      (videoEl.value as any).mozRequestFullScreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen()
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen()
    }
  }
}

// 视频事件监听
const handleVideoError = () => {
  ElMessage.error('HLS视频流加载失败，请检查网络或流地址')
  addAlert('error', '视频流加载失败：无法连接到HLS服务器')
}

const handleVideoReady = () => {
  ElMessage.success('HLS视频流准备就绪（验证HLS协议支持）')
}

const handleVideoPlay = () => {
  isPlaying.value = true
}

const handleVideoPause = () => {
  isPlaying.value = false
}

// ========== 原有逻辑（传感器/告警/响应式） ==========
// 初始化响应式检测
const initResponsive = () => {
  isMobile.value = window.innerWidth < 768
}

// 加载告警音频
const loadAlertAudio = () => {
  try {
    alertAudio.value = new Audio('/src/assets/alert.mp3')
    alertAudio.value.addEventListener('error', () => {
      console.warn('alert.mp3 not found in assets, trying alternative path')
      alertAudio.value = new Audio('/alert.mp3')
    })
  } catch (error) {
    console.error('Failed to load alert audio:', error)
  }
}

// 播放告警音
const playAlertSound = () => {
  if (!alertAudio.value) return
  
  try {
    alertAudio.value.currentTime = 0
    alertAudio.value.play().catch(e => {
      console.warn('Audio playback failed:', e)
    })
  } catch (error) {
    console.error('Error playing alert sound:', error)
  }
}

// 数据筛选
const filterData = () => {
  if (!dateRange.value) {
    const recentData = historyData.value.slice(-20)
    updateFilteredImu(recentData)
  } else {
    const [start, end] = dateRange.value
    const filteredData = historyData.value.filter(
      (d: RobotData) => d.timestamp >= start.getTime() && d.timestamp <= end.getTime()
    )
    updateFilteredImu(filteredData)
  }
}

// 历史数据缓冲
const historyData = ref<RobotData[]>([])

// 更新过滤后的IMU数据
const updateFilteredImu = (data: RobotData[]) => {
  filteredImu.value = {
    accel: { x: [], y: [], z: [], labels: [] },
    gyro: { x: [], y: [], z: [], labels: [] },
    mag: { x: [], y: [], z: [], labels: [] }
  }

  data.forEach((d: RobotData) => {
    const timeLabel = new Date(d.timestamp).toLocaleTimeString()
    
    filteredImu.value.accel.x.push(d.imu.accel[0])
    filteredImu.value.accel.y.push(d.imu.accel[1])
    filteredImu.value.accel.z.push(d.imu.accel[2])
    filteredImu.value.accel.labels.push(timeLabel)
    
    filteredImu.value.gyro.x.push(d.imu.gyro[0])
    filteredImu.value.gyro.y.push(d.imu.gyro[1])
    filteredImu.value.gyro.z.push(d.imu.gyro[2])
    filteredImu.value.gyro.labels.push(timeLabel)
    
    filteredImu.value.mag.x.push(d.imu.mag[0])
    filteredImu.value.mag.y.push(d.imu.mag[1])
    filteredImu.value.mag.z.push(d.imu.mag[2])
    filteredImu.value.mag.labels.push(timeLabel)
  })
}

// 导出传感器数据
const exportSensorData = () => {
  try {
    historyStore.exportSensorData(filteredImu.value.accel, 'accel')
    setTimeout(() => {
      historyStore.exportSensorData(filteredImu.value.gyro, 'gyro')
    }, 200)
    setTimeout(() => {
      historyStore.exportSensorData(filteredImu.value.mag, 'mag')
    }, 400)
    ElMessage.success('传感器数据导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error(`导出失败: ${error}`)
  }
}

// 导出告警日志
const exportAlerts = () => {
  if (alerts.value.length === 0) {
    ElMessage.warning('没有告警日志可导出')
    return
  }
  
  const csvContent = [
    ['时间', '级别', '描述', '确认状态'].join(','),
    ...alerts.value.map(alert => [
      new Date(alert.time).toLocaleString(),
      alert.level,
      alert.message,
      alert.acknowledged ? '已确认' : '未确认'
    ].join(','))
  ].join('\n')
  
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `alerts_${Date.now()}.csv`
  link.click()
  
  ElMessage.success('告警日志导出成功')
}

// 重新连接设备
const reconnect = async () => {
  isReconnecting.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    store.connect()
    ElMessage.success('重新连接中...')
  } catch (error) {
    ElMessage.error('连接失败')
  } finally {
    isReconnecting.value = false
  }
}

// 告警处理
const acknowledgeAlert = (alert: any) => {
  alert.acknowledged = true
  ElMessage.info('告警已确认')
}

const clearAcknowledgedAlerts = () => {
  alerts.value = alerts.value.filter(alert => !alert.acknowledged)
  ElMessage.success('已清空已确认的告警')
}

// FPS 计算
let lastTime = 0
const calcFps = () => {
  const now = performance.now()
  if (lastTime) {
    fps.value = 1000 / (now - lastTime)
  }
  lastTime = now
  requestAnimationFrame(calcFps)
}

// 模拟网络延迟检测
const checkNetworkLatency = () => {
  const start = Date.now()
  setTimeout(() => {
    networkLatency.value = Date.now() - start
  }, Math.random() * 200)
}

// 位置百分比计算
const getPositionPercentage = (value: number, axis: 'x' | 'y') => {
  const max = axis === 'x' ? 10 : 10
  return Math.min(100, Math.max(0, ((value + max) / (2 * max)) * 100))
}

const getPositionColor = (value: number, axis: 'x' | 'y') => {
  const absValue = Math.abs(value)
  if (absValue > 8) return '#F56C6C'
  if (absValue > 5) return '#E6A23C'
  return '#67C23A'
}

// 添加告警
const addAlert = (level: 'error' | 'warning', message: string) => {
  const existing = alerts.value.find(
    alert => alert.message === message && !alert.acknowledged
  )
  if (!existing) {
    alerts.value.unshift({
      id: Date.now().toString(),
      time: Date.now(),
      level,
      message,
      acknowledged: false
    })
  }
}

// 刷新数据
const refreshData = () => {
  filterData()
  ElMessage.success('数据已刷新')
}

// 显示图表回放
const showChartPlayback = () => {
  ElMessage.info('图表回放功能需要在历史数据页面使用')
}

// 监视数据变化
watch(
  () => store.status.timestamp,
  (newTs) => {
    if (newTs === 0) return
    
    const currentData = { ...store.status }
    
    historyData.value.push(currentData)
    if (historyData.value.length > 1000) {
      historyData.value.shift()
    }
    
    if (!dateRange.value) {
      const recentData = historyData.value.slice(-20)
      updateFilteredImu(recentData)
    }
    
    // 电池低电量告警
    const now = Date.now()
    if (currentData.battery < 20) {
      const alertKey = `low_battery_${Math.floor(now / ALERT_INTERVAL)}`
      
      if (!batteryAlerts.value.has(alertKey)) {
        playAlertSound()
        addAlert('error', `电池电量过低: ${currentData.battery.toFixed(1)}%`)
        
        historyStore.addRecord({
          timestamp: Date.now(),
          type: 'alert',
          category: 'system',
          title: '低电量警告',
          data: {
            battery: currentData.battery,
            threshold: 20,
            message: '电池电量低于20%',
            timestamp: Date.now()
          }
        })
        
        batteryAlerts.value.add(alertKey)
        lastLowBatteryAlert.value = now
        
        ElNotification.error({
          title: '低电量警告',
          message: `电池电量过低: ${currentData.battery.toFixed(1)}%`,
          duration: 5000
        })
      }
    } else {
      batteryAlerts.value.clear()
    }
    
    // 温度告警
    if (currentData.env.temp > 35) {
      addAlert('warning', `温度过高: ${currentData.env.temp.toFixed(1)}℃`)
      
      historyStore.addRecord({
        timestamp: Date.now(),
        type: 'alert',
        category: 'system',
        title: '高温警告',
        data: {
          temperature: currentData.env.temp,
          threshold: 35,
          message: '环境温度过高',
          timestamp: Date.now()
        }
      })
    }
    
    // 避障距离告警
    if (currentData.env.distance < 50) {
      addAlert('warning', `避障距离过近: ${currentData.env.distance.toFixed(1)}cm`)
      
      historyStore.addRecord({
        timestamp: Date.now(),
        type: 'alert',
        category: 'system',
        title: '避障警告',
        data: {
          distance: currentData.env.distance,
          threshold: 50,
          message: '前方障碍物过近',
          timestamp: Date.now()
        }
      })
    }
    
    // 保存传感器数据到历史记录
    historyStore.addRecord({
      timestamp: currentData.timestamp || Date.now(),
      type: 'telemetry',
      category: 'sensor',
      title: '传感器数据',
      data: {
        battery: currentData.battery,
        mode: currentData.mode,
        pose: { ...currentData.pose },
        imu: {
          accel: [...currentData.imu.accel],
          gyro: [...currentData.imu.gyro],
          mag: [...currentData.imu.mag]
        },
        env: {
          temp: currentData.env.temp,
          humidity: currentData.env.humidity,
          distance: currentData.env.distance,
          pressure: currentData.env.pressure || 1013
        },
        position: [...currentData.position]
      }
    })
  },
  { immediate: true }
)

// 监视连接状态
watch(() => store.isConnected, (connected) => {
  if (!connected) {
    addAlert('error', '设备连接已断开')
    
    historyStore.addRecord({
      timestamp: Date.now(),
      type: 'alert',
      category: 'system',
      title: '设备离线',
      data: {
        status: 'disconnected',
        message: '设备连接已断开',
        timestamp: Date.now()
      }
    })
  } else {
    addAlert('warning', '设备已重新连接')
    
    historyStore.addRecord({
      timestamp: Date.now(),
      type: 'task',
      category: 'connection',
      title: '设备连接',
      data: {
        status: 'connected',
        message: '设备已重新连接',
        timestamp: Date.now()
      }
    })
  }
})

// 生命周期
onMounted(() => {
  // 初始化响应式
  initResponsive()
  loadAlertAudio()
  calcFps()
  filterData()
  
  // 初始化HLS播放器
  initHlsPlayer()
  
  // 定时任务
  setInterval(checkNetworkLatency, 5000)
  
  // 监听窗口事件
  window.addEventListener('resize', initResponsive)
  window.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(() => {
  // 销毁HLS实例，避免内存泄漏
  if (hlsInstance.value) {
    hlsInstance.value.destroy()
  }
  if (videoEl.value) {
    videoEl.value.pause()
    videoEl.value.src = ''
  }
  
  // 移除事件监听
  window.removeEventListener('resize', initResponsive)
  window.removeEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.status-bar {
  margin-bottom: 20px;
}

.status-bar.connected :deep(.el-alert) {
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
}

.status-bar.disconnected :deep(.el-alert) {
  background-color: #fef0f0;
  border: 1px solid #fde2e2;
}

.metric-card {
  height: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.section-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.sensor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.sensor-chart-container {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.sensor-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.sensor-chart-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.sensor-unit {
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.axis-labels {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 10px;
}

.axis-label {
  display: flex;
  align-items: center;
  gap: 5px;
}

.axis-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.x-axis {
  background-color: #409EFF;
}

.y-axis {
  background-color: #67C23A;
}

.z-axis {
  background-color: #F56C6C;
}

.axis-text {
  font-size: 12px;
  color: #606266;
}

.navigation-card {
  height: 100%;
}

.navigation-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.position-display, .flow-data {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 15px;
}

.position-axis, .flow-axis {
  margin-bottom: 15px;
}

.position-axis:last-child, .flow-axis:last-child {
  margin-bottom: 0;
}

.axis-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.axis-value {
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.axis-progress {
  margin-top: 5px;
}

.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.flow-title {
  font-weight: bold;
  color: #303133;
}

.flow-unit {
  font-size: 12px;
  color: #909399;
}

/* HLS视频样式优化 */
.video-section {
  position: relative;
  background: #000;
  border-radius: 4px;
  overflow: hidden;
}

.video-section video {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.video-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 12px;
  border-radius: 4px;
}

.video-controls {
  display: flex;
  gap: 8px;
}

.alert-container {
  display: flex;
  flex-direction: column;
}

.alert-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.sensor-summary, .sensor-status, .quick-actions {
  text-align: center;
  padding: 10px;
}

.sensor-summary h4, .sensor-status h4, .quick-actions h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.sensor-values {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sensor-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
}

.sensor-item:last-child {
  border-bottom: none;
}

.sensor-item .label {
  color: #909399;
  font-size: 12px;
}

.sensor-item .value {
  font-weight: bold;
  color: #409EFF;
  font-size: 14px;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 5px;
  border-radius: 4px;
}

.status-ok {
  color: #67C23A;
  background-color: #f0f9eb;
}

.status-warning {
  color: #E6A23C;
  background-color: #fdf6ec;
}

.status-error {
  color: #F56C6C;
  background-color: #fef0f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-container.mobile-view {
    padding: 10px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .section-controls {
    margin-top: 10px;
    justify-content: space-between;
  }
  
  .sensor-grid {
    grid-template-columns: 1fr;
  }
  
  .navigation-container {
    flex-direction: column;
  }
  
  .video-section video {
    height: 200px;
  }
  
  .video-overlay {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .video-controls {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .dashboard-container.mobile-view {
    padding: 5px;
  }
  
  .sensor-chart-header h3 {
    font-size: 14px;
  }
  
  .axis-value {
    font-size: 16px;
  }
}
</style>