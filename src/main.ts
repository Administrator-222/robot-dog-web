import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import '@/styles/responsive.css'

import App from './App.vue'
import router from './router'
import { errorHandler } from './utils/errorHandler'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 配置全局错误处理器
errorHandler.setConfig({
  maxRetries: 3,
  retryDelay: 1000,
  showNotifications: true,
  logToConsole: import.meta.env.DEV,
  autoRecover: true
})

// 将错误处理器暴露给全局（仅开发环境）
if (import.meta.env.DEV) {
  // @ts-ignore
  window.$errorHandler = errorHandler
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 全局错误处理中间件
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue 错误:', err, instance, info)

  const error = err as Error
  
  errorHandler.handleError({
    type: 'system',
    code: 'VUE_ERROR',
    message: error?.message || '未知Vue错误',
    data: {
      component: instance?.$options.name,
      info,
      stack: error?.stack
    },
    retryable: false
  })
}

app.mount('#app')