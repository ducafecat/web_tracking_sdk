# @holink/tracking-sdk

## npm

<https://www.npmjs.com/package/@holink/tracking-sdk>

> 🎯 用户行为埋点 SDK - 用于追踪用户的注册、订阅、登录等关键行为

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## ✨ 核心特性

### 🏗️ 架构设计

- ✅ **数据格式与后端 API 完全匹配**：扁平化结构，字段命名一致（`x_uid`、`x_link_id` 等）
- ✅ **职责划分清晰**：客户端只采集基础信息，服务端负责扩展字段（IP、地理位置、UA 解析等）
- ✅ **批量上报机制**：智能批量上报，减少网络请求
- ✅ **离线重试支持**：本地存储保证数据不丢失
- ✅ **自动采集能力**：支持页面访问和点击事件自动采集

### 🚀 技术特性

- 🔒 **类型安全**：完整的 TypeScript 类型定义
- 📦 **零依赖**：轻量级，无第三方依赖
- 🌐 **多环境支持**：浏览器、Node.js、Nuxt 4 等
- 🎨 **易于使用**：简洁的 API 设计，开箱即用
- 🔄 **重试机制**：失败自动重试（指数退避策略）
- 💾 **本地存储**：支持离线数据持久化

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

### 基础使用

```typescript
import { TrackingSDK } from '@holink/tracking-sdk'

// 1. 初始化 SDK
const tracker = new TrackingSDK({
  apiEndpoint: 'https://your-api.com',
  siteDomain: 'holink.com', // 指定站点域名（可选）
  debug: true,
  batchSize: 10,
  batchInterval: 5000,
  autoPageView: true, // 自动采集页面访问
  autoClick: false, // 手动采集点击事件（推荐）
  enableStorage: true,
})

// 2. 初始化 SDK
await tracker.init()

// 3. 设置用户 ID（登录后调用）
tracker.setUserId('user_123')

// 4. 追踪注册事件
tracker.trackRegister({
  uid: 'user_123',
  source: 'email',
  eventData: {
    utm_source: 'google',
    utm_campaign: 'summer_promo',
  },
})

// 5. 追踪订阅事件
tracker.trackSubscribe({
  plan: 'premium',
  duration: 12,
  amount: 99.99,
  eventData: {
    payment_method: 'credit_card',
    currency: 'USD',
  },
})

// 6. 追踪登录事件
tracker.trackLogin({
  uid: 'user_123',
  loginMethod: 'email',
})

// 7. 追踪页面访问
tracker.trackPageView('/dashboard', '用户控制台')

// 8. 追踪点击事件
tracker.trackClick('subscribe_button')

// 9. 追踪自定义事件
tracker.trackCustom('video_play', {
  videoId: 'abc123',
  duration: 120,
})
```

### Nuxt 4 集成

```typescript
// plugins/tracking.client.ts
import { defineNuxtPlugin } from '#app'
import { TrackingSDK } from '@holink/tracking-sdk'

export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig()
  
  const tracker = new TrackingSDK({
    apiEndpoint: config.public.trackingApiEndpoint,
    debug: config.public.trackingDebug === 'true',
    autoPageView: false, // Nuxt 中手动控制
    enableStorage: true,
  })

  await tracker.init()

  // 监听路由变化
  nuxtApp.hook('page:finish', () => {
    tracker.trackPageView()
  })

  return {
    provide: {
      tracker,
      trackPageView: tracker.trackPageView.bind(tracker),
      trackClick: tracker.trackClick.bind(tracker),
      trackRegister: tracker.trackRegister.bind(tracker),
      trackSubscribe: tracker.trackSubscribe.bind(tracker),
      trackLogin: tracker.trackLogin.bind(tracker),
      trackLogout: tracker.trackLogout.bind(tracker),
    },
  }
})
```

使用示例：

```vue
<script setup>
const { $tracker, $trackClick } = useNuxtApp()

function handleButtonClick() {
  $trackClick('subscribe_button', '立即订阅')
}
</script>

<template>
  <button @click="handleButtonClick">订阅</button>
</template>
```

## 📖 API 文档

### 初始化配置

