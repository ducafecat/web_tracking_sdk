/**
 * 事件队列管理器
 * 负责批量上报和队列管理
 */

import type { TrackingEventPayload } from './types'

interface EventQueueConfig {
  batchSize: number
  batchInterval: number
  onFlush: (events: TrackingEventPayload[]) => Promise<void>
}

export class EventQueue {
  private queue: TrackingEventPayload[] = []
  private config: EventQueueConfig
  private flushTimer: ReturnType<typeof setTimeout> | null = null

  constructor(config: EventQueueConfig) {
    this.config = config
    this.startFlushTimer()
  }

  /**
   * 添加事件到队列
   */
  public push(event: TrackingEventPayload): void {
    this.queue.push(event)

    // 如果达到批量阈值，立即刷新
    if (this.queue.length >= this.config.batchSize) {
      this.flush()
    }
  }

  /**
   * 刷新队列（发送所有事件）
   */
  public flush(): void {
    if (this.queue.length === 0) return

    const eventsToSend = [...this.queue]
    this.queue = []

    // 重置定时器
    this.resetFlushTimer()

    // 调用回调函数发送事件
    this.config.onFlush(eventsToSend).catch((error) => {
      console.error('[EventQueue] 刷新失败:', error)
      // 发送失败，重新加入队列
      this.queue.unshift(...eventsToSend)
    })
  }

  /**
   * 获取所有队列中的事件
   */
  public getAll(): TrackingEventPayload[] {
    return [...this.queue]
  }

  /**
   * 清空队列
   */
  public clear(): void {
    this.queue = []
  }

  /**
   * 销毁队列
   */
  public destroy(): void {
    this.flush()
    this.stopFlushTimer()
  }

  /**
   * 启动定时刷新
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.batchInterval)
  }

  /**
   * 重置定时器
   */
  private resetFlushTimer(): void {
    this.stopFlushTimer()
    this.startFlushTimer()
  }

  /**
   * 停止定时器
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }
}
