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
  eventType: string

  /** 用户 UID（业务系统的用户 ID）- 注意字段名是 x_uid */
  x_uid?: string

  /** 链接 ID（可选，用于关联具体业务）- 注意字段名是 x_link_id */
  x_link_id?: string

  /** 事件时间戳（Unix 时间戳，精确到毫秒） */
  timestamp: number

  /** 请求 URI（页面路径 + 查询参数） */
  requestUri: string

  /** Referer（来源页面 URL） */
  referer: string

  /** User-Agent（浏览器标识） */
  userAgent: string

  /** 自定义数据（可选，JSON 字符串） */
  customData?: string
}

/**
 * 批量事件上报格式
 */
export interface BatchEventPayload {
  /** 事件列表 */
  events: TrackingEventPayload[]
}

/**
 * SDK 配置选项
 */
export interface TrackingConfig {
  /** API 端点 URL */
  apiEndpoint: string

  /** 默认链接 ID */
  linkId?: string

  /** 批量上报阈值（事件数量） */
  batchSize?: number

  /** 批量上报时间间隔（毫秒） */
  batchInterval?: number

  /** 是否启用离线存储 */
  enableStorage?: boolean

  /** 存储适配器 */
  storageAdapter?: StorageAdapter

  /** 是否自动采集页面访问 */
  autoPageView?: boolean

  /** 是否自动采集点击事件 */
  autoClick?: boolean

  /** 是否启用调试模式 */
  debug?: boolean

  /** 最大重试次数 */
  maxRetries?: number

  /** 重试延迟（毫秒） */
  retryDelay?: number
}

/**
 * 存储适配器接口
 */
export interface StorageAdapter {
  /** 获取数据 */
  getItem(key: string): Promise<string | null> | string | null

  /** 设置数据 */
  setItem(key: string, value: string): Promise<void> | void

  /** 删除数据 */
  removeItem(key: string): Promise<void> | void

  /** 清空数据 */
  clear(): Promise<void> | void
}

