# Yarn 配置说明

## 📦 包管理器选择

项目已配置为使用 **Yarn 1.x (经典版本)**，这是最稳定和广泛使用的版本。

## 🚀 安装 Yarn

### 方法 1: 通过 npm 安装 (推荐)

```bash
npm install -g yarn
```

### 方法 2: 通过 Homebrew 安装 (macOS)

```bash
brew install yarn
```

### 方法 3: 通过官方脚本安装

```bash
curl -o- -L https://yarnpkg.com/install.sh | bash
```

## ✅ 验证安装

```bash
yarn --version
# 应该显示 1.22.x
```

## 🔧 配置国内镜像 (可选)

如果你在中国大陆，可以配置淘宝镜像加速：

### 方法 1: 修改 .yarnrc 文件

编辑项目根目录的 `.yarnrc` 文件，取消注释以下行：

```
registry "https://registry.npmmirror.com"
```

### 方法 2: 使用命令行配置

```bash
yarn config set registry https://registry.npmmirror.com
```

### 验证镜像配置

```bash
yarn config get registry
```

## 📦 使用 Yarn

### 安装依赖

```bash
# 首次安装或更新依赖
yarn install

# 简写
yarn
```

### 添加依赖

```bash
# 添加运行时依赖
yarn add package-name

# 添加开发依赖
yarn add -D package-name

# 添加精确版本
yarn add package-name@1.2.3

# 添加最新版本
yarn add package-name@latest
```

### 删除依赖

```bash
yarn remove package-name
```

### 更新依赖

```bash
# 更新所有依赖
yarn upgrade

# 更新指定依赖
yarn upgrade package-name

# 交互式更新
yarn upgrade-interactive
```

### 运行脚本

```bash
# 运行 package.json 中的脚本
yarn dev
yarn build
yarn test

# 或使用 yarn run
yarn run dev
```

## 🆚 Yarn vs npm vs pnpm

### 使用 npm

如果你更喜欢 npm：

```bash
# 删除 yarn.lock
rm yarn.lock

# 删除 package.json 中的 packageManager 字段
# 然后安装依赖
npm install

# 之后使用 npm 命令
npm run dev
npm run build
npm test
```

### 使用 pnpm

如果你更喜欢 pnpm：

```bash
# 安装 pnpm
npm install -g pnpm

# 删除 yarn.lock
rm yarn.lock

# 安装依赖
pnpm install

# 之后使用 pnpm 命令
pnpm dev
pnpm build
pnpm test
```

## 🔍 常见问题

### Q: 为什么选择 Yarn 1.x 而不是 Yarn 3/4 (Berry)?

A: 
- ✅ Yarn 1.x 更稳定，社区支持更广泛
- ✅ 与 npm 行为更接近，学习成本低
- ✅ node_modules 结构更直观，便于调试
- ✅ 与现有工具链兼容性更好

Yarn Berry (2+) 虽然有 PnP 等先进特性，但配置复杂，且有一定的兼容性问题。

### Q: 遇到 "yarn: command not found" 怎么办?

A: 需要先安装 Yarn：
```bash
npm install -g yarn
```

### Q: 安装依赖很慢怎么办?

A: 配置国内镜像：
```bash
yarn config set registry https://registry.npmmirror.com
```

### Q: yarn.lock 文件的作用?

A: 
- 锁定依赖版本，确保团队成员安装相同版本
- 应该提交到 Git 仓库
- 不要手动编辑，由 Yarn 自动管理

### Q: 如何清除 Yarn 缓存?

A:
```bash
yarn cache clean
```

### Q: 如何查看项目依赖树?

A:
```bash
yarn list
yarn list --pattern "package-name"
```

## 📚 Yarn 命令速查表

| 命令 | 说明 |
|------|------|
| `yarn` | 安装依赖 |
| `yarn add <pkg>` | 添加依赖 |
| `yarn add -D <pkg>` | 添加开发依赖 |
| `yarn remove <pkg>` | 删除依赖 |
| `yarn upgrade` | 更新依赖 |
| `yarn <script>` | 运行脚本 |
| `yarn list` | 查看依赖树 |
| `yarn why <pkg>` | 查看依赖原因 |
| `yarn cache clean` | 清除缓存 |
| `yarn config list` | 查看配置 |

## 🔗 参考资料

- [Yarn 官方文档](https://classic.yarnpkg.com/)
- [npm vs Yarn 对比](https://classic.yarnpkg.com/en/docs/migrating-from-npm)
- [淘宝 npm 镜像](https://npmmirror.com/)

---

如有其他问题，请参考 [SETUP.md](./SETUP.md) 或提交 Issue。

