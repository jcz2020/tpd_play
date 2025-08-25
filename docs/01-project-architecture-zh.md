# 项目架构

本文档提供了 Acoustic Harmony 应用技术架构的高层概述。

## 1. 技术栈

- **框架**: [Next.js](https://nextjs.org/) (使用 App Router)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **UI 库**: [React](https://reactjs.org/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **UI 组件**: [ShadCN UI](https://ui.shadcn.com/)
- **后端逻辑**: Next.js Server Actions
- **设备发现**: [Bonjour/mDNS](https://github.com/bonjour-js/bonjour-service) (通过一个独立的 Node.js 服务)

## 2. 目录结构

项目遵循标准的 Next.js App Router 结构。以下是关键目录及其用途：

- **`/src/app`**: 包含应用的所有页面和布局。
  - **`/(app)`**: 这是一个路由组，包含了所有共享通用布局（`src/app/(app)/layout.tsx`）的主要应用页面。该布局包括主侧边栏和头部。
  - **`/api`**: 包含 API 路由处理器，特别是用于长轮询通知的端点。
- **`/src/components`**: 包含所有可复用的 React 组件。
  - **`/ui`**: 存放 ShadCN UI 组件。这些通常被认为是原子性的且与应用无关的。
  - **应用特定组件**: 像 `DeviceList.tsx`, `PlaybackControls.tsx` 等组件位于 `/src/components` 的根目录下。它们由更小的 UI 组件组成，并包含应用特定的逻辑。
- **`/src/lib`**: 包含服务端逻辑、类型定义和工具函数。
  - **`actions.ts`**: 后端的核心。它使用 Server Actions 将服务端逻辑安全地暴露给客户端。所有与设备和数据库的通信都在这里发生。
  - **`db.ts` & `db.json`**: 一个简单的基于文件的数据库，用于持久化应用状态（设备、播放列表等）。
  - **`discovery-service.ts`**: 一个独立的 Node.js 服务器，用于在网络上发现 B&O 设备。
  - **`types.ts`**: 应用中使用的所有 TypeScript 类型的单一事实来源。
- **`/public`**: 用于存放静态资源，如图片或字体。
- **`/docs`**: 包含所有项目文档文件（Markdown 格式）。

## 3. 数据流

1.  **客户端 (React 组件)**: 用户与一个组件进行交互（例如，点击“播放”按钮）。
2.  **状态管理 (`AcousticHarmonyApp.tsx`)**: 该组件调用由 `AppContext` 提供的操作处理器 (action handler)。
3.  **Server Action (`actions.ts`)**: `AcousticHarmonyApp.tsx` 中的操作处理器调用 `src/lib/actions.ts` 中对应的 Server Action。
4.  **后端逻辑**: Server Action 执行所需的逻辑：
    - 它可能会调用 B&O 设备的 HTTP API。
    - 它可能会从 `db.json` 文件读取或写入数据。
5.  **响应**: Server Action 向客户端返回结果（或错误）。
6.  **状态更新**: 客户端的操作处理器接收到结果，并更新 `AcousticHarmonyApp.tsx` 中的全局状态。
7.  **UI 重新渲染**: React 因状态更新而重新渲染任何其 props 已更改的组件。

## 4. 实时更新 (通知)

播放状态（音量、进度等）的实时更新通过长轮询机制处理：

1.  `AcousticHarmonyApp` 组件向 Next.js API 路由 `/api/notifications/[ip]` 发起一个 `fetch` 请求。
2.  该 API 路由作为一个代理，与 B&O 设备的 `/BeoNotify/Notifications` 端点建立长轮询连接。
3.  当设备发送通知时，API 路由接收到它并将其作为响应发送回客户端的 `fetch` 请求。
4.  客户端收到通知数据，更新全局状态，并立即发起一个新的长轮询请求以等待下一个事件。
5.  只要有设备被选中，这个循环就会继续，提供近乎实时的状态同步。
