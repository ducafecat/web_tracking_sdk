/**
 * Nuxt 4 插件示例
 * 文件位置: plugins/tracking.client.ts
 */

import { defineNuxtPlugin } from '#app'
import { TrackingSDK, EventType } from '@holink/tracking-sdk'

export default defineNuxtPlugin((nuxtApp) => {
  // 初始化埋点 SDK
  const tracker = new TrackingSDK({
    apiEndpoint: 'https://api.example.com/api/track',
    linkId: 'nuxt-app-link-id',
    autoPageView: false, // 手动控制页面访问事件
    autoClick: true,     // 自动采集点击事件
    debug: import.meta.dev,
  })

  // 监听路由变化，记录页面访问
  nuxtApp.hook('page:finish', () => {
    tracker.track(EventType.VISIT, {
      page: window.location.pathname,
      title: document.title,
    })
  })

  // 提供全局访问
  return {
    provide: {
      tracker,
      track: (eventType: EventType | string, data?: Record<string, unknown>) => {
        tracker.track(eventType, data)
      },
    },
  }
})

// 使用方式:
// 1. 在组件中使用
// const { $tracker, $track } = useNuxtApp()
// $track(EventType.CLICK, { button: 'subscribe' })
//
// 2. 设置用户 UID
// $tracker.setUID('user-123')

