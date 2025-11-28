## 📦 客户端 TypeScript 埋点 SDK 设计方案（修订版）

> **✅ 本文档已根据后端 API 要求进行修订，确保数据格式完全匹配**
>
> - ✅ 字段命名与后端 MongoDB Schema 一致（`x_uid`、`x_link_id` 等）
> - ✅ 数据结构扁平化，避免嵌套的 `context` 对象
> - ✅ 客户端只采集基础信息，服务端负责扩展字段（IP、地理位置等）
> - ✅ 支持批量上报、离线重试、本地存储
> - ✅ 新增 `trackPageView()`、`trackClick()` 方法，完全兼容 Nuxt 4 集成
> - ✅ 新增 `autoClick` 配置选项，支持自动采集点击事件

### 一、整体架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    客户端应用                            │
├─────────────────────────────────────────────────────────┤
│  业务代码 → TrackingSDK.track() → 事件收集队列          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                 埋点 SDK (Tracking SDK)                  │
├─────────────────────────────────────────────────────────┤
│  1. 事件收集与队列管理                                   │
│  2. 自动上下文信息采集 (UA, Referer, URI)               │
│  3. 批量上报 & 重试机制                                  │
│  4. 本地存储 (离线数据持久化)                           │
│  5. 用户身份识别 (UID 管理)                             │
│  6. 扁平化数据结构 (与后端 API 匹配)                    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    后端 API 接口                         │
├─────────────────────────────────────────────────────────┤
│  /api/track/register   - 注册事件                       │
│  /api/track/subscribe  - 订阅事件                       │
│  /api/track/login      - 登录事件                       │
│  /api/track/batch      - 批量事件上报 (推荐)            │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              后端服务器 (服务端扩展字段)                 │
├─────────────────────────────────────────────────────────┤
│  1. 提取真实客户端 IP (clientIp)                        │
│  2. 生成用户唯一标识 (userId = hash(IP + UA))           │
│  3. 地理位置查询 (geolocation)                          │
│  4. User-Agent 解析 (userAgentInfo)                     │
│  5. 来源域名提取 (refererDomain)                        │
│  6. 来源类型分析 (refererType)                          │
│  7. 日期生成 (date = YYYY-MM-DD)                        │
│  8. 站点域名识别 (siteDomain，用于多站点统计)          │
│  9. 保存到 MongoDB (user_events 集合)                   │
└─────────────────────────────────────────────────────────┘
```

### 二、核心代码实现

#### 2.1 类型定义 (`types.ts`)

```typescript
/**
 * 埋点 SDK 类型定义
 * 注意：字段命名与后端 MongoDB Schema 保持一致
 */

/** 事件类型枚举 */
export enum EventType {
  /** 用户注册 */
  REGISTER = 'register',
  /** 用户订阅 */
  SUBSCRIBE = 'subscribe',
  /** 用户登录 */
  LOGIN = 'login',
  /** 用户登出 */
  LOGOUT = 'logout',
  /** 页面访问 */
  VISIT = 'visit',
  /** 点击事件 */
  CLICK = 'click',
  /** 自定义事件 */
  CUSTOM = 'custom',
}

/**
 * 发送给后端的事件数据格式
 * 注意：必须与后端 UserEventMongo 接口匹配
 */
export interface TrackingEventPayload {
  /** 事件类型 */
  eventType: string;

  /** 站点域名（用于多站点统计，例如：holink.com, holink.me） */
  siteDomain?: string;

  /** 用户 UID（业务系统的用户 ID）- 注意字段名是 x_uid */
  x_uid?: string;

  /** 链接 ID（可选，用于关联具体业务）- 注意字段名是 x_link_id */
  x_link_id?: string;

  /** 事件时间戳（Unix 时间戳，精确到毫秒） */
  timestamp: number;

  /** 请求 URI（页面路径 + 查询参数） */
  uri: string;

  /** 请求来源（Referer）- 注意是单个 r */
  referer?: string;

  /** 原始 User-Agent 字符串 */
  userAgent: string;

  /** 会话 ID */
  sessionId: string;

  /** 事件附加数据（可选，存储特定事件的额外信息） */
  eventData?: Record<string, any>;
}

/**
 * 基础事件接口（用于业务代码调用）
 */
export interface BaseEvent {
  /** 事件类型 */
  eventType: EventType | string;

  /** 用户 UID（业务系统的用户 ID） */
  uid?: string;

  /** 链接 ID（业务标识） */
  linkId?: string;

  /** 事件附加数据 */
  eventData?: Record<string, any>;
}

/** 注册事件 */
export interface RegisterEvent extends BaseEvent {
  eventType: EventType.REGISTER;
  /** 注册来源 */
  source?: string;
}

/** 订阅事件 */
export interface SubscribeEvent extends BaseEvent {
  eventType: EventType.SUBSCRIBE;
  /** 订阅计划 */
  plan?: string;
  /** 订阅时长（月） */
  duration?: number;
  /** 订阅金额 */
  amount?: number;
}

