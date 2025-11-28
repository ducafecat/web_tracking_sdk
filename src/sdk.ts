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
  ClickEvent,
  TrackingConfig,
  TrackingResponse,
  TrackingEventPayload,
} from './types'
import { EventQueue } from './EventQueue'
import { StorageManager } from './StorageManager'

export class TrackingSDK {
  private config: Required<TrackingConfig>
  private eventQueue: EventQueue
  private storage: StorageManager
  private currentUserId: string | null = null
  private sessionId: string
  private isInitialized: boolean = false

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
    }

    // 初始化各个模块
    this.storage = new StorageManager(this.config.storagePrefix)
    this.eventQueue = new EventQueue({
      batchSize: this.config.batchSize,
      batchInterval: this.config.batchInterval,
      onFlush: this.sendBatch.bind(this),
    })

    // 生成会话 ID
    this.sessionId = this.generateSessionId()

    this.log('TrackingSDK 已创建', this.config)
  }

  /**
   * 初始化 SDK
   */
  public async init(): Promise<void> {
    if (this.isInitialized) {
      this.log('SDK 已初始化')
      return
    }

    // 恢复用户 ID
    this.currentUserId = this.storage.getUserId()

    // 恢复未发送的事件
    if (this.config.enableStorage) {
      const pendingEvents = this.storage.getPendingEvents()
      if (pendingEvents.length > 0) {
        this.log(`恢复 ${pendingEvents.length} 个待发送事件`)
        pendingEvents.forEach((event) => this.eventQueue.push(event))
      }
    }

    // 自动采集页面访问
    if (this.config.autoPageView) {
      this.trackVisit()
      this.setupPageViewListener()
    }

    // 自动采集点击事件
    if (this.config.autoClick) {
      this.setupClickListener()
    }

    // 监听页面关闭事件
    this.setupBeforeUnloadListener()

    this.isInitialized = true
    this.log('SDK 初始化完成')
  }

  /**
   * 设置用户 ID
   */
  public setUserId(userId: string): void {
    this.currentUserId = userId
    this.storage.setUserId(userId)
    this.log('用户 ID 已设置:', userId)
  }

  /**
   * 清除用户 ID（登出时调用）
   */
  public clearUserId(): void {
    this.currentUserId = null
    this.storage.clearUserId()
    this.log('用户 ID 已清除')
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
    }

    this.track(event)
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
    }

    this.track(event)
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
    }

    this.track(event)
  }

  /**
   * 追踪登出事件
   */
  public trackLogout(): void {
    const event: BaseEvent = {
      eventType: EventType.LOGOUT,
      uid: this.currentUserId || undefined,
      linkId: 'logout',
    }

    this.track(event)
    this.clearUserId()
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
        path: path || (typeof window !== 'undefined' ? window.location.pathname : ''),
        title: title || (typeof document !== 'undefined' ? document.title : ''),
      },
    }

    this.track(event)
  }

  /**
   * 追踪页面访问事件（trackVisit 的别名，兼容 Nuxt 集成）
   */
  public trackPageView(path?: string, title?: string): void {
    this.trackVisit(path, title)
  }

  /**
   * 追踪点击事件
   */
  public trackClick(data: Partial<ClickEvent> | string): void {
    let event: BaseEvent

    if (typeof data === 'string') {
      // 简单用法：只传递元素 ID
      event = {
        eventType: EventType.CLICK,
        uid: this.currentUserId || undefined,
        linkId: 'click_event',
        eventData: {
          elementId: data,
        },
      }
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
      }
    }

    this.track(event)
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
    }

    this.track(event)
  }

  /**
   * 通用追踪方法（核心方法）
   */
  private track(event: BaseEvent): void {
    // 转换为后端 API 格式（扁平化结构）
    const payload = this.transformToPayload(event)

    // 添加到队列
    this.eventQueue.push(payload)

    // 保存到本地存储（用于离线重试）
    if (this.config.enableStorage) {
      this.storage.savePendingEvents(this.eventQueue.getAll())
    }

    this.log('事件已追踪:', payload)
  }

  /**
   * 转换为后端 API 格式
   * 关键方法：将业务事件转换为后端期望的扁平化数据结构
   */
  private transformToPayload(event: BaseEvent): TrackingEventPayload {
    const isWindowAvailable = typeof window !== 'undefined'
    const isDocumentAvailable = typeof document !== 'undefined'
    const isNavigatorAvailable = typeof navigator !== 'undefined'

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
      uri: isWindowAvailable ? window.location.pathname + window.location.search : '',

      // 请求来源（Referer，注意是单个 r）
      referer: isDocumentAvailable ? document.referrer || undefined : undefined,

      // User-Agent
      userAgent: isNavigatorAvailable ? navigator.userAgent : '',

      // 会话 ID
      sessionId: this.sessionId,

      // 事件附加数据（可以包含额外的上下文信息）
      eventData: {
        ...event.eventData,
        // 可选：添加额外的客户端信息
        _clientInfo:
          isWindowAvailable && isNavigatorAvailable
            ? {
                url: window.location.href,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                platform: navigator.platform,
              }
            : undefined,
      },
    }
  }

  /**
   * 批量发送事件
   */
  private async sendBatch(events: TrackingEventPayload[]): Promise<void> {
    if (events.length === 0) return

    const endpoint = `${this.config.apiEndpoint}/api/track/batch`

    try {
      const response = await this.sendRequest(endpoint, { events })

      if (response.success) {
        this.log(`成功上报 ${events.length} 个事件`)

        // 清除已发送的事件
        if (this.config.enableStorage) {
          this.storage.clearPendingEvents()
        }
      } else {
        throw new Error(response.message || '上报失败')
      }
    } catch (error) {
      this.error('批量上报失败:', error)

      // 保存到本地存储等待重试
      if (this.config.enableStorage) {
        this.storage.savePendingEvents(events)
      }
    }
  }

  /**
   * 发送单个事件（用于重要事件的即时上报）
   */
  public async sendImmediately(event: BaseEvent): Promise<void> {
    const payload = this.transformToPayload(event)
    const endpoint = this.getEventEndpoint(event.eventType)

    try {
      await this.sendRequest(endpoint, payload)
      this.log('事件即时上报成功:', payload)
    } catch (error) {
      this.error('事件即时上报失败:', error)
      throw error
    }
  }

  /**
   * 获取事件对应的 API 端点
   */
  private getEventEndpoint(eventType: string): string {
    const baseUrl = this.config.apiEndpoint

    switch (eventType) {
      case EventType.REGISTER:
        return `${baseUrl}/api/track/register`
      case EventType.SUBSCRIBE:
        return `${baseUrl}/api/track/subscribe`
      case EventType.LOGIN:
        return `${baseUrl}/api/track/login`
      default:
        return `${baseUrl}/api/track/batch`
    }
  }

  /**
   * 发送 HTTP 请求
   */
  private async sendRequest(
    url: string,
    data: any,
    retries: number = 0
  ): Promise<TrackingResponse> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return { success: true, ...result }
    } catch (error: any) {
      if (retries < this.config.maxRetries) {
        this.log(`请求失败，重试 ${retries + 1}/${this.config.maxRetries}`)
        await this.delay(1000 * Math.pow(2, retries)) // 指数退避
        return this.sendRequest(url, data, retries + 1)
      }

      throw error
    }
  }

  /**
   * 手动刷新队列（立即发送所有待发送事件）
   */
  public flush(): void {
    this.eventQueue.flush()
  }

  /**
   * 销毁 SDK
   */
  public destroy(): void {
    this.flush()
    this.eventQueue.destroy()
    this.isInitialized = false
    this.log('SDK 已销毁')
  }

  // ========== 自动采集相关方法 ==========

  /**
   * 设置点击事件监听器
   */
  private setupClickListener(): void {
    if (typeof document === 'undefined') return

    document.addEventListener(
      'click',
      (e: MouseEvent) => {
        const target = e.target as HTMLElement

        // 获取元素信息
        const elementId = target.id || target.getAttribute('data-track-id') || ''
        const elementText = target.textContent?.trim() || ''
        const elementTag = target.tagName.toLowerCase()

        // 只追踪特定元素或带有 data-track 属性的元素
        const shouldTrack =
          target.hasAttribute('data-track') ||
          elementTag === 'button' ||
          elementTag === 'a' ||
          target.classList.contains('trackable')

        if (shouldTrack) {
          this.trackClick({
            elementId,
            elementText: elementText.substring(0, 50), // 限制长度
            eventData: {
              elementTag,
              elementClass: target.className,
              href: (target as HTMLAnchorElement).href || undefined,
            },
          })
        }
      },
      true
    )
  }

  /**
   * 设置页面访问监听器（SPA 路由变化）
   */
  private setupPageViewListener(): void {
    if (typeof window === 'undefined' || typeof history === 'undefined') return

    // 监听 History API
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = (...args) => {
      originalPushState.apply(history, args)
      this.trackVisit()
    }

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args)
      this.trackVisit()
    }

    // 监听 popstate（浏览器前进后退）
    window.addEventListener('popstate', () => {
      this.trackVisit()
    })

    // 监听 hashchange（hash 路由）
    window.addEventListener('hashchange', () => {
      this.trackVisit()
    })
  }

  /**
   * 设置页面关闭监听器（确保事件发送完成）
   */
  private setupBeforeUnloadListener(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    window.addEventListener('beforeunload', () => {
      this.flush()
    })

    // 使用 visibilitychange 处理移动端场景
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush()
      }
    })
  }

  // ========== 工具方法 ==========

  /**
   * 生成会话 ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 日志输出
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[TrackingSDK]', ...args)
    }
  }

  /**
   * 错误日志
   */
  private error(...args: any[]): void {
    if (this.config.debug) {
      console.error('[TrackingSDK]', ...args)
    }
  }
}
