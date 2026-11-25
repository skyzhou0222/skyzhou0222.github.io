import { getCollection } from 'astro:content';
import archive from './legacy.json';

export const workGroups = [
  { id: 'ai', title: 'AI 产品' },
  { id: 'systems', title: '业务系统' },
  { id: 'interaction', title: '产品交互' },
  { id: 'visual', title: '视觉与动效' },
] as const;

type Group = typeof workGroups[number]['id'];
export interface Work {
  id: string;
  title: string;
  category: Group;
  href: string;
  cover: string;
  problem: string;
  summary: string;
  role: string;
  stage: string;
  published: string;
}

// Editorial grouping for the map. Original titles, dates and covers come from Gridea.
const archiveGroups: Record<string, Exclude<Group, 'ai'>> = {
  'you-zan-wang-dian-yu-yue-xi-tong': 'systems',
  'b-duan-hou-tai-she-ji-gui-fan': 'systems',
  'wang-ka-ye-wu-guan-li-hou-tai-fan-yu': 'systems',
  'ce-shi': 'interaction',
  'shu-ma-zu-ren-dian-shang-xiao-zu-pei-qi': 'interaction',
  'wang-ka-yi-dong-duan-fan-yu': 'interaction',
  'xiao-ma-os-che-zai-xi-tong': 'interaction',
  'zhi-bo-dian-shang-dao-hang-xiu-tao': 'interaction',
  'ding-ding-redesign': 'visual',
  'pp-shi-pin-re-design': 'visual',
  'cha-hua-xiu-gai-de-de-xiao-dong-xiao': 'visual',
};

const archiveDescriptions:Record<string,string>={
  'ce-shi':'从运营模板编辑器到学习中心，围绕在线英语学习梳理操作路径。',
  'you-zan-wang-dian-yu-yue-xi-tong':'有赞网店预约系统的界面与流程设计，收录原作品图集。',
  'ding-ding-redesign':'钉钉界面改版练习，呈现视觉与动效设计。',
  'pp-shi-pin-re-design':'围绕 PP 视频的界面改版，收录原始设计作品。',
  'shu-ma-zu-ren-dian-shang-xiao-zu-pei-qi':'ZUALL 数码电商租赁产品的界面设计。',
  'wang-ka-ye-wu-guan-li-hou-tai-fan-yu':'凡鱼网咖业务管理后台的界面设计。',
  'wang-ka-yi-dong-duan-fan-yu':'凡鱼网咖移动端设计，与业务管理后台形成一组作品。',
  'xiao-ma-os-che-zai-xi-tong':'小马 OS 的车载系统界面设计。',
  'zhi-bo-dian-shang-dao-hang-xiu-tao':'秀淘直播电商导航产品的界面设计。',
};

export async function getWorks(): Promise<Work[]> {
  const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
  return [
    ...projects.map(({ id, data }): Work => ({
      id, title: data.title, category: 'ai', href: `/work/${id}/`, cover: data.cover,
      problem: data.problem, summary: data.cardLead, role: data.role, stage: data.stage, published: '',
    })),
    ...archive.map(({ slug, title, cover, published, originalText }): Work => {
      const category = archiveGroups[slug];
      if (!category) throw new Error(`Missing work map category: ${slug}`);
      return {
        id: slug, title, category, href: `/${slug}/`, cover, published,
        problem: '', summary: originalText.split('\n')[0].trim() || archiveDescriptions[slug] || '查看原设计作品图集。', role: '', stage: '',
      };
    }),
  ];
}
