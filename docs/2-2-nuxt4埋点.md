我来为您详细说明如何在 Nuxt 4 中使用这个埋点 SDK。

> **✅ 本文档已与 SDK 设计方案（2-1-埋点SDK设计.md v1.1.0）完全兼容**
>
> - ✅ 支持 `trackPageView()` 方法
> - ✅ 支持 `trackClick()` 方法
> - ✅ 支持 `autoClick` 配置选项
> - ✅ 所有方法和配置均已验证

## 📦 在 Nuxt 4 中集成埋点 SDK

### 一、项目结构设计

```
your-nuxt-app/
├── plugins/
│   └── tracking.client.ts          # 客户端插件
├── composables/
│   └── useTracking.ts              # 组合式函数
├── utils/
│   └── tracking/
│       ├── index.ts                # SDK 入口
│       ├── TrackingSDK.ts          # SDK 主类
│       ├── EventQueue.ts           # 事件队列
│       ├── StorageManager.ts       # 存储管理
│       └── types.ts                # 类型定义
└── nuxt.config.ts                  # Nuxt 配置
```

### 二、创建 Nuxt 插件

#### 2.1 客户端插件 (`plugins/tracking.client.ts`)

```typescript
/**
 * 埋点 SDK Nuxt 插件
 * 注意：使用 .client.ts 后缀确保只在客户端运行
 */

import { TrackingSDK } from '~/utils/tracking';

export default defineNuxtPlugin({
  name: 'tracking-sdk',
  enforce: 'pre', // 确保在其他插件之前加载
  async setup(nuxtApp) {
    const config = useRuntimeConfig();

    // 创建 SDK 实例
    const tracker = new TrackingSDK({
      apiEndpoint: config.public.trackingApiEndpoint as string,
      debug: config.public.trackingDebug === 'true',
      batchSize: 10,
      batchInterval: 5000,
      autoPageView: true,
      autoClick: false,
      enableStorage: true,
      storagePrefix: 'holink_track_',
    });

    // 初始化 SDK
    await tracker.init();

    // 监听路由变化，自动追踪页面访问
    nuxtApp.hook('page:finish', () => {
      const route = useRoute();
      tracker.trackPageView(route.fullPath, route.meta.title as string);
    });

    // 监听页面离开，确保事件发送完成
    if (process.client) {
      window.addEventListener('beforeunload', () => {
        tracker.flush();
      });
    }

    // 将 tracker 实例注入到 Nuxt 应用中
    return {
      provide: {
        tracker,
      },
    };
  },
});
```

### 三、创建组合式函数

#### 3.1 `composables/useTracking.ts`

