/**
 * 基础使用示例
 */

import { TrackingSDK, EventType } from '../src'

// 1. 初始化 SDK
const tracker = new TrackingSDK({
  apiEndpoint: 'https://api.example.com/api/track',
  linkId: 'my-link-id',
  autoPageView: true,
  autoClick: false,
  debug: true,
  batchSize: 10,
  batchInterval: 5000,
})

// 2. 设置用户 UID（通常在用户登录后调用）
tracker.setUID('user-12345')

// 3. 记录注册事件
tracker.track(EventType.REGISTER, {
  source: 'homepage',
  campaign: 'summer-2024',
})

// 4. 记录订阅事件
tracker.track(EventType.SUBSCRIBE, {
  plan: 'premium',
  duration: '1-year',
})

// 5. 记录登录事件
tracker.track(EventType.LOGIN, {
  method: 'email',
})

// 6. 记录自定义点击事件
tracker.track(EventType.CLICK, {
  element: 'button',
  elementId: 'subscribe-btn',
  page: '/pricing',
})

// 7. 记录自定义事件
tracker.track('custom_event', {
  action: 'video_play',
  videoId: 'video-123',
  duration: 120,
})

console.info('✅ 所有事件已记录')

