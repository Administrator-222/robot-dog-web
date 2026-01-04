<template>
  <el-container class="layout-container">
    <el-aside width="200px" :class="{ 'mobile-sidebar': isMobile }">
      <div class="logo">RobotLog UI</div>
      <el-menu
        :default-active="$route.path"
        router
        :collapse="isMobile"
        @select="handleMenuSelect"
      >
        <!-- 所有角色都有实时监控权限 -->
        <el-menu-item index="/">
          <el-icon><Monitor /></el-icon>
          <span>实时监控</span>
        </el-menu-item>

        <!-- 管理员和操作员有任务控制权限 -->
        <el-menu-item 
          index="/control" 
          v-if="hasPermission('control')"
        >
          <el-icon><Operation /></el-icon>
          <span>任务控制</span>
        </el-menu-item>
        
        <!-- 只有管理员有历史数据权限 -->
        <el-menu-item 
          index="/history" 
          v-if="hasPermission('history')"
        >
          <el-icon><Histogram /></el-icon>
          <span>历史数据</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header :class="{ 'mobile-header': isMobile }">
        <div class="header-left">
          {{ pageTitle }}
        </div>
        <div class="header-right">
          <el-tag :type="robotStore.isConnected ? 'success' : 'danger'" size="small">
            {{ robotStore.isConnected ? '设备已在线' : '设备离线' }}
          </el-tag>

          <template v-if="authStore.user">
            <span class="user-info">
              {{ authStore.user.username }}
              ({{ roleText }})
            </span>
            <el-button
              type="text"
              @click="authStore.logout"
              class="logout-btn"
            >
              注销
            </el-button>
          </template>
        </div>
      </el-header>

      <el-main :class="{ 'mobile-main': isMobile }">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
      
      <!-- 移动端菜单开关 -->
      <div v-if="isMobile" class="mobile-menu-toggle" @click="toggleSidebar">
        <el-icon :size="20">
          <Menu v-if="!sidebarVisible" />
          <Close v-if="sidebarVisible" />
        </el-icon>
      </div>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRobotStore } from '@/stores/robotStore'
import { useAuthStore } from '@/stores/authStore'
import { Monitor, Operation, Histogram, Menu, Close } from '@element-plus/icons-vue'

const robotStore = useRobotStore()
const authStore = useAuthStore()
const route = useRoute()

const isMobile = ref(false)
const sidebarVisible = ref(false)

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': '实时监控',
    '/control': '任务控制',
    '/history': '历史数据'
  }
  return titles[route.path] || '机器狗控制系统'
})

const roleText = computed(() => {
  const roles: Record<string, string> = {
    admin: '管理员',
    operator: '操作员',
    viewer: '查看员'
  }
  return roles[authStore.user?.role || 'viewer']
})

// 权限检查
const hasPermission = (page: 'control' | 'history') => {
  if (!authStore.user) return false
  
  switch (page) {
    case 'control':
      return authStore.user.role === 'admin' || authStore.user.role === 'operator'
    case 'history':
      return authStore.user.role === 'admin'
    default:
      return false
  }
}

// 检查设备类型
const checkDevice = () => {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) {
    sidebarVisible.value = false
  }
}

// 处理菜单选择（移动端关闭侧边栏）
const handleMenuSelect = () => {
  if (isMobile.value) {
    sidebarVisible.value = false
  }
}

// 切换侧边栏
const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value
}

onMounted(() => {
  checkDevice()
  window.addEventListener('resize', checkDevice)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkDevice)
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.el-aside {
  background-color: #304156;
  color: #fff;
  transition: all 0.3s;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  background: #2b2f3a;
}

.el-menu {
  border-right: none;
  background-color: #304156;
}

.el-menu :deep(.el-menu-item) {
  color: #bfcbd9;
}

.el-menu :deep(.el-menu-item.is-active) {
  color: #409EFF;
  background-color: #263445;
}

.el-header {
  background: #fff;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  transition: all 0.3s;
}

.header-left {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info {
  color: #909399;
  font-size: 14px;
}

.logout-btn {
  color: #409EFF;
}

.el-main {
  padding: 20px;
  background-color: #f5f7fa;
  overflow-y: auto;
}

/* 移动端样式 */
@media (max-width: 768px) {
  .mobile-sidebar {
    position: fixed;
    left: -200px;
    top: 0;
    bottom: 0;
    z-index: 1000;
    transition: left 0.3s;
  }
  
  .mobile-sidebar.el-aside {
    left: 0;
  }
  
  .mobile-header {
    padding: 0 10px;
    height: 50px;
  }
  
  .mobile-main {
    padding: 10px;
  }
  
  .header-left {
    font-size: 16px;
  }
  
  .header-right {
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 5px;
  }
  
  .user-info {
    font-size: 12px;
  }
  
  .mobile-menu-toggle {
    position: fixed;
    right: 10px;
    bottom: 10px;
    z-index: 1001;
    background: #409EFF;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    cursor: pointer;
  }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>