```typescript
/**
 * 埋点追踪组合式函数
 * 提供便捷的追踪方法
 */

import type { TrackingSDK } from '~/utils/tracking';

export const useTracking = () => {
  const { $tracker } = useNuxtApp();
  const tracker = $tracker as TrackingSDK;

  /**
   * 设置用户 ID
   */
  const setUserId = (userId: string) => {
    tracker.setUserId(userId);
  };

  /**
   * 清除用户 ID
   */
  const clearUserId = () => {
    tracker.clearUserId();
  };

  /**
   * 追踪注册事件
   */
  const trackRegister = (data?: any) => {
    tracker.trackRegister(data);
  };

  /**
   * 追踪订阅事件
   */
  const trackSubscribe = (plan: string, duration: number, amount?: number) => {
    tracker.trackSubscribe({
      plan,
      duration,
      amount,
      linkId: 'subscribe',
    });
  };

  /**
   * 追踪登录事件
   */
  const trackLogin = (userId: string, method?: 'email' | 'phone' | 'social' | 'sso') => {
    tracker.setUserId(userId);
    tracker.trackLogin({
      uid: userId,
      loginMethod: method,
      linkId: 'login',
    });
  };

  /**
   * 追踪登出事件
   */
  const trackLogout = () => {
    tracker.trackLogout();
  };

  /**
   * 追踪点击事件
   * 支持多种调用方式
   */
  const trackClick = (
    elementIdOrData: string | { elementId?: string; elementText?: string; linkId?: string },
    elementText?: string,
    linkId?: string,
  ) => {
    if (typeof elementIdOrData === 'string') {
      // 简单用法：trackClick('button_id', '按钮文本', 'page_name')
      tracker.trackClick({
        elementId: elementIdOrData,
        elementText,
        linkId,
      });
    } else {
      // 对象用法：trackClick({ elementId: 'button_id', elementText: '按钮文本', linkId: 'page_name' })
      tracker.trackClick(elementIdOrData);
    }
  };

  /**
   * 追踪自定义事件
   */
  const trackCustom = (eventName: string, data?: Record<string, any>) => {
    tracker.trackCustom(eventName, data);
  };

  /**
   * 追踪页面访问
   */
  const trackPageView = (path?: string, title?: string) => {
    tracker.trackPageView(path, title);
  };

  /**
   * 手动刷新队列
   */
  const flush = () => {
    tracker.flush();
  };

  return {
    setUserId,
    clearUserId,
    trackRegister,
    trackSubscribe,
    trackLogin,
    trackLogout,
    trackClick,
    trackCustom,
    trackPageView,
    flush,
  };
};
```

### 四、配置文件更新

#### 4.1 `nuxt.config.ts`

```typescript
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  // 运行时配置
  runtimeConfig: {
    public: {
      // 埋点 API 端点
      trackingApiEndpoint:
        process.env.NUXT_PUBLIC_TRACKING_API_ENDPOINT || 'https://api.your-domain.com',
      // 是否启用调试模式
      trackingDebug: process.env.NODE_ENV === 'development' ? 'true' : 'false',
    },
  },

  // 自动导入组合式函数
  imports: {
    dirs: ['composables/**'],
  },

  // TypeScript 配置
  typescript: {
    strict: true,
    typeCheck: true,
  },
});
```

#### 4.2 `.env` 环境变量

```bash
# .env
NUXT_PUBLIC_TRACKING_API_ENDPOINT=https://api.your-domain.com
```

### 五、使用示例

#### 5.1 在页面组件中使用

```vue
<!-- pages/index.vue -->
<script setup lang="ts">
const tracking = useTracking();

// 页面加载时的操作
onMounted(() => {
  // 追踪自定义事件
  tracking.trackCustom('home_page_loaded', {
    timestamp: Date.now(),
  });
});

// 按钮点击追踪 - 方式1：简单参数
const handleSubscribeClick = () => {
  tracking.trackClick('subscribe_button', '立即订阅', 'home_page');

  // 执行订阅逻辑...
  // navigateTo('/subscribe');
};

// 按钮点击追踪 - 方式2：对象参数
const handleDetailClick = () => {
  tracking.trackClick({
    elementId: 'detail_button',
    elementText: '查看详情',
    linkId: 'home_page',
  });
};
</script>

<template>
  <div>
    <h1>欢迎来到 Holink</h1>
    <button @click="handleSubscribeClick">立即订阅</button>
  </div>
</template>
```

#### 5.2 用户注册页面

```vue
<!-- pages/register.vue -->
<script setup lang="ts">
const tracking = useTracking();
const router = useRouter();

const form = reactive({
  email: '',
  password: '',
});

const handleRegister = async () => {
  try {
    // 调用注册 API
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: form,
    });

    const userId = response.userId;

    // 追踪注册事件
    tracking.trackRegister({
      uid: userId,
      source: 'email',
      linkId: 'register_form',
      eventData: {
        referrer: document.referrer,
        utm_source: router.currentRoute.value.query.utm_source,
        utm_campaign: router.currentRoute.value.query.utm_campaign,
      },
    });

    // 设置用户 ID
    tracking.setUserId(userId);

    // 跳转到首页
    await router.push('/');
  } catch (error) {
    console.error('注册失败:', error);
  }
};
</script>

<template>
  <div class="register-page">
    <h1>用户注册</h1>
    <form @submit.prevent="handleRegister">
      <input v-model="form.email" type="email" placeholder="邮箱" required />
      <input v-model="form.password" type="password" placeholder="密码" required />
      <button type="submit">注册</button>
    </form>
  </div>
</template>
```

