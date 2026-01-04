// src/utils/mockSocket.ts
import { EventEmitter } from "events";

export interface RobotData {
  timestamp: number;
  battery: number;
  mode: "Stand" | "Walk" | "Run" | "Climb" | "Auto"; // 增加 Auto 模式
  pose: { pitch: number; roll: number; yaw: number };
  imu: {
    accel: [number, number, number];
    gyro: [number, number, number];
    mag: [number, number, number];
  };
  env: {
    temp: number;
    humidity: number;
    distance: number;
    pressure: number; // 保留A项目的压力传感器
  };
  position: [number, number];
}

class MockWebSocket extends EventEmitter {
  private timer: any = null;
  private isConnected = false;

  // 使用与A项目相同的起始位置（单位：米）
  private readonly START_POS: [number, number] = [0, 0];
  private currentPos: [number, number] = [...this.START_POS];

  // 键盘/方向状态
  private keyW = false;
  private keyS = false;
  private keyA = false;
  private keyD = false;

  // 自动巡航相关 - B项目新增
  private isPaused = false;
  private isAutoMode = false;
  private pathQueue: [number, number][] = []; // 存储待执行的路径点

  // 速度设置 - B项目新增
  private readonly baseSpeed = 0.15; // 保持与A项目相同的速度
  private speedMultiplier = 1.0;

  constructor() {
    super();
  }

  connect(url: string) {
    console.log(`[连接中...] ${url}`);
    setTimeout(() => {
      this.isConnected = true;
      this.emit("open");
      this.startDataPush();
    }, 1000);
  }

  send(data: any) {
    if (!this.isConnected) return;

    // 模拟ACK回执，用于日志显示
    setTimeout(() => {
      this.emit("message", { type: "ACK", cmd: data });
    }, 100);

    // --- B项目新增：速度控制 ---
    if (data.type === "SET_SPEED") {
      this.speedMultiplier = data.value / 50; // 假设50%为基准
      console.log(`[MockSocket] 速度设置为: ${data.value}% (乘数: ${this.speedMultiplier})`);
    }

    // --- B项目新增：接收路径任务 ---
    if (data.type === "EXEC_PATH") {
      console.log("[MockSocket] 收到路径任务, 点数:", data.points.length);
      // 深拷贝路径点，防止引用问题
      this.pathQueue = JSON.parse(JSON.stringify(data.points));
      if (this.pathQueue.length > 0) {
        this.isAutoMode = true;
      }
    }

    // --- B项目新增：路径控制 ---
    if (data.type === "PAUSE_PATH") {
      this.isPaused = true;
    }

    if (data.type === "RESUME_PATH") {
      this.isPaused = false;
    }

    if (data.type === "STOP_PATH") {
      this.isAutoMode = false;
      this.pathQueue = [];
    }

    // --- 兼容A项目原有的指令 ---
    if (data.type === "KEYBOARD") {
      switch (data.key) {
        case "W": this.keyW = data.pressed; break;
        case "S": this.keyS = data.pressed; break;
        case "A": this.keyA = data.pressed; break;
        case "D": this.keyD = data.pressed; break;
      }
    }

    // MOVE 类型指令（B项目TaskControl.vue使用的）
    if (data.type === "MOVE") {
      // 如果有手动介入，立即停止自动巡航
      if (data.direction !== "STOP") {
        this.isAutoMode = false;
        this.pathQueue = [];
      }

      switch (data.direction) {
        case "W": this.keyW = true; break;
        case "S": this.keyS = true; break;
        case "A": this.keyA = true; break;
        case "D": this.keyD = true; break;
        case "STOP":
          this.keyW = this.keyS = this.keyA = this.keyD = false;
          break;
      }
    }

    // 支持独立的 STOP 类型（急停按钮发送的）
    if (data.type === "STOP") {
      this.keyW = this.keyS = this.keyA = this.keyD = false;
      this.isAutoMode = false; // 停止自动巡航
      this.pathQueue = [];
    }

    // 处理地图重置命令
    if (data.type === "RESET_MAP") {
      this.currentPos = [0, 0];
      this.keyW = this.keyS = this.keyA = this.keyD = false;
      this.isAutoMode = false;
      this.pathQueue = [];
    }

    // ACTION 类型（抬头、低头）无需处理位置，只回ACK即可
  }

