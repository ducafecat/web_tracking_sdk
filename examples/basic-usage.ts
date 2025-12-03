/**
 * 基础使用示例
 * 演示如何使用埋点 SDK 追踪用户行为
 */

import { TrackingSDK } from '../src'

// ============================================
// 1. 初始化 SDK
// ============================================
const tracker = new TrackingSDK({
  apiEndpoint: 'https://hl-to.8kds.com',
  siteDomain: 'app.holink.com', // 指定站点域名（可选，默认自动获取）
  debug: true, // 开发环境开启调试
  batchSize: 10, // 批量上报阈值
  batchInterval: 5000, // 5秒自动上报
  autoPageView: true, // 自动采集页面访问
  autoClick: false, // 手动采集点击事件（推荐）
  enableStorage: false, // 启用本地存储（支持离线重试）
})

// 初始化 SDK
await tracker.init()

// ============================================
// 2. 用户注册事件
// ============================================
async function handleRegister(userId: string) {
  // 设置用户 ID
  tracker.setUserId(userId)

  // 追踪注册事件
  tracker.trackRegister({
    uid: userId,
    linkId: 'register_form',
    source: 'email',
    eventData: {
      utm_source: 'google',
      utm_campaign: 'summer_promo',
    },
  })
}

// 模拟用户注册
await handleRegister('user_12345')
console.info('✅ 用户注册事件已发送')

// ============================================
// 3. 用户订阅事件
// ============================================
async function handleSubscribe(plan: string, duration: number, amount: number) {
  tracker.trackSubscribe({
    plan,
    duration,
    amount,
    linkId: 'subscribe_page',
    eventData: {
      payment_method: 'credit_card',
      currency: 'USD',
    },
  })
}

// 模拟用户订阅
await handleSubscribe('pro', 12, 99.99)
console.info('✅ 用户订阅事件已发送')

// ============================================
// 4. 用户登录事件
// ============================================
async function handleLogin(userId: string, method: 'email' | 'phone') {
  tracker.setUserId(userId)

  tracker.trackLogin({
    uid: userId,
    loginMethod: method,
    linkId: 'login_form',
  })
}

// 模拟用户登录
await handleLogin('user_12345', 'email')
console.info('✅ 用户登录事件已发送')

// ============================================
// 5. 用户登出事件
// ============================================
async function handleLogout() {
  tracker.trackLogout()
}

// 模拟用户登出
await handleLogout()
console.info('✅ 用户登出事件已发送')

// ============================================
// 6. 页面访问事件（两种方式）
// ============================================

// 方式1：使用 trackVisit()
tracker.trackVisit('/dashboard', '用户控制台')

// 方式2：使用 trackPageView()（Nuxt 集成推荐）
tracker.trackPageView('/dashboard', '用户控制台')

// ============================================
// 7. 点击事件（三种方式）
// ============================================

// 方式1：简单用法（只传递元素 ID）
tracker.trackClick('subscribe_button')

// 方式2：完整用法（传递详细信息）
tracker.trackClick({
  elementId: 'buy_now_button',
  elementText: '立即购买',
  elementType: 'button', // 元素类型（例如：button, a, div）
  linkId: 'pricing_page',
  eventData: {
    productId: 'prod_123',
    price: 99.99,
  },
})

// 方式3：在 HTML 中使用 data-track 属性（配合 autoClick: true）
// <button data-track data-track-id="submit_button">提交</button>
// SDK 会自动采集带有 data-track 属性的元素点击

// ============================================
// 8. 自定义事件
// ============================================
tracker.trackCustom('video_play', {
  videoId: 'abc123',
  duration: 120,
  quality: '1080p',
})

tracker.trackCustom('share_link', {
  linkId: 'link_abc123',
  platform: 'twitter',
})

// ============================================
// 9. 即时上报（用于重要事件）
// ============================================
const importantEvent = {
  eventType: 'payment_completed',
  uid: 'user_123',
  linkId: 'checkout',
  eventData: {
    orderId: 'order_123',
    amount: 99.99,
  },
}
await tracker.sendImmediately(importantEvent)

// ============================================
// 10. 手动刷新队列
// ============================================
// 立即发送所有待发送事件（例如在页面关闭前）
tracker.flush()

// ============================================
// 11. 销毁 SDK
// ============================================
// 在应用卸载时调用
tracker.destroy()

console.info('✅ 所有示例已执行完成')