#### 5.3 用户登录页面

```vue
<!-- pages/login.vue -->
<script setup lang="ts">
const tracking = useTracking();
const router = useRouter();

const form = reactive({
  email: '',
  password: '',
});

const handleLogin = async () => {
  try {
    // 调用登录 API
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: form,
    });

    const userId = response.userId;

    // 追踪登录事件
    tracking.trackLogin(userId, 'email');

    // 跳转到首页
    await router.push('/');
  } catch (error) {
    console.error('登录失败:', error);
  }
};
</script>

<template>
  <div class="login-page">
    <h1>用户登录</h1>
    <form @submit.prevent="handleLogin">
      <input v-model="form.email" type="email" placeholder="邮箱" required />
      <input v-model="form.password" type="password" placeholder="密码" required />
      <button type="submit">登录</button>
    </form>
  </div>
</template>
```

#### 5.4 订阅页面

```vue
<!-- pages/subscribe.vue -->
<script setup lang="ts">
const tracking = useTracking();

const plans = [
  { id: 'monthly', name: '月度会员', duration: 1, price: 9.99 },
  { id: 'yearly', name: '年度会员', duration: 12, price: 99.99 },
];

const handleSubscribe = async (plan: (typeof plans)[0]) => {
  try {
    // 调用订阅 API
    const response = await $fetch('/api/subscribe', {
      method: 'POST',
      body: {
        planId: plan.id,
        duration: plan.duration,
      },
    });

    // 追踪订阅事件
    tracking.trackSubscribe(plan.id, plan.duration, plan.price);

    // 追踪自定义转化事件
    tracking.trackCustom('subscription_completed', {
      plan: plan.id,
      amount: plan.price,
      currency: 'USD',
    });

    // 跳转到成功页面
    await navigateTo('/subscribe/success');
  } catch (error) {
    console.error('订阅失败:', error);
  }
};
</script>

<template>
  <div class="subscribe-page">
    <h1>选择订阅计划</h1>
    <div class="plans">
      <div v-for="plan in plans" :key="plan.id" class="plan-card">
        <h3>{{ plan.name }}</h3>
        <p class="price">${{ plan.price }}</p>
        <button @click="handleSubscribe(plan)">立即订阅</button>
      </div>
    </div>
  </div>
</template>
```

#### 5.5 在布局中使用（全局登出）

```vue
<!-- layouts/default.vue -->
<script setup lang="ts">
const tracking = useTracking();
const router = useRouter();

const handleLogout = async () => {
  try {
    // 调用登出 API
    await $fetch('/api/auth/logout', {
      method: 'POST',
    });

    // 追踪登出事件
    tracking.trackLogout();

    // 跳转到登录页
    await router.push('/login');
  } catch (error) {
    console.error('登出失败:', error);
  }
};
</script>

<template>
  <div>
    <header>
      <nav>
        <NuxtLink to="/">首页</NuxtLink>
        <NuxtLink to="/subscribe">订阅</NuxtLink>
        <button @click="handleLogout">登出</button>
      </nav>
    </header>

    <main>
      <slot />
    </main>

    <footer>
      <p>&copy; 2025 Holink</p>
    </footer>
  </div>
</template>
```

#### 5.6 trackClick 的多种使用方式

`trackClick` 方法支持多种调用方式，满足不同场景需求：

