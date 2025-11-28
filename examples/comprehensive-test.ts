/**
 * 综合测试程序
 * 完整测试埋点 SDK 的所有功能
 *
 * 运行方式:
 * 1. 确保已构建 SDK: yarn build
 * 2. 使用 ts-node 运行: npx ts-node examples/comprehensive-test.ts
 * 3. 或编译后运行: tsc examples/comprehensive-test.ts && node examples/comprehensive-test.js
 */

import { TrackingSDK, EventType } from '../src'

// ============================================
// 测试配置
// ============================================
const TEST_CONFIG = {
  apiEndpoint: 'https://api-test.holink.com',
  siteDomain: 'test.holink.com',
  debug: true,
  batchSize: 5, // 降低批次大小便于测试
  batchInterval: 3000, // 3秒自动上报
  autoPageView: false, // 手动控制页面访问
  autoClick: false, // 手动控制点击事件
  enableStorage: true,
}

// ============================================
// 工具函数
// ============================================

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 打印测试标题
 */
function printTestTitle(title: string): void {
  console.log('\n' + '='.repeat(60))
  console.log(`🧪 ${title}`)
  console.log('='.repeat(60))
}

/**
 * 打印成功信息
 */
function printSuccess(message: string): void {
  console.log(`✅ ${message}`)
}

/**
 * 打印错误信息
 */
function printError(message: string, error?: any): void {
  console.error(`❌ ${message}`)
  if (error) {
    console.error('   错误详情:', error.message || error)
  }
}

/**
 * 打印信息
 */
function printInfo(message: string): void {
  console.log(`ℹ️  ${message}`)
}

// ============================================
// 测试用例
// ============================================

/**
 * 测试 1: SDK 初始化
 */
async function testInitialization(): Promise<TrackingSDK> {
  printTestTitle('测试 1: SDK 初始化')

  try {
    const tracker = new TrackingSDK(TEST_CONFIG)
    await tracker.init()

    printSuccess('SDK 初始化成功')
    printInfo(`配置: ${JSON.stringify(TEST_CONFIG, null, 2)}`)

    return tracker
  } catch (error) {
    printError('SDK 初始化失败', error)
    throw error
  }
}

/**
 * 测试 2: 用户注册流程
 */
async function testUserRegistration(tracker: TrackingSDK): Promise<void> {
  printTestTitle('测试 2: 用户注册流程')

  try {
    const userId = `test_user_${Date.now()}`

    // 设置用户 ID
    tracker.setUserId(userId)
    printSuccess(`设置用户 ID: ${userId}`)

    // 追踪注册事件
    tracker.trackRegister({
      uid: userId,
      linkId: 'register_form',
      source: 'email',
      eventData: {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'test_campaign',
        device_type: 'desktop',
      },
    })
    printSuccess('注册事件已追踪')

    await delay(500)
  } catch (error) {
    printError('用户注册测试失败', error)
  }
}

/**
 * 测试 3: 用户登录和登出
 */
async function testLoginLogout(tracker: TrackingSDK): Promise<void> {
  printTestTitle('测试 3: 用户登录和登出')

  try {
    const userId = `test_user_${Date.now()}`

    // 登录
    tracker.trackLogin({
      uid: userId,
      loginMethod: 'email',
      linkId: 'login_form',
      eventData: {
        remember_me: true,
        ip_address: '192.168.1.100',
      },
    })
    printSuccess(`用户登录: ${userId}`)

    await delay(1000)

    // 登出
    tracker.trackLogout()
    printSuccess('用户登出')

    await delay(500)
  } catch (error) {
    printError('登录登出测试失败', error)
  }
}

/**
 * 测试 4: 订阅功能
 */
async function testSubscription(tracker: TrackingSDK): Promise<void> {
  printTestTitle('测试 4: 订阅功能')

  try {
    // 测试不同的订阅场景
    const subscriptions = [
      { plan: 'basic', duration: 1, amount: 9.99 },
      { plan: 'pro', duration: 12, amount: 99.99 },
      { plan: 'enterprise', duration: 12, amount: 299.99 },
    ]

    for (const sub of subscriptions) {
      tracker.trackSubscribe({
        ...sub,
        linkId: 'pricing_page',
        eventData: {
          payment_method: 'credit_card',
          currency: 'USD',
          promotion_code: 'SAVE20',
          trial_days: 14,
        },
      })
      printSuccess(`订阅追踪: ${sub.plan} - $${sub.amount}/${sub.duration}月`)
      await delay(300)
    }
  } catch (error) {
    printError('订阅功能测试失败', error)
  }
}

