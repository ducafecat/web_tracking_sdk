# 📚 埋点 SDK 文档总览

> **最后更新**：2025-11-27
> **文档状态**：✅ 生产就绪，完全兼容

---

## 📖 文档列表

### 核心文档

| 文档名称                | 文件路径                   | 状态      | 说明                     |
| ----------------------- | -------------------------- | --------- | ------------------------ |
| **埋点 SDK 设计方案**   | `2-1-埋点SDK设计.md`       | ✅ 已更新 | SDK 核心设计与实现代码   |
| **Nuxt 4 集成方案**     | `2-2-nuxt4埋点.md`         | ✅ 已优化 | 在 Nuxt 4 中集成使用 SDK |
| **SDK 更新日志**        | `2-3-SDK更新日志.md`       | ✅ 新增   | 详细的版本更新说明       |
| **兼容性对比表**        | `2-4-兼容性对比表.md`      | ✅ 新增   | 两个文档的详细对比       |
| **Nuxt 4 文档优化说明** | `2-5-Nuxt4文档优化说明.md` | ✅ 新增   | Nuxt 4 文档的优化详情    |

### 其他相关文档

| 文档名称     | 文件路径            | 说明                 |
| ------------ | ------------------- | -------------------- |
| 用户活动分析 | `1-用户活动分析.md` | 用户行为分析业务逻辑 |
| 业务说明     | `0-业务说明.md`     | 整体业务背景介绍     |

---

## 🎯 快速开始

### 1️⃣ 实现 SDK 核心代码

按照 **`2-1-埋点SDK设计.md`** 创建以下文件：

```bash
utils/tracking/
├── types.ts              # 类型定义
├── TrackingSDK.ts        # SDK 主类
├── EventQueue.ts         # 事件队列管理
├── StorageManager.ts     # 本地存储管理
└── index.ts              # 导出入口
```

### 2️⃣ 在 Nuxt 4 中集成

按照 **`2-2-nuxt4埋点.md`** 创建以下文件：

```bash
plugins/
└── tracking.client.ts    # Nuxt 插件

composables/
└── useTracking.ts        # 组合式函数

types/
└── tracking.d.ts         # TypeScript 类型声明
```

### 3️⃣ 配置环境变量

```bash
# .env
NUXT_PUBLIC_TRACKING_API_ENDPOINT=https://api.your-domain.com
```

### 4️⃣ 开始使用

```vue
<script setup>
const tracking = useTracking();

// 页面访问
tracking.trackPageView();

// 点击事件
tracking.trackClick('button_id', '按钮文本');

// 注册事件
tracking.trackRegister({ uid: 'user_123', source: 'email' });
</script>
```

---

## ✨ 核心特性

### 完全兼容

- ✅ **文档 2-1** 与 **文档 2-2** 完全兼容
- ✅ 所有方法和配置选项都能正常工作
- ✅ 无需额外的适配层

### 新增功能（v1.1.0）

- ✅ `trackPageView()` - 页面访问追踪（`trackVisit` 的别名）
- ✅ `trackClick()` - 点击事件追踪（新增）
- ✅ `autoClick` 配置 - 自动点击采集（新增）
- ✅ `EventType.CLICK` - 点击事件类型（新增）
- ✅ `ClickEvent` 接口 - 点击事件类型定义（新增）

### 核心功能

- ✅ 批量上报（减少网络请求）
- ✅ 离线支持（本地存储待发送事件）
- ✅ 自动重试（失败自动重试）
- ✅ 类型安全（完整的 TypeScript 支持）
- ✅ 自动采集（页面访问、点击事件）

---

## 📊 API 速查表

### 核心方法

| 方法                         | 参数                                           | 说明                   |
| ---------------------------- | ---------------------------------------------- | ---------------------- |
| `trackRegister(data)`        | `{ uid, source, linkId, eventData }`           | 追踪注册事件           |
| `trackSubscribe(data)`       | `{ plan, duration, amount, linkId }`           | 追踪订阅事件           |
| `trackLogin(data)`           | `{ uid, loginMethod, linkId }`                 | 追踪登录事件           |
| `trackLogout()`              | -                                              | 追踪登出事件           |
| `trackVisit(path, title)`    | `path?, title?`                                | 追踪页面访问           |
| `trackPageView(path, title)` | `path?, title?`                                | 追踪页面访问（别名）⭐ |
| `trackClick(data)`           | `string \| { elementId, elementText, linkId }` | 追踪点击事件 ⭐        |
| `trackCustom(name, data)`    | `name, data?`                                  | 追踪自定义事件         |
| `setUserId(userId)`          | `userId`                                       | 设置用户 ID            |
| `clearUserId()`              | -                                              | 清除用户 ID            |
| `flush()`                    | -                                              | 立即发送所有待发送事件 |

⭐ = 新增方法

### 配置选项