```vue
<!-- pages/demo.vue -->
<script setup lang="ts">
const tracking = useTracking();

// 方式1：简单用法（只传元素 ID）
const handleClick1 = () => {
  tracking.trackClick('button_id');
};

// 方式2：传递三个参数（ID、文本、链接 ID）
const handleClick2 = () => {
  tracking.trackClick('button_id', '按钮文本', 'page_name');
};

// 方式3：对象参数（更灵活）
const handleClick3 = () => {
  tracking.trackClick({
    elementId: 'button_id',
    elementText: '按钮文本',
    linkId: 'page_name',
  });
};

// 方式4：直接在模板中使用
const trackButtonClick = (id: string, text: string) => {
  tracking.trackClick(id, text, 'demo_page');
};
</script>

<template>
  <div>
    <!-- 方式1：简单用法 -->
    <button @click="handleClick1">按钮1</button>

    <!-- 方式2：完整参数 -->
    <button @click="handleClick2">按钮2</button>

    <!-- 方式3：对象参数 -->
    <button @click="handleClick3">按钮3</button>

    <!-- 方式4：内联调用 -->
    <button @click="trackButtonClick('btn_4', '按钮4')">按钮4</button>
  </div>
</template>
```

#### 5.7 使用指令自动追踪点击

创建一个自定义指令来简化点击追踪：

```typescript
// plugins/tracking-directive.client.ts
export default defineNuxtPlugin(nuxtApp => {
  const tracking = useTracking();

  // 注册 v-track 指令
  nuxtApp.vueApp.directive('track', {
    mounted(el: HTMLElement, binding) {
      const { value } = binding;

      el.addEventListener('click', () => {
        if (typeof value === 'string') {
          // v-track="'button_id'"
          tracking.trackClick(value);
        } else if (typeof value === 'object') {
          // v-track="{ elementId: 'button_id', elementText: '按钮文本', linkId: 'page_name' }"
          tracking.trackClick(value);
        }
      });
    },
  });
});
```

使用指令：

```vue
<template>
  <div>
    <!-- 简单用法：只传元素 ID -->
    <button v-track="'subscribe_button'">订阅</button>

    <!-- 完整用法：传递对象 -->
    <button
      v-track="{
        elementId: 'buy_button',
        elementText: '立即购买',
        linkId: 'pricing_page',
      }"
    >
      立即购买
    </button>
  </div>
</template>
```

### 六、在 API 路由中使用（服务端）

虽然埋点主要在客户端进行，但某些关键事件可以在服务端记录：

```typescript
// server/api/auth/register.post.ts
export default defineEventHandler(async event => {
  const body = await readBody(event);

  try {
    // 注册逻辑
    const user = await createUser(body);

    // 服务端记录注册事件（可选）
    await $fetch('https://api.your-domain.com/api/track/register', {
      method: 'POST',
      body: {
        eventType: 'register',
        uid: user.id,
        timestamp: Date.now(),
        context: {
          userAgent: getHeader(event, 'user-agent'),
          ip: getHeader(event, 'x-forwarded-for') || event.node.req.socket.remoteAddress,
          referer: getHeader(event, 'referer'),
        },
      },
    });

    return { success: true, userId: user.id };
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: '注册失败',
    });
  }
});
```

### 七、TypeScript 类型支持

创建类型声明文件以获得更好的类型提示：

```typescript
// types/tracking.d.ts
import type { TrackingSDK } from '~/utils/tracking';

declare module '#app' {
  interface NuxtApp {
    $tracker: TrackingSDK;
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $tracker: TrackingSDK;
  }
}

export {};
```

### 八、测试环境配置

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      trackingApiEndpoint:
        process.env.NODE_ENV === 'production'
          ? 'https://api.your-domain.com'
          : 'http://localhost:3001', // 本地测试服务器
      trackingDebug: process.env.NODE_ENV !== 'production' ? 'true' : 'false',
    },
  },
});
```

### 九、完整的文件清单

```bash
# 需要创建的文件（按照文档 2-1 实现）
utils/tracking/types.ts              # 类型定义
utils/tracking/TrackingSDK.ts        # SDK 主类
utils/tracking/EventQueue.ts         # 事件队列
utils/tracking/StorageManager.ts     # 存储管理
utils/tracking/index.ts              # 导出入口

