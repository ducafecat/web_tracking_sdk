import { defineConfig } from 'tsup'

export default defineConfig({
  // 入口文件
  entry: ['src/index.ts'],
  
  // 输出格式: ESM 和 CJS
  format: ['esm', 'cjs'],
  
  // 生成类型声明文件
  dts: true,
  
  // 代码分割
  splitting: false,
  
  // 生成 sourcemap
  sourcemap: true,
  
  // 清理输出目录
  clean: true,
  
  // 目标环境
  target: 'es2020',
  
  // 输出目录
  outDir: 'dist',
  
  // 保留注释
  keepNames: true,
  
  // 生成 package.json (用于双包支持)
  // minify: false, // 开发环境不压缩,生产环境可开启
  
  // 外部依赖(不打包进bundle)
  external: [],
  
  // 全局变量替换
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  
  // 构建成功后的钩子
  onSuccess: async () => {
    console.log('✅ 构建成功!')
  },
})

