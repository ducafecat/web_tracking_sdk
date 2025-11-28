var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/types.ts
var EventType = /* @__PURE__ */ ((EventType2) => {
  EventType2["REGISTER"] = "register";
  EventType2["SUBSCRIBE"] = "subscribe";
  EventType2["LOGIN"] = "login";
  EventType2["LOGOUT"] = "logout";
  EventType2["VISIT"] = "visit";
  EventType2["CLICK"] = "click";
  EventType2["CUSTOM"] = "custom";
  return EventType2;
})(EventType || {});

// src/EventQueue.ts
var _EventQueue = class _EventQueue {
  constructor(config) {
    this.queue = [];
    this.flushTimer = null;
    this.config = config;
    this.startFlushTimer();
  }
  /**
   * 添加事件到队列
   */
  push(event) {
    this.queue.push(event);
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }
  /**
   * 刷新队列（发送所有事件）
   */
  flush() {
    if (this.queue.length === 0) return;
    const eventsToSend = [...this.queue];
    this.queue = [];
    this.resetFlushTimer();
    this.config.onFlush(eventsToSend).catch((error) => {
      console.error("[EventQueue] \u5237\u65B0\u5931\u8D25:", error);
      this.queue.unshift(...eventsToSend);
    });
  }
  /**
   * 获取所有队列中的事件
   */
  getAll() {
    return [...this.queue];
  }
  /**
   * 清空队列
   */
  clear() {
    this.queue = [];
  }
  /**
   * 销毁队列
   */
  destroy() {
    this.flush();
    this.stopFlushTimer();
  }
  /**
   * 启动定时刷新
   */
  startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.batchInterval);
  }
  /**
   * 重置定时器
   */
  resetFlushTimer() {
    this.stopFlushTimer();
    this.startFlushTimer();
  }
  /**
   * 停止定时器
   */
  stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
};
__name(_EventQueue, "EventQueue");
var EventQueue = _EventQueue;

// src/StorageManager.ts
var _StorageManager = class _StorageManager {
  constructor(prefix = "holink_track_") {
    this.prefix = prefix;
  }
  /**
   * 保存用户 ID
   */
  setUserId(userId) {
    this.setItem("user_id", userId);
  }
  /**
   * 获取用户 ID
   */
  getUserId() {
    return this.getItem("user_id");
  }
  /**
   * 清除用户 ID
   */
  clearUserId() {
    this.removeItem("user_id");
  }
  /**
   * 保存待发送事件
   */
  savePendingEvents(events) {
    this.setItem("pending_events", JSON.stringify(events));
  }
  /**
   * 获取待发送事件
   */
  getPendingEvents() {
    const data = this.getItem("pending_events");
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  /**
   * 清除待发送事件
   */
  clearPendingEvents() {
    this.removeItem("pending_events");
  }
  // ========== 底层存储方法 ==========
  setItem(key, value) {
    try {
      localStorage.setItem(this.prefix + key, value);
    } catch (error) {
      console.error("[StorageManager] \u5B58\u50A8\u5931\u8D25:", error);
    }
  }
  getItem(key) {
    try {
      return localStorage.getItem(this.prefix + key);
    } catch (error) {
      console.error("[StorageManager] \u8BFB\u53D6\u5931\u8D25:", error);
      return null;
    }
  }
  removeItem(key) {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error("[StorageManager] \u5220\u9664\u5931\u8D25:", error);
    }
  }
};
__name(_StorageManager, "StorageManager");
var StorageManager = _StorageManager;