/** 登录事件 */
export interface LoginEvent extends BaseEvent {
  eventType: EventType.LOGIN;
  /** 登录方式 */
  loginMethod?: 'email' | 'phone' | 'social' | 'sso';
}

/** 页面访问事件 */
export interface VisitEvent extends BaseEvent {
  eventType: EventType.VISIT;
  /** 页面路径 */
  path?: string;
  /** 页面标题 */
  title?: string;
}

/** 点击事件 */
export interface ClickEvent extends BaseEvent {
  eventType: EventType.CLICK;
  /** 元素 ID */
  elementId?: string;
  /** 元素文本 */
  elementText?: string;
}

/** SDK 配置 */
export interface TrackingConfig {
  /** API 端点（例如：https://your-api.com） */
  apiEndpoint: string;

  /** 站点域名（用于多站点统计，例如：'holink.com'）
   * 如果不设置，SDK 会自动使用 window.location.hostname */
  siteDomain?: string;

  /** 是否启用调试模式 */
  debug?: boolean;

  /** 批量上报的事件数量阈值（默认：10） */
  batchSize?: number;

  /** 批量上报的时间间隔（毫秒，默认：5000） */
  batchInterval?: number;

  /** 是否自动采集页面访问事件（默认：true） */
  autoPageView?: boolean;

  /** 是否自动采集点击事件（默认：false） */
  autoClick?: boolean;

  /** 请求超时时间（毫秒，默认：10000） */
  timeout?: number;

  /** 最大重试次数（默认：3） */
  maxRetries?: number;

  /** 是否启用本地存储（默认：true） */
  enableStorage?: boolean;

  /** 存储 key 前缀（默认：holink_track_） */
  storagePrefix?: string;
}

/** 事件上报响应 */
export interface TrackingResponse {
  success: boolean;
  message?: string;
  code?: number;
}
```

#### 2.2 主 SDK 类 (`TrackingSDK.ts`)

```typescript
/**
 * 用户行为埋点 SDK
 * 用于追踪用户的注册、订阅、登录等关键行为
 *
 * 核心特点：
 * 1. 数据格式与后端 API 完全匹配（扁平化结构）
 * 2. 客户端只采集基础信息，服务端负责扩展字段
 * 3. 支持批量上报、离线重试、本地存储
 */

import {
  EventType,
  BaseEvent,
  RegisterEvent,
  SubscribeEvent,
  LoginEvent,
  VisitEvent,
  ClickEvent,
  TrackingConfig,
  TrackingResponse,
  TrackingEventPayload,
} from './types';
import { EventQueue } from './EventQueue';
import { StorageManager } from './StorageManager';

export class TrackingSDK {
  private config: Required<TrackingConfig>;
  private eventQueue: EventQueue;
  private storage: StorageManager;
  private currentUserId: string | null = null;
  private sessionId: string;
  private isInitialized: boolean = false;

  constructor(config: TrackingConfig) {
    // 合并默认配置
    this.config = {
      apiEndpoint: config.apiEndpoint,
      siteDomain:
        config.siteDomain || (typeof window !== 'undefined' ? window.location.hostname : ''),
      debug: config.debug ?? false,
      batchSize: config.batchSize ?? 10,
      batchInterval: config.batchInterval ?? 5000,
      autoPageView: config.autoPageView ?? true,
      autoClick: config.autoClick ?? false,
      timeout: config.timeout ?? 10000,
      maxRetries: config.maxRetries ?? 3,
      enableStorage: config.enableStorage ?? true,
      storagePrefix: config.storagePrefix ?? 'holink_track_',
    };

    // 初始化各个模块
    this.storage = new StorageManager(this.config.storagePrefix);
    this.eventQueue = new EventQueue({
      batchSize: this.config.batchSize,
      batchInterval: this.config.batchInterval,
      onFlush: this.sendBatch.bind(this),
    });

    // 生成会话 ID
    this.sessionId = this.generateSessionId();

    this.log('TrackingSDK 已创建', this.config);
  }

  /**
   * 初始化 SDK
   */
  public async init(): Promise<void> {
    if (this.isInitialized) {
      this.log('SDK 已初始化');
      return;
    }

    // 恢复用户 ID
    this.currentUserId = this.storage.getUserId();

    // 恢复未发送的事件
    if (this.config.enableStorage) {
      const pendingEvents = this.storage.getPendingEvents();
      if (pendingEvents.length > 0) {
        this.log(`恢复 ${pendingEvents.length} 个待发送事件`);
        pendingEvents.forEach(event => this.eventQueue.push(event));
      }
    }

    // 自动采集页面访问
    if (this.config.autoPageView) {
      this.trackVisit();
      this.setupPageViewListener();
    }

    // 自动采集点击事件
    if (this.config.autoClick) {
      this.setupClickListener();
    }

    // 监听页面关闭事件
    this.setupBeforeUnloadListener();

    this.isInitialized = true;
    this.log('SDK 初始化完成');
  }

  /**
   * 设置用户 ID
   */
  public setUserId(userId: string): void {
    this.currentUserId = userId;
    this.storage.setUserId(userId);
    this.log('用户 ID 已设置:', userId);
  }

