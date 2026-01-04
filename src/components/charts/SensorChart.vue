<template>
  <div class="chart-container" :class="{ 'mobile-view': isMobile }">
    <div class="chart-header">
      <div class="chart-title">{{ title }}</div>
      <div class="chart-actions">
        <el-button 
          v-if="enableExport" 
          size="small" 
          @click="exportData"
          :disabled="!data.labels.length"
        >
          导出数据
        </el-button>
        <el-button 
          v-if="enablePlayback && historicalData.length > 0" 
          size="small" 
          @click="togglePlayback"
        >
          {{ isPlaying ? '暂停' : '回放' }}
        </el-button>
      </div>
    </div>
    <div ref="chartRef" class="chart-box"></div>
    <div v-if="showLegend" class="chart-footer">
      <div class="legend">
        <span class="legend-item" v-for="item in legendItems" :key="item.name">
          <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
          {{ item.name }}
        </span>
      </div>
      <div v-if="currentAlert" class="alert-indicator" :class="`alert-${currentAlert.level}`">
        {{ currentAlert.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as echarts from 'echarts'
import { ElMessage, ElNotification } from 'element-plus'

interface ChartData {
  x: number[]
  y: number[]
  z: number[]
  labels: string[]
  timestamps?: number[]
}

interface AlertThreshold {
  axis: 'x' | 'y' | 'z' | 'all'
  value: number
  level: 'warning' | 'error' | 'info'
  message: string
  direction?: 'above' | 'below'
}

interface PlaybackConfig {
  speed: number
  autoPlay: boolean
  loop: boolean
}

const props = withDefaults(defineProps<{
  title: string
  unit: string
  data: ChartData
  alertThresholds?: AlertThreshold[]
  enableExport?: boolean
  enablePlayback?: boolean
  showLegend?: boolean
  minValue?: number
  maxValue?: number
  playbackConfig?: PlaybackConfig
}>(), {
  enableExport: true,
  enablePlayback: false,
  showLegend: true,
  playbackConfig: () => ({
    speed: 1,
    autoPlay: false,
    loop: false
  })
})

const chartRef = ref<HTMLElement>()
let myChart: echarts.ECharts | null = null
const isMobile = ref(false)
const isPlaying = ref(false)
const playbackIndex = ref(0)
const historicalData = ref<ChartData[]>([])
const currentAlert = ref<{ level: string; message: string } | null>(null)

const legendItems = computed(() => [
  { name: 'X轴', color: '#409EFF' },
  { name: 'Y轴', color: '#67C23A' },
  { name: 'Z轴', color: '#F56C6C' }
])

// 检查设备类型
const checkDevice = () => {
  isMobile.value = window.innerWidth < 768
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  myChart = echarts.init(chartRef.value)
  
  const displayData = isPlaying.value && historicalData.value.length > 0 
    ? historicalData.value[playbackIndex.value] 
    : props.data

  const series: any[] = [
    {
      name: 'X轴',
      type: 'line',
      data: displayData.x,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: isMobile.value ? 2 : 3 },
      itemStyle: { color: '#409EFF' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
        ])
      }
    },
    {
      name: 'Y轴',
      type: 'line',
      data: displayData.y,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: isMobile.value ? 2 : 3 },
      itemStyle: { color: '#67C23A' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
          { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
        ])
      }
    },
    {
      name: 'Z轴',
      type: 'line',
      data: displayData.z,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: isMobile.value ? 2 : 3 },
      itemStyle: { color: '#F56C6C' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
          { offset: 1, color: 'rgba(245, 108, 108, 0.05)' }
        ])
      }
    }
  ]

  // 添加告警标记线
  if (props.alertThresholds && props.alertThresholds.length > 0) {
    props.alertThresholds.forEach(threshold => {
      const seriesIndex = threshold.axis === 'x' ? 0 : threshold.axis === 'y' ? 1 : threshold.axis === 'z' ? 2 : null
      
      if (seriesIndex !== null) {
        series[seriesIndex].markLine = {
          silent: true,
          data: [{ yAxis: threshold.value }],
          label: { show: true, formatter: threshold.message },
          lineStyle: { 
            color: threshold.level === 'error' ? '#F56C6C' : 
                   threshold.level === 'warning' ? '#E6A23C' : '#909399',
            type: 'dashed',
            width: isMobile.value ? 1 : 2
          }
        }
      }
    })
  }

  const option: echarts.EChartsOption = {
    title: { 
      text: props.title, 
      textStyle: { fontSize: isMobile.value ? 12 : 14 },
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const time = displayData.labels[params[0].dataIndex] || '--:--:--'
        let tip = `<div style="font-weight: bold; margin-bottom: 5px;">${time}</div>`
        params.forEach((item: any) => {
          const val = item.value !== null && item.value !== undefined 
            ? Number(item.value).toFixed(3)
            : '-'
          tip += `
            <div style="display: flex; align-items: center; margin: 2px 0;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${item.color}; margin-right: 5px;"></span>
              ${item.seriesName}: <span style="font-weight: bold; margin-left: 5px;">${val} ${props.unit}</span>
            </div>`
        })
        return tip
      }
    },
    legend: { 
      data: ['X轴', 'Y轴', 'Z轴'], 
      right: isMobile.value ? 5 : 10,
      top: isMobile.value ? 5 : 10,
      textStyle: { fontSize: isMobile.value ? 10 : 12 }
    },
    grid: { 
      left: isMobile.value ? '5%' : '3%', 
      right: isMobile.value ? '5%' : '4%', 
      bottom: isMobile.value ? '15%' : '8%', 
      top: isMobile.value ? '20%' : '15%',
      containLabel: true 
    },
    xAxis: { 
      type: 'category', 
      boundaryGap: false, 
      data: displayData.labels,
      axisLabel: { fontSize: isMobile.value ? 10 : 12 }
    },
    yAxis: {
      type: 'value',
      name: props.unit,
      axisLabel: { 
        fontSize: isMobile.value ? 10 : 12,
        formatter: (value: number) => value.toFixed(3)
      },
      min: props.minValue,
      max: props.maxValue
    },
    series,
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        show: true,
        type: 'slider',
        bottom: isMobile.value ? 25 : 10,
        height: isMobile.value ? 20 : 30
      }
    ]
  }

  myChart.setOption(option)
  
  // 检查告警
  checkAlerts()
}

