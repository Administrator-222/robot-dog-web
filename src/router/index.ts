// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { ElMessage } from 'element-plus'
import type { Role } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        { 
          path: '', 
          component: () => import('@/views/Dashboard.vue'),
          meta: { 
            requiresAuth: true, 
            allowedRoles: ['admin', 'operator', 'viewer'],
            title: '实时监控'
          }
        },
        { 
          path: 'control', 
          component: () => import('@/views/TaskControl.vue'),
          meta: { 
            requiresAuth: true, 
            allowedRoles: ['admin', 'operator'],
            title: '任务控制'
          }
        },
        { 
          path: 'history', 
          component: () => import('@/views/HistoryView.vue'),
          meta: { 
            requiresAuth: true, 
            allowedRoles: ['admin'],
            title: '历史数据'
          }
        }
      ]
    },
    { 
      path: '/login', 
      component: () => import('@/views/Login.vue'),
      meta: { 
        requiresAuth: false,
        title: '登录'
      }
    }
  ]
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const allowedRoles = to.meta.allowedRoles as Role[] | undefined

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 智能机器狗控制系统`
  }

  // 如果路由需要认证但用户未登录，重定向到登录页
  if (requiresAuth && !authStore.user) {
    next('/login')
    return
  }

  // 如果用户已登录，检查角色权限
  if (requiresAuth && authStore.user && allowedRoles) {
    if (!allowedRoles.includes(authStore.user.role)) {
      // 角色无权限，重定向到首页
      ElMessage.warning('您没有权限访问此页面')
      next('/')
      return
    }
  }

  next()
})

export default router