  private startDataPush() {
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      // 暂停时只发送静止数据
      if (this.isPaused) {
        const data: RobotData = {
          timestamp: Date.now(),
          battery: Math.max(10, 100 - (Date.now() % 100000) / 1000), // 最低10%
          mode: "Stand",
          pose: {
            pitch: 0,
            roll: 0,
            yaw: 0,
          },
          imu: {
            accel: [0, 0, 9.8],
            gyro: [0, 0, 0],
            mag: [0, 0, 0],
          },
          env: {
            temp: 24,
            humidity: 55,
            distance: 120,
            pressure: 1013, // A项目压力数据
          },
          position: [this.currentPos[0], this.currentPos[1]],
        };

        this.emit("message", { type: "TELEM", data });
        return; // ⬅️ 关键：阻止后面任何位移计算
      }

      let dx = 0;
      let dy = 0;

      // 当前这一帧的移动距离
      const stepDistance = this.baseSpeed * this.speedMultiplier;

      // --- 逻辑分支 A: 自动巡航模式 (B项目新增) ---
      if (this.isAutoMode && this.pathQueue.length > 0) {
        const target = this.pathQueue[0] as [number, number];
        const cur = this.currentPos;

        // 计算距离
        const distX = target[0] - cur[0];
        const distY = target[1] - cur[1];
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance < stepDistance) {
          // 如果距离小于一步的长度，直接到达该点
          this.currentPos = [target[0], target[1]];
          this.pathQueue.shift(); // 移除已到达的点

          if (this.pathQueue.length === 0) {
            this.isAutoMode = false; // 跑完了
            console.log("[MockSocket] 路径执行完毕");
          }
        } else {
          // 否则，按比例移动 (向量归一化)
          const ratio = stepDistance / distance;
          this.currentPos[0] += distX * ratio;
          this.currentPos[1] += distY * ratio;
        }
      }
      // --- 逻辑分支 B: 手动键盘控制 ---
      else {
        if (this.keyW) dy += stepDistance;
        if (this.keyS) dy -= stepDistance;
        if (this.keyD) dx += stepDistance;
        if (this.keyA) dx -= stepDistance;

        // 加微小随机噪声，模拟真实定位漂移
        this.currentPos[0] += dx + (Math.random() - 0.5) * 0.01;
        this.currentPos[1] += dy + (Math.random() - 0.5) * 0.01;
      }

      const isMoving =
        this.isAutoMode || this.keyW || this.keyS || this.keyA || this.keyD;

      const data: RobotData = {
        timestamp: Date.now(),
        battery: Math.max(10, 100 - (Date.now() % 100000) / 1000), // 最低10%
        // 状态栏显示 Auto
        mode: this.isAutoMode ? "Auto" : isMoving ? "Walk" : "Stand",
        pose: {
          pitch: Math.sin(Date.now() / 1000) * 8,
          roll: Math.cos(Date.now() / 1000) * 4,
          yaw: 0,
        },
        imu: {
          accel: [dx * 15, dy * 15, 9.8 + Math.random() * 0.3],
          gyro: [Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5],
          mag: [30 + Math.random() * 10, 10 + Math.random() * 10, 50 + Math.random() * 10],
        },
        env: {
          temp: 24 + Math.random() * 4,
          humidity: 55 + Math.random() * 20,
          distance: 120 + Math.sin(Date.now() / 1200) * 100,
          pressure: 1013 + Math.sin(Date.now() / 5000) * 10, // 保留A项目压力
        },
        position: [Number(this.currentPos[0].toFixed(3)), Number(this.currentPos[1].toFixed(3))],
      };

      this.emit("message", { type: "TELEM", data });
    }, 200); // 保持A项目原有的200ms刷新率
  }
}

export const mockSocket = new MockWebSocket();