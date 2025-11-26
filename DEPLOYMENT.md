# Cloudflare Pages 部署配置

## 必需配置

在 Cloudflare Pages Dashboard 中配置以下设置：

### Build settings（构建设置）

- **Build command（构建命令）**: `npm run build`
- **Build output directory（构建输出目录）**: `dist`
- **Deploy command（部署命令）**: `true`

> **注意**: Deploy command 使用 `true` 命令即可，因为 Cloudflare Pages 会自动部署 `dist` 目录中的静态文件，不需要额外的部署步骤。

### 为什么使用 `true`？

- `true` 是一个总是成功返回的命令（空操作）
- Cloudflare Pages 在构建完成后会自动部署 `dist` 目录
- 不需要使用 `wrangler deploy`（那是用于 Workers 的）
- 静态站点部署是自动的，无需额外命令

### 替代方案

如果 `true` 命令不可用，也可以使用：
- `echo "Deploying static files"`
- 或者留空（如果允许的话）

## Node.js 版本

建议使用 Node.js 20.19.0 或更高版本（项目已包含 `.nvmrc` 文件）

