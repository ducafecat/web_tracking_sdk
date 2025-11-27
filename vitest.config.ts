import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // 测试环境
    environment: 'jsdom',
    
    // 全局变量
    globals: true,
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/__tests__/**',
        '**/types.ts',
        '**/*.config.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    
    // 包含的测试文件
    include: ['src/**/*.{test,spec}.ts'],
    
    // 排除的文件
    exclude: ['node_modules', 'dist'],
    
    // 测试超时时间
    testTimeout: 10000,
    
    // 监听模式排除
    watchExclude: ['**/node_modules/**', '**/dist/**'],
  },
  
  // 路径别名
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

