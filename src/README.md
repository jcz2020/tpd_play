# Acoustic Harmony

This is a Next.js application for discovering, controlling, and scheduling your B&O speakers with a modern, web-based interface.

## Features

- **Device Discovery**: Automatically scans the local network to find compatible B&O speakers.
- **Playback Control**: Full control over playback, including play/pause, volume, track seeking, and source switching.
- **Music Library**: Scans local folders for music files and builds a browsable library.
- **Playlist Management**: Create and manage custom playlists from your local music library.
- **Scheduling**: Set schedules to automate tasks like turning speakers on or off at a specific time.

## Project Documentation (English)

For detailed information about the project's architecture, development guidelines, and API reference, please refer to the documentation in the `/docs` directory.

| Document                        | Description                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| [Project Architecture](./docs/01-project-architecture.md) | A high-level overview of the technology stack and project structure.                 |
| [Frontend Development](./docs/02-frontend-development.md) | Guidelines for building UI components and managing frontend state.                     |
| [Backend Development](./docs/03-backend-development.md)  | An explanation of the server-side logic, including Server Actions and database access. |
| [API Reference](./docs/04-api-reference.md)           | Detailed reference for all available Server Actions and data types.                  |

## 项目文档 (中文)

关于项目架构、开发指南和API参考的详细信息，请参阅 `/docs` 目录中的文档。

| 文档                        | 描述                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| [项目架构](./docs/01-project-architecture-zh.md) | 关于技术栈和项目结构的高层概述。                 |
| [前端开发](./docs/02-frontend-development-zh.md) | 构建UI组件和管理前端状态的指南。                     |
| [后端开发](./docs/03-backend-development-zh.md)  | 对服务端逻辑的解释，包括 Server Actions 和数据库访问。 |
| [API 参考](./docs/04-api-reference-zh.md)           | 所有可用的 Server Actions 和数据类型的详细参考。                  |


## Getting Started

To get the application running on your local machine, follow these steps:

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Installation

1.  Clone the repository to your local machine.
2.  Open a terminal in the project's root directory.
3.  Install the necessary dependencies by running:

    ```bash
    npm install
    ```

### Running the Application

**This application consists of two parts that need to run concurrently in separate terminals.**

1.  **Terminal 1: The Main Web Application**
    
    This command starts the main Next.js development server.
    ```bash
    npm run dev
    ```
    By default, it will be accessible at [http://localhost:9002](http://localhost:9002).

2.  **Terminal 2: The Device Discovery Service**
    
    This command starts the local service that scans your network for B&O devices.
    ```bash
    npm run discover
    ```
    This service runs on port `9003` and is automatically called by the main application. **The "Add Device" discovery feature will not work unless this service is running.**

## Available Scripts

- `npm run dev`: Starts the Next.js app in development mode.
- `npm run discover`: Starts the local device discovery service.
- `npm run build`: Builds the application for production usage.
- `npm run start`: Starts a Next.js production server.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run typecheck`: Runs the TypeScript compiler to check for type errors.
