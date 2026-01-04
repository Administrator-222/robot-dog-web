<!-- src/components/control/TaskControl.vue -->
<template>
  <div class="control-container">
    <el-row :gutter="20">
      <el-col :span="16">
        <PathMap :current-pos="store.status.position" />
        
        <!-- B项目新增：AI任务序列模板库 -->
        <el-card style="margin-top: 20px" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="title">
                <el-icon><List /></el-icon> 自定义任务序列模板库
              </span>
              <el-button type="primary" size="small" @click="handleCreate">
                <el-icon><Plus /></el-icon> 新建任务模板
              </el-button>
            </div>
          </template>
          
          <!-- B项目新增：任务执行状态显示 -->
          <div v-if="execution.isRunning" class="execution-box">
            <div class="exec-info">
              <span>正在执行：<b>{{ execution.taskName }}</b></span>
              <span class="step-tag">步骤：{{ execution.currentStepDesc }}</span>
            </div>
            <el-progress
              :percentage="execution.progress"
              :stroke-width="18"
              striped
              striped-flow
            />
            <el-button
              type="danger"
              size="small"
              @click="stopTask"
              style="margin-top: 10px"
            >
              紧急停止
            </el-button>
          </div>

          <!-- B项目新增：任务模板列表 -->
          <el-table v-else :data="taskList" border stripe size="small">
            <el-table-column prop="name" label="模板名称" width="150" />
            <el-table-column label="步骤详情" show-overflow-tooltip>
              <template #default="scope">
                <span class="step-summary">{{ getTaskSummary(scope.row) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center">
              <template #default="scope">
                <el-button type="primary" link @click="runTask(scope.row)">
                  执行
                </el-button>
                <el-button type="info" link @click="handleEdit(scope.row)">
                  编辑
                </el-button>
                <el-button type="danger" link @click="handleDelete(scope.row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- B项目修改：增强的指令日志 -->
        <el-card style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>指令交互日志</span>
              <div>
                <el-button type="default" size="small" @click="store.clearLogs">
                  清空
                </el-button>
                <el-button type="success" size="small" @click="exportLogs">
                  <el-icon style="margin-right: 4px"><Download /></el-icon> 导出 Excel/CSV
                </el-button>
              </div>
            </div>
          </template>

          <el-table :data="store.logs" height="250" size="small" border stripe>
            <el-table-column prop="time" label="时间" width="100" />
            <el-table-column prop="type" label="指令类型" width="100">
              <template #default="scope">
                <el-tag :type="getLogTagType(scope.row.type)">
                  {{ scope.row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="params" label="参数详情" show-overflow-tooltip />
            <el-table-column prop="result" label="状态" width="80" align="center">
              <template #default="scope">
                <el-tag
                  v-if="scope.row.result === 'Success'"
                  type="success"
                  effect="plain"
                  size="small"
                >
                  成功
                </el-tag>
                <el-tag
                  v-else-if="scope.row.result === 'Pending'"
                  type="warning"
                  effect="plain"
                  size="small"
                >
                  发送中
                </el-tag>
                <el-tag v-else type="danger" effect="plain" size="small">
                  失败
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <!-- B项目修改：增强的手动控制面板 -->
        <el-card header="远程手动控制 (支持键盘 WASD)" class="manual-card">
          <!-- B项目新增：速度控制 -->
          <div class="speed-control">
            <span class="label">行进速度 ({{ speedValue }}%)</span>
            <el-slider
              v-model="speedValue"
              :step="10"
              show-stops
              @change="handleSpeedChange"
            />
          </div>

          <div class="joystick-wrapper">
            <div class="d-pad">
              <!-- 上（W） -->
              <el-button
                class="dir-btn"
                @mousedown="manualMove('W')"
                @mouseup="manualMoveStop"
                @mouseleave="manualMoveStop"
                @touchstart.prevent="manualMove('W')"
                @touchend.prevent="manualMoveStop"
              >
                <el-icon><CaretTop /></el-icon> W
              </el-button>

              <div class="d-pad-mid">
                <!-- 左（A） -->
                <el-button
                  class="dir-btn"
                  @mousedown="manualMove('A')"
                  @mouseup="manualMoveStop"
                  @mouseleave="manualMoveStop"
                  @touchstart.prevent="manualMove('A')"
                  @touchend.prevent="manualMoveStop"
                >
                  <el-icon><CaretLeft /></el-icon> A
                </el-button>

                <!-- 急停（最高优先级） -->
                <el-button
                  type="danger"
                  circle
                  class="stop-btn"
                  @click="manualStop"
                >
                  STOP
                </el-button>

                <!-- 右（D） -->
                <el-button
                  class="dir-btn"
                  @mousedown="manualMove('D')"
                  @mouseup="manualMoveStop"
                  @mouseleave="manualMoveStop"
                  @touchstart.prevent="manualMove('D')"
                  @touchend.prevent="manualMoveStop"
                >
                  <el-icon><CaretRight /></el-icon> D
                </el-button>
              </div>

              <!-- 下（S） -->
              <el-button
                class="dir-btn"
                @mousedown="manualMove('S')"
                @mouseup="manualMoveStop"
                @mouseleave="manualMoveStop"
                @touchstart.prevent="manualMove('S')"
                @touchend.prevent="manualMoveStop"
              >
                <el-icon><CaretBottom /></el-icon> S
              </el-button>
            </div>
          </div>

          <el-divider>姿态快插</el-divider>
          <el-row :gutter="10">
            <el-col :span="12">
              <el-button style="width: 100%" @click="sendAction('HEAD_UP')">
                抬头
              </el-button>
            </el-col>
            <el-col :span="12">
              <el-button style="width: 100%" @click="sendAction('HEAD_DOWN')">
                低头
              </el-button>
            </el-col>
          </el-row>
          
          <p class="kb-hint">键盘已绑定：W/A/S/D 控制方向</p>
        </el-card>
      </el-col>
    </el-row>

    <!-- B项目新增：任务模板编辑器对话框 -->
    <el-dialog
      v-model="editor.visible"
      :title="editor.isEdit ? '编辑任务模板' : '创建任务模板'"
      width="580px"
    >
      <el-form :model="editor.form" label-width="80px" label-position="top">
        <el-form-item label="任务模板名称" required>
          <el-input
            v-model="editor.form.name"
            placeholder="例如：S型巡逻路径"
          />
        </el-form-item>
        <el-divider>定义动作序列 (按序执行)</el-divider>
        <div
          v-for="(step, index) in editor.form.steps"
          :key="index"
          class="step-edit-row"
        >
          <div class="step-index">{{ index + 1 }}</div>
          <el-select
            v-model="step.type"
            placeholder="类别"
            style="width: 100px"
            size="small"
          >
            <el-option label="移动" value="MOVE" />
            <el-option label="姿态" value="ACTION" />
          </el-select>
          <el-select
            v-model="step.value"
            placeholder="指令"
            style="width: 120px"
            size="small"
          >
            <template v-if="step.type === 'MOVE'">
              <el-option label="前进" value="W" />
              <el-option label="后退" value="S" />
              <el-option label="左转" value="A" />
              <el-option label="右转" value="D" />
            </template>
            <template v-else>
              <el-option label="抬头" value="HEAD_UP" />
              <el-option label="低头" value="HEAD_DOWN" />
              <el-option label="复位" value="RESET" />
            </template>
          </el-select>
          <el-input-number
            v-model="step.duration"
            :min="500"
            :step="500"
            size="small"
            style="width: 120px"
          />
          <span class="unit-text">ms</span>
          <el-button
            type="danger"
            icon="Delete"
            circle
            size="small"
            @click="removeStep(index)"
          />
        </div>
        <el-button
          type="primary"
          dashed
          style="width: 100%; margin-top: 10px"
          @click="addStep"
        >
          + 添加下一步动作
        </el-button>
      </el-form>
      <template #footer>
        <el-button @click="editor.visible = false">取消</el-button>
        <el-button
          type="primary"
          @click="saveTask"
          :disabled="!editor.form.name"
        >
          保存模板
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRobotStore } from '@/stores/robotStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  CaretTop, 
  CaretBottom, 
  CaretLeft, 
  CaretRight,
  Plus, 
  List, 
  Download,
  // Delete
} from '@element-plus/icons-vue'
import PathMap from '@/components/control/PathMap.vue'

const store = useRobotStore()

// B项目新增：速度控制
const speedValue = ref(50) // 默认 50%
const handleSpeedChange = (val: number) => {
  store.sendCommand({
    type: "SET_SPEED",
    value: val,
  })
  ElMessage.success(`速度已设定为: ${val}%`)
}

// B项目新增：日志标签类型
const getLogTagType = (type: string) => {
  switch (type) {
    case 'MOVE':
      return ''
    case 'ACTION':
      return 'warning'
    case 'RESET_MAP':
      return 'info'
    case 'SET_SPEED':
      return 'success'
    case 'EXEC_PATH':
    case 'PAUSE_PATH':
    case 'RESUME_PATH':
    case 'STOP_PATH':
      return 'primary'
    default:
      return 'info'
  }
}

// B项目新增：导出日志
const exportLogs = () => {
  if (store.logs.length === 0) {
    ElMessage.warning('当前没有日志可导出')
    return
  }
  
  const headers = ['ID,时间戳,格式化时间,指令类型,参数详情,执行结果\n']
  const rows = store.logs.map((log) => {
    const safeParams = `"${log.params.replace(/"/g, '""')}"`
    return `${log.id},${log.timestamp},${log.time},${log.type},${safeParams},${log.result}`
  })
  
  const csvContent = '\uFEFF' + headers.concat(rows).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute(
    'download',
    `robot_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`
  )
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// B项目新增：任务模板系统
interface TaskStep {
  type: 'MOVE' | 'ACTION'
  value: string
  duration: number
}

interface TaskTemplate {
  id: string
  name: string
  steps: TaskStep[]
}

const taskList = ref<TaskTemplate[]>([])

// 加载任务模板
// 加载默认模板任务
const DEFAULT_TASK_LIST: TaskTemplate[] = [
  {
    id: "default-1",
    name: "正方形巡逻",
    steps: [
      { type: "MOVE", value: "W", duration: 2000 },
      { type: "MOVE", value: "D", duration: 1000 },
      { type: "MOVE", value: "S", duration: 2000 },
      { type: "MOVE", value: "A", duration: 1000 },
    ],
  },
  {
    id: "default-2",
    name: "快速前进后退",
    steps: [
      { type: "MOVE", value: "W", duration: 1000 },
      { type: "MOVE", value: "S", duration: 1000 },
      { type: "MOVE", value: "W", duration: 1000 },
      { type: "MOVE", value: "S", duration: 1000 },
    ],
  },
];

//读取本地存储并处理逻辑
const initTaskList = () => {
  const saved = localStorage.getItem("robot_task_templates");
  if (saved) {
    try {
      // 解析本地存储内容，并断言为 TaskTemplate[]（TypeScript 类型安全）
      const parsedData = JSON.parse(saved) as TaskTemplate[];
      // 核心判断：必须是「非空数组」才使用本地数据，否则兜底默认模板
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        taskList.value = parsedData;
      } else {
        taskList.value = DEFAULT_TASK_LIST;
      }
    } catch (error) {
      // 解析失败（空字符串/无效JSON）→ 用默认模板
      console.warn("本地任务模板解析失败，使用默认模板：", error);
      taskList.value = DEFAULT_TASK_LIST;
    }
  } else {
    // 本地无该 key → 用默认模板
    taskList.value = DEFAULT_TASK_LIST;
  }
};

// 获取任务摘要
const getTaskSummary = (task: TaskTemplate) => {
  const map: Record<string, string> = {
    W: '前',
    S: '后',
    A: '左',
    D: '右',
    HEAD_UP: '抬头',
    HEAD_DOWN: '低头',
    RESET: '复位',
  }
  return task.steps.map((s) => map[s.value] || s.value).join(' → ')
}

// B项目新增：任务编辑器
const editor = reactive({
  visible: false,
  isEdit: false,
  form: { id: '', name: '', steps: [] as TaskStep[] },
})

const handleCreate = () => {
  editor.isEdit = false
  editor.form = {
    id: '',
    name: '',
    steps: [{ type: 'MOVE', value: 'W', duration: 1000 }],
  }
  editor.visible = true
}

const handleEdit = (task: TaskTemplate) => {
  editor.isEdit = true
  editor.form = JSON.parse(JSON.stringify(task))
  editor.visible = true
}

const addStep = () => {
  editor.form.steps.push({ type: 'MOVE', value: 'W', duration: 1000 })
}

const removeStep = (index: number) => {
  editor.form.steps.splice(index, 1)
}

const saveTask = () => {
  if (editor.isEdit) {
    const idx = taskList.value.findIndex((t) => t.id === editor.form.id)
    taskList.value[idx] = { ...editor.form }
  } else {
    taskList.value.push({ ...editor.form, id: 'task_' + Date.now() })
  }
  localStorage.setItem('robot_task_templates', JSON.stringify(taskList.value))
  editor.visible = false
  ElMessage.success('任务模板已保存')
}

const handleDelete = (task: TaskTemplate) => {
  ElMessageBox.confirm(`确定删除模板 [${task.name}] 吗？`).then(() => {
    taskList.value = taskList.value.filter((t) => t.id !== task.id)
    localStorage.setItem('robot_task_templates', JSON.stringify(taskList.value))
    ElMessage.success('模板已删除')
  })
}

// B项目新增：任务执行系统
const execution = reactive({
  isRunning: false,
  taskName: '',
  currentStepDesc: '',
  progress: 0,
})

const runTask = async (task: TaskTemplate) => {
  if (execution.isRunning) return ElMessage.warning("已有任务正在运行");

  execution.isRunning = true;
  execution.taskName = task.name;

  // 计算总时长
  const totalDuration = task.steps.reduce((acc, s) => acc + s.duration, 0);
  // 记录任务开始的绝对时间戳
  const taskStartTime = Date.now();

  try {
    for (const [index, step] of task.steps.entries()) {
      if (!execution.isRunning) throw new Error("STOP_INTERRUPT");

      execution.currentStepDesc = `第${index + 1}/${task.steps.length}步`;

      store.sendCommand({
        type: step.type,
        direction: step.type === "MOVE" ? step.value : undefined,
        action_type: step.type === "ACTION" ? step.value : undefined,
      });

      const stepStartTime = Date.now();
      // 内部循环：处理当前步骤的持续时间
      while (Date.now() - stepStartTime < step.duration) {
        if (!execution.isRunning) throw new Error("STOP_INTERRUPT");

        await new Promise((r) => setTimeout(r, 50));

        // ✅ 关键改进：使用真实偏移量计算总进度
        const actualElapsed = Date.now() - taskStartTime;
        execution.progress = Math.min(
          99, // 循环内最高只显示 99
          Math.floor((actualElapsed / totalDuration) * 100)
        );
      }

      // 每一步结束后的处理
      store.sendCommand({ type: "MOVE", direction: "STOP" });
      await new Promise((r) => setTimeout(r, 50));
    }

    // ✅ 循环正常结束后，强制置为 100
    execution.progress = 100;
    ElMessage.success("序列执行圆满完成");
  } catch (e) {
    console.warn("任务被中断:", e);
    ElMessage.warning("任务执行被中断");
  } finally {
    // 确保最终状态一定是停止的
    store.sendCommand({ type: "MOVE", direction: "STOP" });
    execution.isRunning = false;
    execution.progress = 0;
    execution.currentStepDesc = "";
  }
}

const stopTask = () => {
  execution.isRunning = false
  store.globalStop()
  ElMessage.error('任务已紧急停止')
}

// B项目修改：手动控制函数
const manualMove = (dir: string) => {
  if (execution.isRunning) {
    ElMessage.warning('任务执行中，无法手动控制')
    return
  }
  store.sendCommand({ type: 'MOVE', direction: dir })
}

const manualMoveStop = () => {
  store.sendCommand({ type: 'MOVE', direction: 'STOP' })
}

const manualStop = () => {
  // 停止所有任务
  execution.isRunning = false
  // 调用全局停止
  store.globalStop()
  ElMessage.error('紧急停止：所有任务已撤回')
}

const sendAction = (act: string) => {
  store.sendCommand({ type: 'ACTION', action_type: act })
}

// B项目修改：键盘监听
const handleKeyDown = (e: KeyboardEvent) => {
  // 只有当不在输入框时才触发
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

  const key = e.key.toUpperCase()
  if (['W', 'A', 'S', 'D'].includes(key)) manualMove(key)
}

const handleKeyUp = (e: KeyboardEvent) => {
  const key = e.key.toUpperCase()
  if (['W', 'A', 'S', 'D'].includes(key)) manualMoveStop()
}

onMounted(() => {
  initTaskList()
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<style scoped>
.control-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header .title {
  font-weight: bold;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}
/* B项目新增：执行状态框 */
.execution-box {
  padding: 15px;
  background: #f0f7ff;
  border: 1px solid #d9ecff;
  border-radius: 8px;
  margin-bottom: 15px;
}
.exec-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}
.step-tag {
  background: #409eff;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
}
/* B项目新增：步骤编辑行 */
.step-edit-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
}
.step-index {
  width: 20px;
  font-weight: bold;
  color: #909399;
}
.unit-text {
  font-size: 12px;
  color: #999;
}
.manual-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.joystick-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}
/* B项目新增：速度控制样式 */
.speed-control {
  padding: 0 10px;
  margin-bottom: 15px;
}
.speed-control .label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 5px;
  display: block;
}
.d-pad {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.d-pad-mid {
  display: flex;
  gap: 15px;
  align-items: center;
}
.dir-btn {
  width: 60px;
  height: 60px;
  font-weight: bold;
}
.stop-btn {
  width: 70px;
  height: 70px;
  font-weight: bold;
}
.kb-hint {
  margin-top: 20px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}
.step-summary {
  color: #67c23a;
  font-family: monospace;
}
</style>