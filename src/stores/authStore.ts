// src/stores/authStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export type Role = 'admin' | 'operator' | 'viewer'

export interface User {
  username: string
  role: Role
  permissions: string[]
}

// 权限定义
const PERMISSIONS = {
  // 管理员权限
  admin: [
    'dashboard.view',
    'control.view',
    'control.edit',
    'history.view',
    'history.edit',
    'system.settings',
    'user.manage'
  ],
  // 操作员权限
  operator: [
    'dashboard.view',
    'control.view',
    'control.edit'
  ],
  // 查看员权限
  viewer: [
    'dashboard.view'
  ]
}

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const user = ref<User | null>(null)

  // 检查权限
  const hasPermission = (permission: string): boolean => {
    if (!user.value) return false
    return user.value.permissions.includes(permission)
  }

  // 检查角色
  const hasRole = (role: Role): boolean => {
    return user.value?.role === role
  }

  // 登录
  const login = (username: string, password: string, role: Role) => {
    // 模拟验证，实际项目请换成 axios 调用后端接口
    if (password === '123456') {
      const permissions = PERMISSIONS[role] || []
      
      user.value = { 
        username, 
        role,
        permissions
      }
      
      localStorage.setItem('user', JSON.stringify(user.value))
      ElMessage.success('登录成功')
      
      // 根据角色跳转到不同页面
      if (role === 'admin' || role === 'operator') {
        router.push('/')
      } else {
        router.push('/')
      }
    } else {
      ElMessage.error('密码错误，请输入 123456')
    }
  }

  // 注销
  const logout = () => {
    user.value = null
    localStorage.removeItem('user')
    ElMessage.info('已退出登录')
    router.push('/login')
  }

  // 页面刷新时恢复登录状态
  const init = () => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // 确保权限存在
        if (!parsed.permissions) {
          parsed.permissions = PERMISSIONS[parsed.role as Role] || []
        }
        user.value = parsed
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('user')
      }
    }
  }

  // 获取用户可访问的菜单
  const getAccessibleMenus = () => {
    if (!user.value) return []
    
    const menus = [
      { path: '/', name: '实时监控', icon: 'Monitor', permission: 'dashboard.view' },
      { path: '/control', name: '任务控制', icon: 'Operation', permission: 'control.view' },
      { path: '/history', name: '历史数据', icon: 'Histogram', permission: 'history.view' }
    ]
    
    return menus.filter(menu => hasPermission(menu.permission))
  }

  // 检查是否有历史数据访问权限
  const canAccessHistory = (): boolean => {
    return hasPermission('history.view')
  }

  // 检查是否有控制台访问权限
  const canAccessControl = (): boolean => {
    return hasPermission('control.view')
  }

  return { 
    user, 
    login, 
    logout, 
    init, 
    hasPermission,
    hasRole,
    getAccessibleMenus,
    canAccessHistory,
    canAccessControl
  }
})