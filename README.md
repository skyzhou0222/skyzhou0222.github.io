# 周国翔 / Sky · 个人作品站

周国翔的中文静态作品集。首页介绍本人及代表作，`/work/` 提供可缩放地图和按类别浏览的作品列表。首页采用白底、陶土色强调与滚动叙事。

## 本机打开

双击上一级目录的「打开新版个人站.command」。终端保持打开时，在浏览器访问 http://localhost:4321 。停止预览可在终端按 Control + C。

已安装 Node.js 22.23.4 以上和 pnpm 的电脑也可运行：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

如果本地端口被占用，启动工具会显示实际可用地址。不要把本地预览地址用于简历投递。

## 修改内容

| 内容 | 位置 |
| --- | --- |
| 姓名、邮箱、履历与教育 | `src/data/profile.ts` |
| 两篇核心案例 | `src/content/projects/`，一篇一个 Markdown 文件 |
| 首页、能力轮播、职业速览、精选作品 | `src/pages/index.astro` |
| 「关于我」四段滚动叠图 | `src/data/story.ts`，按出现顺序分别填写正文、图片路径、图片描述和图注 |
| 邮箱入口、联系渠道预留位 | `src/components/Contact.astro` |
| 作品地图的分类与作品入口 | `src/data/works.ts` |
| 地图区块与作品位置 | `src/pages/work/index.astro` |
| 关于页 | `src/pages/about.astro` |
| 整体视觉 | `src/styles/global.css` |
| 核心案例流程图 | `src/components/ProjectVisual.astro` |
| 历史作品目录与原图索引 | `src/data/legacy.json` |
| 历史长图阅读版本 | `public/assets/legacy/` |
| 原始作品图片 | `public/post-images/` |

核心案例的封面、本人贡献、业务问题、职责和阶段在对应 Markdown 中维护。更新项目状态时同时更新资料覆盖日期。网站使用已脱敏的实际界面或明确标注的设计稿，归档作品使用原文章发布日期。

首页主视觉在 `src/pages/index.astro` 的 `heroImage` 填入个人照片和描述即可切换，默认使用两张脱敏案例界面。

「关于我」的四个位置始终保留。图片放进 `public/assets/`，再把以 `/assets/` 开头的站内地址填到 `image`。暂时清空某段的 `image` 或 `text`，仍会显示该段的色块或标题。访客开启系统「减少动态效果」时可直接逐段阅读。

## 构建与检查

```sh
pnpm build
pnpm test
pnpm preview
```

`pnpm test` 检查声明的最低 Node 版本是否通过真实启动检查，并检查生成的页面、站内路由、锚点、图片引用以及私人来源泄漏。检查工具另需 Python 3。页面在 `dist/`，无需后端服务即可托管。另需浏览器检查手机布局、键盘和复制邮箱功能。

已迁入的 11 项历史作品保留原图。阅读图按需加载，点击「查看原图」可打开原始文件。

## 历史与发布

源仓库：`skyzhou0222/skyzhou0222.github.io`。
原基线：`f7438354d6e80d91a52aaaf32c5120a147c90ce7`。
版本分支

| 分支 | 用途 |
| --- | --- |
| `portfolio-interactive` | 滚动交互版，在此继续设计和修改 |
| `portfolio-refresh` | 当前公开站的源码 |
| `gh-pages` | GitHub Pages 读取此分支的静态文件，对外提供网站 |

两项核心案例、11 项归档作品和旧图片继续使用原地址，上一级目录保存了迁移前的 HTML 供比对。

日常迭代推送到 `portfolio-interactive`。正式网站由 `gh-pages` 发布。
