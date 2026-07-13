# LTW Admin

LTW Admin 是一个基于 Vue 3 和 Naive UI 的后台管理前端项目，主要用于管理内容、用户、权限、菜单、网站导航和定时任务等后台功能。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Naive UI
- Pinia
- Vue Router
- Tailwind CSS
- pnpm workspace

## 目录说明

- `src`：后台管理应用源码
- `public`：静态资源
- `packages`：项目公共组件和工具包
- `internal`：工程配置和内部工具
- `scripts`：构建、检查和部署脚本

## 本地运行

确保已安装 Node.js 22+、pnpm，然后执行：

```bash
pnpm install
pnpm dev
```

开发服务器启动后，访问终端输出的本地地址即可。

## 构建

```bash
pnpm build
```

构建产物默认输出到 `dist` 目录。

## 许可证

[MIT](LICENSE)
