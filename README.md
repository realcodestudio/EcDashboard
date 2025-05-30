# EcDashboard

EcDashboard是一个简单的仪表盘组件，使用Vue 3+TypeScript+Tailwind CSS，用于显示服务器的 CPU、内存、储存空间和网络流量等状态信息。
基于 [ServerBox Monitor](https://github.com/lollipopkit/server_box_monitor) 服务端

## 主要功能

- 显示简单服务器状态（CPU 使用率、内存使用、储存空间、网络上下行流量）。



## 项目设置

请按照以下步骤设置项目：

1. 克隆仓库：

   ```bash
   git clone [the project]
   cd EcDashboard
   ```

2. 安装项目依赖：

   ```bash
   npm install
   # 或者使用 yarn
   # yarn install
   # 或者使用 pnpm
   # pnpm install
   ```

## 运行项目

### 调试模式

```bash
npm run dev
# 或者使用 yarn
# yarn dev
# 或者使用 pnpm
# pnpm dev
```

项目将在本地开发服务器上运行 `http://localhost:5173`

### 构建项目

```bash
npm run build
# 或者使用 yarn
# yarn build
# 或者使用 pnpm
# pnpm build
```

这将把项目构建到 `dist` 目录中，用于生产环境部署。

## 配置

如果你是第一次使用，可以通过点击卡片右下角的设置图标来配置以下项：

- **API 地址:** 用于获取服务器状态数据的后端接口地址。请确保该接口返回的数据格式符合组件预期。
- **刷新间隔:** 数据自动刷新的时间间隔（毫秒）。

这些设置将自动保存在你的浏览器本地存储中，以便下次访问时使用。

**API 数据格式要求:**

后端 API 接口应返回类似以下结构的 JSON 数据：

```json
{
  "code": 0, // 0 表示成功，非 0 表示错误
  "data": {
    "cpu": "11.9%",
    "disk": "213.7GB/16.4TB",
    "mem": "13.2GB/511.9GB",
    "name": "Your Server", 
    //名字不宜过长，若卡片过窄可前往App.vue中修改cardMinWidth = ref(450)中的数值。
    "net": "2.6MB/s / 1.4MB/s"
  }
}
```
## 致谢
[@lollipopkit](https://github.com/lollipopkit/)
