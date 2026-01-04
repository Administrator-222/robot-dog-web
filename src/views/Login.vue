<template>
  <div class="login-container">
    <el-card class="login-box">
      <h2>机器狗控制系统</h2>
      <el-form>
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="form.role" placeholder="选择角色">
            <el-option label="管理员 (全权限)" value="admin" />
            <el-option label="操作员 (监控+控制)" value="operator" />
            <el-option label="查看员 (仅查看)" value="viewer" />
          </el-select>
        </el-form-item>
        <el-button type="primary" style="width: 100%" @click="handleLogin">登录</el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useAuthStore, type Role } from '@/stores/authStore'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const form = reactive({ username: 'admin', password: '', role: 'admin' as Role })

const handleLogin = () => {
  if (!form.role) return ElMessage.error('请选择角色')
  authStore.login(form.username, form.password, form.role as Role)
}
</script>

<style scoped>
.login-container { height: 100vh; display: flex; align-items: center; justify-content: center; background: #2d3a4b; }
.login-box { width: 350px; text-align: center; }
</style>