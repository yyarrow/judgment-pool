# 🧠 Judgment Pool

> Pool your organization's human judgment. Protect attention. Price it fairly.

## 核心理念

AI 时代判断力是最稀缺的资源，但它从未被合理计量和保护。Judgment Pool 让组织内的判断力可见、可流通、可守护。

## 功能

- **发布判断任务** — 把需要人类判断的问题挂到池子里
- **接取任务** — 有空有能力的人来接，按 credits 计酬
- **实时 channel** — 任务双方通过 WebSocket 实时对话
- **Credits 结算** — 发布方支付，完成后自动转给接取方，支持紧急溢价
- **注意力守护** — 每日任务上限 + 消耗预警，防止过度榨取判断力

## API 速览

```
POST   /api/auth/register          注册
POST   /api/auth/login             登录

GET    /api/tasks                  浏览开放任务
POST   /api/tasks                  发布任务
GET    /api/tasks/:id              任务详情
POST   /api/tasks/:id/accept       接取任务
POST   /api/tasks/:id/complete     完成任务（含评分）
POST   /api/tasks/:id/cancel       取消任务（退款）
GET    /api/tasks/:id/messages     获取对话记录
POST   /api/tasks/:id/messages     发送消息（REST）

GET    /api/users/me               我的信息 + 注意力守护状态
GET    /api/users/me/ledger        Credits 流水

WS     /ws?token=JWT&taskId=UUID   实时对话
```

## 任务紧急程度

| urgency  | credits 倍率 | 场景           |
|----------|-------------|----------------|
| normal   | 1x          | 不急，异步即可  |
| urgent   | 2x          | 今天内需要      |
| critical | 3x          | 立刻需要        |

## 快速部署（Docker）

```bash
git clone https://github.com/your-org/judgment-pool.git
cd judgment-pool
cp backend/.env.example .env
# 修改 .env 里的 JWT_SECRET
docker-compose up -d
```

API 运行在 `http://your-server/api/`

## AWS 部署

1. 启动一个 EC2（t3.small 足够，Amazon Linux 2023）
2. 安装 Docker + Docker Compose：
   ```bash
   sudo dnf install -y docker
   sudo systemctl enable --now docker
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   sudo usermod -aG docker ec2-user
   ```
3. Clone 项目，配置 `.env`，`docker-compose up -d`
4. 安全组开放 80 端口（内网访问可只开内网 CIDR）

## 注意力守护逻辑

每个用户每天最多接 `DAILY_TASK_LIMIT`（默认 20）个任务。
`GET /api/users/me` 返回 `attention_guard`：
```json
{
  "daily_tasks_done": 16,
  "daily_limit": 20,
  "warning": "⚠️ 你今天已处理不少判断任务，注意保护注意力！"
}
```

## Tech Stack

- **Backend**: Node.js + Express + SQLite (better-sqlite3)
- **Realtime**: WebSocket (ws)
- **Auth**: JWT
- **Deploy**: Docker + Nginx

## License

MIT
