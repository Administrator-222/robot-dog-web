// src/utils/errorHandler.ts

export interface ErrorInfo {
  type: 'network' | 'device' | 'command' | 'system' | 'data'
  code: string
  message: string
  timestamp: number
  data?: any
  retryable: boolean
}

export interface ErrorHandlerConfig {
  maxRetries: number
  retryDelay: number
  showNotifications: boolean
  logToConsole: boolean
  autoRecover: boolean
}

export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler
  private errorQueue: ErrorInfo[] = []
  private retryCount: Map<string, number> = new Map()
  private config: ErrorHandlerConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    showNotifications: true,
    logToConsole: true,
    autoRecover: true
  }
  
  private constructor() {
    this.setupGlobalHandlers()
  }
  
  public static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler()
    }
    return GlobalErrorHandler.instance
  }
  
  public setConfig(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config }
  }
  
  private setupGlobalHandlers(): void {
    // 监听未捕获的异常
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'system',
        code: 'UNCAUGHT_ERROR',
        message: event.message,
        timestamp: Date.now(),
        data: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        retryable: false
      })
    })
    
    // 监听未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'system',
        code: 'UNHANDLED_REJECTION',
        message: event.reason?.message || 'Promise rejected',
        timestamp: Date.now(),
        data: { reason: event.reason },
        retryable: false
      })
    })
  }
  
  public handleError(error: Omit<ErrorInfo, 'timestamp'>): void {
    const errorInfo: ErrorInfo = {
      ...error,
      timestamp: Date.now()
    }
    
    // 添加到错误队列
    this.errorQueue.unshift(errorInfo)
    
    // 限制队列长度
    if (this.errorQueue.length > 100) {
      this.errorQueue.pop()
    }
    
    // 控制台日志
    if (this.config.logToConsole) {
      console.error(`[Error ${errorInfo.code}] ${errorInfo.message}`, errorInfo.data)
    }
    
    // 显示通知
    if (this.config.showNotifications && this.shouldShowNotification(errorInfo)) {
      this.showNotification(errorInfo)
    }
    
    // 自动重试
    if (this.config.autoRecover && errorInfo.retryable) {
      this.scheduleRetry(errorInfo)
    }
  }
  
  private shouldShowNotification(error: ErrorInfo): boolean {
    // 根据错误类型决定是否显示通知
    const suppressTypes = ['data'] // 数据错误不显示通知
    return !suppressTypes.includes(error.type)
  }
  
  private showNotification(error: ErrorInfo): void {
    import('element-plus').then(({ ElNotification }) => {
      const title = this.getErrorTitle(error.type)
      const type = this.getErrorNotificationType(error.type)
      
      ElNotification({
        title,
        message: error.message,
        type,
        duration: error.type === 'device' ? 0 : 5000, // 设备错误持续显示
        position: 'bottom-right'
      })
    })
  }
  
  private getErrorTitle(type: string): string {
    const titles: Record<string, string> = {
      network: '网络错误',
      device: '设备连接错误',
      command: '指令执行错误',
      system: '系统错误',
      data: '数据处理错误'
    }
    return titles[type] || '未知错误'
  }
  
  private getErrorNotificationType(type: string): 'success' | 'warning' | 'error' | 'info' {
    const types: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      network: 'error',
      device: 'error',
      command: 'warning',
      system: 'error',
      data: 'info'
    }
    return types[type] || 'error'
  }
  
  private scheduleRetry(error: ErrorInfo): void {
    const errorKey = `${error.code}:${JSON.stringify(error.data)}`
    const currentRetries = this.retryCount.get(errorKey) || 0
    
    if (currentRetries < this.config.maxRetries) {
      this.retryCount.set(errorKey, currentRetries + 1)
      
      setTimeout(() => {
        this.executeRetry(error)
      }, this.config.retryDelay * Math.pow(2, currentRetries)) // 指数退避
    }
  }
  
  private async executeRetry(error: ErrorInfo): Promise<void> {
    console.log(`[Retry] Attempting to recover from error: ${error.code}`)
    
    try {
      switch (error.type) {
        case 'network':
          await this.retryNetworkConnection()
          break
        case 'device':
          await this.retryDeviceConnection()
          break
        case 'command':
          await this.retryCommand()
          break
        default:
          console.log(`[Retry] No retry handler for error type: ${error.type}`)
      }
    } catch (retryError) {
      console.error('[Retry] Retry failed:', retryError)
    }
  }
  
  private async retryNetworkConnection(): Promise<void> {
    // 模拟网络连接重试
    console.log('[Retry] Retrying network connection...')
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('[Retry] Network connection restored')
  }
  
  private async retryDeviceConnection(): Promise<void> {
    // 模拟设备连接重试
    console.log('[Retry] Retrying device connection...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('[Retry] Device connection restored')
  }
  
  private async retryCommand(): Promise<void> {
    // 模拟指令重试
    console.log('[Retry] Retrying command...')
    await new Promise(resolve => setTimeout(resolve, 300))
    console.log('[Retry] Command executed successfully')
  }
  
  public getErrorHistory(): ErrorInfo[] {
    return [...this.errorQueue]
  }
  
  public clearErrorHistory(): void {
    this.errorQueue = []
    this.retryCount.clear()
  }
  
  public getErrorStatistics(): {
    total: number
    byType: Record<string, number>
    last24Hours: number
  } {
    const now = Date.now()
    const last24Hours = this.errorQueue.filter(
      error => now - error.timestamp < 24 * 60 * 60 * 1000
    ).length
    
    const byType = this.errorQueue.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      total: this.errorQueue.length,
      byType,
      last24Hours
    }
  }
}

// 导出单例实例
export const errorHandler = GlobalErrorHandler.getInstance()