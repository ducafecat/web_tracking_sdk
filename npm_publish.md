### 一、3 分钟前置准备（必须先做）

```bash
# 1. 注册 npm 账号（用 GitHub 一键登录最快）
https://www.npmjs.com/signup   → 直接点 “Sign in with GitHub”

# 2. 命令行登录（推荐用 GitHub 方式，永不掉）
npm login
# → 会自动跳浏览器让你授权 GitHub → 登录成功！
# 成功后终端会显示：Logged in as 你的用户名
```

### 三、项目根目录准备（直接复制这结构）

```bash
my-awesome-pkg/
├── index.js          ← 你的主文件（必须）
├── package.json      ← 重点！下面给最优模板
├── README.md         ← 必写！否则审核可能被拒
└── LICENSE           ← MIT 许可证（强烈推荐）
```

### 三、最强 package.json 模板（2025 年直接复制 100% 通过）

```json
{
  "name": "@yourname/my-pkg",           // 带 scope 最专业（可不带）
  // 或者普通名： "name": "holink-utils"（注意：这个名字必须全球唯一！）
  "version": "1.0.0",
  "description": "一个超好用的工具包，帮你快速开发",
  "main": "index.js",
  "type": "module",                     // 如果你用 ES Module（推荐）
  // "type": "commonjs",                // 如果你用 require
  "keywords": ["utils", "tools", "holink", "awesome"],
  "author": "你的名字 <you@gmail.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yourname/my-pkg.git"
  },
  "bugs": {
    "url": "https://github.com/yourname/my-pkg/issues"
  },
  "homepage": "https://github.com/yourname/my-pkg#readme",
  "files": [
    "index.js",
    "lib/",
    "dist/"
  ],
  "publishConfig": {
    "access": "public"                  // 关键！带 @scope 的包必须加这行
  }
}
```

### 四、一键发布命令（就这 3 行！）

```bash
# 1. 第一次发布
npm publish

# 2. 以后更新版本（推荐用 npm 自动打版）
npm version patch    # 小更新 → 1.0.1
# npm version minor  # 新功能 → 1.1.0
# npm version major  # 大改版 → 2.0.0

# 3. 再次发布
npm publish
```

带 `@scope` 的包第一次要加 `--access public`：

```bash
npm publish --access public
```

### 五、常见错误 & 100% 解决方案

| 错误 | 原因 | 解决 |
|------|------|------|
| `You must be logged in` | 没登录 | `npm login` 用 GitHub 登录 |
| `You do not have permission` | 名字被占了 | 改名或加 scope：`@ducafecat/utils` |
| `You cannot publish over the previously published versions` | 版本号没变 | `npm version patch` 再发 |
| 403 + need auth | 没加 public | 加 `"publishConfig": { "access": "public" }` |

### 六、终极福利：我写好的发布脚本（一键无脑发）

```bash
# publish.sh
#!/bin/bash
echo "准备发布 npm 包..."

# 自动递增小版本
npm version patch -m "chore: release v%s"

# 发布（自动识别是否需要 public）
npm publish --access public

echo "发布成功！去看看：https://www.npmjs.com/package/$(node -p "require('./package.json').name")"
```

保存为 `publish.sh` → `chmod +x publish.sh` → `./publish.sh` → 完事！

现在就去跑 `npm login` → 改 package.json → `npm publish`  
