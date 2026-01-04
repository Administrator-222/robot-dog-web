<template>
  <div class="gauge-wrapper">
    <div class="gauge-container" :class="{ 'mobile-view': isMobile }">
      <el-progress 
        type="dashboard" 
        :percentage="percentage" 
        :stroke-width="isMobile ? 8 : 12"
        :color="customColors"
        :width="isMobile ? 120 : 160"
      >
        <template #default="{ percentage }">
          <div class="gauge-content">
            <span class="percentage-value">{{ displayValue }}</span>
            <span class="percentage-unit">{{ unit }}</span>
            <div v-if="showStatus" class="status-indicator" :class="statusClass">
              {{ statusText }}
            </div>
          </div>
        </template>
      </el-progress>
      <div class="gauge-footer">
        <div class="gauge-label">{{ label }}</div>
        <div v-if="showLimits" class="gauge-limits">
          <span class="limit-min">Min: {{ minValue }}{{ unit }}</span>
          <span class="limit-max">Max: {{ maxValue }}{{ unit }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  label: string
  unit: string
  // 支持两种传入方式
  percentage?: number
  value?: number
  minValue?: number
  maxValue?: number
  showLimits?: boolean
  showStatus?: boolean
  thresholds?: { value: number; color: string; label: string }[]
}>()

const isMobile = ref(false)

// 检查设备类型
const checkDevice = () => {
  isMobile.value = window.innerWidth < 768
}

// 计算百分比
const computedPercentage = computed(() => {
  if (props.percentage !== undefined) return props.percentage
  if (props.value !== undefined && props.minValue !== undefined && props.maxValue !== undefined) {
    return Math.min(100, Math.max(0, 
      ((props.value - props.minValue) / (props.maxValue - props.minValue)) * 100
    ))
  }
  return 0
})

// 显示值
const displayValue = computed(() => {
  if (props.value !== undefined) return props.value.toFixed(1)
  return computedPercentage.value.toFixed(1)
})

// 动态颜色
const customColors = computed(() => {
  if (props.thresholds && props.thresholds.length > 0) {
    return props.thresholds.map(t => ({
      color: t.color,
      percentage: t.value
    }))
  }
  
  // 默认颜色
  return [
    { color: '#67c23a', percentage: 40 },
    { color: '#e6a23c', percentage: 70 },
    { color: '#f56c6c', percentage: 100 },
  ]
})

// 状态指示
const statusClass = computed(() => {
  const pct = computedPercentage.value
  if (pct > 80) return 'status-high'
  if (pct > 60) return 'status-medium'
  if (pct > 20) return 'status-normal'
  return 'status-low'
})

const statusText = computed(() => {
  const pct = computedPercentage.value
  if (pct > 80) return '高'
  if (pct > 60) return '中'
  if (pct > 20) return '正常'
  return '低'
})

onMounted(() => {
  checkDevice()
  window.addEventListener('resize', checkDevice)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkDevice)
})
</script>

<style scoped>
.gauge-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  height: 100%;
}

.gauge-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.gauge-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.percentage-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.percentage-unit {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.status-indicator {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-top: 6px;
  color: white;
}

.status-normal { background-color: #67C23A; }
.status-medium { background-color: #E6A23C; }
.status-high { background-color: #F56C6C; }
.status-low { background-color: #909399; }

.gauge-footer {
  margin-top: 10px;
  text-align: center;
  width: 100%;
}

.gauge-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 4px;
}

.gauge-limits {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #C0C4CC;
  margin-top: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gauge-container.mobile-view {
    padding: 5px;
  }
  
  .percentage-value {
    font-size: 18px;
  }
  
  .percentage-unit {
    font-size: 10px;
  }
  
  .gauge-label {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .percentage-value {
    font-size: 16px;
  }
  
  .gauge-limits {
    flex-direction: column;
    gap: 2px;
  }
}
</style>