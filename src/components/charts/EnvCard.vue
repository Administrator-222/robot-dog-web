<template>
  <div class="env-card">
    <div class="label">{{ label }}</div>
    <div class="value">{{ value.toFixed(1) }} <span class="unit">{{ unit }}</span></div>
    <el-progress :percentage="percentage" :color="progressColor" :show-text="false" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'  // ← 关键：导入 computed

const props = defineProps<{
  label: string
  value: number
  unit: string
  percentage: number
  isBattery?: boolean  // 用于电池低电量变红
}>()

// 动态颜色：电池低电量红色优先，其他按原有规则
const progressColor = computed(() => {
  if (props.isBattery && props.percentage < 20) return '#F56C6C'  // 低电量红色
  if (props.percentage > 80) return '#F56C6C'
  if (props.percentage > 60) return '#E6A23C'
  return '#67C23A'
})
</script>

<style scoped>
.env-card { padding: 10px; text-align: center; }
.label { font-size: 12px; color: #909399; margin-bottom: 8px; }
.value { font-size: 24px; font-weight: bold; color: #303133; margin-bottom: 8px; }
.unit { font-size: 14px; font-weight: normal; }
</style>