// 检查告警条件
const checkAlerts = () => {
  if (!props.alertThresholds || props.alertThresholds.length === 0) return
  
  const latestData = {
    x: props.data.x[props.data.x.length - 1] || 0,
    y: props.data.y[props.data.y.length - 1] || 0,
    z: props.data.z[props.data.z.length - 1] || 0
  }
  
  props.alertThresholds.forEach(threshold => {
    let value: number
    if (threshold.axis === 'x') value = latestData.x
    else if (threshold.axis === 'y') value = latestData.y
    else if (threshold.axis === 'z') value = latestData.z
    else value = Math.max(latestData.x, latestData.y, latestData.z)
    
    const isAlert = threshold.direction === 'above' 
      ? value > threshold.value
      : value < threshold.value
    
    if (isAlert) {
      currentAlert.value = {
        level: threshold.level,
        message: threshold.message
      }
      
      if (threshold.level === 'error') {
        ElNotification.error({
          title: '传感器告警',
          message: threshold.message,
          duration: 5000
        })
      } else if (threshold.level === 'warning') {
        ElNotification.warning({
          title: '传感器预警',
          message: threshold.message,
          duration: 3000
        })
      }
    }
  })
}

// 导出数据
const exportData = () => {
  const headers = ['时间', 'X轴', 'Y轴', 'Z轴']
  const rows = props.data.labels.map((label, index) => [
    label,
    props.data.x[index]?.toFixed(3) || '--',
    props.data.y[index]?.toFixed(3) || '--',
    props.data.z[index]?.toFixed(3) || '--'
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${props.title}_${new Date().toISOString().slice(0,10)}.csv`
  link.click()
  
  ElMessage.success('数据导出成功')
}

// 历史数据回放
let playbackTimer: any = null
const togglePlayback = () => {
  if (!isPlaying.value) {
    // 开始回放
    isPlaying.value = true
    playbackIndex.value = 0
    playbackTimer = setInterval(() => {
      if (playbackIndex.value < historicalData.value.length - 1) {
        playbackIndex.value++
        initChart()
      } else if (props.playbackConfig.loop) {
        playbackIndex.value = 0
      } else {
        stopPlayback()
      }
    }, 1000 / props.playbackConfig.speed)
  } else {
    stopPlayback()
  }
}

const stopPlayback = () => {
  isPlaying.value = false
  if (playbackTimer) {
    clearInterval(playbackTimer)
    playbackTimer = null
  }
}

// 保存历史数据快照
const saveSnapshot = () => {
  historicalData.value.push({
    x: [...props.data.x],
    y: [...props.data.y],
    z: [...props.data.z],
    labels: [...props.data.labels],
    timestamps: props.data.labels.map(() => Date.now())
  })
  
  // 保持历史数据长度
  if (historicalData.value.length > 100) {
    historicalData.value.shift()
  }
}

// 监视数据变化
watch(() => props.data, () => {
  if (!myChart) return
  
  // 保存快照
  saveSnapshot()
  
  // 更新图表
  if (!isPlaying.value) {
    initChart()
  }
}, { deep: true })

// 响应式调整
watch(isMobile, () => {
  if (myChart) {
    myChart.resize()
    initChart()
  }
})

onMounted(() => {
  checkDevice()
  initChart()
  window.addEventListener('resize', () => {
    checkDevice()
    myChart?.resize()
  })
})

onUnmounted(() => {
  stopPlayback()
  if (myChart) {
    myChart.dispose()
    myChart = null
  }
  window.removeEventListener('resize', () => {})
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.chart-box {
  flex: 1;
  min-height: 200px;
}

.chart-footer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.legend {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.alert-indicator {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.alert-warning {
  background-color: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #faecd8;
}

.alert-error {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}

.alert-info {
  background-color: #f4f4f5;
  color: #909399;
  border: 1px solid #e9e9eb;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-container.mobile-view {
    padding: 8px;
  }
  
  .chart-title {
    font-size: 12px;
  }
  
  .chart-actions :deep(.el-button) {
    padding: 5px 8px;
    font-size: 12px;
  }
  
  .legend {
    gap: 8px;
  }
  
  .legend-item {
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .chart-footer {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .chart-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>