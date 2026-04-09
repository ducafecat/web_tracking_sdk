# README 附加内容

## 🎯 后端 API 接口

SDK 会将事件发送到以下端点：

### 批量上报（推荐）

```
POST /api/track/batch

Body:
{
  "events": [
    { eventType, siteDomain, x_uid, x_link_id, x_link_type, ... },
    { eventType, siteDomain, x_uid, x_link_id, x_link_type, ... }
  ]
}
```

### 单个事件上报

```
POST /api/track/register   - 注册事件
POST /api/track/subscribe  - 订阅事件
POST /api/track/login      - 登录事件
```

## 🔧 自动采集配置

### 自动采集点击事件

如果启用 `autoClick: true`，SDK 会自动采集以下元素的点击：

- 带有 `data-track` 属性的元素
- `<button>` 按钮
- `<a>` 链接
- 带有 `.trackable` 类的元素

```html
<!-- 自动采集的元素示例 -->
<button data-track data-track-id="subscribe_button">订阅</button>
<a data-track href="/pricing">查看价格</a>
<div class="trackable" data-track-id="feature_card">功能卡片</div>
```

### 自动采集页面访问

如果启用 `autoPageView: true`，SDK 会自动监听以下事件：

- `history.pushState` - SPA 路由切换
- `history.replaceState` - SPA 路由替换
- `popstate` - 浏览器前进后退
- `hashchange` - Hash 路由变化

## 💡 最佳实践

### 1. 重要事件使用即时上报

对于支付、订单等重要事件，建议使用 `sendImmediately` 方法：

```typescript
await tracker.sendImmediately({
  eventType: 'payment_completed',
  uid: 'user_123',
  linkId: 'checkout',
  eventData: { orderId: 'order_123', amount: 99.99 },
})
```

### 2. 页面关闭前刷新队列

SDK 已自动处理，但如果需要自定义：

```typescript
window.addEventListener('beforeunload', () => {
  tracker.flush()
})
```

### 3. 使用环境变量管理配置

```typescript
const tracker = new TrackingSDK({
  apiEndpoint: process.env.TRACKING_API_ENDPOINT,
  debug: process.env.NODE_ENV === 'development',
})
```

### 4. 错误处理

```typescript
try {
  await tracker.sendImmediately(event)
} catch (error) {
  console.error('埋点上报失败:', error)
}
```

## 🔍 常见问题

### Q: SDK 会自动发送什么数据？

A: SDK 会自动采集以下信息：

- 事件类型（eventType）
- 用户 UID（x_uid，需要手动设置）
- 链接 ID（x_link_id）
- 链接类型（x_link_type）
- 时间戳（timestamp）
- 页面 URI（uri）
- 来源页面（referer）
- User-Agent（userAgent）
- 会话 ID（sessionId）
- 客户端信息（_clientInfo：URL、分辨率、语言、时区等）

### Q: 如何处理多站点统计？

A: 使用 `siteDomain` 配置：

```typescript
const tracker = new TrackingSDK({
  apiEndpoint: 'https://your-api.com',
  siteDomain: 'holink.com', // 指定站点域名
})
```

### Q: 如何在 SSR 应用中使用？

A: SDK 会自动检测运行环境，在 SSR 环境中不会报错。建议只在客户端初始化：

```typescript
// Nuxt 3/4: plugins/tracking.client.ts
// Next.js: 使用 useEffect 或 'use client'
```

### Q: 离线数据会保存多久？

A: SDK 使用 localStorage 保存未发送的事件，直到成功上报。数据会一直保留直到成功发送。

### Q: 如何自定义存储前缀？

A: 使用 `storagePrefix` 配置：

```typescript
const tracker = new TrackingSDK({
  apiEndpoint: 'https://your-api.com',
  storagePrefix: 'my_app_track_', // 自定义前缀
})
```

## 📊 数据字段对照表

| SDK 字段               | 后端字段        | 来源   | 说明                        |
| ---------------------- | --------------- | ------ | --------------------------- |
| `eventType`            | `eventType`     | 客户端 | 事件类型                    |
| `siteDomain`           | `siteDomain`    | 客户端 | 站点域名（多站点统计）      |
| `uid` → `x_uid`        | `x_uid`         | 客户端 | 用户 UID（业务系统 ID）     |
| `linkId` → `x_link_id` | `x_link_id`     | 客户端 | 链接 ID（业务标识）         |
| `linkType` → `x_link_type` | `x_link_type`       | 客户端 | 链接类型（业务类型补充）    |
| `timestamp`            | `timestamp`     | 客户端 | 事件时间戳（毫秒）          |
| -                      | `date`          | 服务端 | 日期字符串（YYYY-MM-DD）    |
| `uri`                  | `uri`           | 客户端 | 请求 URI                    |
| `referer`              | `referer`       | 客户端 | 请求来源（Referer）         |
| -                      | `refererDomain` | 服务端 | 来源域名（从 referer 提取） |
| -                      | `refererType`   | 服务端 | 来源类型（分析得出）        |
| `userAgent`            | `userAgent`     | 客户端 | User-Agent 字符串           |
| -                      | `userAgentInfo` | 服务端 | 解析后的 UA 信息            |
| `sessionId`            | `sessionId`     | 客户端 | 会话 ID                     |
| -                      | `clientIp`      | 服务端 | 客户端真实 IP               |
| -                      | `userId`        | 服务端 | 用户唯一标识（hash）        |
| -                      | `geolocation`   | 服务端 | 地理位置信息                |
| `eventData`            | `eventData`     | 客户端 | 事件附加数据                |

## 🔗 相关链接

- [完整设计文档](docs/2-1-埋点SDK设计.md)
- [基础使用示例](examples/basic-usage.ts)
- [Nuxt 4 集成示例](examples/nuxt-plugin.ts)