/**
 * 测试 5: 页面访问追踪
 */
async function testPageViews(tracker: TrackingSDK): Promise<void> {
  printTestTitle('测试 5: 页面访问追踪')

  try {
    const pages = [
      { path: '/', title: '首页' },
      { path: '/pricing', title: '价格页' },
      { path: '/features', title: '功能介绍' },
      { path: '/about', title: '关于我们' },
      { path: '/contact', title: '联系我们' },
    ]

    for (const page of pages) {
      tracker.trackPageView(page.path, page.title)
      printSuccess(`页面访问: ${page.title} (${page.path})`)
      await delay(200)
    }
  } catch (error) {
    printError('页面访问测试失败', error)
  }
}

/**
 * 测试 6: 点击事件追踪
 */
async function testClickEvents(tracker: TrackingSDK): Promise<void> {
  printTestTitle('测试 6: 点击事件追踪')

  try {
    // 简单用法：只传递元素 ID
    tracker.trackClick('hero_cta_button')
    printSuccess('简单点击事件: hero_cta_button')

    await delay(200)

    // 完整用法：传递详细信息
    const clicks = [
      {
        elementId: 'subscribe_button',
        elementText: '立即订阅',
        linkId: 'pricing_page',
        eventData: { plan: 'pro', position: 'header' },
      },
      {
        elementId: 'download_button',
        elementText: '下载应用',
        linkId: 'homepage',
        eventData: { platform: 'ios', size: '120MB' },
      },
      {
        elementId: 'share_button',
        elementText: '分享',
        linkId: 'article_page',
        eventData: { platform: 'twitter', article_id: 'art_123' },
      },
    ]

    for (const click of clicks) {
      tracker.trackClick(click)
      printSuccess(`点击事件: ${click.elementText} (${click.elementId})`)
      await delay(200)
    }
  } catch (error) {
    printError('点击事件测试失败', error)
  }
}

/**
 * 测试 7: 自定义事件
 */
async function testCustomEvents(tracker: TrackingSDK): Promise<void> {
  printTestTitle('测试 7: 自定义事件')

  try {
    // 视频播放事件
    tracker.trackCustom('video_play', {
      videoId: 'vid_12345',
      videoTitle: '产品介绍视频',
      duration: 180,
      quality: '1080p',
      autoplay: false,
    })
    printSuccess('自定义事件: 视频播放')

    await delay(300)

    // 搜索事件
    tracker.trackCustom('search', {
      keyword: 'typescript sdk',
      results_count: 42,
      filters: { category: 'development', sort: 'relevance' },
    })
    printSuccess('自定义事件: 搜索')

    await delay(300)

    // 文件下载事件
    tracker.trackCustom('file_download', {
      fileId: 'file_789',
      fileName: 'report.pdf',
      fileSize: 1024000,
      fileType: 'pdf',
    })
    printSuccess('自定义事件: 文件下载')

    await delay(300)

    // 表单提交事件
    tracker.trackCustom('form_submit', {
      formId: 'contact_form',
      formType: 'inquiry',
      fields: ['name', 'email', 'message'],
      validation_errors: 0,
    })
    printSuccess('自定义事件: 表单提交')
  } catch (error) {
    printError('自定义事件测试失败', error)
  }
}

/**
 * 测试 8: 批量上报机制
 */
async function testBatchReporting(tracker: TrackingSDK): Promise<void> {
  printTestTitle('测试 8: 批量上报机制')

  try {
    printInfo(`批量阈值: ${TEST_CONFIG.batchSize} 个事件`)
    printInfo(`自动上报间隔: ${TEST_CONFIG.batchInterval}ms`)

    // 快速产生多个事件,触发批量上报
    for (let i = 1; i <= 12; i++) {
      tracker.trackCustom('batch_test', {
        index: i,
        timestamp: Date.now(),
      })

      if (i % TEST_CONFIG.batchSize === 0) {
        printSuccess(`已生成 ${i} 个事件 (应触发批量上报)`)
      }
    }

    printInfo('等待批量上报完成...')
    await delay(2000)

    printSuccess('批量上报测试完成')
  } catch (error) {
    printError('批量上报测试失败', error)
  }
}

/**
 * 测试 9: 即时上报
 */
