# 静态部署缓存建议（becoming · 改写人生剧本）

本产品为 **Vite + React SPA**：`bank.json`、评分与报告均在浏览器本地完成，**无默认外部 AI API**。

## 缓存原则
| 资源 | 建议 Cache-Control | 原因 |
|---|---|---|
| `/index.html` | `public, max-age=0, must-revalidate` | 入口需能拿到新 hash 引用 |
| `/assets/*`（带 content hash） | `public, max-age=31536000, immutable` | Vite 文件名含 hash，可长期缓存 |
| Logo `.webp` / `.png` / favicon | `public, max-age=31536000, immutable` | 换图时改文件名或清 CDN |

仓库内已附：
- `public/_headers`（Cloudflare Pages / Netlify）
- `deploy-cache.nginx.conf`（nginx 示例）

## 回访流量
第二次访问同一浏览器时，hashed JS/CSS/图片通常 **304 或 disk cache 命中**，传输接近 0（仅可能再取 index.html 校验）。
