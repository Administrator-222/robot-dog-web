<template>
  <el-config-provider :locale="locale" :size="size">
    <router-view />
    
    <!-- 全局错误提示 -->
    <teleport to="body">
      <el-dialog
        v-model="globalErrorVisible"
        title="系统异常"
        width="400px"
        :close-on-click-modal="false"
        :show-close="false"
      >
        <div class="error-dialog">
          <el-alert
            :title="globalError.title"
            :type="globalError.type"
            :description="globalError.message"
            :closable="false"
            center
            show-icon
          />
          <div class="error-actions">
            <el-button @click="handleErrorAction('reload')" type="primary">
              重新加载
            </el-button>
            <el-button @click="handleErrorAction('ignore')" plain>
              忽略
            </el-button>
            <el-button @click="handleErrorAction('report')" v-if="canReportError">
              反馈问题
            </el-button>
          </div>
        </div>
      </el-dialog>
    </teleport>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted, onErrorCaptured, onUnmounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'
import { useRobotStore } from '@/stores/robotStore'
import { useHistoryStore } from '@/stores/historyStore'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const locale = zhCn
const size = ref<'large' | 'default' | 'small'>('default')

const authStore = useAuthStore()
const robotStore = useRobotStore()
const historyStore = useHistoryStore()

// 全局错误处理
const globalErrorVisible = ref(false)
const globalError = ref({
  title: '',
  type: 'error' as const,
  message: ''
})

const canReportError = ref(false)

// 监听网络状态
const isOnline = ref(navigator.onLine)
const networkCheckInterval = ref<any>(null)

// 捕获全局错误
onErrorCaptured((error, instance, info) => {
  console.error('全局错误捕获:', error, info)
  
  globalError.value = {
    title: '应用程序错误',
    type: 'error',
    message: `错误信息: ${error.message}\n组件: ${instance?.$options.name || '未知'}\n位置: ${info}`
  }
  
  globalErrorVisible.value = true
  
  // 记录错误历史
  historyStore.addRecord({
    timestamp: Date.now(),
    type: 'alert',
    category: 'system',
    title: '应用程序错误',
    data: {
      message: error.message,
      stack: error.stack,
      component: instance?.$options.name,
      info
    }
  })
  
  return false // 阻止错误继续向上传播
})

// 网络状态变化处理
const handleOnline = () => {
  isOnline.value = true
  ElNotification.success({
    title: '网络连接恢复',
    message: '网络连接已恢复正常',
    duration: 3000
  })
  
  // 尝试重新连接设备
  if (!robotStore.isConnected) {
    setTimeout(() => {
      robotStore.connect()
    }, 1000)
  }
}

const handleOffline = () => {
  isOnline.value = false
  ElNotification.error({
    title: '网络连接断开',
    message: '请检查网络连接',
    duration: 0 // 持续显示直到恢复
  })
}

// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('全局错误事件:', event)
  
  // 记录资源加载错误
  if (event.target && (event.target as any).src) {
    historyStore.addRecord({
      timestamp: Date.now(),
      type: 'alert',
      category: 'system',
      title: '资源加载失败',
      data: {
        resource: (event.target as any).src,
        message: event.message
      }
    })
  }
})

// Promise 未捕获异常处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason)
  
  ElNotification.error({
    title: '异步操作失败',
    message: event.reason?.message || '未知错误',
    duration: 5000
  })
  
  historyStore.addRecord({
    timestamp: Date.now(),
    type: 'alert',
    category: 'system',
    title: '异步操作异常',
    data: {
      reason: event.reason?.message,
      stack: event.reason?.stack
    }
  })
})

// 错误处理动作
const handleErrorAction = (action: 'reload' | 'ignore' | 'report') => {
  switch (action) {
    case 'reload':
      location.reload()
      break
    case 'ignore':
      globalErrorVisible.value = false
      break
    case 'report':
      // 实际项目中这里可以跳转到反馈页面或发送错误报告
      ElMessage.info('错误报告功能开发中...')
      globalErrorVisible.value = false
      break
  }
}

// 初始化
onMounted(() => {
  // 恢复登录状态
  authStore.init()
  
  // 自动连接机器狗
  robotStore.connect()
  
  // 监听网络状态
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // 定期检查连接状态
  networkCheckInterval.value = setInterval(() => {
    if (!robotStore.isConnected && isOnline.value) {
      ElMessage.warning('设备连接断开，正在尝试重连...')
      robotStore.connect()
    }
  }, 30000)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  
  if (networkCheckInterval.value) {
    clearInterval(networkCheckInterval.value)
  }
})
</script>

<style scoped>
.error-dialog {
  text-align: center;
}

.error-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .error-actions {
    flex-direction: column;
    gap: 5px;
  }
}
</style>