  /**
   * 清除用户 ID（登出时调用）
   */
  public clearUserId(): void {
    this.currentUserId = null;
    this.storage.clearUserId();
    this.log('用户 ID 已清除');
  }

  /**
   * 追踪注册事件
   */
  public trackRegister(data: Partial<RegisterEvent> = {}): void {
    const event: BaseEvent = {
      eventType: EventType.REGISTER,
      uid: data.uid || this.currentUserId || undefined,
      linkId: data.linkId || 'register',
      eventData: {
        source: data.source,
        ...data.eventData,
      },
    };

    this.track(event);
  }

  /**
   * 追踪订阅事件
   */
  public trackSubscribe(data: Partial<SubscribeEvent>): void {
    const event: BaseEvent = {
      eventType: EventType.SUBSCRIBE,
      uid: data.uid || this.currentUserId || undefined,
      linkId: data.linkId || 'subscribe',
      eventData: {
        plan: data.plan,
        duration: data.duration,
        amount: data.amount,
        ...data.eventData,
      },
    };

    this.track(event);
  }

  /**
   * 追踪登录事件
   */
  public trackLogin(data: Partial<LoginEvent> = {}): void {
    const event: BaseEvent = {
      eventType: EventType.LOGIN,
      uid: data.uid || this.currentUserId || undefined,
      linkId: data.linkId || 'login',
      eventData: {
        loginMethod: data.loginMethod,
        ...data.eventData,
      },
    };

    this.track(event);
  }

  /**
   * 追踪登出事件
   */
  public trackLogout(): void {
    const event: BaseEvent = {
      eventType: EventType.LOGOUT,
      uid: this.currentUserId || undefined,
      linkId: 'logout',
    };

    this.track(event);
    this.clearUserId();
  }

  /**
   * 追踪页面访问事件
   */
  public trackVisit(path?: string, title?: string): void {
    const event: BaseEvent = {
      eventType: EventType.VISIT,
      uid: this.currentUserId || undefined,
      linkId: 'page_view',
      eventData: {
        path: path || window.location.pathname,
        title: title || document.title,
      },
    };

    this.track(event);
  }

  /**
   * 追踪页面访问事件（trackVisit 的别名，兼容 Nuxt 集成）
   */
  public trackPageView(path?: string, title?: string): void {
    this.trackVisit(path, title);
  }

  /**
   * 追踪点击事件
   */
  public trackClick(data: Partial<ClickEvent> | string): void {
    let event: BaseEvent;

    if (typeof data === 'string') {
      // 简单用法：只传递元素 ID
      event = {
        eventType: EventType.CLICK,
        uid: this.currentUserId || undefined,
        linkId: 'click_event',
        eventData: {
          elementId: data,
        },
      };
    } else {
      // 完整用法：传递对象
      event = {
        eventType: EventType.CLICK,
        uid: data.uid || this.currentUserId || undefined,
        linkId: data.linkId || 'click_event',
        eventData: {
          elementId: data.elementId,
          elementText: data.elementText,
          ...data.eventData,
        },
      };
    }

    this.track(event);
  }

  /**
   * 追踪自定义事件
   */
  public trackCustom(eventName: string, data: Record<string, any> = {}): void {
    const event: BaseEvent = {
      eventType: eventName,
      uid: this.currentUserId || undefined,
      linkId: data.linkId || 'custom',
      eventData: data,
    };

    this.track(event);
  }

  /**
   * 通用追踪方法（核心方法）
   */
  private track(event: BaseEvent): void {
    // 转换为后端 API 格式（扁平化结构）
    const payload = this.transformToPayload(event);

    // 添加到队列
    this.eventQueue.push(payload);

    // 保存到本地存储（用于离线重试）
    if (this.config.enableStorage) {
      this.storage.savePendingEvents(this.eventQueue.getAll());
    }

    this.log('事件已追踪:', payload);
  }

  /**
   * 转换为后端 API 格式
   * 关键方法：将业务事件转换为后端期望的扁平化数据结构
   */
  private transformToPayload(event: BaseEvent): TrackingEventPayload {
    return {
      // 事件类型
      eventType: event.eventType,

      // 站点域名（用于多站点统计）
      siteDomain: this.config.siteDomain,

      // 用户标识（注意字段名是 x_uid）
      x_uid: event.uid,

      // 链接 ID（注意字段名是 x_link_id）
      x_link_id: event.linkId,

      // 时间戳
      timestamp: Date.now(),

      // 请求 URI（页面路径 + 查询参数）
      uri: window.location.pathname + window.location.search,

      // 请求来源（Referer，注意是单个 r）
      referer: document.referrer || undefined,

      // User-Agent
      userAgent: navigator.userAgent,

      // 会话 ID
      sessionId: this.sessionId,

      // 事件附加数据（可以包含额外的上下文信息）
      eventData: {
        ...event.eventData,
        // 可选：添加额外的客户端信息
        _clientInfo: {
          url: window.location.href,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          platform: navigator.platform,
        },
      },
    };
  }

