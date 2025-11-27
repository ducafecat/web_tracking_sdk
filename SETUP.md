# 项目初始化指南

## 📦 环境要求

- Node.js >= 18.0.0
- Yarn 1.x (经典版本) 或 npm/pnpm

## 🚀 快速开始

### 1. 安装依赖

```bash
yarn install
```

### 2. 初始化 Git Hooks

```bash
yarn prepare
```

这会自动设置 husky hooks，包括：
- `pre-commit`: 提交前自动运行 lint-staged (代码检查和格式化)
- `commit-msg`: 检查 commit 信息是否符合规范

### 3. 开发模式

```bash
# 启动开发模式（监听文件变化，自动重新构建）
yarn dev
```

### 4. 构建项目

```bash
# 构建生产版本
yarn build
```

构建产物将输出到 `dist/` 目录：
- `dist/index.js` - ESM 格式
- `dist/index.cjs` - CommonJS 格式
- `dist/index.d.ts` - TypeScript 类型声明文件

### 5. 运行测试

```bash
# 运行所有测试
yarn test

# 运行测试并生成覆盖率报告
yarn test:coverage

# 运行测试 UI 界面
yarn test:ui
```

### 6. 代码质量检查

```bash
# ESLint 检查
yarn lint

# 自动修复 ESLint 问题
yarn lint:fix

# Prettier 格式化检查
yarn format:check

# 自动格式化代码
yarn format

# TypeScript 类型检查
yarn type-check
```

## 📝 提交规范

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### Commit 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档变更
- `style`: 代码格式(不影响代码运行的变动)
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 增加测试
- `chore`: 构建过程或辅助工具的变动
- `revert`: 回滚
- `build`: 构建系统或外部依赖项的更改
- `ci`: CI 配置文件和脚本的更改

### 示例

```bash
# 使用交互式 commit 工具
yarn commit

# 或者直接提交
git commit -m "feat: 添加用户登录功能"
git commit -m "fix: 修复页面访问统计bug"
git commit -m "docs: 更新 API 文档"
```

## 🗂️ 项目结构

```
.
├── .husky/                 # Git hooks 配置
│   ├── commit-msg          # Commit 信息校验
│   └── pre-commit          # 提交前检查
├── docs/                   # 项目文档
├── src/                    # 源代码
│   ├── __tests__/          # 测试文件
│   │   └── sdk.test.ts     # SDK 单元测试
│   ├── index.ts            # 导出入口
│   ├── sdk.ts              # SDK 主类
│   └── types.ts            # 类型定义
├── .editorconfig           # 编辑器配置
├── .eslintrc.cjs           # ESLint 配置
├── .gitignore              # Git 忽略文件
├── .npmrc                  # NPM 配置
├── .prettierrc.json        # Prettier 配置
├── .prettierignore         # Prettier 忽略文件
├── commitlint.config.cjs   # Commit 信息校验配置
├── LICENSE                 # MIT 许可证
├── package.json            # 项目配置
├── README.md               # 项目说明
├── SETUP.md                # 初始化指南（本文件）
├── tsconfig.json           # TypeScript 配置
├── tsconfig.build.json     # 构建用 TypeScript 配置
├── tsup.config.ts          # 构建工具配置
├── vitest.config.ts        # 测试框架配置
└── yarn.lock               # 依赖锁定文件
```

## 🛠️ 常用命令速查

| 命令 | 说明 |
|------|------|
| `yarn install` | 安装依赖 |
| `yarn dev` | 开发模式 |
| `yarn build` | 构建项目 |
| `yarn test` | 运行测试 |
| `yarn test:coverage` | 测试覆盖率 |
| `yarn lint` | 代码检查 |
| `yarn lint:fix` | 自动修复代码问题 |
| `yarn format` | 格式化代码 |
| `yarn type-check` | 类型检查 |
| `yarn clean` | 清理构建产物 |
| `yarn commit` | 交互式提交 |

## 🔧 技术栈

- **语言**: TypeScript 5.5+
- **构建工具**: tsup (基于 esbuild)
- **测试框架**: Vitest
- **代码质量**: ESLint + Prettier
- **Git 规范**: Husky + lint-staged + Commitlint
- **包管理**: Yarn 4 (Berry)

## 📚 下一步

完成初始化后，你可以：

1. 查看 `README.md` 了解项目详情
2. 查看 `docs/` 目录了解业务需求和 API 设计
3. 开始在 `src/` 目录编写业务代码
4. 在 `src/__tests__/` 目录编写测试用例

## ❓ 常见问题

### Q: 可以使用 npm 或 pnpm 吗?

A: 可以！删除 `yarn.lock` 和 `package.json` 中的 `packageManager` 字段，然后运行：
```bash
# 使用 npm
npm install

# 或使用 pnpm
pnpm install
```

### Q: 如何配置淘宝镜像?

A: 编辑 `.yarnrc` 文件，取消注释镜像配置：
```
registry "https://registry.npmmirror.com"
```

### Q: 为什么使用 tsup 而不是 tsc?

A: tsup 基于 esbuild，构建速度更快，支持多种输出格式，配置更简单，且自动处理 ESM/CJS 双格式输出。

### Q: 如何禁用 Git Hooks?

A: 在提交时添加 `--no-verify` 标志：
```bash
git commit -m "feat: xxx" --no-verify
```

---

如有其他问题，请查阅文档或提交 Issue。

