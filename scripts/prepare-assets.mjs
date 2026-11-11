import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const dir = 'public/assets/legacy';
await mkdir(dir, { recursive: true });
const legacy = JSON.parse(await readFile('src/data/legacy.json', 'utf8'));
const selected = ['ce-shi', 'b-duan-hou-tai-she-ji-gui-fan'];
const result = {};
for (const slug of selected) {
  const entry = legacy.find(p => p.slug === slug);
  result[slug] = [];
  for (const [i, source] of entry.images.entries()) {
    const input = join('public', source);
    const meta = await sharp(input).metadata();
    const width = Math.min(1600, meta.width);
    const cropHeight = Math.max(1, Math.round(meta.width * 1.5));
    const slices = [];
    for (let y = 0, n = 0; y < meta.height; y += cropHeight, n++) {
      const height = Math.min(cropHeight, meta.height - y);
      const name = `${slug}-${i + 1}-${n + 1}.webp`;
      const info = await sharp(input).extract({ left: 0, top: y, width: meta.width, height })
        .resize({ width }).webp({ quality: 86 }).toFile(join(dir, name));
      slices.push({ src: `/assets/legacy/${name}`, width: info.width, height: info.height });
    }
    result[slug].push({ original: source, slices });
  }
}
for (const [source, name] of [['ce-shi.jpg','k12-cover'], ['b-duan-hou-tai-she-ji-gui-fan.jpg','backend-cover']]) {
  await sharp(`public/post-images/${source}`).resize(960, 600, { fit: 'cover' }).webp({ quality: 85 }).toFile(`${dir}/${name}.webp`);
}
await writeFile('src/data/legacy-images.json', JSON.stringify(result, null, 2) + '\n');
const social = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="white"/><path d="M80 126H1120" stroke="#e2e7e1"/><text x="80" y="88" font-family="PingFang SC,sans-serif" font-size="28" fill="#315342">周国翔 / Sky</text><text x="80" y="215" font-family="Arial,sans-serif" font-size="16" letter-spacing="4" fill="#7b8774">PRODUCT · DESIGN · AI</text><text x="76" y="320" font-family="PingFang SC,sans-serif" font-size="68" font-weight="600" fill="#242a25">让复杂的业务，</text><text x="76" y="415" font-family="PingFang SC,sans-serif" font-size="68" font-weight="600" fill="#242a25">成为好用的产品。</text><text x="80" y="535" font-family="PingFang SC,sans-serif" font-size="24" fill="#66735e">AI 产品经理｜企业效率工具与 AI 应用</text></svg>`;
await sharp(Buffer.from(social)).png().toFile('public/assets/social-card.png');
console.log('Prepared original-image reading slices, two covers and social card.');