  /**
   * 批量发送事件
   */
  private async sendBatch(events: TrackingEventPayload[]): Promise<void> {
    if (events.length === 0) return;

    const endpoint = `${this.config.apiEndpoint}/api/track/batch`;

    try {
      const response = await this.sendRequest(endpoint, { events });

      if (response.success) {
        this.log(`成功上报 ${events.length} 个事件`);

        // 清除已发送的事件
        if (this.config.enableStorage) {
          this.storage.clearPendingEvents();
        }
      } else {
        throw new Error(response.message || '上报失败');
      }
    } catch (error) {
      this.error('批量上报失败:', error);

      // 保存到本地存储等待重试
      if (this.config.enableStorage) {
        this.storage.savePendingEvents(events);
      }
    }
  }

  /**
   * 发送单个事件（用于重要事件的即时上报）
   */
  public async sendImmediately(event: BaseEvent): Promise<void> {
    const payload = this.transformToPayload(event);
    const endpoint = this.getEventEndpoint(event.eventType);

    try {
      await this.sendRequest(endpoint, payload);
      this.log('事件即时上报成功:', payload);
    } catch (error) {
      this.error('事件即时上报失败:', error);
      throw error;
    }
  }

  /**
   * 获取事件对应的 API 端点
   */
  private getEventEndpoint(eventType: string): string {
    const baseUrl = this.config.apiEndpoint;

    switch (eventType) {
      case EventType.REGISTER:
        return `${baseUrl}/api/track/register`;
      case EventType.SUBSCRIBE:
        return `${baseUrl}/api/track/subscribe`;
      case EventType.LOGIN:
        return `${baseUrl}/api/track/login`;
      default:
        return `${baseUrl}/api/track/batch`;
    }
  }

  /**
   * 发送 HTTP 请求
   */
  private async sendRequest(
    url: string,
    data: any,
    retries: number = 0,
  ): Promise<TrackingResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, ...result };
    } catch (error: any) {
      if (retries < this.config.maxRetries) {
        this.log(`请求失败，重试 ${retries + 1}/${this.config.maxRetries}`);
        await this.delay(1000 * Math.pow(2, retries)); // 指数退避
        return this.sendRequest(url, data, retries + 1);
      }

      throw error;
    }
  }

  /**
   * 手动刷新队列（立即发送所有待发送事件）
   */
  public flush(): void {
    this.eventQueue.flush();
  }

  /**
   * 销毁 SDK
   */
  public destroy(): void {
    this.flush();
    this.eventQueue.destroy();
    this.isInitialized = false;
    this.log('SDK 已销毁');
  }

  // ========== 自动采集相关方法 ==========

  /**
   * 设置点击事件监听器
   */
  private setupClickListener(): void {
    document.addEventListener(
      'click',
      (e: MouseEvent) => {
        const target = e.target as HTMLElement;

        // 获取元素信息
        const elementId = target.id || target.getAttribute('data-track-id') || '';
        const elementText = target.textContent?.trim() || '';
        const elementTag = target.tagName.toLowerCase();

        // 只追踪特定元素或带有 data-track 属性的元素
        const shouldTrack =
          target.hasAttribute('data-track') ||
          elementTag === 'button' ||
          elementTag === 'a' ||
          target.classList.contains('trackable');

        if (shouldTrack) {
          this.trackClick({
            elementId,
            elementText: elementText.substring(0, 50), // 限制长度
            eventData: {
              elementTag,
              elementClass: target.className,
              href: (target as HTMLAnchorElement).href || undefined,
            },
          });
        }
      },
      true,
    );
  }

  /**
   * 设置页面访问监听器（SPA 路由变化）
   */
  private setupPageViewListener(): void {
    // 监听 History API
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.trackVisit();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.trackVisit();
    };

    // 监听 popstate（浏览器前进后退）
    window.addEventListener('popstate', () => {
      this.trackVisit();
    });

    // 监听 hashchange（hash 路由）
    window.addEventListener('hashchange', () => {
      this.trackVisit();
    });
  }

  /**
   * 设置页面关闭监听器（确保事件发送完成）
   */
  private setupBeforeUnloadListener(): void {
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // 使用 visibilitychange 处理移动端场景
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }

  // ========== 工具方法 ==========

  /**
   * 生成会话 ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 日志输出
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[TrackingSDK]', ...args);
    }
  }

  /**
   * 错误日志
   */
  private error(...args: any[]): void {
    if (this.config.debug) {
      console.error('[TrackingSDK]', ...args);
    }
  }
}
```

#### 2.3 事件队列管理 (`EventQueue.ts`)

```typescript
/**
 * 事件队列管理器
 * 负责批量上报和队列管理
 */

import { TrackingEventPayload } from './types';

interface EventQueueConfig {
  batchSize: number;
  batchInterval: number;
  onFlush: (events: TrackingEventPayload[]) => Promise<void>;
}