// src/sdk.ts
var _TrackingSDK = class _TrackingSDK {
  constructor(config) {
    this.currentUserId = null;
    this.isInitialized = false;
    this.config = {
      apiEndpoint: config.apiEndpoint,
      siteDomain: config.siteDomain || (typeof window !== "undefined" ? window.location.hostname : ""),
      debug: config.debug ?? false,
      batchSize: config.batchSize ?? 10,
      batchInterval: config.batchInterval ?? 5e3,
      autoPageView: config.autoPageView ?? true,
      autoClick: config.autoClick ?? false,
      timeout: config.timeout ?? 1e4,
      maxRetries: config.maxRetries ?? 3,
      enableStorage: config.enableStorage ?? true,
      storagePrefix: config.storagePrefix ?? "holink_track_"
    };
    this.storage = new StorageManager(this.config.storagePrefix);
    this.eventQueue = new EventQueue({
      batchSize: this.config.batchSize,
      batchInterval: this.config.batchInterval,
      onFlush: this.sendBatch.bind(this)
    });
    this.sessionId = this.generateSessionId();
    this.log("TrackingSDK \u5DF2\u521B\u5EFA", this.config);
  }
  /**
   * 初始化 SDK
   */
  async init() {
    if (this.isInitialized) {
      this.log("SDK \u5DF2\u521D\u59CB\u5316");
      return;
    }
    if (this.config.enableStorage) {
      this.currentUserId = this.storage.getUserId();
      const pendingEvents = this.storage.getPendingEvents();
      if (pendingEvents.length > 0) {
        this.log(`\u6062\u590D ${pendingEvents.length} \u4E2A\u5F85\u53D1\u9001\u4E8B\u4EF6`);
        pendingEvents.forEach((event) => this.eventQueue.push(event));
      }
    }
    if (this.config.autoPageView) {
      this.trackVisit();
      this.setupPageViewListener();
    }
    if (this.config.autoClick) {
      this.setupClickListener();
    }
    this.setupBeforeUnloadListener();
    this.isInitialized = true;
    this.log("SDK \u521D\u59CB\u5316\u5B8C\u6210");
  }
  /**
   * 设置用户 ID
   */
  setUserId(userId) {
    this.currentUserId = userId;
    if (this.config.enableStorage) {
      this.storage.setUserId(userId);
    }
    this.log("\u7528\u6237 ID \u5DF2\u8BBE\u7F6E:", userId);
  }
  /**
   * 清除用户 ID（登出时调用）
   */
  clearUserId() {
    this.currentUserId = null;
    if (this.config.enableStorage) {
      this.storage.clearUserId();
    }
    this.log("\u7528\u6237 ID \u5DF2\u6E05\u9664");
  }
  /**
   * 追踪注册事件
   */
  trackRegister(data = {}) {
    const event = {
      eventType: "register" /* REGISTER */,
      uid: data.uid || this.currentUserId || void 0,
      linkId: data.linkId || "register",
      eventData: {
        source: data.source,
        ...data.eventData
      }
    };
    this.track(event);
  }
  /**
   * 追踪订阅事件
   */
  trackSubscribe(data) {
    const event = {
      eventType: "subscribe" /* SUBSCRIBE */,
      uid: data.uid || this.currentUserId || void 0,
      linkId: data.linkId || "subscribe",
      eventData: {
        plan: data.plan,
        duration: data.duration,
        amount: data.amount,
        ...data.eventData
      }
    };
    this.track(event);
  }
  /**
   * 追踪登录事件
   */
  trackLogin(data = {}) {
    const event = {
      eventType: "login" /* LOGIN */,
      uid: data.uid || this.currentUserId || void 0,
      linkId: data.linkId || "login",
      eventData: {
        loginMethod: data.loginMethod,
        ...data.eventData
      }
    };
    this.track(event);
  }
  /**
   * 追踪登出事件
   */
  trackLogout() {
    const event = {
      eventType: "logout" /* LOGOUT */,
      uid: this.currentUserId || void 0,
      linkId: "logout"
    };
    this.track(event);
    this.clearUserId();
  }
  /**
   * 追踪页面访问事件
   */
  trackVisit(path, title) {
    const event = {
      eventType: "visit" /* VISIT */,
      uid: this.currentUserId || void 0,
      linkId: "page_view",
      eventData: {
        path: path || (typeof window !== "undefined" ? window.location.pathname : ""),
        title: title || (typeof document !== "undefined" ? document.title : "")
      }
    };
    this.track(event);
  }
  /**
   * 追踪页面访问事件（trackVisit 的别名，兼容 Nuxt 集成）
   */
  trackPageView(path, title) {
    this.trackVisit(path, title);
  }
  /**
   * 追踪点击事件
   */
  trackClick(data) {
    let event;
    if (typeof data === "string") {
      event = {
        eventType: "click" /* CLICK */,
        uid: this.currentUserId || void 0,
        linkId: "click_event",
        eventData: {
          elementId: data
        }
      };
    } else {
      event = {
        eventType: "click" /* CLICK */,
        uid: data.uid || this.currentUserId || void 0,
        linkId: data.linkId || "click_event",
        eventData: {
          elementId: data.elementId,
          elementText: data.elementText,
          ...data.eventData
        }
      };
    }
    this.track(event);
  }
  /**
   * 追踪自定义事件
   */
  trackCustom(eventName, data = {}) {
    const event = {
      eventType: eventName,
      uid: this.currentUserId || void 0,
      linkId: data.linkId || "custom",
      eventData: data
    };
    this.track(event);
  }
  /**
   * 通用追踪方法（核心方法）
   */
  track(event) {
    const payload = this.transformToPayload(event);
    this.eventQueue.push(payload);
    if (this.config.enableStorage) {
      this.storage.savePendingEvents(this.eventQueue.getAll());
    }
    this.log("\u4E8B\u4EF6\u5DF2\u8FFD\u8E2A:", payload);
  }
  /**
   * 转换为后端 API 格式（扁平化结构）
   * 关键方法：将业务事件转换为后端期望的扁平化数据结构，用于 URL 参数
   */
  transformToPayload(event) {
    const isWindowAvailable = typeof window !== "undefined";
    const isDocumentAvailable = typeof document !== "undefined";
    const isNavigatorAvailable = typeof navigator !== "undefined";
    const payload = {
      // 基础字段
      eventType: event.eventType,
      siteDomain: this.config.siteDomain,
      x_uid: event.uid,
      x_link_id: event.linkId,
      timestamp: Date.now(),
      uri: isWindowAvailable ? window.location.pathname + window.location.search : "",
      referer: isDocumentAvailable ? document.referrer || void 0 : void 0,
      userAgent: isNavigatorAvailable ? navigator.userAgent : "",
      sessionId: this.sessionId
    };
    if (isWindowAvailable && isNavigatorAvailable) {
      payload.url = window.location.href;
      payload.screenResolution = `${window.screen.width}x${window.screen.height}`;
      payload.viewport = `${window.innerWidth}x${window.innerHeight}`;
      payload.language = navigator.language;
      payload.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      payload.platform = navigator.platform;
    }
    if (event.eventData) {
      Object.assign(payload, event.eventData);
    }
    return payload;
  }
  /**
   * 批量发送事件（使用 GET + URL 参数，逐个发送）
   */
  async sendBatch(events) {
    if (events.length === 0) return;
    const endpoint = `${this.config.apiEndpoint}/api/track/event`;
    let successCount = 0;
    const failedEvents = [];
    try {
      for (const event of events) {
        try {
          const response = await this.sendRequest(endpoint, event);
          if (response.success) {
            successCount++;
          } else {
            failedEvents.push(event);
          }
        } catch (error) {
          this.error("\u4E8B\u4EF6\u4E0A\u62A5\u5931\u8D25:", error);
          failedEvents.push(event);
        }
      }
      if (successCount > 0) {
        this.log(`\u6210\u529F\u4E0A\u62A5 ${successCount} \u4E2A\u4E8B\u4EF6`);
      }
      if (failedEvents.length > 0) {
        this.log(`\u5931\u8D25 ${failedEvents.length} \u4E2A\u4E8B\u4EF6`);
        if (this.config.enableStorage) {
          this.storage.savePendingEvents(failedEvents);
        }
      } else {
        if (this.config.enableStorage) {
          this.storage.clearPendingEvents();
        }
      }
    } catch (error) {
      this.error("\u6279\u91CF\u4E0A\u62A5\u5931\u8D25:", error);
      if (this.config.enableStorage) {
        this.storage.savePendingEvents(events);
      }
    }
  }
  /**
   * 发送单个事件（用于重要事件的即时上报）
   */
  async sendImmediately(event) {
    const payload = this.transformToPayload(event);
    const endpoint = this.getEventEndpoint(event.eventType);
    try {
      await this.sendRequest(endpoint, payload);
      this.log("\u4E8B\u4EF6\u5373\u65F6\u4E0A\u62A5\u6210\u529F:", payload);
    } catch (error) {
      this.error("\u4E8B\u4EF6\u5373\u65F6\u4E0A\u62A5\u5931\u8D25:", error);
      throw error;
    }
  }
  /**
   * 获取事件对应的 API 端点
   */
  getEventEndpoint(eventType) {
    const baseUrl = this.config.apiEndpoint;
    switch (eventType) {
      case "register" /* REGISTER */:
        return `${baseUrl}/api/track/register`;
      case "subscribe" /* SUBSCRIBE */:
        return `${baseUrl}/api/track/subscribe`;
      case "login" /* LOGIN */:
        return `${baseUrl}/api/track/login`;
      default:
        return `${baseUrl}/api/track/batch`;
    }
  }
  /**
   * 发送 HTTP 请求
   */
  async sendRequest(url, data, retries = 0) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      const params = new URLSearchParams();
      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (value !== void 0 && value !== null) {
          params.append(key, String(value));
        }
      });
      const fullUrl = `${url}?${params.toString()}`;
      const response = await fetch(fullUrl, {
        method: "GET",
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const contentType = response.headers.get("content-type");
      let result = {};
      if (contentType && contentType.includes("application/json")) {
        const text = await response.text();
        if (text && text.trim()) {
          try {
            result = JSON.parse(text);
          } catch (e) {
            this.log(`JSON \u89E3\u6790\u5931\u8D25\uFF0C\u539F\u59CB\u54CD\u5E94: ${text.substring(0, 100)}`);
            result = { rawResponse: text };
          }
        }
      } else {
        const text = await response.text();
        result = { rawResponse: text || "OK" };
      }
      return { success: true, ...result };
    } catch (error) {
      if (retries < this.config.maxRetries) {
        this.log(`\u8BF7\u6C42\u5931\u8D25\uFF0C\u91CD\u8BD5 ${retries + 1}/${this.config.maxRetries}`);
        await this.delay(1e3 * Math.pow(2, retries));
        return this.sendRequest(url, data, retries + 1);
      }
      throw error;
    }
  }
  /**
   * 手动刷新队列（立即发送所有待发送事件）
   */
  flush() {
    this.eventQueue.flush();
  }
  /**
   * 销毁 SDK
   */
  destroy() {
    this.flush();
    this.eventQueue.destroy();
    this.isInitialized = false;
    this.log("SDK \u5DF2\u9500\u6BC1");
  }
  // ========== 自动采集相关方法 ==========
  /**
   * 设置点击事件监听器
   */
  setupClickListener() {
    if (typeof document === "undefined") return;
    document.addEventListener(
      "click",
      (e) => {
        const target = e.target;
        const elementId = target.id || target.getAttribute("data-track-id") || "";
        const elementText = target.textContent?.trim() || "";
        const elementTag = target.tagName.toLowerCase();
        const shouldTrack = target.hasAttribute("data-track") || elementTag === "button" || elementTag === "a" || target.classList.contains("trackable");
        if (shouldTrack) {
          this.trackClick({
            elementId,
            elementText: elementText.substring(0, 50),
            // 限制长度
            eventData: {
              elementTag,
              elementClass: target.className,
              href: target.href || void 0
            }
          });
        }
      },
      true
    );
  }
  /**
   * 设置页面访问监听器（SPA 路由变化）
   */
  setupPageViewListener() {
    if (typeof window === "undefined" || typeof history === "undefined") return;
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.trackVisit();
    };
    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.trackVisit();
    };
    window.addEventListener("popstate", () => {
      this.trackVisit();
    });
    window.addEventListener("hashchange", () => {
      this.trackVisit();
    });
  }
  /**
   * 设置页面关闭监听器（确保事件发送完成）
   */
  setupBeforeUnloadListener() {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    window.addEventListener("beforeunload", () => {
      this.flush();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.flush();
      }
    });
  }
  // ========== 工具方法 ==========
  /**
   * 生成会话 ID
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * 日志输出
   */
  log(...args) {
    if (this.config.debug) {
      console.log("[TrackingSDK]", ...args);
    }
  }
  /**
   * 错误日志
   */
  error(...args) {
    if (this.config.debug) {
      console.error("[TrackingSDK]", ...args);
    }
  }
};
__name(_TrackingSDK, "TrackingSDK");
var TrackingSDK = _TrackingSDK;
export {
  EventQueue,
  EventType,
  StorageManager,
  TrackingSDK
};
//# sourceMappingURL=index.js.map