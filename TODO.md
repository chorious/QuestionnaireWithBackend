# QuestionnaireWithBackend — TODO

> 本文件跟踪项目待办、已完成事项及技术债务。
> 最后更新：2026-05-02

---

## 已完成

- [x] 将 MBTI 32 题模型替换为 Schein 职业锚 10 题模型（8 种锚：TF/GM/AU/SE/EC/SV/CH/LS）
- [x] 前端答题流程：10 题自动递进、进度条、选项网格布局
- [x] 自动计分：A-H 计数、判定主导锚、支持双锚并列（如 TF+SV）
- [x] 结果页：锚名称、描述、特征标签、职业建议、8 锚得分分布条形图
- [x] 前端中文化：欢迎页、答题页、结果页全部中文
- [x] 后端 Go + Gin + SQLite（pure Go，无 CGO）
- [x] `/api/submit` 保存提交（含 user_id、answers、scores、result）
- [x] `/api/submissions`、`/api/export`、`/api/stats` 受 `ADMIN_TOKEN` 保护
- [x] 前端 localStorage 持久化 `user_id`（同一用户多次提交 ID 不变）
- [x] 前端 localStorage 配置自定义 API Base（支持 ngrok / 本地）
- [x] 版本检测：前端轮询 `/api/version`，版本不匹配时提示刷新
- [x] 最终题防重复提交（`isCompletedRef` 锁）
- [x] CSV 导出带 BOM（Excel 兼容）
- [x] GitHub Pages 自动部署（GitHub Actions）
- [x] `.gitignore` 排除 `data.db`、dist、node_modules
- [x] README 更新为 Career Anchor 模型文档

---

## 进行中 / 近期计划

### 功能增强

- [ ] **结果分享图片生成**（Canvas / html2canvas）—— 用户可保存/分享带结果卡片的长图
- [x] **提交时携带 name + phone** —— 欢迎页必填姓名（中文，≤10）和手机号（数字，≤16），后端保存并导出
- [ ] **管理员数据看板** —— 简单 HTML 页面（或新路由 `/admin`），展示提交统计、实时图表
- [x] **UI 风格重设计** —— 紫粉娱乐风 → 商务蓝白专业风（实色深蓝、小圆角、去毛玻璃、轻阴影）
- [ ] **多语言支持** —— 至少中英双语，用简单字典映射即可
- [ ] **部署到生产服务器** —— Cloudflare Tunnel / VPS / Render 等，脱离 GitHub Pages + 本地后端

### 安全 & 正确性（P0 / P1）

- [ ] **CORS 白名单** —— 当前 `Access-Control-Allow-Origin: *`，生产环境应限制为前端域名
- [ ] **`/api/submit` 限频** —— 无认证 POST 可被脚本灌库，建议 IP 级令牌桶（如 10 req/min）
- [ ] **输入校验** —— `handleSubmit` 直接接受任意 JSON，需限制：
  - `answers` 长度必须等于题库长度（10）
  - `result` 必须在已知锚类型枚举内
  - `source` / `nickname` 长度上限（如 ≤64）
  - Body 整体大小限制（`MaxBytesReader`）
- [ ] **后端独立计分** —— 当前前端传 `scores` 和 `result`，用户可伪造。后端应只信 `answers`，自己算分
- [ ] **SQLite WAL 模式 + 连接池配置** —— `PRAGMA journal_mode=WAL;` + `PRAGMA busy_timeout=5000;` + `SetMaxOpenConns(1)`
- [ ] **版本号动态注入** —— 当前硬编码 `"1.0.0"`，改用 `go build -ldflags "-X main.version=..."`
- [ ] **分页查询** —— `handleList` 一次 LIMIT 10000，应改为 `?page=&size=` 游标分页

### 工程化 & 可维护性（P2）

- [ ] **embed.FS 嵌入前端 dist** —— 单二进制部署，无需相对路径 `../dist/index.html`
- [ ] **拆包重构** —— `main.go` 目前 240 行单体，可拆为：
  ```
  backend-go/
    cmd/server/main.go
    internal/handler/
    internal/store/
    internal/scoring/
    internal/middleware/
  ```
- [ ] **添加测试** —— 最小投入：
  - Go: `handleSubmit` + `handleStats` 的 `httptest` 用例（happy path + 401）
  - 前端: Vitest 给 `personalityCalculator.ts` 写单测
- [ ] **Dockerfile + docker-compose** —— 多阶段构建：Node 编译 dist → Go 编译二进制 + embed.FS
- [ ] **GitHub Actions CI** —— lint + test + build + release
- [ ] **结构化日志** —— 当前用 `fmt.Println`，换 `log/slog` 或 `zerolog`
- [ ] **前端路由** —— `react-router` 分离答题页、结果页、管理页
- [ ] **前端 Error Boundary** —— 防止渲染错误导致白屏
- [ ] **`.env.example`** —— 列出所有环境变量：`PORT`、`ADMIN_TOKEN`、`CORS_ORIGINS`、`DB_PATH`
- [ ] **清理遗留 backend/** —— 旧 Node 后端目录（`backend/package.json`、`backend/src/` 等）已废弃，可删除或归档

---

## 优先级速查

| 优先级 | 事项 | 预估工时 |
|---|---|---|
| P0 | CORS 白名单 + 限频 + 输入校验 | 半天 |
| P0 | 后端独立计分 | 半天 |
| P1 | SQLite WAL + 分页 + 版本注入 | 半天 |
| P1 | nickname 入库 + 前端传递 | 1 小时 |
| P2 | embed.FS + Dockerfile | 半天 |
| P2 | 拆包 + 测试 + CI | 1 天 |
| 功能 | 分享图片生成 | 1 天 |
| 功能 | 管理员看板 | 1 天 |
| 功能 | 多语言 | 半天 |

---

## 参考

- 原始 review: `../QuestionnaireWithBackend-review.md`（Opus 4.7，21 条建议，P0/P1/P2 分级）
- Schein Career Anchor 理论：[Wikipedia](https://en.wikipedia.org/wiki/Career_anchors)
