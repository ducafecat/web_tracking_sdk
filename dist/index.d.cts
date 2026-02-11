/**
 * 埋点 SDK 类型定义
 * 注意：字段命名与后端 MongoDB Schema 保持一致
 */
/** 事件类型枚举 */
declare enum EventType {
    /** 用户注册 */
    REGISTER = "register",
    /** 用户订阅 */
    SUBSCRIBE = "subscribe",
    /** 用户登录 */
    LOGIN = "login",
    /** 用户登出 */
    LOGOUT = "logout",
    /** 页面访问 */
    VISIT = "visit",
    /** 点击事件 */
    CLICK = "click",
    /** 自定义事件 */
    CUSTOM = "custom"
}
/**
 * 发送给后端的事件数据格式（扁平化结构，用于 URL 参数）
 * 注意：必须与后端 UserEventMongo 接口匹配
 */
interface TrackingEventPayload {
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
    /** 注册来源（register 事件） */
    source?: string;
    /** 订阅计划（subscribe 事件） */
    plan?: string;
    /** 订阅时长/月（subscribe 事件） */
    duration?: number;
    /** 订阅金额（subscribe 事件） */
    amount?: number;
    /** 登录方式（login 事件） */
    loginMethod?: string;
    /** 页面路径（visit 事件） */
    path?: string;
    /** 页面标题（visit 事件） */
    title?: string;
    /** 元素 ID（click 事件） */
    elementId?: string;
    /** 元素文本（click 事件） */
    elementText?: string;
    /** 元素类型（click 事件，例如：button, a, div） */
    elementType?: string;
    /** 页面 URL（客户端信息） */
    url?: string;
    /** 屏幕分辨率（客户端信息） */
    screenResolution?: string;
    /** 视口大小（客户端信息） */
    viewport?: string;
    /** 浏览器语言（客户端信息） */
    language?: string;
    /** 时区（客户端信息） */
    timezone?: string;
    /** 平台（客户端信息） */
    platform?: string;
    [key: string]: any;
}
/**
 * 基础事件接口（用于业务代码调用）
 */
