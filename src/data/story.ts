// Each fixed slot can be updated independently. Image paths are relative to public/.
// Leave an image or paragraph empty while editing. The card keeps its place and title.
export interface StoryChapter {
  title: string;
  text?: string;
  image?: string;
  alt?: string;
}

export const story: [StoryChapter, StoryChapter, StoryChapter, StoryChapter] = [
  {
    title: '长春智慧城市后台',
    text: '我在神州数码做智慧城市后台设计。地图、表格和操作入口分布在不同模块，我从这些反复出现的任务入手，梳理后台的交互规范与组件。',
    image: '/assets/legacy/backend-cover.webp',
    alt: '长春智慧城市后台作品，界面包含地图与业务管理面板',
  },
  {
    title: '有赞美业预约',
    text: '在阿卡索做完在线学习产品后，我开始设计商家工具。在有赞，同一次预约对顾客和门店意味着不同的操作。我把两边的任务放在一起，重新梳理预约流程。',
    image: '/assets/legacy/you-zan-wang-dian-yu-yue-xi-tong-6-1.webp',
    alt: '有赞网店预约系统历史作品中的设计页面',
  },
  {
    title: 'WeC Bot 论坛分析',
    text: '在世野，我和另外三位伙伴做 WeC Bot。我负责产品、交互、Prompt 和工作流，把论坛里的求助与产品反馈整理出来，让处理问题的同事能回到原帖。',
    image: '/assets/wec/forum-design.webp',
    alt: 'WeC Bot 论坛分析的脱敏设计稿',
  },
  {
    title: 'WESION AI 中台',
    text: '现在我在做 WESION AI 中台。我用 Codex 辅助实现 Bug 和 VOC 分析，让同事从一个问题主题点回原始记录，自己核对 AI 的判断。中台还在持续开发。',
    image: '/assets/wesion/bug-topics.webp',
    alt: 'WESION AI 中台的 Bug 主题分析脱敏界面',
  },
];
