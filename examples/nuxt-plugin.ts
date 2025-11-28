/**
 * Nuxt 4 插件示例
 * 文件位置: plugins/tracking.client.ts
 *
 * 完整集成埋点 SDK 到 Nuxt 4 应用
 */

import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { TrackingSDK, EventType } from '@holink/tracking-sdk'

export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig()

  // ============================================
  // 1. 初始化埋点 SDK
  // ============================================
  const tracker = new TrackingSDK({
    apiEndpoint: config.public.trackingApiEndpoint as string,
    siteDomain: (config.public.siteDomain as string) || 'holink.com',
    debug: config.public.trackingDebug === 'true',
    batchSize: 10,
    batchInterval: 5000,
    autoPageView: false, // Nuxt 中手动控制页面访问（通过 router 监听）
    autoClick: false, // 点击事件建议手动调用（更精确）
    enableStorage: true,
  })

  // 初始化 SDK
  await tracker.init()

  // ============================================
  // 2. 监听路由变化，自动追踪页面访问
  // ============================================
  nuxtApp.hook('page:finish', () => {
    tracker.trackPageView() // 使用 trackPageView 方法（Nuxt 推荐）
  })

  // ============================================
  // 3. 监听错误事件（可选）
  // ============================================
  nuxtApp.hook('vue:error', (error) => {
    tracker.trackCustom('error', {
      message: error.message,
      stack: error.stack,
      componentName: error.componentName,
    })
  })

  // ============================================
  // 4. 提供全局访问方法
  // ============================================
  return {
    provide: {
      // 完整的 tracker 实例
      tracker,

      // 便捷方法：追踪事件
      track: (eventType: EventType | string, data?: Record<string, any>) => {
        tracker.trackCustom(eventType, data)
      },

      // 便捷方法：追踪页面访问
      trackPageView: (path?: string, title?: string) => {
        tracker.trackPageView(path, title)
      },

      // 便捷方法：追踪点击
      trackClick: (elementId: string, elementText?: string) => {
        tracker.trackClick({
          elementId,
          elementText,
        })
      },

      // 便捷方法：追踪注册
      trackRegister: (data: any) => {
        tracker.trackRegister(data)
      },

      // 便捷方法：追踪订阅
      trackSubscribe: (data: any) => {
        tracker.trackSubscribe(data)
      },

      // 便捷方法：追踪登录
      trackLogin: (data: any) => {
        tracker.trackLogin(data)
      },

      // 便捷方法：追踪登出
      trackLogout: () => {
        tracker.trackLogout()
      },
    },
  }
})

// ============================================
// 类型声明（添加到 nuxt.d.ts）
// ============================================
declare module '#app' {
  interface NuxtApp {
    $tracker: TrackingSDK
    $track: (eventType: EventType | string, data?: Record<string, any>) => void
    $trackPageView: (path?: string, title?: string) => void
    $trackClick: (elementId: string, elementText?: string) => void
    $trackRegister: (data: any) => void
    $trackSubscribe: (data: any) => void
    $trackLogin: (data: any) => void
    $trackLogout: () => void
  }
}

// ============================================
// 使用示例
// ============================================

/*
// 在页面组件中使用:

<script setup>
const { $tracker, $trackPageView, $trackClick, $trackRegister } = useNuxtApp()

// 1. 用户注册后
async function handleRegister(userId) {
  $tracker.setUserId(userId)
  $trackRegister({
    uid: userId,
    source: 'email',
  })
}

// 2. 追踪点击事件
function handleButtonClick() {
  $trackClick('subscribe_button', '立即订阅')
}

// 3. 追踪自定义事件
function handleVideoPlay() {
  $tracker.trackCustom('video_play', {
    videoId: 'abc123',
    duration: 120,
  })
}
</script>

<template>
  <button @click="handleButtonClick">
    订阅
  </button>
</template>
*/

/*
// nuxt.config.ts 配置:

export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      trackingApiEndpoint: process.env.TRACKING_API_ENDPOINT || 'https://your-api.com',
      siteDomain: process.env.SITE_DOMAIN || 'holink.com',
      trackingDebug: process.env.TRACKING_DEBUG || 'false',
    },
  },
})
*/

/*
// .env 文件:

TRACKING_API_ENDPOINT=https://your-api.com
SITE_DOMAIN=holink.com
TRACKING_DEBUG=true
*/
