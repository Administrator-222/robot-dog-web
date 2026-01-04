# 智能机器狗控制系统

一个基于 Vue3 + TypeScript 的智能机器狗控制与监控系统前端界面，提供实时数据监控、任务控制、历史数据分析和路径规划等功能。

## 功能特点

### 🚀 核心功能
- **实时监控**：电池电量、姿态角、环境传感器数据实时显示
- **远程控制**：支持键盘(WASD)和可视化按钮控制机器狗移动
- **路径规划**：基于Leaflet地图的2D路径规划与执行
- **任务序列**：AI任务模板库，支持自定义动作序列
- **数据记录**：完整的遥测数据、指令记录和系统告警历史

### 📊 数据可视化
- 传感器数据图表（加速度、陀螺仪、磁力计）
- 实时姿态仪表盘
- HLS协议视频流监控
- 2D位置轨迹追踪

### 🔐 权限管理
- 三角色权限系统（管理员、操作员、查看员）
- 路由级权限控制
- 登录认证与状态管理

### 📁 数据管理
- 历史数据查询与筛选
- 多格式数据导出（CSV/JSON/Excel）
- 图表数据回放功能
- 传感器数据告警阈值设置

## 技术栈

### 前端框架
- **Vue 3** - 前端框架
- **TypeScript** - 类型安全
- **Pinia** - 状态管理
- **Vue Router** - 路由管理

### UI 组件库
- **Element Plus** - UI组件库
- **ECharts** - 数据可视化
- **Leaflet** - 地图交互

### 工具库
- **HLS.js** - HLS视频流播放
- **SheetJS** - Excel导出（预留接口）

## 项目结构

src/
├── api/
│ └── mockSocket.ts # 模拟WebSocket
├── components/ # 可复用组件
│ ├── charts/ # 图表组件
│ │ ├── EnvCard.vue
│ │ ├── GaugeBoard.vue # 仪表盘
│ │ └── SensorChart.vue # 传感器图表
│ └── control/ # 控制组件
│ └── PathMap.vue # 路径地图
│
├── views/ # 页面组件
│ ├── Dashboard.vue # 仪表盘/实时监控
│ ├── TaskControl.vue # 任务控制页面
│ ├── HistoryView.vue # 历史数据页面
│ └── Login.vue # 登录页面
├── stores/ # 状态管理
│ ├── authStore.ts # 认证状态
│ ├── robotStore.ts # 机器狗状态
│ └── historyStore.ts # 历史数据状态
├── router/ # 路由配置
│ └── index.ts
├── utils/ # 工具函数
│ ├── exportUtils.ts # 导出工具
│ └── errorHandler.ts # 错误处理
└── styles/ # 全局样式
│ └── responsive.css # 响应式样式
├── layouts/
│ └── MainLayout.vue # 主布局
├── App.vue # 应用入口
└── main.ts


## 快速开始

### 环境要求
- Node.js 16+ 
- npm 8+ 或 yarn 1.22+
- Git

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd robot-dog-control-system
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
```

4. **访问应用**
打开浏览器访问：http://localhost:5173

### 构建生产版本
```bash
npm run build
# 构建产物在 dist/ 目录
```

## 使用说明

### 登录系统
- **管理员** (admin)：全权限访问
- **操作员** (operator)：可监控和控制，无历史数据删除权限
- **查看员** (viewer)：仅查看权限

### 主要功能模块

#### 1. 实时监控 (Dashboard)
- 查看机器狗实时状态（电池、姿态、环境数据）
- 监控传感器图表
- HLS视频流播放
- 系统告警显示

#### 2. 任务控制 (Task Control)
- **手动控制**：WASD键盘或按钮控制移动
- **速度调节**：滑动条调整行进速度
- **路径规划**：在地图上绘制并执行路径
- **任务模板**：创建和执行AI任务序列
- **指令日志**：查看所有控制指令执行记录

#### 3. 历史数据 (History)
- **数据查询**：按时间、类型、分类筛选
- **数据导出**：支持CSV、JSON格式导出
- **图表回放**：传感器数据历史回放
- **统计分析**：数据分布和统计信息

### 键盘快捷键
- **W**：前进
- **S**：后退  
- **A**：左转
- **D**：右转
- 任意键松开：停止移动

## 部署说明

### 本地部署

1. **环境配置**
```bash
# 安装Node.js（推荐16.x以上版本）
# 验证安装
node --version
npm --version
```

2. **构建项目**
```bash
npm run build
```

3. **预览构建结果**
```bash
npm run preview
```

### Vercel 部署

#### 自动部署（推荐）
1. 将代码推送到GitHub仓库
2. 登录 [Vercel](https://vercel.com)
3. 点击 "New Project"，导入GitHub仓库
4. 配置构建设置：
   - **Framework Preset**: Vue.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 点击 "Deploy"

#### 手动部署
1. **安装Vercel CLI**
```bash
npm i -g vercel
```

2. **登录Vercel**
```bash
vercel login
```

3. **部署项目**
```bash
vercel
# 或直接发布到生产环境
vercel --prod
```

### 环境变量配置

创建 `.env` 文件：
```env
VITE_APP_TITLE=智能机器狗控制系统
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL= # API基础URL（如需连接真实后端）
```

### 注意事项

#### 开发环境
- 项目使用模拟WebSocket数据，无需后端服务
- HLS视频流使用公开测试流地址
- 所有数据存储在浏览器本地（localStorage/IndexedDB）

#### 生产环境
- 如需连接真实设备，需配置WebSocket地址
- 建议启用CORS配置
- 考虑数据持久化方案（对接后端API）

## 故障排除

### 常见问题

1. **HLS视频无法播放**
   - 检查浏览器是否支持HLS（Chrome/Firefox需要HLS.js）
   - 确保网络可以访问测试流地址

2. **地图无法加载**
   - 检查网络连接，Leaflet需要访问OpenStreetMap
   - 确认Leaflet CSS已正确引入

3. **数据导出乱码**
   - CSV文件已添加UTF-8 BOM头，确保使用UTF-8编码打开
   - Excel打开时选择"UTF-8"编码导入

4. **键盘控制无效**
   - 确保焦点不在输入框内
   - 检查浏览器是否阻止了键盘事件

### 开发调试
```bash
# 启用调试模式
npm run dev -- --debug

# 检查TypeScript类型
npm run type-check

# 代码格式检查
npm run lint
```

## 浏览器兼容性

- Chrome 90+ ✅
- Firefox 88+ ✅  
- Edge 90+ ✅
- Safari 14+ ✅（部分HLS功能需要原生支持）

## 项目配置

### 修改默认设置

1. **模拟数据频率**：修改 `mockSocket.ts` 中的定时器间隔
2. **地图中心点**：调整 `PathMap.vue` 中的坐标转换参数
3. **告警阈值**：在 `Dashboard.vue` 和 `SensorChart.vue` 中配置
4. **视频流地址**：修改 `Dashboard.vue` 中的 `mockHlsUrl`

### 扩展功能

1. **连接真实设备**
   - 修改 `mockSocket.ts` 为真实WebSocket连接
   - 配置设备通信协议

2. **添加新传感器**
   - 在 `RobotData` 接口中添加字段
   - 创建对应的图表组件
   - 更新数据存储逻辑

3. **国际化**
   - 集成Vue I18n
   - 添加中英文语言包


**提示**：本项目为演示系统，使用模拟数据。在实际部署时，请根据需求调整配置和连接真实设备接口。