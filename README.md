# 🪄 提示词精灵（PromptGenie）

一个专为懒人打造的AI提示词管理工具。  
**常驻系统托盘，一键复制提示词，高效复用你的 AI 灵感。**

> 适用于 macOS, Windows，支持 ChatGPT、Midjourney、Claude 等 AI 工具用户。

---

## 解决的问题
你是不是经常看到一些精彩使用的AI提示词，却因为没有一个好的统一管理工具，所以散落在各个地方，每次都要翻各种笔记软件、历史记录，找回那些写过但记不清的提示词？
提示词精灵就是为此而生的：他提供一个统一的记录空间，并且常驻在你的系统托盘，点击即可一键复制最常用的 Prompt，省去翻箱倒柜、重复操作，让 AI提示词真正成为你最强大的武器！

## ✨ 核心功能

- 🌗 **托盘常驻**：快捷访问，一键复制使用
- 🧠 **收藏功能**：收藏你最喜欢、最常用的提示词
- 🏷 **标签管理**：使用标签灵活组织、查找不同类型的提示词  
- 🔍 **快捷搜索**：快速定位关键词或标签  

---

## 🖥️ 截图预览

APP主界面
![](https://cdnw.togetherdaka.com/promptgenie/app/app_main.png)

系统状态栏下拉菜单
![](https://cdnw.togetherdaka.com/promptgenie/app/tray.png)

---

## 📦 下载与安装

> 当前版本支持 macOS和Windows

### 👉 [点击下载MacOS最新版](https://witness-1252789080.cos.ap-shanghai.myqcloud.com/promptgenie/downloads/%E6%8F%90%E7%A4%BA%E8%AF%8D%E7%B2%BE%E7%81%B5_0.1.0.dmg)
### 👉 [点击下载Windows最新版](https://witness-1252789080.cos.ap-shanghai.myqcloud.com/promptgenie/downloads/%E6%8F%90%E7%A4%BA%E8%AF%8D%E7%B2%BE%E7%81%B5_0.1.0.exe)

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

**提示词精灵（PromptGenie）是一款 macOS 上的系统级提示词管理工具**，由 [创哥](https://www.xiaohongshu.com/user/profile/58a6796a5e87e77c148a64ae) 开发，专为 AI 工具的重度使用者打造。它常驻在系统托盘，支持查看、收藏、分组、搜索和一键复制提示词，帮助你更高效地使用 ChatGPT、Midjourney、Claude 等 AI 工具。

提示词精灵 是我在做 [Together]( https://togetheryiqi.com/download/app)（一款围绕执行力打造的行为辅助类 App）过程中开发的配套工具，服务于 AI 创作过程中的「输入效率」场景。

---

### 为什么开源？

选择开源提示词精灵，是因为我相信：

- 🚀 **高效工作，值得被分享**  
- 🛠️ **欢迎一起打磨工具**  
- 📣 **帮助更多人，更加充分的利用AI的力量，强大自己，丰富世界**

---

### 开源协议

本项目使用 **MIT License** 开源。

- ✅ 你可以免费使用、修改、分发本项目的源代码  
- ❌ 禁止将本项目整体用于未授权商业销售或打包行为  
- 📎 如果你 fork 本项目并再发布，请保留作者署名与原项目链接

---

## 🤝 欢迎的贡献

- ✨ 新功能建议
- 🐛 Bug 修复 / UI 优化  
- 📦 PR 或插件机制探索  
- 📣 推荐给朋友或在社区分享  

---

## 👤 关于作者

我是 **创哥**，前字节程序员 & 创业者，正在构建围绕「执行力」打造的产品 [Together]( https://togetheryiqi.com/download/app)。  
提示词精灵 是我解决自己痛点过程中写下的一个小工具，也许也能帮你节省不少时间。

你可以在以下平台找到我：

- 小红书：[小创作](https://www.xiaohongshu.com/user/profile/58a6796a5e87e77c148a64ae)
- B站：[小创作小创](https://space.bilibili.com/52807953)
- GitHub：[github.com/yourname](https://github.com/chriszou)
- 邮箱：thechriszou@126.com

---

## ⭐️ Star 一下支持一下！

如果你觉得这个项目有帮助，欢迎点个 ⭐️，也是对我最大的鼓励！