```typescript
interface TrackingConfig {
  /** API 端点（例如：https://your-api.com） */
  apiEndpoint: string

  /** 站点域名（用于多站点统计，例如：'holink.com'）
   * 如果不设置，SDK 会自动使用 window.location.hostname */
  siteDomain?: string

  /** 是否启用调试模式（默认：false） */
  debug?: boolean

  /** 批量上报的事件数量阈值（默认：10） */
  batchSize?: number

  /** 批量上报的时间间隔（毫秒，默认：5000） */
  batchInterval?: number

  /** 是否自动采集页面访问事件（默认：true） */
  autoPageView?: boolean

  /** 是否自动采集点击事件（默认：false） */
  autoClick?: boolean

  /** 请求超时时间（毫秒，默认：10000） */
  timeout?: number

  /** 最大重试次数（默认：3） */
  maxRetries?: number

  /** 是否启用本地存储（默认：true） */
  enableStorage?: boolean

  /** 存储 key 前缀（默认：holink_track_） */
  storagePrefix?: string
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

### 核心方法

#### `init(): Promise<void>`

初始化 SDK（恢复本地数据、设置自动采集等）

```typescript
await tracker.init()
```

#### `setUserId(userId: string): void`

设置用户 ID（登录后调用）

```typescript
tracker.setUserId('user_123')
```

#### `clearUserId(): void`

清除用户 ID（登出时调用）

```typescript
tracker.clearUserId()
```

#### `trackRegister(data: Partial<RegisterEvent>): void`

追踪注册事件

```typescript
tracker.trackRegister({
  uid: 'user_123',
  source: 'email',
  eventData: {
    utm_source: 'google',
  },
})
```

#### `trackSubscribe(data: Partial<SubscribeEvent>): void`

追踪订阅事件

```typescript
tracker.trackSubscribe({
  plan: 'premium',
  duration: 12,
  amount: 99.99,
})
```

#### `trackLogin(data: Partial<LoginEvent>): void`

追踪登录事件

```typescript
tracker.trackLogin({
  uid: 'user_123',
  loginMethod: 'email',
})
```

#### `trackLogout(): void`

追踪登出事件

```typescript
tracker.trackLogout()
```

#### `trackPageView(path?: string, title?: string): void`

追踪页面访问事件（`trackVisit` 的别名）

```typescript
tracker.trackPageView('/dashboard', '用户控制台')
```

#### `trackClick(data: Partial<ClickEvent> | string): void`

追踪点击事件

```typescript
// 简单用法
tracker.trackClick('button_id')

// 完整用法
tracker.trackClick({
  elementId: 'buy_now_button',
  elementText: '立即购买',
  eventData: {
    productId: 'prod_123',
  },
})
```

#### `trackCustom(eventName: string, data?: Record<string, any>): void`

追踪自定义事件

```typescript
tracker.trackCustom('video_play', {
  videoId: 'abc123',
  duration: 120,
})
```

#### `sendImmediately(event: BaseEvent): Promise<void>`

即时上报事件（不经过队列，用于重要事件）

```typescript
await tracker.sendImmediately({
  eventType: 'payment_completed',
  uid: 'user_123',
  linkId: 'checkout',
  eventData: {
    orderId: 'order_123',
    amount: 99.99,
  },
})
```

#### `flush(): void`

手动刷新队列（立即发送所有待发送事件）

```typescript
tracker.flush()
```

#### `destroy(): void`

销毁 SDK（发送所有待发送事件并清理资源）

```typescript
tracker.destroy()
```

## 📊 数据流程

```
客户端 SDK 采集基础信息
    ↓
批量上报到后端 API
    ↓
后端扩展字段（IP、地理位置、UA 解析等）
    ↓
保存到 MongoDB
    ↓
用户活动分析
```

### 客户端发送的数据格式

```json
{
  "eventType": "register",
  "siteDomain": "holink.com",
  "x_uid": "user_123",
  "x_link_id": "register_form",
  "timestamp": 1700000000000,
  "uri": "/register",
  "referer": "https://google.com",
  "userAgent": "Mozilla/5.0...",
  "sessionId": "1700000000000-abc123",
  "eventData": {
    "source": "email",
    "_clientInfo": {
      "url": "https://your-site.com/register",
      "screenResolution": "1920x1080",
      "viewport": "1440x900",
      "language": "zh-CN",
      "timezone": "Asia/Shanghai",
      "platform": "MacIntel"
    }
  }
}
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