export class EventQueue {
  private queue: TrackingEventPayload[] = [];
  private config: EventQueueConfig;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: EventQueueConfig) {
    this.config = config;
    this.startFlushTimer();
  }

  /**
   * 添加事件到队列
   */
  public push(event: TrackingEventPayload): void {
    this.queue.push(event);

    // 如果达到批量阈值，立即刷新
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * 刷新队列（发送所有事件）
   */
  public flush(): void {
    if (this.queue.length === 0) return;

    const eventsToSend = [...this.queue];
    this.queue = [];

    // 重置定时器
    this.resetFlushTimer();

    // 调用回调函数发送事件
    this.config.onFlush(eventsToSend).catch(error => {
      console.error('[EventQueue] 刷新失败:', error);
      // 发送失败，重新加入队列
      this.queue.unshift(...eventsToSend);
    });
  }

  /**
   * 获取所有队列中的事件
   */
  public getAll(): TrackingEventPayload[] {
    return [...this.queue];
  }

  /**
   * 清空队列
   */
  public clear(): void {
    this.queue = [];
  }

  /**
   * 销毁队列
   */
  public destroy(): void {
    this.flush();
    this.stopFlushTimer();
  }

  /**
   * 启动定时刷新
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.batchInterval);
  }

  /**
   * 重置定时器
   */
  private resetFlushTimer(): void {
    this.stopFlushTimer();
    this.startFlushTimer();
  }

  /**
   * 停止定时器
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}
```

#### 2.4 本地存储管理 (`StorageManager.ts`)

```typescript
/**
 * 本地存储管理器
 * 用于持久化用户 ID 和待发送事件
 */

import { TrackingEventPayload } from './types';

export class StorageManager {
  private prefix: string;

  constructor(prefix: string = 'holink_track_') {
    this.prefix = prefix;
  }

  /**
   * 保存用户 ID
   */
  public setUserId(userId: string): void {
    this.setItem('user_id', userId);
  }

  /**
   * 获取用户 ID
   */
  public getUserId(): string | null {
    return this.getItem('user_id');
  }

  /**
   * 清除用户 ID
   */
  public clearUserId(): void {
    this.removeItem('user_id');
  }

  /**
   * 保存待发送事件
   */
  public savePendingEvents(events: TrackingEventPayload[]): void {
    this.setItem('pending_events', JSON.stringify(events));
  }

  /**
   * 获取待发送事件
   */
  public getPendingEvents(): TrackingEventPayload[] {
    const data = this.getItem('pending_events');
    if (!data) return [];

    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  /**
   * 清除待发送事件
   */
  public clearPendingEvents(): void {
    this.removeItem('pending_events');
  }

  // ========== 底层存储方法 ==========

  private setItem(key: string, value: string): void {
    try {
      localStorage.setItem(this.prefix + key, value);
    } catch (error) {
      console.error('[StorageManager] 存储失败:', error);
    }
  }

  private getItem(key: string): string | null {
    try {
      return localStorage.getItem(this.prefix + key);
    } catch (error) {
      console.error('[StorageManager] 读取失败:', error);
      return null;
    }
  }

  private removeItem(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('[StorageManager] 删除失败:', error);
    }
  }
}
```

### 三、使用示例

#### 3.1 初始化 SDK

```typescript
// main.ts
import { TrackingSDK } from './tracking-sdk';

// 创建 SDK 实例
const tracker = new TrackingSDK({
  apiEndpoint: 'https://your-api.com',
  siteDomain: 'holink.com', // 指定站点域名（可选，默认自动获取）
  debug: process.env.NODE_ENV === 'development',
  batchSize: 10,
  batchInterval: 5000,
  autoPageView: true,
  autoClick: false, // 是否自动采集点击事件（建议手动调用）
  enableStorage: true,
});

// 初始化
await tracker.init();

// 导出供全局使用
export { tracker };
```

#### 3.2 用户注册埋点

```typescript
// 用户注册成功后
async function handleRegister(userId: string) {
  // 设置用户 ID
  tracker.setUserId(userId);

  // 追踪注册事件
  tracker.trackRegister({
    uid: userId,
    linkId: 'register_form',
    source: 'email',
    eventData: {
      utm_source: 'google',
      utm_campaign: 'summer_promo',
    },
  });
}
```

**发送到后端的数据格式**：

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
    "utm_source": "google",
    "utm_campaign": "summer_promo",
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

#### 3.3 用户订阅埋点

```typescript
// 用户订阅成功后
async function handleSubscribe(plan: string, duration: number, amount: number) {
  tracker.trackSubscribe({
    plan,
    duration,
    amount,
    linkId: 'subscribe_page',
    eventData: {
      payment_method: 'credit_card',
      currency: 'USD',
    },
  });
}
```

**发送到后端的数据格式**：

```json
{
  "eventType": "subscribe",
  "siteDomain": "holink.com",
  "x_uid": "user_123",
  "x_link_id": "subscribe_page",
  "timestamp": 1700000000000,
  "uri": "/subscribe",
  "referer": "https://your-site.com/pricing",
  "userAgent": "Mozilla/5.0...",
  "sessionId": "1700000000000-abc123",
  "eventData": {
    "plan": "premium",
    "duration": 12,
    "amount": 99.99,
    "payment_method": "credit_card",
    "currency": "USD",
    "_clientInfo": { ... }
  }
}
```

#### 3.4 用户登录埋点

```typescript
// 用户登录成功后
async function handleLogin(userId: string, method: 'email' | 'phone') {
  tracker.setUserId(userId);

  tracker.trackLogin({
    uid: userId,
    loginMethod: method,
    linkId: 'login_form',
  });
}
```

#### 3.5 用户登出埋点

```typescript
// 用户登出时
async function handleLogout() {
  tracker.trackLogout();
}
```

#### 3.6 点击事件埋点

```typescript
// 方式1：简单用法（只传递元素 ID）
tracker.trackClick('subscribe_button');

// 方式2：完整用法（传递详细信息）
tracker.trackClick({
  elementId: 'buy_now_button',
  elementText: '立即购买',
  linkId: 'pricing_page',
  eventData: {
    productId: 'prod_123',
    price: 99.99,
  },
});

// 方式3：在 HTML 中使用 data-track 属性（配合 autoClick: true）
// <button data-track data-track-id="submit_button">提交</button>
// SDK 会自动采集带有 data-track 属性的元素点击
```

#### 3.7 页面访问埋点（两种方式）

```typescript
// 方式1：使用 trackVisit()
tracker.trackVisit('/dashboard', '用户控制台');

// 方式2：使用 trackPageView()（Nuxt 集成推荐）
tracker.trackPageView('/dashboard', '用户控制台');

// 两个方法功能完全相同，trackPageView 是 trackVisit 的别名
```

#### 3.8 自定义事件埋点

```typescript
// 追踪自定义业务事件
tracker.trackCustom('video_play', {
  videoId: 'abc123',
  duration: 120,
  quality: '1080p',
});

tracker.trackCustom('share_link', {
  linkId: 'link_abc123',
  platform: 'twitter',
});
```

### 四、后端 API 接口实现示例

#### 4.1 批量事件接收接口（推荐）

```typescript
// POST /api/track/batch

interface BatchRequest {
  events: TrackingEventPayload[];
}

async function handleBatchTracking(req: Request, res: Response) {
  try {
    const { events } = req.body as BatchRequest;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        message: '无效的事件数据',
      });
    }

    // 获取客户端真实 IP
    const clientIp = getClientIp(req);

    // 批量处理事件
    const processedEvents = events.map(event => ({
      // 客户端提供的字段
      eventType: event.eventType,
      siteDomain: event.siteDomain || extractDomainFromRequest(req), // 站点域名（优先使用客户端提供）
      x_uid: event.x_uid,
      x_link_id: event.x_link_id,
      timestamp: event.timestamp,
      uri: event.uri,
      referer: event.referer,
      userAgent: event.userAgent,
      sessionId: event.sessionId,
      eventData: event.eventData,

      // 服务端生成的字段
      date: new Date(event.timestamp).toISOString().split('T')[0],
      clientIp: clientIp,
      userId: generateUserId(clientIp, event.userAgent),
      geolocation: await getGeolocation(clientIp),
      userAgentInfo: parseUserAgent(event.userAgent),
      refererDomain: extractDomain(event.referer),
      refererType: analyzeRefererType(event.referer),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // 批量保存到数据库
    await db.collection('user_events').insertMany(processedEvents);

    res.json({
      success: true,
      message: `成功接收 ${events.length} 个事件`,
    });
  } catch (error) {
    console.error('批量事件处理失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}

/**
 * 获取客户端真实 IP
 */
function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    ''
  );
}

/**
 * 从请求中提取域名（用作站点域名的后备方案）
 */
function extractDomainFromRequest(req: Request): string {
  const host = req.headers.host || '';
  return host.split(':')[0]; // 移除端口号
}

/**
 * 生成用户唯一标识（基于 IP + User-Agent）
 */
function generateUserId(ip: string, userAgent: string): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5');
  hash.update(ip + userAgent);
  return hash.digest('hex');
}

/**
 * 提取域名
 */
function extractDomain(referer?: string): string | undefined {
  if (!referer) return undefined;
  try {
    const url = new URL(referer);
    return url.hostname;
  } catch {
    return undefined;
  }
}

/**
 * 分析来源类型
 */
function analyzeRefererType(
  referer?: string,
): 'direct' | 'search' | 'social' | 'internal' | 'external' {
  if (!referer) return 'direct';

  try {
    const url = new URL(referer);
    const domain = url.hostname.toLowerCase();

    // 搜索引擎
    if (
      domain.includes('google') ||
      domain.includes('baidu') ||
      domain.includes('bing') ||
      domain.includes('yahoo')
    ) {
      return 'search';
    }

    // 社交媒体
    if (
      domain.includes('facebook') ||
      domain.includes('twitter') ||
      domain.includes('instagram') ||
      domain.includes('linkedin')
    ) {
      return 'social';
    }

    return 'external';
  } catch {
    return 'direct';
  }
}
```

#### 4.2 单个事件接收接口

```typescript
// POST /api/track/register
// POST /api/track/subscribe
// POST /api/track/login

async function handleSingleTracking(req: Request, res: Response) {
  try {
    const event = req.body as TrackingEventPayload;
    const clientIp = getClientIp(req);

    const userEvent = {
      // 客户端提供的字段
      ...event,
      siteDomain: event.siteDomain || extractDomainFromRequest(req), // 站点域名（优先使用客户端提供）

      // 服务端生成的字段
      date: new Date(event.timestamp).toISOString().split('T')[0],
      clientIp: clientIp,
      userId: generateUserId(clientIp, event.userAgent),
      geolocation: await getGeolocation(clientIp),
      userAgentInfo: parseUserAgent(event.userAgent),
      refererDomain: extractDomain(event.referer),
      refererType: analyzeRefererType(event.referer),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('user_events').insertOne(userEvent);

    res.json({
      success: true,
      message: '事件接收成功',
    });
  } catch (error) {
    console.error('事件处理失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
}
```

### 五、数据流程示例

#### 5.1 完整的数据流程

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 客户端 SDK 采集                                           │
├─────────────────────────────────────────────────────────────┤
│ {                                                            │
│   eventType: "register",                                     │
│   siteDomain: "holink.com",                                  │
│   x_uid: "user_123",                                         │
│   x_link_id: "register_form",                                │
│   timestamp: 1700000000000,                                  │
│   uri: "/register",                                          │
│   referer: "https://google.com",                             │
│   userAgent: "Mozilla/5.0...",                               │
│   sessionId: "1700000000000-abc123",                         │
│   eventData: { ... }                                         │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP POST
┌─────────────────────────────────────────────────────────────┐
│ 2. 后端服务器扩展字段                                        │
├─────────────────────────────────────────────────────────────┤
│ + date: "2025-11-27"                                         │
│ + clientIp: "192.168.1.1"                                    │
│ + userId: "md5(IP+UA)"                                       │
│ + geolocation: { countryCode: "US", ... }                    │
│ + userAgentInfo: { deviceType: "desktop", ... }              │
│ + refererDomain: "google.com"                                │
│ + refererType: "search"                                      │
│ + createdAt: Date                                            │
│ + updatedAt: Date                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓ MongoDB.insertOne()
┌─────────────────────────────────────────────────────────────┐
│ 3. 保存到 MongoDB (user_events 集合)                        │
├─────────────────────────────────────────────────────────────┤
│ {                                                            │
│   _id: ObjectId("..."),                                      │
│   eventType: "register",                                     │
│   siteDomain: "holink.com",                                  │
│   x_uid: "user_123",                                         │
│   x_link_id: "register_form",                                │
│   timestamp: 1700000000000,                                  │
│   date: "2025-11-27",                                        │
│   clientIp: "192.168.1.1",                                   │
│   userId: "abc123...",                                       │
│   uri: "/register",                                          │
│   referer: "https://google.com",                             │
│   refererDomain: "google.com",                               │
│   refererType: "search",                                     │
│   userAgent: "Mozilla/5.0...",                               │
│   userAgentInfo: { deviceType: "desktop", ... },             │
│   geolocation: { countryCode: "US", ... },                   │
│   sessionId: "1700000000000-abc123",                         │
│   eventData: { ... },                                        │
│   createdAt: Date,                                           │
│   updatedAt: Date                                            │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓ 定时任务
┌─────────────────────────────────────────────────────────────┐
│ 4. 用户活动分析 (13_user_activity_analysis.ts)              │
├─────────────────────────────────────────────────────────────┤
│ - 更新 user_activity_summary (汇总表)                       │
│ - 计算 user_activity_daily (日报表)                         │
│ - 保存 user_activity_detail (明细表)                        │
└─────────────────────────────────────────────────────────────┘
```

### 六、字段对照表

| SDK 字段               | 后端字段        | 来源   | 说明                        |
| ---------------------- | --------------- | ------ | --------------------------- |
| `eventType`            | `eventType`     | 客户端 | 事件类型                    |
| `siteDomain`           | `siteDomain`    | 客户端 | 站点域名（多站点统计）      |
| `uid` → `x_uid`        | `x_uid`         | 客户端 | 用户 UID（业务系统 ID）     |
| `linkId` → `x_link_id` | `x_link_id`     | 客户端 | 链接 ID（业务标识）         |
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

### 七、打包和发布

#### 7.1 项目结构

```
tracking-sdk/
├── src/
│   ├── types.ts              # 类型定义
│   ├── TrackingSDK.ts        # 主 SDK 类
│   ├── EventQueue.ts         # 事件队列管理
│   ├── StorageManager.ts     # 本地存储管理
│   └── index.ts              # 入口文件
├── package.json
├── tsconfig.json
└── README.md
```

#### 7.2 package.json

```json
{
  "name": "@holink/tracking-sdk",
  "version": "1.0.0",
  "description": "Holink 用户行为埋点 SDK",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["tracking", "analytics", "sdk"],
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

#### 7.3 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 7.4 index.ts（入口文件）

```typescript
// src/index.ts
export { TrackingSDK } from './TrackingSDK';
export { EventQueue } from './EventQueue';
export { StorageManager } from './StorageManager';
export * from './types';
```

### 八、核心优势总结

#### 8.1 与后端 API 完美匹配

✅ **字段命名一致**：`x_uid`、`x_link_id`、`referer`（单 r）等
✅ **数据结构扁平化**：避免嵌套的 `context` 对象
✅ **职责划分清晰**：客户端采集基础信息，服务端扩展字段

#### 8.2 技术特性

✅ **类型安全**：完整的 TypeScript 类型定义
✅ **批量上报**：减少网络请求，提升性能
✅ **离线支持**：本地存储保证数据不丢失
✅ **自动采集**：支持页面访问和点击事件自动采集
✅ **重试机制**：失败自动重试，保证数据可靠性
✅ **易于使用**：简洁的 API 设计
✅ **Nuxt 集成**：完美兼容 Nuxt 4，提供 `trackPageView()` 等别名方法
✅ **灵活配置**：支持 `autoClick`、`autoPageView` 等多种配置选项

#### 8.3 数据流程清晰

```
客户端 SDK 采集 → 批量上报 → 后端扩展字段 → 保存 MongoDB → 用户活动分析
```

### 九、后续扩展建议

#### 9.1 性能监控

可以在 `eventData._clientInfo` 中添加性能数据：

```typescript
eventData: {
  _clientInfo: {
    // 页面加载时间
    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
    // DOM 解析时间
    domReadyTime: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
    // 首次内容绘制
    firstContentfulPaint: performance.getEntriesByType('paint')[0]?.startTime,
  }
}
```

#### 9.2 错误监控

可以添加全局错误监听：

```typescript
window.addEventListener('error', event => {
  tracker.trackCustom('error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});
```

#### 9.3 网络信息采集

```typescript
const connection = (navigator as any).connection;
if (connection) {
  eventData._clientInfo.connection = {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
  };
}
```

### 十、与 Nuxt 4 集成的兼容性说明

本 SDK 已完全兼容 Nuxt 4 集成方案（参见 `docs/2-2-nuxt4埋点.md`）：

#### 10.1 新增的兼容性方法

1. **`trackPageView(path?, title?)`** - `trackVisit()` 的别名

   ```typescript
   // 两种方式完全等价
   tracker.trackVisit('/home', '首页');
   tracker.trackPageView('/home', '首页');
   ```

2. **`trackClick(data)`** - 追踪点击事件

   ```typescript
   // 简单用法
   tracker.trackClick('button_id');

   // 完整用法
   tracker.trackClick({
     elementId: 'button_id',
     elementText: '按钮文本',
     linkId: 'page_name',
   });
   ```

#### 10.2 新增的配置选项

- **`autoClick`** - 是否自动采集点击事件（默认：`false`）
  - 当设置为 `true` 时，SDK 会自动采集带有 `data-track` 属性的元素点击
  - 也会自动采集 `<button>`、`<a>` 等常见交互元素的点击

#### 10.3 Nuxt 4 中的使用示例

```typescript
// plugins/tracking.client.ts
const tracker = new TrackingSDK({
  apiEndpoint: config.public.trackingApiEndpoint,
  debug: config.public.trackingDebug === 'true',
  batchSize: 10,
  batchInterval: 5000,
  autoPageView: true, // ✅ 自动采集页面访问
  autoClick: false, // ✅ 点击事件建议手动调用
  enableStorage: true,
});

// 在 Nuxt 页面中使用
const tracking = useTracking();
tracking.trackPageView(); // ✅ 使用 trackPageView 方法
tracking.trackClick('subscribe_button', '立即订阅'); // ✅ 使用 trackClick 方法
```

#### 10.4 完整兼容性清单

| 功能         | SDK 方法                           | Nuxt 4 集成 | 状态                 |
| ------------ | ---------------------------------- | ----------- | -------------------- |
| 注册事件     | `trackRegister()`                  | ✅          | 完全兼容             |
| 订阅事件     | `trackSubscribe()`                 | ✅          | 完全兼容             |
| 登录事件     | `trackLogin()`                     | ✅          | 完全兼容             |
| 登出事件     | `trackLogout()`                    | ✅          | 完全兼容             |
| 页面访问     | `trackVisit()` / `trackPageView()` | ✅          | 完全兼容（新增别名） |
| 点击事件     | `trackClick()`                     | ✅          | 完全兼容（新增方法） |
| 自定义事件   | `trackCustom()`                    | ✅          | 完全兼容             |
| 自动页面追踪 | `autoPageView`                     | ✅          | 完全兼容             |
| 自动点击追踪 | `autoClick`                        | ✅          | 完全兼容（新增配置） |

---

**本文档已完全基于后端 API 要求进行修订，并已添加 Nuxt 4 兼容性支持，可直接用于生产环境开发。**
