/**
 * Holink Tracking SDK 主类
 */

import type { TrackingConfig, TrackingEventPayload } from './types'
import { EventType } from './types'

export class TrackingSDK {
  private config: Required<TrackingConfig>
  private eventQueue: TrackingEventPayload[] = []
  private uid?: string

  constructor(config: TrackingConfig) {
    // 默认配置
    this.config = {
      apiEndpoint: config.apiEndpoint,
      linkId: config.linkId || '',
      batchSize: config.batchSize || 10,
      batchInterval: config.batchInterval || 5000,
      enableStorage: config.enableStorage ?? true,
      storageAdapter: config.storageAdapter || this.getDefaultStorage(),
      autoPageView: config.autoPageView ?? true,
      autoClick: config.autoClick ?? false,
      debug: config.debug ?? false,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
    }

    this.log('SDK 初始化完成', this.config)
  }

  /**
   * 设置用户 UID
   */
  setUID(uid: string): void {
    this.uid = uid
    this.log('设置 UID:', uid)
  }

  /**
   * 记录事件
   */
  track(eventType: EventType | string, customData?: Record<string, unknown>): void {
    const event: TrackingEventPayload = {
      eventType,
      x_uid: this.uid,
      x_link_id: this.config.linkId,
      timestamp: Date.now(),
      requestUri: this.getRequestUri(),
      referer: this.getReferer(),
      userAgent: this.getUserAgent(),
      customData: customData ? JSON.stringify(customData) : undefined,
    }

    this.log('记录事件:', event)
    this.eventQueue.push(event)
  }

  /**
   * 获取默认存储适配器
   */
  private getDefaultStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      return {
        getItem: (key: string) => localStorage.getItem(key),
        setItem: (key: string, value: string) => localStorage.setItem(key, value),
        removeItem: (key: string) => localStorage.removeItem(key),
        clear: () => localStorage.clear(),
      }
    }

    // 内存存储（fallback）
    const memoryStorage = new Map<string, string>()
    return {
      getItem: (key: string) => memoryStorage.get(key) || null,
      setItem: (key: string, value: string) => memoryStorage.set(key, value),
      removeItem: (key: string) => memoryStorage.delete(key),
      clear: () => memoryStorage.clear(),
    }
  }

  /**
   * 获取当前请求 URI
   */
  private getRequestUri(): string {
    if (typeof window !== 'undefined') {
      return window.location.pathname + window.location.search
    }
    return ''
  }

  /**
   * 获取 Referer
   */
  private getReferer(): string {
    if (typeof document !== 'undefined') {
      return document.referrer
    }
    return ''
  }

  /**
   * 获取 User-Agent
   */
  private getUserAgent(): string {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent
    }
    return ''
  }

  /**
   * 日志输出
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.info('[Holink Tracking]', ...args)
    }
  }
}

