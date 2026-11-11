# 周国翔 / Sky · 个人作品站

白底、深绿的静态作品集。当前为本地审阅版本，没有推送或发布。

## 本机打开

双击上一级目录的「打开新版个人站.command」。终端保持打开时，在浏览器访问 http://localhost:4321 。停止预览可在终端按 Control + C。

已安装 Node.js 22.12 以上和 pnpm 的电脑也可运行：

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
| 首页 | `src/pages/index.astro` |
| 关于页 | `src/pages/about.astro` |
| 整体视觉 | `src/styles/global.css` |
| 核心案例流程图 | `src/components/ProjectVisual.astro` |
| 历史作品目录与原图索引 | `src/data/legacy.json` |
| 历史长图阅读版本 | `public/assets/legacy/` |
| 原始作品图片 | `public/post-images/` |

核心案例标题、摘要、职责和阶段来自同一份 Markdown，首页与详情同步更新。当前内容口径对应 2026-11-02 已梳理的简历材料；修改项目状态时同步修改材料覆盖日期。真实界面素材加入前，需要完成脱敏，不能把流程示意图当作真实产品截图。

## 构建与检查

```sh
pnpm build
pnpm test
pnpm preview
```

`pnpm test` 检查生成的页面、站内路由、锚点、图片引用以及私人来源泄漏。页面在 `dist/`，无需后端服务即可托管。另需浏览器检查手机布局、键盘和复制邮箱功能。

重新生成旧图的阅读切片和分享图：

```sh
node scripts/prepare-assets.mjs
```

原图不覆盖，阅读图按需加载，点击「查看原图」可打开原始文件。

## 历史与发布

源仓库：`skyzhou0222/skyzhou0222.github.io`。
原基线：`f7438354d6e80d91a52aaaf32c5120a147c90ce7`。
本地分支：`portfolio-refresh`。

保留原有文章与图片地址；首页、关于页、归档页、404 和两项精选旧作品采用新模板。原有页面可从 Git 历史恢复，上一级另存原始 HTML 供比对。其余历史页面保留原版阅读样式，移除了不必要的外部字体、图标和脚本依赖。

未来发布仍可使用原 GitHub Pages 地址；届时单独核对 Pages 发布来源和构建流程。本轮没有新增自动发布工作流，没有修改远端或域名。不要将上一级简历草稿、事实底稿、原始工作资料整体加入公开仓库。
