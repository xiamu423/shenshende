# COMINO WORLD

COMINO WORLD 是一个面向演出物料交换与分享的社区项目，包含社区广场、物料卡、收藏、私信和个人中心等功能。

## 技术栈

- 前端：React 19、Vite、React Router
- 后端：Node.js、Express
- 数据库：SQLite
- 生产运行：Nginx、PM2

## 本地开发

需要 Node.js 20+ 和 pnpm。

```bash
pnpm install
pnpm --dir server install
pnpm --dir server start
pnpm dev
```

前端默认运行在 `http://127.0.0.1:5173`，后端默认运行在 `http://127.0.0.1:3000`。

## 生产构建

```bash
pnpm build
```

正式环境的环境变量、Nginx、PM2、HTTPS、健康检查、备份及孤立上传文件清理说明，请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 数据安全

仓库不包含生产环境变量、HTTPS 私钥、SQLite 数据库、运行日志或用户上传文件。请根据 `server/.env.example` 在服务器上单独配置正式环境。
