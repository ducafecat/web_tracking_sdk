/**
 * 本地存储管理器
 * 用于持久化用户 ID 和待发送事件
 */

import type { TrackingEventPayload } from './types'

export class StorageManager {
  private prefix: string

  constructor(prefix: string = 'holink_track_') {
    this.prefix = prefix
  }

  /**
   * 保存用户 ID
   */
  public setUserId(userId: string): void {
    this.setItem('user_id', userId)
  }

  /**
   * 获取用户 ID
   */
  public getUserId(): string | null {
    return this.getItem('user_id')
  }

  /**
   * 清除用户 ID
   */
  public clearUserId(): void {
    this.removeItem('user_id')
  }

  /**
   * 保存待发送事件
   */
  public savePendingEvents(events: TrackingEventPayload[]): void {
    this.setItem('pending_events', JSON.stringify(events))
  }

  /**
   * 获取待发送事件
   */
  public getPendingEvents(): TrackingEventPayload[] {
    const data = this.getItem('pending_events')
    if (!data) return []

    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  /**
   * 清除待发送事件
   */
  public clearPendingEvents(): void {
    this.removeItem('pending_events')
  }

  // ========== 底层存储方法 ==========

  private setItem(key: string, value: string): void {
    try {
      localStorage.setItem(this.prefix + key, value)
    } catch (error) {
      console.error('[StorageManager] 存储失败:', error)
    }
  }

  private getItem(key: string): string | null {
    try {
      return localStorage.getItem(this.prefix + key)
    } catch (error) {
      console.error('[StorageManager] 读取失败:', error)
      return null
    }
  }

  private removeItem(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key)
    } catch (error) {
      console.error('[StorageManager] 删除失败:', error)
    }
  }
}
