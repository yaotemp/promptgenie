# 🪄 提示词精灵（PromptGenie）

一个专为懒人打造的AI提示词管理工具。  
**常驻系统托盘，一键复制提示词，高效复用你的 AI 灵感。**

> 适用于 macOS, Windows，支持 ChatGPT、Midjourney、Claude 等 AI 工具用户。

---

## ✨ 核心功能

- 🌗 **托盘常驻**：快捷访问，一键复制使用
- 🧠 **收藏功能**：收藏你最喜欢、最常用的提示词
- 🏷 **标签管理**：使用标签灵活组织、查找不同类型的提示词  
- 🔍 **快捷搜索**：快速定位关键词或标签  

---

## 🖥️ 截图预览

> 💡 建议插入以下截图：
> - 系统托盘展开界面
> - 添加/编辑提示词界面
> - 快捷复制与分组界面

---

## 📦 下载与安装

> 当前版本仅支持 macOS

### 👉 [点击下载最新版](https://yourdomain.com/download/PromptGenie.dmg)

或手动构建：

```bash
git clone https://github.com/chriszou/promptgenie.git
cd promptgenie
pnpm install
pnpm tauri build
```

---

## 🧑‍💻 开发者须知

本项目基于：

- [Tauri](https://tauri.app/)
- [React + Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- SQLite + [sqlx](https://github.com/launchbadge/sqlx)

### 本地运行

```bash
pnpm install
pnpm tauri dev
```

### 数据结构说明

- 所有提示词存储在本地 SQLite 数据库中（首次启动自动创建）
- 使用 `sqlx` + migration 自动管理表结构

---

## 🧾 开源说明

### 关于提示词精灵

**提示词精灵（PromptGenie）是一款 macOS 上的系统级提示词管理工具**，由 [大创](https://www.xiaohongshu.com/user/profile) 开发，专为 AI 工具的重度使用者打造。它常驻在系统托盘，支持查看、收藏、分组、搜索和一键复制提示词，帮助你更高效地使用 ChatGPT、Midjourney、Claude 等 AI 工具。

提示词精灵 是我在做 [Together](https://your-together-site.com)（一款围绕执行力打造的行为辅助类 App）过程中开发的配套工具，服务于 AI 创作过程中的「输入效率」场景。

---

### 为什么开源？

我们开源提示词精灵，是因为我们相信：

- 🚀 **高效工作，值得被分享**  
- 🛠️ **欢迎一起打磨工具**  
- 📣 **促进 Together 的产品生态**

---

### 开源协议

本项目使用 **MIT License** 开源。

- ✅ 你可以免费使用、修改、分发本项目的源代码  
- ❌ 禁止将本项目整体用于未授权商业销售或打包行为  
- 📎 如果你 fork 本项目并再发布，请保留作者署名与原项目链接

---

## 🤝 我们欢迎的贡献

- ✨ 新功能建议（如快捷键、自定义模版、云同步）  
- 🐛 Bug 修复 / UI 优化  
- 📦 PR 或插件机制探索  
- 📣 推荐给朋友或在社区分享  

---

## 👤 关于作者

我是 **大创**，程序员 & 创业者，正在构建围绕「执行力」打造的产品 [Together](https://your-together-site.com)。  
提示词精灵 是我解决自己痛点过程中写下的一个小工具，也许也能帮你节省不少时间。

你可以在以下平台找到我：

- 小红书：[大创](https://www.xiaohongshu.com/user/profile)
- GitHub：[github.com/yourname](https://github.com/yourname)
- 邮箱：your@email.com

---

## ⭐️ Star 一下支持一下！

如果你觉得这个项目有帮助，欢迎点个 ⭐️，也是对我最大的鼓励！