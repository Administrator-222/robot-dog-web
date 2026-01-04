// src/stores/historyStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

export interface HistoryRecord {
  id: string
  timestamp: number
  type: 'telemetry' | 'command' | 'alert' | 'task'
  category: string
  title: string
  data: any
  metadata?: {
    duration?: number
    success?: boolean
    error?: string
    operator?: string
  }
}

export interface DataExportConfig {
  format: 'csv' | 'json' | 'excel'
  timeRange: [Date, Date]
  categories: string[]
  includeMetadata: boolean
}

export interface SensorData {
  labels: string[]
  x: number[]
  y: number[]
  z: number[]
  timestamps?: number[]
}

export const useHistoryStore = defineStore('history', () => {
  // 历史记录存储
  const records = ref<HistoryRecord[]>([])
  const MAX_RECORDS = 10000
  
  // 添加记录
  const addRecord = (record: Omit<HistoryRecord, 'id'>) => {
    const newRecord: HistoryRecord = {
      ...record,
      id: generateId()
    }
    
    records.value.unshift(newRecord)
    
    // 限制记录数量
    if (records.value.length > MAX_RECORDS) {
      records.value.pop()
    }
    
    console.log(`历史记录已添加: ${newRecord.type} - ${newRecord.title}`)
    return newRecord
  }
  
  // 查询记录
  const queryRecords = (options?: {
    startTime?: Date
    endTime?: Date
    type?: HistoryRecord['type']
    categories?: string[]
    keyword?: string
    limit?: number
  }) => {
    let filtered = [...records.value]
    
    if (options?.startTime) {
      filtered = filtered.filter(r => r.timestamp >= options.startTime!.getTime())
    }
    
    if (options?.endTime) {
      filtered = filtered.filter(r => r.timestamp <= options.endTime!.getTime())
    }
    
    if (options?.type) {
      filtered = filtered.filter(r => r.type === options.type)
    }
    
    if (options?.categories && options.categories.length > 0) {
      filtered = filtered.filter(r => options.categories!.includes(r.category))
    }
    
    if (options?.keyword) {
      const keyword = options.keyword.toLowerCase()
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(keyword) ||
        r.category.toLowerCase().includes(keyword) ||
        JSON.stringify(r.data).toLowerCase().includes(keyword) ||
        getTypeLabel(r.type).toLowerCase().includes(keyword)
      )
    }
    
    if (options?.limit) {
      filtered = filtered.slice(0, options.limit)
    }
    
    return filtered
  }
  
  // 导出数据
  const exportData = async (config: DataExportConfig) => {
    try {
      const filteredRecords = queryRecords({
        startTime: config.timeRange[0],
        endTime: config.timeRange[1],
        categories: config.categories.length > 0 ? config.categories : undefined
      })
      
      if (filteredRecords.length === 0) {
        ElMessage.warning('没有找到符合条件的数据')
        return
      }
      
      switch (config.format) {
        case 'csv':
          exportToCSV(filteredRecords, config)
          break
        case 'json':
          exportToJSON(filteredRecords, config)
          break
        case 'excel':
          await exportToExcel(filteredRecords, config)
          break
      }
      
      // 记录导出日志
      addRecord({
        timestamp: Date.now(),
        type: 'task',
        category: 'data_export',
        title: '数据导出',
        data: {
          format: config.format,
          count: filteredRecords.length,
          timeRange: config.timeRange,
          timestamp: Date.now()
        }
      })
      
    } catch (error) {
      ElMessage.error(`导出失败: ${error}`)
      throw error
    }
  }
  
  // CSV 导出（修复乱码问题）
  const exportToCSV = (records: HistoryRecord[], config: DataExportConfig) => {
    // 构建表头
    const headers = ['时间', '类型', '分类', '标题', '数据']
    if (config.includeMetadata) {
      headers.push('元数据')
    }
    
    // 构建数据行
    const rows = records.map(record => {
      const row = [
        formatDateForCSV(new Date(record.timestamp)),
        getTypeLabel(record.type),
        record.category,
        record.title,
        formatDataForCSV(record.data)
      ]
      
      if (config.includeMetadata && record.metadata) {
        row.push(formatDataForCSV(record.metadata))
      }
      
      return row
    })
    
    // 构建CSV内容
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // 处理单元格内容，避免CSV格式问题
        const cellStr = String(cell || '')
        // 转义双引号
        const escaped = cellStr.replace(/"/g, '""')
        // 如果包含逗号、换行或双引号，需要加引号
        if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
          return `"${escaped}"`
        }
        return escaped
      }).join(','))
    ].join('\n')
    
    // 添加UTF-8 BOM头解决中文乱码
    const bom = '\uFEFF'
    const timestamp = new Date().getTime()
    downloadFile(bom + csvContent, `history_export_${timestamp}.csv`, 'text/csv;charset=utf-8')
    
    ElMessage.success(`已导出 ${records.length} 条记录`)
  }
  
  // JSON 导出
  const exportToJSON = (records: HistoryRecord[], config: DataExportConfig) => {
    const data = {
      exportTime: new Date().toISOString(),
      count: records.length,
      timeRange: config.timeRange.map(d => d.toISOString()),
      records: records.map(record => ({
        ...record,
        timestamp: new Date(record.timestamp).toISOString()
      }))
    }
    
    const jsonContent = JSON.stringify(data, null, 2)
    const timestamp = new Date().getTime()
    downloadFile(jsonContent, `history_export_${timestamp}.json`, 'application/json')
  }
  
  // Excel 导出（简化版）
  const exportToExcel = async (records: HistoryRecord[], config: DataExportConfig) => {
    // 在实际项目中，这里可以使用 sheetjs 库
    // 这里简化处理，转为 CSV
    exportToCSV(records, config)
  }
  
  // 下载文件工具函数
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 清理URL
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)
  }
  
  // 格式化日期为CSV使用
  const formatDateForCSV = (date: Date): string => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }
  
  // 格式化数据为CSV使用
  const formatDataForCSV = (data: any): string => {
    if (data === null || data === undefined) {
      return ''
    }
    
    if (typeof data === 'string') {
      return data
    }
    
    if (typeof data === 'number' || typeof data === 'boolean') {
      return String(data)
    }
    
    // 如果是数组或对象，转为JSON字符串
    try {
      return JSON.stringify(data)
    } catch {
      return String(data)
    }
  }
  
  // 获取类型标签
  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      telemetry: '遥测数据',
      command: '指令记录',
      alert: '系统告警',
      task: '任务记录'
    }
    return labels[type] || type
  }
  
  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
  
  // 清空历史记录
  const clearHistory = () => {
    records.value = []
    ElMessage.success('历史记录已清空')
  }
  
  // 统计数据
  const statistics = computed(() => {
    const total = records.value.length
    const byType = records.value.reduce((acc, record) => {
      acc[record.type] = (acc[record.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const byCategory = records.value.reduce((acc, record) => {
      acc[record.category] = (acc[record.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayCount = records.value.filter(r => r.timestamp >= today.getTime()).length
    
    // 获取最近7天的记录数量
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const last7DaysCount = records.value.filter(r => r.timestamp >= sevenDaysAgo.getTime()).length
    
    // 获取告警数量
    const alertCount = records.value.filter(r => r.type === 'alert').length
    const unacknowledgedAlerts = records.value.filter(r => 
      r.type === 'alert' && r.data?.acknowledged === false
    ).length
    
    return {
      total,
      byType,
      byCategory,
      todayCount,
      last7DaysCount,
      alertCount,
      unacknowledgedAlerts
    }
  })
  
  // 图表回放数据准备
  const preparePlaybackData = (category: string, startTime?: Date, endTime?: Date): SensorData => {
    const filtered = queryRecords({
      category,
      startTime,
      endTime,
      type: 'telemetry'
    })
    
    const result: SensorData = {
      x: [],
      y: [],
      z: [],
      labels: [],
      timestamps: []
    }
    
    filtered.forEach(record => {
      if (record.data?.imu?.accel) {
        result.x.push(record.data.imu.accel[0] || 0)
        result.y.push(record.data.imu.accel[1] || 0)
        result.z.push(record.data.imu.accel[2] || 0)
      } else if (record.data?.x !== undefined) {
        result.x.push(record.data.x)
        result.y.push(record.data.y)
        result.z.push(record.data.z)
      }
      
      result.labels.push(new Date(record.timestamp).toLocaleTimeString())
      result.timestamps?.push(record.timestamp)
    })
    
    return result
  }
  
  // 导出传感器数据（专门用于传感器数据导出，避免乱码）
  const exportSensorData = (sensorData: SensorData, sensorType: string) => {
    const typeNames: Record<string, string> = {
      accel: '加速度',
      gyro: '陀螺仪',
      mag: '磁力计',
      acceleration: '加速度',
      gyroscope: '陀螺仪',
      magnetometer: '磁力计'
    }
    
    const unitNames: Record<string, string> = {
      accel: 'm/s²',
      gyro: 'rad/s',
      mag: 'µT',
      acceleration: 'm/s²',
      gyroscope: 'rad/s',
      magnetometer: 'µT'
    }
    
    const typeName = typeNames[sensorType] || sensorType
    const unitName = unitNames[sensorType] || ''
    
    const headers = [
      '时间',
      `X轴(${unitName})`,
      `Y轴(${unitName})`,
      `Z轴(${unitName})`
    ]
    
    const rows = sensorData.labels.map((label, index) => [
      label,
      sensorData.x[index]?.toFixed(3) || '0',
      sensorData.y[index]?.toFixed(3) || '0',
      sensorData.z[index]?.toFixed(3) || '0'
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const cellStr = String(cell || '')
        const escaped = cellStr.replace(/"/g, '""')
        if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
          return `"${escaped}"`
        }
        return escaped
      }).join(','))
    ].join('\n')
    
    // 添加UTF-8 BOM头解决中文乱码
    const bom = '\uFEFF'
    const timestamp = new Date().getTime()
    const filename = `${typeName}_数据_${timestamp}.csv`
    
    downloadFile(
      bom + csvContent, 
      filename, 
      'text/csv;charset=utf-8'
    )
    
    return filename
  }
  
  // 批量导出传感器数据
  const exportAllSensorData = (sensorData: Record<string, SensorData>) => {
    const exportedFiles: string[] = []
    
    Object.entries(sensorData).forEach(([type, data]) => {
      if (data.labels.length > 0) {
        const filename = exportSensorData(data, type)
        exportedFiles.push(filename)
      }
    })
    
    return exportedFiles
  }
  
  // 获取最近N条记录
  const getRecentRecords = (limit: number = 50) => {
    return records.value.slice(0, limit)
  }
  
  // 按时间分组统计
  const getTimeGroupedStats = (groupBy: 'hour' | 'day' | 'month' = 'day') => {
    const grouped: Record<string, number> = {}
    
    records.value.forEach(record => {
      const date = new Date(record.timestamp)
      let key: string
      
      switch (groupBy) {
        case 'hour':
          key = date.toISOString().slice(0, 13) // YYYY-MM-DDTHH
          break
        case 'day':
          key = date.toISOString().slice(0, 10) // YYYY-MM-DD
          break
        case 'month':
          key = date.toISOString().slice(0, 7) // YYYY-MM
          break
        default:
          key = date.toISOString().slice(0, 10)
      }
      
      grouped[key] = (grouped[key] || 0) + 1
    })
    
    return grouped
  }
  
  // 获取告警记录
  const getAlertRecords = (options?: {
    startTime?: Date
    endTime?: Date
    acknowledged?: boolean
    level?: string
  }) => {
    let alerts = queryRecords({
      type: 'alert',
      startTime: options?.startTime,
      endTime: options?.endTime
    })
    
    if (options?.acknowledged !== undefined) {
      alerts = alerts.filter(alert => alert.data?.acknowledged === options.acknowledged)
    }
    
    if (options?.level) {
      alerts = alerts.filter(alert => alert.data?.level === options.level)
    }
    
    return alerts
  }
  
  // 导出告警记录
  const exportAlertRecords = (options?: {
    startTime?: Date
    endTime?: Date
    acknowledged?: boolean
    level?: string
  }) => {
    const alertRecords = getAlertRecords(options)
    
    if (alertRecords.length === 0) {
      ElMessage.warning('没有找到符合条件的告警记录')
      return
    }
    
    const headers = ['时间', '级别', '标题', '消息', '确认状态', '详细数据']
    const rows = alertRecords.map(record => [
      formatDateForCSV(new Date(record.timestamp)),
      record.data?.level || 'unknown',
      record.title,
      record.data?.message || '',
      record.data?.acknowledged ? '已确认' : '未确认',
      formatDataForCSV(record.data)
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const cellStr = String(cell || '')
        const escaped = cellStr.replace(/"/g, '""')
        if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
          return `"${escaped}"`
        }
        return escaped
      }).join(','))
    ].join('\n')
    
    const bom = '\uFEFF'
    const timestamp = new Date().getTime()
    downloadFile(
      bom + csvContent,
      `system_alerts_${timestamp}.csv`,
      'text/csv;charset=utf-8'
    )
    
    ElMessage.success(`已导出 ${alertRecords.length} 条告警记录`)
  }
  
  return {
    records,
    statistics,
    addRecord,
    queryRecords,
    getAlertRecords,
    exportData,
    exportAlertRecords,
    exportSensorData,
    exportAllSensorData,
    clearHistory,
    preparePlaybackData,
    getRecentRecords,
    getTimeGroupedStats
  }
})