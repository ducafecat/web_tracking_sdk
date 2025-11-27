# @holink/tracking-sdk

> 现代化的网站埋点 TypeScript SDK，支持自动采集、批量上报、离线重试

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## ✨ 特性

- 🚀 **现代化构建**: 使用 tsup 构建，支持 ESM 和 CJS 双格式输出
- 📦 **轻量级**: 零依赖，体积小巧
- 🔒 **类型安全**: 完整的 TypeScript 类型定义
- 🎯 **自动采集**: 支持页面访问、点击事件自动采集
- 📊 **批量上报**: 智能批量上报，减少网络请求
- 💾 **离线存储**: 支持离线数据持久化
- 🔄 **重试机制**: 自动重试失败的请求
- 🛠️ **可扩展**: 支持自定义存储适配器

## 📦 安装

```bash
# npm
npm install @holink/tracking-sdk

# yarn
yarn add @holink/tracking-sdk

# pnpm
pnpm add @holink/tracking-sdk
```

## 🚀 快速开始

```typescript
import { TrackingSDK, EventType } from '@holink/tracking-sdk'

// 初始化 SDK
const tracker = new TrackingSDK({
  apiEndpoint: 'https://your-api.com/api/track',
  linkId: 'your-link-id',
  autoPageView: true,
  autoClick: true,
  debug: true,
})

// 设置用户 UID
tracker.setUID('user-123')

// 记录自定义事件
tracker.track(EventType.CLICK, {
  button: 'subscribe',
  page: 'homepage',
})
```

## 📖 API 文档

### 初始化配置

```typescript
interface TrackingConfig {
  // API 端点 URL (必填)
  apiEndpoint: string

  // 默认链接 ID (可选)
  linkId?: string

  // 批量上报阈值（事件数量，默认: 10）
  batchSize?: number

  // 批量上报时间间隔（毫秒，默认: 5000）
  batchInterval?: number

  // 是否启用离线存储（默认: true）
  enableStorage?: boolean

  // 存储适配器（可选）
  storageAdapter?: StorageAdapter

  // 是否自动采集页面访问（默认: true）
  autoPageView?: boolean

  // 是否自动采集点击事件（默认: false）
  autoClick?: boolean

  // 是否启用调试模式（默认: false）
  debug?: boolean

  // 最大重试次数（默认: 3）
  maxRetries?: number

  // 重试延迟（毫秒，默认: 1000）
  retryDelay?: number
}
```

### 事件类型

```typescript
enum EventType {
  REGISTER = 'register',   // 用户注册
  SUBSCRIBE = 'subscribe', // 用户订阅
  LOGIN = 'login',         // 用户登录
  LOGOUT = 'logout',       // 用户登出
  VISIT = 'visit',         // 页面访问
  CLICK = 'click',         // 点击事件
  CUSTOM = 'custom',       // 自定义事件
}
```

### 方法

#### `setUID(uid: string): void`

设置用户 UID

```typescript
tracker.setUID('user-123')
```

#### `track(eventType: EventType | string, customData?: Record<string, unknown>): void`

记录事件

```typescript
tracker.track(EventType.CLICK, {
  button: 'subscribe',
  page: 'homepage',
})
```

## 🛠️ 开发

```bash
# 安装依赖
yarn install

# 开发模式（监听文件变化）
yarn dev

# 构建
yarn build

# 运行测试
yarn test

# 测试覆盖率
yarn test:coverage

# 代码检查
yarn lint

# 代码格式化
yarn format

# 类型检查
yarn type-check
```

## 📂 项目结构

```
.
├── src/                    # 源代码
│   ├── __tests__/          # 测试文件
│   ├── index.ts            # 入口文件
│   ├── sdk.ts              # SDK 主类
│   └── types.ts            # 类型定义
├── dist/                   # 构建输出
├── docs/                   # 文档
├── .eslintrc.cjs           # ESLint 配置
├── .prettierrc.json        # Prettier 配置
├── commitlint.config.cjs   # Commitlint 配置
├── tsconfig.json           # TypeScript 配置
├── tsup.config.ts          # 构建配置
├── vitest.config.ts        # 测试配置
└── package.json
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

在提交代码前，请确保：

1. 代码通过 ESLint 检查
2. 代码格式符合 Prettier 规范
3. 所有测试用例通过
4. Commit 信息符合规范

## 📄 许可证

[MIT](LICENSE)

## 👨‍💻 作者

ducafecat

---

如有问题或建议，请提交 Issue 或联系作者。

