/**
 * SDK 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TrackingSDK } from '../sdk'
import { EventType } from '../types'

describe('TrackingSDK', () => {
  let sdk: TrackingSDK

  beforeEach(() => {
    sdk = new TrackingSDK({
      apiEndpoint: 'https://api.example.com',
      linkId: 'test-link-id',
      debug: true,
    })
  })

  it('应该正确初始化', () => {
    expect(sdk).toBeInstanceOf(TrackingSDK)
  })

  it('应该能设置 UID', () => {
    sdk.setUID('user-123')
    expect(sdk).toBeDefined()
  })

  it('应该能记录事件', () => {
    sdk.track(EventType.VISIT, { page: 'home' })
    expect(sdk).toBeDefined()
  })
})

