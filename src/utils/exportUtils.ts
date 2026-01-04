// src/utils/exportUtils.ts

/**
 * 导出CSV文件，解决中文乱码问题
 * @param data 二维数组，第一行为表头
 * @param filename 文件名
 */
export const exportCSV = (data: any[][], filename: string) => {
  if (!data || data.length === 0) {
    console.warn('导出数据为空')
    return
  }
  
  // 构建CSV内容
  const csvContent = data.map(row => {
    return row.map(cell => {
      if (cell === null || cell === undefined) {
        return ''
      }
      
      let cellStr = String(cell)
      
      // 处理换行符
      cellStr = cellStr.replace(/\n/g, ' ')
      
      // 转义双引号
      cellStr = cellStr.replace(/"/g, '""')
      
      // 如果包含逗号、双引号或换行符，需要加引号
      if (cellStr.includes(',') || cellStr.includes('"')) {
        return `"${cellStr}"`
      }
      
      return cellStr
    }).join(',')
  }).join('\n')
  
  // 添加UTF-8 BOM头解决中文乱码
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], { 
    type: 'text/csv;charset=utf-8' 
  })
  
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${formatDate(new Date())}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // 清理URL
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 100)
}

/**
 * 导出JSON文件
 * @param data JSON数据
 * @param filename 文件名
 */
export const exportJSON = (data: any, filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { 
    type: 'application/json;charset=utf-8' 
  })
  
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${formatDate(new Date())}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 100)
}

/**
 * 导出传感器数据
 * @param sensorData 传感器数据
 * @param type 传感器类型
 * @param unit 单位
 */
export const exportSensorDataToCSV = (
  sensorData: {
    labels: string[]
    x: number[]
    y: number[]
    z: number[]
  },
  type: string,
  unit: string
) => {
  const headers = [
    '时间',
    `X轴(${unit})`,
    `Y轴(${unit})`,
    `Z轴(${unit})`
  ]
  
  const data = sensorData.labels.map((label, index) => [
    label,
    sensorData.x[index]?.toFixed(3) || '0',
    sensorData.y[index]?.toFixed(3) || '0',
    sensorData.z[index]?.toFixed(3) || '0'
  ])
  
  exportCSV([headers, ...data], `${type}_传感器数据`)
}

/**
 * 格式化日期为字符串
 * @param date 日期对象
 * @returns 格式化的日期字符串 YYYYMMDD_HHmmss
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}${month}${day}_${hour}${minute}${second}`
}

/**
 * 通用下载函数
 * @param content 文件内容
 * @param filename 文件名
 * @param mimeType MIME类型
 */
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 100)
}