async function testImmediateReporting(tracker: TrackingSDK): Promise<void> {
  printTestTitle('测试 9: 即时上报')

  try {
    printInfo('测试重要事件的即时上报...')

    // 支付完成事件 - 需要即时上报
    const paymentEvent = {
      eventType: EventType.SUBSCRIBE,
      uid: `user_${Date.now()}`,
      linkId: 'checkout',
      eventData: {
        orderId: `order_${Date.now()}`,
        amount: 299.99,
        currency: 'USD',
        payment_method: 'stripe',
        status: 'completed',
      },
    }

    await tracker.sendImmediately(paymentEvent)
    printSuccess('支付事件即时上报成功')

    await delay(500)

    // 错误事件 - 需要即时上报
    const errorEvent = {
      eventType: 'error',
      linkId: 'app',
      eventData: {
        error_type: 'api_error',
        error_message: 'Connection timeout',
        error_code: 'ERR_TIMEOUT',
        stack_trace: 'Error at line 123...',
      },
    }

    await tracker.sendImmediately(errorEvent)
    printSuccess('错误事件即时上报成功')
  } catch (error) {
    printError('即时上报测试失败', error)
  }
}

/**
 * 测试 10: 手动刷新队列
 */
async function testManualFlush(tracker: TrackingSDK): Promise<void> {
  printTestTitle('测试 10: 手动刷新队列')

  try {
    // 产生一些事件
    for (let i = 1; i <= 3; i++) {
      tracker.trackCustom('flush_test', {
        index: i,
        timestamp: Date.now(),
      })
    }
    printInfo('已生成 3 个事件')

    // 手动刷新
    tracker.flush()
    printSuccess('手动刷新队列完成')

    await delay(1000)
  } catch (error) {
    printError('手动刷新测试失败', error)
  }
}

/**
 * 测试 11: 复杂场景 - 用户完整旅程
 */
async function testUserJourney(tracker: TrackingSDK): Promise<void> {
  printTestTitle('测试 11: 复杂场景 - 用户完整旅程')

  try {
    const userId = `journey_user_${Date.now()}`

    // 1. 访问首页
    tracker.trackPageView('/', '首页')
    printInfo('步骤 1: 访问首页')
    await delay(300)

    // 2. 点击了解更多
    tracker.trackClick({
      elementId: 'learn_more_button',
      elementText: '了解更多',
      linkId: 'homepage',
    })
    printInfo('步骤 2: 点击了解更多')
    await delay(300)

    // 3. 访问功能页
    tracker.trackPageView('/features', '功能介绍')
    printInfo('步骤 3: 访问功能页')
    await delay(300)

    // 4. 观看演示视频
    tracker.trackCustom('video_play', {
      videoId: 'demo_video',
      videoTitle: '功能演示',
      duration: 120,
    })
    printInfo('步骤 4: 观看演示视频')
    await delay(2000) // 模拟观看 2 秒

    // 5. 访问价格页
    tracker.trackPageView('/pricing', '价格页')
    printInfo('步骤 5: 访问价格页')
    await delay(300)

    // 6. 点击订阅按钮
    tracker.trackClick({
      elementId: 'subscribe_pro_button',
      elementText: '订阅 Pro 版',
      linkId: 'pricing_page',
      eventData: { plan: 'pro' },
    })
    printInfo('步骤 6: 点击订阅按钮')
    await delay(300)

    // 7. 用户注册
    tracker.setUserId(userId)
    tracker.trackRegister({
      uid: userId,
      linkId: 'register_form',
      source: 'organic',
      eventData: {
        utm_source: 'google',
        referrer: 'https://google.com',
      },
    })
    printInfo(`步骤 7: 用户注册 (${userId})`)
    await delay(300)

    // 8. 完成订阅
    tracker.trackSubscribe({
      plan: 'pro',
      duration: 12,
      amount: 99.99,
      linkId: 'checkout',
      eventData: {
        payment_method: 'credit_card',
        currency: 'USD',
        discount: 20,
      },
    })
    printInfo('步骤 8: 完成订阅')
    await delay(300)

    printSuccess('用户完整旅程测试完成')
  } catch (error) {
    printError('用户旅程测试失败', error)
  }
}

/**
 * 测试 12: 性能测试
 */