plugins/tracking.client.ts           # Nuxt 插件
plugins/tracking-directive.client.ts # 自定义指令（可选）

composables/useTracking.ts           # 组合式函数

types/tracking.d.ts                  # TypeScript 类型声明（可选）
```

> **💡 提示**：SDK 核心文件（`utils/tracking/` 目录下）的实现代码请参考 [埋点 SDK 设计方案](./2-1-埋点SDK设计.md)。

### 十、快速参考

#### 10.1 常用 API 速查

```typescript
const tracking = useTracking();

// 用户身份管理
tracking.setUserId('user_123'); // 设置用户 ID
tracking.clearUserId(); // 清除用户 ID

// 事件追踪
tracking.trackRegister({ uid, source }); // 注册事件
tracking.trackSubscribe(plan, duration, amount); // 订阅事件
tracking.trackLogin(userId, 'email'); // 登录事件
tracking.trackLogout(); // 登出事件
tracking.trackPageView('/path', 'title'); // 页面访问
tracking.trackClick('btn_id', '文本', 'page'); // 点击事件
tracking.trackCustom('event_name', data); // 自定义事件

// 其他
tracking.flush(); // 立即发送所有待发送事件
```

#### 10.2 配置选项速查

```typescript
const tracker = new TrackingSDK({
  apiEndpoint: string;        // 必填：API 端点
  debug?: boolean;            // 调试模式（默认：false）
  batchSize?: number;         // 批量阈值（默认：10）
  batchInterval?: number;     // 批量间隔（默认：5000ms）
  autoPageView?: boolean;     // 自动页面追踪（默认：true）
  autoClick?: boolean;        // 自动点击追踪（默认：false）
  enableStorage?: boolean;    // 启用本地存储（默认：true）
  storagePrefix?: string;     // 存储前缀（默认：'holink_track_'）
  timeout?: number;           // 请求超时（默认：10000ms）
  maxRetries?: number;        // 最大重试次数（默认：3）
});
```

### 十一、优势总结

在 Nuxt 4 中使用这个埋点方案的优势：

1. ✅ **完全类型安全**：TypeScript 全链路类型支持
2. ✅ **自动路由追踪**：利用 Nuxt 的页面钩子自动追踪页面访问
3. ✅ **SSR 兼容**：使用 `.client.ts` 确保只在客户端运行
4. ✅ **组合式 API**：符合 Vue 3 / Nuxt 3+ 的编码风格
5. ✅ **易于使用**：通过 `useTracking()` 在任何组件中使用
6. ✅ **自定义指令**：`v-track` 指令简化重复代码
7. ✅ **环境配置**：通过 `runtimeConfig` 灵活配置
8. ✅ **自动导入**：Nuxt 自动导入组合式函数
9. ✅ **灵活的点击追踪**：支持多种 `trackClick` 调用方式
10. ✅ **完全兼容 SDK v1.1.0**：与最新 SDK 设计完全匹配

现在您可以直接复制这些代码到您的 Nuxt 4 项目中使用了！

---

## 📚 相关文档

- [埋点 SDK 设计方案](./2-1-埋点SDK设计.md) - SDK 核心实现
- [SDK 更新日志](./2-3-SDK更新日志.md) - 版本更新说明
- [兼容性对比表](./2-4-兼容性对比表.md) - 详细兼容性对比
- [文档总览](./README-埋点文档总览.md) - 快速参考指南

---

**文档版本**：1.1.0
**SDK 兼容版本**：1.1.0+
**兼容性状态**：✅ 完全兼容
