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
 * 发送给后端的事件数据格式（扁平化结构，用于 URL 参数）
 * 注意：必须与后端 UserEventMongo 接口匹配
 */
export interface TrackingEventPayload {
  /** 事件类型 */
  eventType: string

  /** 站点域名（用于多站点统计，例如：holink.com, holink.me） */
  siteDomain?: string

  /** 用户 UID（业务系统的用户 ID）- 注意字段名是 x_uid */
  x_uid?: string

  /** 链接 ID（可选，用于关联具体业务）- 注意字段名是 x_link_id */
  x_link_id?: string

  /** 事件时间戳（Unix 时间戳，精确到毫秒） */
  timestamp: number

  /** 请求 URI（页面路径 + 查询参数） */
  uri: string

  /** 请求来源（Referer）- 注意是单个 r */
  referer?: string

  /** 原始 User-Agent 字符串 */
  userAgent: string

  /** 会话 ID */
  sessionId: string

  // ========== 扁平化的事件特定字段 ==========
  
  /** 注册来源（register 事件） */
  source?: string

  /** 订阅计划（subscribe 事件） */
  plan?: string

  /** 订阅时长/月（subscribe 事件） */
  duration?: number

  /** 订阅金额（subscribe 事件） */
  amount?: number

  /** 登录方式（login 事件） */
  loginMethod?: string

  /** 页面路径（visit 事件） */
  path?: string

  /** 页面标题（visit 事件） */
  title?: string

  /** 元素 ID（click 事件） */
  elementId?: string

  /** 元素文本（click 事件） */
  elementText?: string

  /** 元素类型（click 事件，例如：button, a, div） */
  elementType?: string

  /** 页面 URL（客户端信息） */
  url?: string

  /** 屏幕分辨率（客户端信息） */
  screenResolution?: string

  /** 视口大小（客户端信息） */
  viewport?: string

  /** 浏览器语言（客户端信息） */
  language?: string

  /** 时区（客户端信息） */
  timezone?: string

  /** 平台（客户端信息） */
  platform?: string

  // 自定义事件的额外字段（可以动态添加）
  [key: string]: any
}

/**
 * 基础事件接口（用于业务代码调用）
 */
export interface BaseEvent {
  /** 事件类型 */
  eventType: EventType | string

  /** 用户 UID（业务系统的用户 ID） */
  uid?: string

  /** 链接 ID（业务标识） */
  linkId?: string

  /** 事件附加数据 */
  eventData?: Record<string, any>
}

/** 注册事件 */
export interface RegisterEvent extends BaseEvent {
  eventType: EventType.REGISTER
  /** 注册来源 */
  source?: string
}

/** 订阅事件 */
export interface SubscribeEvent extends BaseEvent {
  eventType: EventType.SUBSCRIBE
  /** 订阅计划 */
  plan?: string
  /** 订阅时长（月） */
  duration?: number
  /** 订阅金额 */
  amount?: number
}

/** 登录事件 */
export interface LoginEvent extends BaseEvent {
  eventType: EventType.LOGIN
  /** 登录方式 */
  loginMethod?: 'email' | 'phone' | 'social' | 'sso'
}

/** 页面访问事件 */
export interface VisitEvent extends BaseEvent {
  eventType: EventType.VISIT
  /** 页面路径 */
  path?: string
  /** 页面标题 */
  title?: string
}

/** 点击事件 */
export interface ClickEvent extends BaseEvent {
  eventType: EventType.CLICK
  /** 元素 ID */
  elementId?: string
  /** 元素文本 */
  elementText?: string
  /** 元素类型（例如：button, a, div） */
  elementType?: string
}

/** SDK 配置 */
export interface TrackingConfig {
  /** API 端点（例如：https://your-api.com） */
  apiEndpoint: string

  /** 站点域名（用于多站点统计，例如：'holink.com'）
   * 如果不设置，SDK 会自动使用 window.location.hostname */
  siteDomain?: string

  /** 是否启用调试模式 */
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

/** 事件上报响应 */
export interface TrackingResponse {
  success: boolean
  message?: string
  code?: number
}
