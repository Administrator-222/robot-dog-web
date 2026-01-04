<template>
  <div class="history-container" :class="{ 'mobile-view': isMobile }">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>RobotLog UI</h1>
      <div class="header-subtitle">历史数据记录与分析</div>
    </div>

    <!-- 快速导航 -->
    <div class="quick-nav">
      <el-card shadow="never" class="nav-card">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="nav-item" @click="$router.push('/')">
              <el-icon><Monitor /></el-icon>
              <span>实时监控</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="nav-item" @click="$router.push('/control')" v-if="hasControlPermission">
              <el-icon><Operation /></el-icon>
              <span>任务控制</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="nav-item active">
              <el-icon><Histogram /></el-icon>
              <span>历史数据</span>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 数据查询条件 -->
    <el-card header="数据查询条件" style="margin-bottom: 20px;" shadow="never">
      <el-form :model="queryForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="queryForm.timeRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                style="width: 100%"
                :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
              />
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
            <el-form-item label="数据类型">
              <el-select v-model="queryForm.types" multiple placeholder="请选择" style="width: 100%">
                <el-option label="遥测数据" value="telemetry" />
                <el-option label="指令记录" value="command" />
                <el-option label="系统告警" value="alert" />
                <el-option label="任务记录" value="task" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
            <el-form-item label="数据分类">
              <el-select v-model="queryForm.categories" multiple placeholder="请选择" style="width: 100%">
                <el-option label="传感器" value="sensor" />
                <el-option label="姿态控制" value="pose" />
                <el-option label="环境监测" value="environment" />
                <el-option label="设备控制" value="control" />
                <el-option label="系统状态" value="system" />
                <el-option label="连接状态" value="connection" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="8" :lg="4" :xl="4">
            <el-form-item label="关键词">
              <el-input
                v-model="queryForm.keyword"
                placeholder="请输入关键词"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <div class="form-actions">
          <el-button type="primary" @click="handleQuery" :loading="queryLoading">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button type="success" @click="handleExport" :disabled="filteredRecords.length === 0">
            <el-icon><Download /></el-icon>
            导出所有数据
          </el-button>
          <el-button type="warning" @click="exportAlerts" :disabled="queryAlerts().length === 0">
            <el-icon><Warning /></el-icon>
            仅导出告警
          </el-button>
          <el-button type="info" @click="generateMockData">
            <el-icon><MagicStick /></el-icon>
            生成测试数据
          </el-button>
          <el-button type="danger" @click="clearHistory" plain v-if="authStore.user?.role === 'admin'">
            <el-icon><Delete /></el-icon>
            清空历史
          </el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 统计信息卡片 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :xs="24" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon total">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">总记录数</div>
              <div class="stat-value">{{ statistics.total }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon today">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">今日记录</div>
              <div class="stat-value">{{ statistics.todayCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon week">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">近7天记录</div>
              <div class="stat-value">{{ statistics.last7DaysCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon alert">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">未确认告警</div>
              <div class="stat-value">{{ statistics.unacknowledgedAlerts || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据表格 -->
    <el-card header="历史数据记录" shadow="never">
      <template #header>
        <div class="table-header">
          <span class="table-title">历史数据记录</span>
          <div class="table-actions">
            <el-button-group>
              <el-button size="small" @click="showChartPlayback" :disabled="!hasSensorData">
                <el-icon><VideoPlay /></el-icon>
                图表回放
              </el-button>
              <el-button size="small" @click="showDataAnalysis" :disabled="filteredRecords.length === 0">
                <el-icon><PieChart /></el-icon>
                数据分析
              </el-button>
              <el-button size="small" @click="refreshData">
                <el-icon><RefreshRight /></el-icon>
                刷新数据
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <div class="table-container">
        <el-table
          :data="displayRecords"
          v-loading="queryLoading"
          stripe
          border
          style="width: 100%"
          :height="tableHeight"
          :default-sort="{ prop: 'timestamp', order: 'descending' }"
          @sort-change="handleSortChange"
        >
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="detail-panel">
                <h4>数据详情</h4>
                <pre class="data-content">{{ formatJSON(row.data) }}</pre>
                <div v-if="row.metadata" class="metadata">
                  <h4>元数据</h4>
                  <pre class="metadata-content">{{ formatJSON(row.metadata) }}</pre>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            prop="timestamp" 
            label="时间" 
            width="180" 
            sortable="custom"
            :sort-orders="['ascending', 'descending']"
          >
            <template #default="{ row }">
              <div class="time-cell">
                <div class="time-date">{{ formatDate(row.timestamp, 'date') }}</div>
                <div class="time-clock">{{ formatDate(row.timestamp, 'time') }}</div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="type" label="类型" width="120" sortable>
            <template #default="{ row }">
              <el-tag :type="getTypeTagType(row.type)" size="small" effect="light">
                {{ getTypeLabel(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="category" label="分类" width="120" sortable>
            <template #default="{ row }">
              <el-tag type="info" size="small" effect="light">
                {{ getCategoryLabel(row.category) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="title" label="标题" min-width="150" show-overflow-tooltip />
          
          <el-table-column label="数据预览" min-width="200">
            <template #default="{ row }">
              <div class="data-preview">
                {{ previewData(row.data) }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button-group size="small">
                <el-button type="primary" @click="viewDetail(row)" title="查看详情">
                  <el-icon><View /></el-icon>
                </el-button>
                <el-button type="success" @click="replayRecord(row)" title="数据回放" v-if="row.type === 'telemetry'">
                  <el-icon><VideoPlay /></el-icon>
                </el-button>
                <el-button type="warning" @click="exportSingleRecord(row)" title="导出单条">
                  <el-icon><Download /></el-icon>
                </el-button>
                <el-button type="info" @click="acknowledgeRecord(row)" title="确认告警" v-if="row.type === 'alert' && !row.data?.acknowledged">
                  <el-icon><Check /></el-icon>
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalRecords"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>

    <!-- 数据分析面板 -->
    <el-card header="数据分析" shadow="never" style="margin-top: 20px;" v-if="showAnalysisPanel">
      <div class="analysis-container">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="analysis-chart">
              <h3>数据类型分布</h3>
              <div class="chart-placeholder">
                <div class="type-distribution">
                  <div v-for="(count, type) in statistics.byType" :key="type" class="type-item">
                    <div class="type-name">{{ getTypeLabel(type) }}</div>
                    <div class="type-bar">
                      <div class="bar-fill" :style="{ width: `${(count / statistics.total) * 100}%` }"></div>
                    </div>
                    <div class="type-count">{{ count }}</div>
                  </div>
                </div>
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="analysis-stats">
              <h3>统计信息</h3>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="总记录数">
                  {{ statistics.total }}
                </el-descriptions-item>
                <el-descriptions-item label="今日新增">
                  {{ statistics.todayCount }}
                </el-descriptions-item>
                <el-descriptions-item label="近7天新增">
                  {{ statistics.last7DaysCount }}
                </el-descriptions-item>
                <el-descriptions-item label="告警总数">
                  {{ statistics.alertCount || 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="未确认告警">
                  {{ statistics.unacknowledgedAlerts || 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="数据更新时间">
                  {{ lastUpdateTime }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`数据详情 - ${selectedRecord?.title || ''}`"
      width="80%"
      :fullscreen="isMobile"
    >
      <div v-if="selectedRecord" class="record-detail">
        <el-descriptions :column="isMobile ? 1 : 2" border>
          <el-descriptions-item label="记录ID">
            {{ selectedRecord.id }}
          </el-descriptions-item>
          <el-descriptions-item label="时间">
            {{ formatFullDate(selectedRecord.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="getTypeTagType(selectedRecord.type)" size="small">
              {{ getTypeLabel(selectedRecord.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="分类">
            {{ getCategoryLabel(selectedRecord.category) }}
          </el-descriptions-item>
          <el-descriptions-item label="标题">
            {{ selectedRecord.title }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="detail-content">
          <h3>数据内容</h3>
          <pre class="data-content">{{ formatJSON(selectedRecord.data) }}</pre>
        </div>
        
        <div v-if="selectedRecord.metadata" class="detail-metadata">
          <h3>元数据</h3>
          <pre class="metadata-content">{{ formatJSON(selectedRecord.metadata) }}</pre>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="exportSingleRecord(selectedRecord!)" v-if="selectedRecord">
            导出此记录
          </el-button>
          <el-button type="success" @click="acknowledgeRecord(selectedRecord!)" v-if="selectedRecord?.type === 'alert' && !selectedRecord.data?.acknowledged">
            确认告警
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 图表回放对话框 -->
    <el-dialog
      v-model="chartPlaybackVisible"
      title="传感器数据回放"
      width="90%"
      :fullscreen="isMobile"
    >
      <div class="playback-container">
        <div class="playback-controls">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="control-group">
                <span class="control-label">回放速度：</span>
                <el-radio-group v-model="playbackSpeed" size="small">
                  <el-radio-button label="0.5">0.5x</el-radio-button>
                  <el-radio-button label="1">1x</el-radio-button>
                  <el-radio-button label="2">2x</el-radio-button>
                  <el-radio-button label="5">5x</el-radio-button>
                </el-radio-group>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="control-group">
                <span class="control-label">传感器类型：</span>
                <el-select v-model="selectedSensorType" size="small" style="width: 120px">
                  <el-option label="加速度" value="accel" />
                  <el-option label="陀螺仪" value="gyro" />
                  <el-option label="磁力计" value="mag" />
                </el-select>
              </div>
            </el-col>
          </el-row>
          
          <div class="playback-buttons">
            <el-button-group>
              <el-button @click="playbackStart" :disabled="isPlaying || !playbackRecords.length">
                开始回放
              </el-button>
              <el-button @click="playbackPause" :disabled="!isPlaying">
                暂停
              </el-button>
              <el-button @click="playbackStop">
                停止
              </el-button>
              <el-button @click="playbackPrevious" :disabled="playbackIndex === 0">
                上一条
              </el-button>
              <el-button @click="playbackNext" :disabled="playbackIndex >= playbackRecords.length - 1">
                下一条
              </el-button>
            </el-button-group>
          </div>
          
          <div class="playback-info">
            <el-row :gutter="20">
              <el-col :span="6">
                <div class="info-item">
                  <span class="info-label">进度：</span>
                  <span class="info-value">{{ playbackProgress }}%</span>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="info-item">
                  <span class="info-label">当前时间：</span>
                  <span class="info-value">{{ currentPlaybackTime }}</span>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="info-item">
                  <span class="info-label">总记录：</span>
                  <span class="info-value">{{ playbackRecords.length }}</span>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="info-item">
                  <span class="info-label">当前索引：</span>
                  <span class="info-value">{{ playbackIndex + 1 }}</span>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>
        
        <div class="playback-charts">
          <div class="chart-container">
            <h3>传感器数据回放 - {{ getSensorTypeName(selectedSensorType) }}</h3>
            <div class="chart-placeholder">
              <div class="sensor-values">
                <div class="value-row">
                  <div class="value-label">X轴：</div>
                  <div class="value-number">{{ currentSensorValues.x.toFixed(3) }}</div>
                  <div class="value-unit">{{ getSensorUnit(selectedSensorType) }}</div>
                </div>
                <div class="value-row">
                  <div class="value-label">Y轴：</div>
                  <div class="value-number">{{ currentSensorValues.y.toFixed(3) }}</div>
                  <div class="value-unit">{{ getSensorUnit(selectedSensorType) }}</div>
                </div>
                <div class="value-row">
                  <div class="value-label">Z轴：</div>
                  <div class="value-number">{{ currentSensorValues.z.toFixed(3) }}</div>
                  <div class="value-unit">{{ getSensorUnit(selectedSensorType) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 用户信息 -->
    <div class="user-status">
      <el-card shadow="never" class="status-card">
        <div class="user-info">
          <el-avatar :size="40" style="background-color: #409EFF; margin-right: 10px;">
            {{ authStore.user?.username?.charAt(0).toUpperCase() || 'U' }}
          </el-avatar>
          <div class="user-details">
            <div class="user-name">{{ authStore.user?.username || '未登录' }}</div>
            <div class="user-role">{{ roleText }} · {{ authStore.user?.role === 'admin' ? '有历史数据权限' : '无历史数据权限' }}</div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { useHistoryStore, type HistoryRecord } from '@/stores/historyStore'
import { useRobotStore } from '@/stores/robotStore'
import { useAuthStore } from '@/stores/authStore'
import { 
  Monitor, Operation, Histogram, Search, Refresh, Download, 
  MagicStick, Delete, Document, Calendar, DataAnalysis,
  VideoPlay, PieChart, RefreshRight, View, VideoCamera, ArrowRight,
  Warning, Check, SuccessFilled
} from '@element-plus/icons-vue'

const router = useRouter()
const historyStore = useHistoryStore()
const robotStore = useRobotStore()
const authStore = useAuthStore()

// 响应式状态
const isMobile = ref(false)

// 查询表单
const queryForm = ref({
  timeRange: [
    new Date(new Date().setHours(0, 0, 0, 0)),
    new Date(new Date().setHours(23, 59, 59, 999))
  ] as [Date, Date],
  types: [] as string[],
  categories: [] as string[],
  keyword: ''
})

// 表格状态
const currentPage = ref(1)
const pageSize = ref(20)
const queryLoading = ref(false)
const detailDialogVisible = ref(false)
const chartPlaybackVisible = ref(false)
const showAnalysisPanel = ref(false)
const sortConfig = ref<{ prop: string; order: 'ascending' | 'descending' | null }>({ 
  prop: 'timestamp', 
  order: 'descending' 
})

// 选中的记录
const selectedRecord = ref<HistoryRecord | null>(null)

// 图表回放状态
const playbackRecords = ref<HistoryRecord[]>([])
const playbackIndex = ref(0)
const playbackSpeed = ref('1')
const isPlaying = ref(false)
const selectedSensorType = ref<'accel' | 'gyro' | 'mag'>('accel')
const currentSensorValues = ref({ x: 0, y: 0, z: 0 })
let playbackTimer: any = null

// 权限检查
const hasControlPermission = computed(() => {
  return authStore.user?.role === 'admin' || authStore.user?.role === 'operator'
})

const roleText = computed(() => {
  const roles: Record<string, string> = {
    admin: '管理员',
    operator: '操作员',
    viewer: '查看员'
  }
  return roles[authStore.user?.role || 'viewer']
})

const tableHeight = computed(() => {
  return isMobile.value ? 400 : 600
})

const statistics = computed(() => historyStore.statistics)

// 检查是否有传感器数据
const hasSensorData = computed(() => {
  return historyStore.records.some(record => 
    record.type === 'telemetry' && record.category === 'sensor'
  )
})

// 获取所有记录（已过滤）
const filteredRecords = computed(() => {
  let records = historyStore.queryRecords({
    startTime: queryForm.value.timeRange?.[0],
    endTime: queryForm.value.timeRange?.[1],
    categories: queryForm.value.categories.length > 0 ? queryForm.value.categories : undefined
  })
  
  // 按类型过滤
  if (queryForm.value.types.length > 0) {
    records = records.filter(record => queryForm.value.types.includes(record.type))
  }
  
  // 按关键词过滤
  if (queryForm.value.keyword) {
    const keyword = queryForm.value.keyword.toLowerCase()
    records = records.filter(record => 
      record.title.toLowerCase().includes(keyword) ||
      record.category.toLowerCase().includes(keyword) ||
      JSON.stringify(record.data).toLowerCase().includes(keyword) ||
      getTypeLabel(record.type).toLowerCase().includes(keyword)
    )
  }
  
  // 排序
  if (sortConfig.value.order) {
    records.sort((a, b) => {
      const aValue = a[sortConfig.value.prop as keyof HistoryRecord]
      const bValue = b[sortConfig.value.prop as keyof HistoryRecord]
      
      if (sortConfig.value.order === 'ascending') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }
  
  return records
})

const totalRecords = computed(() => filteredRecords.value.length)

const displayRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRecords.value.slice(start, start + pageSize.value)
})

const lastUpdateTime = computed(() => {
  if (historyStore.records.length === 0) return '暂无数据'
  const lastRecord = historyStore.records[0]
  return formatFullDate(lastRecord.timestamp)
})

// 专门查询告警数据
const queryAlerts = () => {
  try {
    const alertRecords = historyStore.getAlertRecords({
      startTime: queryForm.value.timeRange?.[0],
      endTime: queryForm.value.timeRange?.[1],
      acknowledged: undefined // 查询所有告警
    })
    
    console.log('查询到的告警记录:', alertRecords.length)
    return alertRecords
  } catch (error) {
    console.error('查询告警记录失败:', error)
    return []
  }
}

// 格式化日期
const formatDate = (timestamp: number, type: 'date' | 'time' | 'full' = 'full') => {
  const date = new Date(timestamp)
  
  if (type === 'date') {
    return date.toLocaleDateString('zh-CN')
  } else if (type === 'time') {
    return date.toLocaleTimeString('zh-CN', { hour12: false })
  } else {
    return date.toLocaleString('zh-CN')
  }
}

const formatFullDate = (timestamp: number) => {
  return formatDate(timestamp, 'full')
}

// 格式化JSON数据
const formatJSON = (data: any) => {
  if (!data) return '无数据'
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

// 获取类型标签
const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    telemetry: '遥测数据',
    command: '指令记录',
    alert: '系统告警',
    task: '任务记录'
  }
  return labels[type] || type
}

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    sensor: '传感器',
    pose: '姿态控制',
    environment: '环境监测',
    control: '设备控制',
    system: '系统状态',
    connection: '连接状态'
  }
  return labels[category] || category
}

const getTypeTagType = (type: string) => {
  const types: Record<string, string> = {
    telemetry: 'success',
    command: 'primary',
    alert: 'danger',
    task: 'warning'
  }
  return types[type] || 'info'
}

// 数据预览
const previewData = (data: any) => {
  if (!data) return '无数据'
  
  if (typeof data === 'string') {
    return data.length > 50 ? data.substring(0, 50) + '...' : data
  }
  
  if (typeof data === 'object') {
    // 尝试提取关键信息
    if (data.battery !== undefined) {
      return `电池: ${data.battery.toFixed(1)}%`
    }
    if (data.temp !== undefined) {
      return `温度: ${data.temp.toFixed(1)}℃`
    }
    if (data.message) {
      return data.message.length > 50 ? data.message.substring(0, 50) + '...' : data.message
    }
    if (data.accel) {
      return `加速度: X=${data.accel[0]?.toFixed(2)} Y=${data.accel[1]?.toFixed(2)} Z=${data.accel[2]?.toFixed(2)}`
    }
    
    const str = JSON.stringify(data)
    return str.length > 50 ? str.substring(0, 50) + '...' : str
  }
  
  return String(data)
}

// 查询处理
const handleQuery = async () => {
  queryLoading.value = true
  try {
    // 模拟查询延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    currentPage.value = 1
    
    if (filteredRecords.value.length === 0) {
      ElMessage.warning('未找到符合条件的数据')
    } else {
      ElMessage.success(`查询到 ${filteredRecords.value.length} 条记录`)
    }
  } finally {
    queryLoading.value = false
  }
}

const resetQuery = () => {
  queryForm.value = {
    timeRange: [
      new Date(new Date().setHours(0, 0, 0, 0)),
      new Date(new Date().setHours(23, 59, 59, 999))
    ],
    types: [],
    categories: [],
    keyword: ''
  }
  currentPage.value = 1
  sortConfig.value = { prop: 'timestamp', order: 'descending' }
}

// 排序处理
const handleSortChange = (column: any) => {
  sortConfig.value = {
    prop: column.prop,
    order: column.order
  }
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 导出所有数据
const handleExport = async () => {
  try {
    if (filteredRecords.value.length === 0) {
      ElMessage.warning('没有数据可导出')
      return
    }
    
    await historyStore.exportData({
      format: 'csv',
      timeRange: queryForm.value.timeRange,
      categories: queryForm.value.categories,
      includeMetadata: true
    })
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请稍后重试')
  }
}

// 专门导出告警数据
const exportAlerts = async () => {
  try {
    await historyStore.exportAlertRecords({
      startTime: queryForm.value.timeRange?.[0],
      endTime: queryForm.value.timeRange?.[1]
    })
  } catch (error) {
    console.error('导出告警记录失败:', error)
    ElMessage.error('导出失败，请稍后重试')
  }
}

// 导出单条记录
const exportSingleRecord = (record: HistoryRecord) => {
  try {
    const data = {
      exportTime: new Date().toISOString(),
      record: {
        ...record,
        timestamp: new Date(record.timestamp).toISOString()
      }
    }
    
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `record_${record.id}_${new Date().getTime()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)
    
    ElMessage.success('记录导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 确认告警
const acknowledgeRecord = (record: HistoryRecord) => {
  try {
    // 更新记录的数据
    if (record.data) {
      record.data.acknowledged = true
      record.data.acknowledgedTime = Date.now()
    }
    
    // 重新保存记录
    const updatedRecord = {
      ...record,
      data: record.data
    }
    
    // 这里需要更新历史存储中的记录
    // 实际项目中可能需要调用API
    ElMessage.success('告警已确认')
    
    // 刷新显示
    handleQuery()
  } catch (error) {
    console.error('确认告警失败:', error)
    ElMessage.error('操作失败')
  }
}

// 生成模拟数据
const generateMockData = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要生成测试数据吗？这将添加模拟的历史记录，不会影响现有数据。',
      '生成测试数据',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    robotStore.generateMockData(100)
    
    // 刷新显示
    setTimeout(() => {
      handleQuery()
    }, 1000)
  } catch {
    // 用户取消
  }
}

// 清空历史
const clearHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有历史记录吗？此操作不可恢复！',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    historyStore.clearHistory()
    ElMessage.success('历史记录已清空')
    
    // 刷新显示
    currentPage.value = 1
  } catch {
    // 用户取消
  }
}

// 查看详情
const viewDetail = (record: HistoryRecord) => {
  selectedRecord.value = record
  detailDialogVisible.value = true
}

// 图表回放相关
const playbackProgress = computed(() => {
  if (playbackRecords.value.length === 0) return 0
  return Math.round((playbackIndex.value / (playbackRecords.value.length - 1)) * 100)
})

const currentPlaybackTime = computed(() => {
  if (!playbackRecords.value[playbackIndex.value]) return '--:--:--'
  return formatDate(playbackRecords.value[playbackIndex.value].timestamp, 'time')
})

const getSensorTypeName = (type: string) => {
  const names: Record<string, string> = {
    accel: '加速度传感器',
    gyro: '陀螺仪传感器',
    mag: '磁力计传感器'
  }
  return names[type] || type
}

const getSensorUnit = (type: string) => {
  const units: Record<string, string> = {
    accel: 'm/s²',
    gyro: 'rad/s',
    mag: 'µT'
  }
  return units[type] || ''
}

const showChartPlayback = async () => {
  // 获取传感器数据记录
  playbackRecords.value = historyStore.queryRecords({
    type: 'telemetry',
    category: 'sensor',
    startTime: queryForm.value.timeRange[0],
    endTime: queryForm.value.timeRange[1],
    limit: 100
  })
  
  if (playbackRecords.value.length === 0) {
    ElMessage.warning('没有找到可回放的传感器数据')
    return
  }
  
  chartPlaybackVisible.value = true
  playbackIndex.value = 0
  updatePlaybackData()
}

const updatePlaybackData = () => {
  if (!playbackRecords.value[playbackIndex.value]) return
  
  const record = playbackRecords.value[playbackIndex.value]
  const data = record.data
  
  // 根据选择的传感器类型更新当前值
  switch (selectedSensorType.value) {
    case 'accel':
      currentSensorValues.value = {
        x: data?.imu?.accel?.[0] || 0,
        y: data?.imu?.accel?.[1] || 0,
        z: data?.imu?.accel?.[2] || 0
      }
      break
    case 'gyro':
      currentSensorValues.value = {
        x: data?.imu?.gyro?.[0] || 0,
        y: data?.imu?.gyro?.[1] || 0,
        z: data?.imu?.gyro?.[2] || 0
      }
      break
    case 'mag':
      currentSensorValues.value = {
        x: data?.imu?.mag?.[0] || 0,
        y: data?.imu?.mag?.[1] || 0,
        z: data?.imu?.mag?.[2] || 0
      }
      break
  }
}

const playbackStart = () => {
  if (isPlaying.value || playbackRecords.value.length === 0) return
  
  isPlaying.value = true
  const speed = parseFloat(playbackSpeed.value)
  playbackTimer = setInterval(() => {
    if (playbackIndex.value < playbackRecords.value.length - 1) {
      playbackIndex.value++
      updatePlaybackData()
    } else {
      playbackStop()
      ElMessage.info('回放完成')
    }
  }, 1000 / speed)
}

const playbackPause = () => {
  isPlaying.value = false
  if (playbackTimer) {
    clearInterval(playbackTimer)
    playbackTimer = null
  }
}

const playbackStop = () => {
  playbackPause()
  playbackIndex.value = 0
  updatePlaybackData()
}

const playbackPrevious = () => {
  if (playbackIndex.value > 0) {
    playbackIndex.value--
    updatePlaybackData()
  }
}

const playbackNext = () => {
  if (playbackIndex.value < playbackRecords.value.length - 1) {
    playbackIndex.value++
    updatePlaybackData()
  }
}

const replayRecord = (record: HistoryRecord) => {
  selectedRecord.value = record
  ElMessage.info(`开始回放记录: ${record.title}`)
}

const showDataAnalysis = () => {
  showAnalysisPanel.value = !showAnalysisPanel.value
  if (showAnalysisPanel.value) {
    ElMessage.info('数据分析面板已打开')
  }
}

const refreshData = () => {
  handleQuery()
  ElMessage.success('数据已刷新')
}

// 响应式检测
const checkResponsive = () => {
  isMobile.value = window.innerWidth < 768
}

// 初始化数据
const initData = () => {
  // 如果数据为空，显示提示
  if (historyStore.records.length === 0) {
    ElMessage.info('历史数据为空，请连接设备或生成测试数据')
  }
}

onMounted(() => {
  checkResponsive()
  initData()
  window.addEventListener('resize', checkResponsive)
})

onUnmounted(() => {
  playbackPause()
  window.removeEventListener('resize', checkResponsive)
})
</script>

<style scoped>
.history-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: white;
}

.page-header h1 {
  font-size: 32px;
  margin: 0;
  font-weight: bold;
}

.header-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin-top: 8px;
}

.quick-nav {
  margin-bottom: 20px;
}

.nav-card {
  border: none;
  background: transparent;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background-color: #f5f7fa;
  transform: translateY(-2px);
}

.nav-item.active {
  background-color: #409EFF;
  color: white;
}

.nav-item .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.nav-item span {
  font-size: 14px;
}

.form-actions {
  margin-top: 20px;
  text-align: center;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.stat-card {
  border: none;
  background: white;
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 28px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.today {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.week {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.alert {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-chart {
  height: 10px;
  display: flex;
  border-radius: 5px;
  overflow: hidden;
  margin-top: 8px;
}

.chart-bar {
  height: 100%;
  background-color: #409EFF;
  margin-right: 1px;
}

.chart-bar:last-child {
  margin-right: 0;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.table-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.time-cell {
  display: flex;
  flex-direction: column;
}

.time-date {
  font-size: 12px;
  color: #909399;
}

.time-clock {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.data-preview {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.detail-panel {
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.detail-panel h4 {
  margin: 0 0 10px 0;
  color: #606266;
}

.data-content, .metadata-content {
  margin: 0;
  padding: 10px;
  background-color: white;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}

.metadata {
  margin-top: 10px;
}

.record-detail {
  max-height: 60vh;
  overflow-y: auto;
}

.detail-content,
.detail-metadata {
  margin-top: 20px;
}

.detail-content h3,
.detail-metadata h3 {
  margin: 0 0 10px 0;
  color: #606266;
}

.analysis-container {
  padding: 20px;
}

.type-distribution {
  margin-top: 20px;
}

.type-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.type-name {
  width: 100px;
  font-size: 14px;
  color: #606266;
}

.type-bar {
  flex: 1;
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  margin: 0 10px;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #409EFF, #67C23A);
  border-radius: 10px;
  transition: width 0.5s ease;
}

.type-count {
  width: 60px;
  text-align: right;
  font-weight: bold;
  color: #303133;
}

.playback-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.playback-controls {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
}

.control-group {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.control-label {
  font-weight: 500;
  margin-right: 10px;
  color: #606266;
}

.playback-buttons {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.playback-info {
  background-color: white;
  border-radius: 6px;
  padding: 15px;
  border: 1px solid #ebeef5;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-label {
  color: #909399;
  font-size: 14px;
}

.info-value {
  font-weight: bold;
  color: #303133;
  margin-left: 5px;
}

.sensor-values {
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.value-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.value-label {
  width: 60px;
  font-weight: 500;
  color: #606266;
}

.value-number {
  flex: 1;
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  text-align: center;
}

.value-unit {
  width: 60px;
  text-align: right;
  color: #909399;
}

.user-status {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.status-card {
  border: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: bold;
  color: #303133;
}

.user-role {
  font-size: 12px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .history-container.mobile-view {
    padding: 10px;
  }
  
  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .form-actions .el-button {
    width: 100%;
    margin-bottom: 10px;
  }
  
  .table-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .playback-controls .control-group {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .playback-info .el-row {
    flex-direction: column;
    gap: 10px;
  }
  
  .user-status {
    position: static;
    margin-top: 20px;
  }
}
</style>