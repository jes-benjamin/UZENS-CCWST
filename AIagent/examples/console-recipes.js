/* ============================================================================
   console-recipes.js —— 可直接粘到浏览器控制台的常用配方
   这些只是片段，不是完整可运行脚本；按需复制某一段执行。
   ============================================================================ */

// ---- A. 认识 API ----
// UZ.ai.describe();                 // 能力清单
// UZ.ai.getState();                 // { lang, theme, page, url }
// UZ.ai.getConfig();                // 全部配置快照

// ---- B. 切语言 / 切主题 ----
// UZ.ai.setLang('ja');
// UZ.ai.setTheme('light');

// ---- C. 改文案（四语言）----
// UZ.ai.setText('section_title', '一体化平台', 'zh');
// UZ.ai.setText('section_title', 'All-in-one', 'en');

// ---- D. 换图 / 改滤镜 ----
// UZ.ai.setImage('#showcaseImg', 'https://example.com/banner.png');
// UZ.ai.setImageFilter('#showcaseImg', { brightness: 1.1, saturate: 1.3, rotate: 2 });
// UZ.ai.getImageInfo('#showcaseImg');       // 先读后改
// UZ.ai.resetImageFilter('#showcaseImg');   // 恢复原样

// ---- E. 数据驱动列表 ----
// UZ.ai.setList('features', [
//   { icon:'★', desc:{zh:'新特性',en:'New',tw:'新特性',ja:'新機能'},
//     paras:[{zh:'说明文字',en:'Desc',tw:'說明',ja:'説明'}] }
// ]);
// UZ.ai.addListItem('features', { icon:'●', desc:{zh:'再来一项',en:'More',tw:'再來',ja:'追加'}, paras:[] });

// ---- F. 批量一次完成 ----
// UZ.ai.apply([
//   { op:'setLang', args:['en'] },
//   { op:'setTheme', args:['dark'] },
//   { op:'setText', args:['hero_sub','Built for everyone','en'] },
//   { op:'setImageFilter', args:['#showcaseImg',{ grayscale:1 }] }
// ]);

// ---- G. 导出配置为 JSON（永久保存要写回 txt）----
// copy(UZ.ai.exportConfig());
