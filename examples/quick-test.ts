/**
 * 快速测试程序
 * 用于快速验证 SDK 的基本功能
 *
 * 运行方式:
 * yarn example:quick
 * 或
 * npx tsx examples/quick-test.ts
 */

import { TrackingSDK } from '../src'

// ============================================
// 快速测试
// ============================================

async function quickTest() {
  console.log('🚀 开始快速测试...\n')

  // 1. 初始化 SDK
  console.log('📦 步骤 1: 初始化 SDK')
  const tracker = new TrackingSDK({
    apiEndpoint: 'https://hl-to.8kds.com',
    siteDomain: 'hl-app.8kds.com',
    debug: true,
    batchSize: 3,
    batchInterval: 2000,
    enableStorage: false,
  })

  await tracker.init()
  console.log('✅ SDK 初始化成功\n')

  // 2. 模拟用户注册
  console.log('📝 步骤 2: 用户注册')
  const userId = `user_${Date.now()}`
  tracker.setUserId(userId)
  tracker.trackRegister({
    uid: userId,
    source: 'email',
    linkId: 'register_form',
  })
  console.log(`✅ 用户注册: ${userId}\n`)

  await delay(500)

  // 3. 模拟页面访问
  console.log('🔍 步骤 3: 页面访问')
  tracker.trackPageView('/', '首页')
  tracker.trackPageView('/pricing', '价格页')
  console.log('✅ 页面访问追踪完成\n')

  await delay(500)

  // 4. 模拟点击事件
  console.log('👆 步骤 4: 点击事件')
  tracker.trackClick('subscribe_button')
  console.log('✅ 点击事件追踪完成\n')

  await delay(500)

  // 5. 模拟订阅
  console.log('💰 步骤 5: 用户订阅')
  tracker.trackSubscribe({
    plan: 'pro',
    duration: 12,
    amount: 99.99,
    linkId: 'checkout',
  })
  console.log('✅ 订阅事件追踪完成\n')

  await delay(500)

  // 6. 自定义事件
  console.log('🎯 步骤 6: 自定义事件')
  tracker.trackCustom('video_play', {
    videoId: 'demo_001',
    duration: 120,
  })
  console.log('✅ 自定义事件追踪完成\n')

  // 7. 等待批量上报
  console.log('⏳ 步骤 7: 等待批量上报...')
  await delay(3000)

  // 8. 手动刷新队列
  console.log('🔄 步骤 8: 手动刷新队列')
  tracker.flush()
  console.log('✅ 队列刷新完成\n')

  await delay(1000)

  // 9. 销毁 SDK
  console.log('🧹 步骤 9: 清理资源')
  tracker.destroy()
  console.log('✅ SDK 已销毁\n')

  console.log('🎉 快速测试完成！')
  console.log('\n提示：查看上面的日志输出，确认所有事件都已正确追踪。')
}

// 工具函数
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 运行测试
quickTest().catch((error) => {
  console.error('❌ 测试失败:', error)
  process.exit(1)
})