interface BaseEvent {
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
interface RegisterEvent extends BaseEvent {
    eventType: EventType.REGISTER;
    /** 注册来源 */
    source?: string;
}
/** 订阅事件 */
interface SubscribeEvent extends BaseEvent {
    eventType: EventType.SUBSCRIBE;
    /** 订阅计划 */
    plan?: string;
    /** 订阅时长（月） */
    duration?: number;
    /** 订阅金额 */
    amount?: number;
}
/** 登录事件 */
interface LoginEvent extends BaseEvent {
    eventType: EventType.LOGIN;
    /** 登录方式 */
    loginMethod?: 'email' | 'phone' | 'social' | 'sso';
}
/** 页面访问事件 */
interface VisitEvent extends BaseEvent {
    eventType: EventType.VISIT;
    /** 页面路径 */
    path?: string;
    /** 页面标题 */
    title?: string;
}
/** 点击事件 */
interface ClickEvent extends BaseEvent {
    eventType: EventType.CLICK;
    /** 元素 ID */
    elementId?: string;
    /** 元素文本 */
    elementText?: string;
    /** 元素类型（例如：button, a, div） */
    elementType?: string;
}
/** SDK 配置 */
interface TrackingConfig {
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
interface TrackingResponse {
    success: boolean;
    message?: string;
    code?: number;
}

/**
 * 用户行为埋点 SDK
 * 用于追踪用户的注册、订阅、登录等关键行为
 *
 * 核心特点：
 * 1. 数据格式与后端 API 完全匹配（扁平化结构）
 * 2. 客户端只采集基础信息，服务端负责扩展字段
 * 3. 支持批量上报、离线重试、本地存储
 */

declare class TrackingSDK {
    private config;
    private eventQueue;
    private storage;
    private currentUserId;
    private sessionId;
    private isInitialized;
    constructor(config: TrackingConfig);
    /**
     * 初始化 SDK
     */
    init(): void;
    /**
     * 设置用户 ID
     */
    setUserId(userId: string): void;
    /**
     * 清除用户 ID（登出时调用）
     */
    clearUserId(): void;
    /**
     * 追踪注册事件
     */
    trackRegister(data?: Partial<RegisterEvent>): void;
    /**
     * 追踪订阅事件
     */
    trackSubscribe(data: Partial<SubscribeEvent>): void;
    /**
     * 追踪登录事件
     */
    trackLogin(data?: Partial<LoginEvent>): void;
    /**
     * 追踪登出事件
     */
    trackLogout(): void;
    /**
     * 追踪页面访问事件
     */
    trackVisit(path?: string, title?: string, data_id?: string): void;
    /**
     * 追踪页面访问事件（trackVisit 的别名，兼容 Nuxt 集成）
     */
    trackPageView(path?: string, title?: string, data_id?: string): void;
    /**
     * 追踪点击事件
     */
    trackClick(data: Partial<ClickEvent> | string): void;
    /**
     * 追踪自定义事件
     */
    trackCustom(eventName: string, data?: Record<string, unknown>): void;
    /**
     * 通用追踪方法（核心方法）
     */
    private track;
    /**
     * 转换为后端 API 格式（扁平化结构）
     * 关键方法：将业务事件转换为后端期望的扁平化数据结构，用于 URL 参数
     */
    private transformToPayload;
    /**
     * 批量发送事件（使用 GET + URL 参数，逐个发送）
     */
    private sendBatch;
    /**
     * 发送单个事件（用于重要事件的即时上报）
     */
    sendImmediately(event: BaseEvent): Promise<void>;
    /**
     * 获取事件对应的 API 端点
     */
    private getEventEndpoint;
    /**
     * 发送 HTTP 请求
     */
    private sendRequest;
    /**
     * 手动刷新队列（立即发送所有待发送事件）
     */
    flush(): void;
    /**
     * 销毁 SDK
     */
    destroy(): void;
    /**
     * 设置点击事件监听器
     */
    private setupClickListener;
    /**
     * 设置页面访问监听器（SPA 路由变化）
     */
    private setupPageViewListener;
    /**
     * 设置页面关闭监听器（确保事件发送完成）
     */
    private setupBeforeUnloadListener;
    /**
     * 生成会话 ID
     */
    private generateSessionId;
    /**
     * 延迟函数
     */
    private delay;
    /**
     * 日志输出
     */
    private log;
    /**
     * 错误日志
     */
    private error;
}

/**
 * 事件队列管理器
 * 负责批量上报和队列管理
 */

interface EventQueueConfig {
    batchSize: number;
    batchInterval: number;
    onFlush: (events: TrackingEventPayload[]) => Promise<void>;
}
declare class EventQueue {
    private queue;
    private config;
    private flushTimer;
    constructor(config: EventQueueConfig);
    /**
     * 添加事件到队列
     */
    push(event: TrackingEventPayload): void;
    /**
     * 刷新队列（发送所有事件）
     */
    flush(): void;
    /**
     * 获取所有队列中的事件
     */
    getAll(): TrackingEventPayload[];
    /**
     * 清空队列
     */
    clear(): void;
    /**
     * 销毁队列
     */
    destroy(): void;
    /**
     * 启动定时刷新
     */
    private startFlushTimer;
    /**
     * 重置定时器
     */
    private resetFlushTimer;
    /**
     * 停止定时器
     */
    private stopFlushTimer;
}

/**
 * 本地存储管理器
 * 用于持久化用户 ID 和待发送事件
 */

declare class StorageManager {
    private prefix;
    constructor(prefix?: string);
    /**
     * 保存用户 ID
     */
    setUserId(userId: string): void;
    /**
     * 获取用户 ID
     */
    getUserId(): string | null;
    /**
     * 清除用户 ID
     */
    clearUserId(): void;
    /**
     * 保存待发送事件
     */
    savePendingEvents(events: TrackingEventPayload[]): void;
    /**
     * 获取待发送事件
     */
    getPendingEvents(): TrackingEventPayload[];
    /**
     * 清除待发送事件
     */
    clearPendingEvents(): void;
    private setItem;
    private getItem;
    private removeItem;
}

export { type BaseEvent, type ClickEvent, EventQueue, EventType, type LoginEvent, type RegisterEvent, StorageManager, type SubscribeEvent, type TrackingConfig, type TrackingEventPayload, type TrackingResponse, TrackingSDK, type VisitEvent };