async function testPerformance(tracker: TrackingSDK): Promise<void> {
  printTestTitle('测试 12: 性能测试')

  try {
    const eventCount = 100
    const startTime = Date.now()

    printInfo(`开始生成 ${eventCount} 个事件...`)

    for (let i = 1; i <= eventCount; i++) {
      tracker.trackCustom('performance_test', {
        index: i,
        timestamp: Date.now(),
        randomData: Math.random(),
      })

      if (i % 20 === 0) {
        printInfo(`已生成 ${i}/${eventCount} 个事件`)
      }
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    printSuccess(`性能测试完成`)
    printInfo(`总事件数: ${eventCount}`)
    printInfo(`总耗时: ${duration}ms`)
    printInfo(`平均每个事件: ${(duration / eventCount).toFixed(2)}ms`)

    // 等待队列处理
    printInfo('等待队列处理完成...')
    await delay(5000)

    // 手动刷新
    tracker.flush()
    await delay(2000)
  } catch (error) {
    printError('性能测试失败', error)
  }
}

/**
 * 测试 13: 错误处理
 */
async function testErrorHandling(tracker: TrackingSDK): Promise<void> {
  printTestTitle('测试 13: 错误处理')

  try {
    // 测试空数据
    printInfo('测试 1: 空事件数据')
    tracker.trackCustom('empty_event', {})
    printSuccess('空事件数据处理正常')

    await delay(300)

    // 测试超长字符串
    printInfo('测试 2: 超长字符串')
    tracker.trackCustom('long_string_test', {
      longText: 'A'.repeat(10000),
    })
    printSuccess('超长字符串处理正常')

    await delay(300)

    // 测试特殊字符
    printInfo('测试 3: 特殊字符')
    tracker.trackCustom('special_chars', {
      text: '特殊字符测试: <>&"\' 😀 🎉',
      emoji: '👍 💯 🚀',
      unicode: '\u0000\u0001\u0002',
    })
    printSuccess('特殊字符处理正常')

    await delay(300)

    // 测试嵌套对象
    printInfo('测试 4: 嵌套对象')
    tracker.trackCustom('nested_object', {
      level1: {
        level2: {
          level3: {
            deep: 'value',
          },
        },
      },
    })
    printSuccess('嵌套对象处理正常')

    await delay(300)

    printSuccess('错误处理测试完成')
  } catch (error) {
    printError('错误处理测试失败', error)
  }
}

// ============================================
// 主测试流程
// ============================================

async function runAllTests(): Promise<void> {
  console.log('\n')
  console.log('╔═══════════════════════════════════════════════════════════╗')
  console.log('║                                                           ║')
  console.log('║         🧪 埋点 SDK 综合测试程序                          ║')
  console.log('║                                                           ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')

  let tracker: TrackingSDK | null = null

  try {
    // 测试 1: 初始化
    tracker = await testInitialization()
    await delay(500)

    // 测试 2: 用户注册
    await testUserRegistration(tracker)
    await delay(500)

    // 测试 3: 登录登出
    await testLoginLogout(tracker)
    await delay(500)

    // 测试 4: 订阅功能
    await testSubscription(tracker)
    await delay(500)

    // 测试 5: 页面访问
    await testPageViews(tracker)
    await delay(500)

    // 测试 6: 点击事件
    await testClickEvents(tracker)
    await delay(500)

    // 测试 7: 自定义事件
    await testCustomEvents(tracker)
    await delay(500)

    // 测试 8: 批量上报
    await testBatchReporting(tracker)
    await delay(1000)

    // 测试 9: 即时上报
    await testImmediateReporting(tracker)
    await delay(1000)

    // 测试 10: 手动刷新
    await testManualFlush(tracker)
    await delay(1000)

    // 测试 11: 用户旅程
    await testUserJourney(tracker)
    await delay(1000)

    // 测试 12: 性能测试
    await testPerformance(tracker)
    await delay(1000)

    // 测试 13: 错误处理
    await testErrorHandling(tracker)
    await delay(1000)

    // 最终刷新
    printTestTitle('最终清理')
    tracker.flush()
    printSuccess('队列已刷新')
    await delay(2000)

    // 销毁 SDK
    tracker.destroy()
    printSuccess('SDK 已销毁')

    // 测试总结
    console.log('\n')
    console.log('╔═══════════════════════════════════════════════════════════╗')
    console.log('║                                                           ║')
    console.log('║         ✅ 所有测试完成                                    ║')
    console.log('║                                                           ║')
    console.log('╚═══════════════════════════════════════════════════════════╝')
    console.log('\n')
  } catch (error) {
    console.error('\n')
    console.error('╔═══════════════════════════════════════════════════════════╗')
    console.error('║                                                           ║')
    console.error('║         ❌ 测试过程中出现错误                              ║')
    console.error('║                                                           ║')
    console.error('╚═══════════════════════════════════════════════════════════╝')
    console.error('\n错误详情:', error)

    // 确保清理
    if (tracker) {
      tracker.destroy()
    }

    process.exit(1)
  }
}

// 运行所有测试
runAllTests()

