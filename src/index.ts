/**
 * Holink Tracking SDK
 * 用户行为埋点 SDK - 用于追踪用户的注册、订阅、登录等关键行为
 */

// 主 SDK 类
export { TrackingSDK } from './sdk'

// 事件队列管理器
export { EventQueue } from './EventQueue'

// 本地存储管理器
export { StorageManager } from './StorageManager'

// 枚举类型
export { EventType } from './types'

// 导出所有类型定义
export type {
  TrackingConfig,
  TrackingEventPayload,
  TrackingResponse,
  BaseEvent,
  RegisterEvent,
  SubscribeEvent,
  LoginEvent,
  VisitEvent,
  ClickEvent,
} from './types'
