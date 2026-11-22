/* ============================================================================
   playwright-example.js —— AI Agent 用 Playwright 操作本站的完整示例
   运行前：npm install playwright && npx playwright install chromium
   运行：  node AIagent/examples/playwright-example.js
   ============================================================================ */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 用 file:// 直接打开，验证"双击即用"架构
  const url = 'file://' + path.resolve(__dirname, '../index.html');
  await page.goto(url);

  // 1) 自描述：Agent 先了解能力
  const caps = await page.evaluate(() => UZ.ai.describe().capabilities.map(c => c.name));
  console.log('可用能力：', caps.join(', '));

  // 2) 读现状
  const before = await page.evaluate(() => UZ.ai.getState());
  console.log('初始状态：', before);

  // 3) 批量修改：切英文 + 浅色 + 改标题 + 图片灰度
  const result = await page.evaluate(() => UZ.ai.apply([
    { op: 'setLang', args: ['en'] },
    { op: 'setTheme', args: ['light'] },
    { op: 'setText', args: ['section_title', 'One Platform, Everything', 'en'] },
    { op: 'setImageFilter', args: ['#showcaseImg', { grayscale: 1, contrast: 1.2 }] }
  ]));
  console.log('批量修改结果：', result);

  // 4) 读回图片状态确认
  const img = await page.evaluate(() => UZ.ai.getImageInfo('#showcaseImg'));
  console.log('图片状态：', img);

  // 5) 导出最终配置为 JSON（可写回文件）
  const json = await page.evaluate(() => UZ.ai.exportConfig());
  console.log('配置字节数：', json.length);

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
