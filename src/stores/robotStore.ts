// src/stores/robotStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { mockSocket, type RobotData } from '@/api/mockSocket'
import { useHistoryStore } from '@/stores/historyStore' // 保留A项目的历史记录
import { ElNotification, ElMessage } from 'element-plus'

// B项目新增：结构化的日志接口
export interface CommandLog {
  id: string; // 唯一标识，用于匹配 ACK
  time: string; // 时间字符串
  timestamp: number; // 时间戳，用于排序
  type: string; // 指令类型 (MOVE, ACTION, SET_SPEED, EXEC_PATH, etc.)
  params: string; // 参数详情 (JSON string)
  result: "Pending" | "Success" | "Failed"; // 执行状态
}

export const useRobotStore = defineStore('robot', () => {
  const isConnected = ref(false)
  const isPaused = ref(false) // B项目新增：暂停状态
  const logs = ref<CommandLog[]>([]) // B项目修改：使用结构化日志
  
  const status = ref<RobotData>({
    timestamp: 0, battery: 100, mode: 'Stand',
    pose: { pitch: 0, roll: 0, yaw: 0 },
    imu: { accel: [0,0,0], gyro: [0,0,0], mag: [0,0,0] },
    env: { temp: 0, humidity: 0, distance: 0, pressure: 0 },
    position: [0, 0]
  })

  // 保留A项目的历史存储引用
  const historyStore = useHistoryStore()

  const connect = () => {
    mockSocket.connect('ws://mock-robot-dog:8080')
    
    mockSocket.on('open', () => {
      isConnected.value = true
      ElNotification.success('机器狗已连接')
      
      // 保留A项目：添加连接记录到历史
      historyStore.addRecord({
        timestamp: Date.now(),
        type: 'task',
        category: 'connection',
        title: '设备连接',
        data: { 
          status: 'connected', 
          message: '机器狗已成功连接',
          timestamp: Date.now()
        }
      })
    })

    mockSocket.on('message', (msg: any) => {
      if (msg.type === 'TELEM') {
        const newData = msg.data
        status.value = newData
        
        // 保留A项目：保存传感器数据到历史记录
        saveTelemetryToHistory(newData)
        
        // 保留A项目：阈值告警逻辑
        if (newData.env.temp > 35) {
          ElNotification.warning({ 
            title: '高温警告', 
            message: '电机温度过高！',
            duration: 5000
          })
          
          // 保存告警记录
          historyStore.addRecord({
            timestamp: Date.now(),
            type: 'alert',
            category: 'system',
            title: '高温警告',
            data: {
              temperature: newData.env.temp,
              threshold: 35,
              message: '电机温度过高',
              timestamp: Date.now()
            }
          })
        }
        
        // 保留A项目：低电量告警
        if (newData.battery < 20) {
          historyStore.addRecord({
            timestamp: Date.now(),
            type: 'alert',
            category: 'system',
            title: '低电量警告',
            data: {
              battery: newData.battery,
              threshold: 20,
              message: '电池电量低于20%',
              timestamp: Date.now()
            }
          })
        }
        
      } else if (msg.type === 'ACK') {
        // B项目修改：收到 ACK，根据 ID 更新日志状态
        const targetLog = logs.value.find((l) => l.id === msg.cmd.id);
        if (targetLog) {
          targetLog.result = "Success";
          
          // 保留A项目：添加指令记录到历史
          historyStore.addRecord({
            timestamp: Date.now(),
            type: 'command',
            category: 'control',
            title: '指令执行',
            data: {
              command: msg.cmd,
              response: 'acknowledged',
              timestamp: Date.now()
            }
          })
        }
      }
    })

    // 保留A项目：错误处理
    mockSocket.on('error', () => {
      isConnected.value = false
      ElNotification.error('连接发生错误')
      
      historyStore.addRecord({
        timestamp: Date.now(),
        type: 'alert',
        category: 'connection',
        title: '连接错误',
        data: {
          status: 'error',
          message: '连接发生错误',
          timestamp: Date.now()
        }
      })
    })

    mockSocket.on('close', () => {
      isConnected.value = false
      ElNotification.warning('连接已关闭')
      
      historyStore.addRecord({
        timestamp: Date.now(),
        type: 'alert',
        category: 'connection',
        title: '连接关闭',
        data: {
          status: 'closed',
          message: '连接已关闭',
          timestamp: Date.now()
        }
      })
    })
  }

  // 保留A项目：保存遥测数据到历史记录
  const saveTelemetryToHistory = (data: RobotData) => {
    // 限制保存频率，每2秒保存一次，避免数据过多
    const lastRecord = historyStore.records[0]
    if (lastRecord && lastRecord.type === 'telemetry' && 
        (Date.now() - lastRecord.timestamp < 2000)) {
      return
    }
    
    try {
      historyStore.addRecord({
        timestamp: data.timestamp || Date.now(),
        type: 'telemetry',
        category: 'sensor',
        title: '传感器数据',
        data: {
          battery: data.battery,
          mode: data.mode,
          pose: { ...data.pose },
          imu: {
            accel: [...data.imu.accel],
            gyro: [...data.imu.gyro],
            mag: [...data.imu.mag]
          },
          env: {
            temp: data.env.temp,
            humidity: data.env.humidity,
            distance: data.env.distance,
            pressure: data.env.pressure || 1013
          },
          position: [...data.position],
          timestamp: data.timestamp || Date.now()
        }
      })
    } catch (error) {
      console.error('保存遥测数据失败:', error)
    }
  }

  // B项目修改：增强sendCommand函数
  const sendCommand = (cmd: any) => {
    if (!isConnected.value) {
      ElNotification.warning('设备未连接，无法发送指令')
      return
    }
    
    // B项目新增：发送前预先记录日志
    const cmdId = Date.now().toString() + Math.floor(Math.random() * 1000);

    // 浅拷贝指令并注入 ID，确保 socket 回传时带回 ID
    const payload = { ...cmd, id: cmdId };

    // 提取用于显示的参数（排除 type 和 id）
    const { type, id, ...params } = payload;

    // B项目：添加结构化日志
    logs.value.unshift({
      id: cmdId,
      time: new Date().toLocaleTimeString(),
      timestamp: Date.now(),
      type: type,
      params: JSON.stringify(params), // 将参数对象转为字符串存储
      result: "Pending", // 默认为发送中
    });

    // 保留A项目：添加指令记录到历史
    historyStore.addRecord({
      timestamp: Date.now(),
      type: 'command',
      category: 'control',
      title: '发送指令',
      data: { 
        command: cmd,
        timestamp: Date.now()
      }
    })
    
    mockSocket.send(payload)
  }

  // B项目新增：全局停止函数
  const globalStop = () => {
    isPaused.value = false; // 重置暂停状态
    // 发送最高优先级的物理停止指令
    sendCommand({ type: "MOVE", direction: "STOP" });
  };

  // 断开连接（保留A项目）
  const disconnect = () => {
    mockSocket.removeAllListeners?.()
    isConnected.value = false
    
    // 添加断开连接记录
    historyStore.addRecord({
      timestamp: Date.now(),
      type: 'task',
      category: 'connection',
      title: '设备断开',
      data: { 
        status: 'disconnected', 
        message: '手动断开连接',
        timestamp: Date.now()
      }
    })
    
    ElNotification.info('已断开连接')
  }

  // 保留A项目：模拟数据生成
  const generateMockData = (count: number = 50) => {
    const mockRecords = []
    const now = Date.now()
    
    for (let i = count; i > 0; i--) {
      const timestamp = now - (i * 60000) // 每分钟一条数据
      const battery = Math.max(10, 100 - (i * 1.5))
      const temp = 24 + Math.sin(i * 0.1) * 8
      
      mockRecords.push({
        timestamp,
        type: 'telemetry' as const,
        category: 'sensor',
        title: '传感器数据',
        data: {
          battery,
          mode: i % 3 === 0 ? 'Walk' : 'Stand',
          pose: {
            pitch: Math.sin(i * 0.2) * 15,
            roll: Math.cos(i * 0.2) * 10,
            yaw: i * 0.5
          },
          imu: {
            accel: [
              Math.sin(i * 0.3) * 5,
              Math.cos(i * 0.3) * 5,
              9.8 + Math.random() * 0.5
            ],
            gyro: [
              Math.sin(i * 0.2) * 2,
              Math.cos(i * 0.2) * 2,
              Math.random() * 1.5
            ],
            mag: [
              30 + Math.sin(i * 0.1) * 10,
              20 + Math.cos(i * 0.1) * 8,
              50 + Math.random() * 15
            ]
          },
          env: {
            temp,
            humidity: 50 + Math.sin(i * 0.15) * 20,
            distance: 100 + Math.cos(i * 0.1) * 80,
            pressure: 1013 + Math.sin(i * 0.05) * 10
          },
          position: [
            Math.sin(i * 0.1) * 8,
            Math.cos(i * 0.1) * 8
          ],
          timestamp
        }
      })
    }
    
    // 添加一些告警记录
    mockRecords.push({
      timestamp: now - 30000,
      type: 'alert' as const,
      category: 'system',
      title: '低电量警告',
      data: {
        battery: 18.5,
        threshold: 20,
        message: '电池电量低于20%',
        acknowledged: false,
        level: 'error',
        timestamp: now - 30000
      }
    })
    
    mockRecords.push({
      timestamp: now - 60000,
      type: 'alert' as const,
      category: 'system',
      title: '高温警告',
      data: {
        temperature: 38.2,
        threshold: 35,
        message: '环境温度过高',
        acknowledged: true,
        level: 'warning',
        timestamp: now - 60000
      }
    })
    
    // 添加一些任务记录
    mockRecords.push({
      timestamp: now - 120000,
      type: 'task' as const,
      category: 'control',
      title: '路径规划',
      data: {
        task: 'path_planning',
        success: true,
        start: [0, 0],
        end: [5, 5],
        timestamp: now - 120000
      }
    })
    
    // 添加模拟数据到历史记录
    mockRecords.forEach(record => {
      historyStore.addRecord(record)
    })
    
    ElMessage.success(`已生成 ${count + 3} 条模拟数据（包含传感器数据、告警和任务记录）`)
  }

  // B项目修改：清空日志
  const clearLogs = () => {
    logs.value = []
  }

  return { 
    isConnected, 
    isPaused, // B项目新增
    status, 
    logs, 
    connect, 
    sendCommand, 
    disconnect,
    generateMockData,
    clearLogs,
    globalStop // B项目新增
  }
})