| 选项            | 类型      | 默认值            | 说明                 |
| --------------- | --------- | ----------------- | -------------------- |
| `apiEndpoint`   | `string`  | 必填              | API 端点             |
| `debug`         | `boolean` | `false`           | 调试模式             |
| `batchSize`     | `number`  | `10`              | 批量上报阈值         |
| `batchInterval` | `number`  | `5000`            | 批量上报间隔（毫秒） |
| `autoPageView`  | `boolean` | `true`            | 自动页面追踪         |
| `autoClick`     | `boolean` | `false`           | 自动点击追踪 ⭐      |
| `enableStorage` | `boolean` | `true`            | 启用本地存储         |
| `storagePrefix` | `string`  | `'holink_track_'` | 存储前缀             |
| `timeout`       | `number`  | `10000`           | 请求超时（毫秒）     |
| `maxRetries`    | `number`  | `3`               | 最大重试次数         |

⭐ = 新增配置

---

## 🔄 版本历史

### v1.1.0 (2025-11-27) - Nuxt 4 兼容性更新

**新增**：

- `trackPageView()` 方法（`trackVisit` 的别名）
- `trackClick()` 方法（追踪点击事件）
- `autoClick` 配置选项（自动点击采集）
- `EventType.CLICK` 枚举值
- `ClickEvent` 类型接口
- 完整的 Nuxt 4 集成兼容性

**修改**：

- 更新 `TrackingConfig` 接口（添加 `autoClick`）
- 更新构造函数（处理 `autoClick` 配置）
- 更新 `init()` 方法（初始化点击监听器）

**文档**：

- 新增 `2-3-SDK更新日志.md`
- 新增 `2-4-兼容性对比表.md`
- 新增本文档 `README-埋点文档总览.md`
- 更新 `2-1-埋点SDK设计.md`

### v1.0.0 (初始版本)

- 基础 SDK 实现
- 事件追踪功能
- 批量上报
- 离线支持

---

## 🎓 使用建议

### 推荐配置

```typescript
const tracker = new TrackingSDK({
  apiEndpoint: 'https://your-api.com',
  debug: process.env.NODE_ENV === 'development',
  batchSize: 10,
  batchInterval: 5000,
  autoPageView: true, // ✅ 推荐启用
  autoClick: false, // ✅ 推荐禁用（手动调用更精确）
  enableStorage: true, // ✅ 推荐启用
});
```

### 推荐用法

```typescript
// ✅ 页面访问 - 使用 trackPageView（Nuxt 4）
tracking.trackPageView('/home', '首页');

// ✅ 点击事件 - 手动调用
<button @click="() => tracking.trackClick('submit_btn', '提交')">
  提交
</button>

// ⚠️ 避免使用 autoClick（会产生大量事件）
// autoClick: false
```

---

## 🧪 测试验证

### 快速验证清单

- [ ] SDK 初始化成功
- [ ] `trackPageView()` 能正常工作
- [ ] `trackClick()` 能正常工作
- [ ] 事件数据能成功上报到后端
- [ ] 后端接收到的数据格式正确（`x_uid`、`x_link_id` 等）
- [ ] 离线时事件能保存到本地
- [ ] 恢复在线后事件能自动上报
- [ ] TypeScript 类型检查通过

### 调试方法

```typescript
// 启用调试模式
const tracker = new TrackingSDK({
  apiEndpoint: 'https://your-api.com',
  debug: true, // ✅ 在控制台输出详细日志
});

// 手动触发事件上报
tracker.flush();

// 查看队列中的事件
console.log(tracker.eventQueue.getAll());
```

---

## 📞 常见问题

### Q1: 为什么有 `trackVisit()` 和 `trackPageView()` 两个方法？

**A**: `trackPageView()` 是 `trackVisit()` 的别名方法，功能完全相同。添加 `trackPageView()` 是为了与 Nuxt 4 集成方案保持一致，提供更语义化的 API。

### Q2: `autoClick` 应该设置为 `true` 还是 `false`？

**A**: 推荐设置为 `false`，手动调用 `trackClick()` 更精确。如果设置为 `true`，SDK 会自动采集所有 button、a 标签的点击，可能产生大量不必要的事件。

### Q3: 如何确认两个文档是否兼容？

**A**: 查看 **`2-4-兼容性对比表.md`**，里面有详细的对比清单。所有方法和配置选项都已标注兼容状态。

### Q4: 已有项目如何升级到新版本？

**A**: 查看 **`2-3-SDK更新日志.md`** 中的"升级注意事项"章节，按照清单逐项更新即可。主要是添加新的方法和类型定义。

---

## 📚 相关链接

- [埋点 SDK 设计方案](./2-1-埋点SDK设计.md)
- [Nuxt 4 集成方案](./2-2-nuxt4埋点.md)
- [SDK 更新日志](./2-3-SDK更新日志.md)
- [兼容性对比表](./2-4-兼容性对比表.md)
- [Nuxt 4 文档优化说明](./2-5-Nuxt4文档优化说明.md)

---

## 📝 维护说明

### 文档维护者

请在更新任何文档时：

1. 更新本文档的"最后更新"日期
2. 在 `2-3-SDK更新日志.md` 中添加更新记录
3. 检查 `2-4-兼容性对比表.md` 是否需要更新
4. 确保所有文档之间的信息保持一致

### 版本规范

- **主版本号**（1.x.x）：不兼容的 API 变更
- **次版本号**（x.1.x）：向下兼容的功能新增
- **修订号**（x.x.1）：向下兼容的问题修正

---

**文档版本**：1.0
**SDK 版本**：1.1.0
**生产就绪**：✅ 是
**兼容性**：✅ 完全兼容
