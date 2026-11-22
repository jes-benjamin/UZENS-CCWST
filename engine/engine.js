/* ============================================================================
   engine.js —— 通用渲染引擎（本源码包的核心）
   ============================================================================
   这个文件做一件事：把 content/*.txt 里配置的"数据"，
   渲染到 index.html / about.html 这些"只有骨架"的页面上。

   整个架构的核心思想只有三句话：
     ① txt 用 <script src> 当 JS 加载，往 window.SITE_PAGES 仓库里塞配置对象；
     ② 本引擎按 body[data-page] 找到当前页的配置；
     ③ 把配置里的文字/数组，通过 data-i18n / data-list 这些标记填进页面。

   为什么这样设计？见 DOCS.md。下面按"从工具到启动"的顺序逐段实现。

   【本版新增】
     · 第 8 部分：自动翻译 API（谷歌/必应/有道，默认关闭）
     · 第 9 部分：图片修改 API（换图 + CSS 滤镜/旋转/翻转，配置 + 运行时）
     · 第 10 部分：AI Agent 接入 API（window.UZ.ai，自描述、可批量改内容）
   ============================================================================ */
(function () {
    'use strict';

    /* ==================================================================
       第 0 部分：最基础的三个小工具
       ================================================================== */

    /* $ / $$ ：querySelector 的简写，后面到处要用 */
    var $ = function (sel, root) { return (root || document).querySelector(sel); };
    var $$ = function (sel, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    };

    /* esc：把文字里的 < > & " ' 转成安全字符。
       因为我们要用 innerHTML 拼 HTML，用户输入里的 <script> 之类必须转义，
       否则会破坏页面结构（甚至造成 XSS）。这是拼接 HTML 的必备习惯。 */
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    /* L：从"多语言对象"里取当前语言的文字。
       配置里经常写 { zh:'标题', en:'Title', tw:'標題', ja:'タイトル' }，
       这个函数帮你取当前语言的值；没有当前语言就退回中文，再退回英文。
       如果传进来的不是对象（就是普通字符串），原样返回。 */
    function L(obj) {
        if (obj == null) return '';
        if (typeof obj !== 'object') return obj;
        return obj[state.lang] || obj.zh || obj.en || '';
    }

    /* ph：生成一个内联 SVG 占位图（data URI）。
       好处是"永不 404"——图片没配置时显示这个灰块，不依赖任何外部文件。 */
    function ph(w, h, label) {
        w = w || 800; h = h || 450;
        var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h + "'>" +
            "<rect width='" + w + "' height='" + h + "' fill='#1b1b22'/>" +
            "<rect x='1' y='1' width='" + (w - 2) + "' height='" + (h - 2) + "' fill='none' stroke='#3a3a44' stroke-width='2'/>" +
            "<text x='50%' y='50%' fill='#6a6a76' font-family='sans-serif' font-size='22' text-anchor='middle' dominant-baseline='middle'>" +
            esc(label || '图片') + "</text></svg>";
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    /* ==================================================================
       第 1 部分：读取配置仓库
       ================================================================== */

    /* window.SITE_PAGES 是所有 txt 共同写入的"仓库"。
       global 是全站配置；pageKey 来自 <body data-page="index">，
       cur 就是当前页自己的配置（比如 window.SITE_PAGES.index）。 */
    var PAGES = window.SITE_PAGES || {};
    var G = PAGES.global;
    var pageKey = document.body.getAttribute('data-page') || '';
    var cur = PAGES[pageKey] || {};

    /* 自动翻译配置（来自 content/i18n.txt，可选）。没加载时为空对象，功能关闭。 */
    var AI18N = PAGES.i18nConfig || {};

    /* 运行状态：当前语言、当前主题。 */
    var state = { lang: 'zh', theme: 'dark' };

    /* 兜底：如果 global.txt 没加载（比如文件路径写错），
       给一句友好提示，而不是让用户面对白屏不知所措。 */
    if (!G) {
        var tip = document.createElement('div');
        tip.setAttribute('style', 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#111;color:#eee;font:16px/1.7 sans-serif;text-align:center;padding:2rem;z-index:99999');
        tip.textContent = '内容配置未加载：请把本页与 content/ 文件夹放在一起，并确认已加载 content/global.txt。';
        document.body.appendChild(tip);
        return;
    }

    /* ==================================================================
       第 2 部分：i18n —— 把全站文案和本页文案"按语言合并"
       ================================================================== */

    /* I18N 是合并后的大字典：I18N.zh.字段名 / I18N.en.字段名 …
       合并规则：先放全站的，再用本页的覆盖同名字段（本页优先）。
       这样"通用的放 global，专有的放本页"，既共享又可覆盖。 */
    var I18N = { zh: {}, en: {}, tw: {}, ja: {} };
    function mergeI18n() {
        ['zh', 'en', 'tw', 'ja'].forEach(function (lang) {
            var g = (G.i18n && G.i18n[lang]) || {};
            var p = (cur.i18n && cur.i18n[lang]) || {};
            var out = {};
            Object.keys(g).forEach(function (k) { out[k] = g[k]; });   // 全站打底
            Object.keys(p).forEach(function (k) { out[k] = p[k]; });   // 本页覆盖
            I18N[lang] = out;
        });
    }

    /* 把当前语言的字典应用到所有带 data-i18n 的元素上。
       例如 <h2 data-i18n="section_title">大标题</h2>，
       就会变成 I18N[currentLang].section_title 的值。
       data-i18n-aria / data-i18n-title 用类似方式处理无障碍属性。 */
    function applyI18n() {
        var d = I18N[state.lang] || {};
        $$('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (d[key] != null) el.textContent = d[key];
        });
        $$('[data-i18n-aria]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-aria');
            if (d[key] != null) el.setAttribute('aria-label', d[key]);
        });
        applyPageName(d);                          // 网页名称（题头）：来自本页 pageName
        document.documentElement.lang = state.lang;
    }

    /* 网页名称（题头）：每个页面的 txt 可用 pageName 字段（四语言对象）
       自定义"这页叫什么"。引擎同时更新两处：
         ① 浏览器标签 document.title（SEO / 书签用）
         ② 页面上带 id="pageName" 的可见标题元素（如果 HTML 里有）
       取值优先级：pageName > i18n.docTitle > global.siteInfo.title。
       pageName 用 L() 读取，切语言时会自动跟着变。 */
    function applyPageName(d) {
        d = d || (I18N[state.lang] || {});
        var name = L(cur.pageName) || d.docTitle || (G.siteInfo && G.siteInfo.title) || 'UZENS CCWST';
        document.title = name;
        var el = $('#pageName');
        if (el) el.textContent = name;
    }

    /* ==================================================================
       第 3 部分：主题与语言（都记住用户上次的选择）
       ================================================================== */

    function detectTheme() {
        var q = new URLSearchParams(location.search).get('theme');
        if (q === 'light' || q === 'dark') return q;                 // 网址参数最高优先
        var saved = null;
        try { saved = localStorage.getItem('theme'); } catch (e) {}  // 其次用本地记忆
        if (saved === 'light' || saved === 'dark') return saved;
        return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark'; // 最后跟随系统
    }
    function setTheme(t, save) {
        state.theme = t;
        document.documentElement.setAttribute('data-theme', t);     // CSS 靠这个属性切深浅色
        if (save !== false) { try { localStorage.setItem('theme', t); } catch (e) {} }
    }

    function detectLang() {
        var q = new URLSearchParams(location.search).get('lang');
        if (q && I18N[q]) return q;
        var saved = null;
        try { saved = localStorage.getItem('lang'); } catch (e) {}
        if (saved && I18N[saved]) return saved;
        var nav = (navigator.language || '').toLowerCase();
        if (nav.indexOf('zh-tw') === 0 || nav.indexOf('zh-hk') === 0) return 'tw';
        if (nav.indexOf('zh') === 0) return 'zh';
        if (nav.indexOf('ja') === 0) return 'ja';
        return 'en';
    }
    function setLang(l, save) {
        state.lang = l;
        applyI18n();             // 更新所有 data-i18n 文字
        renderNav();             // 重新渲染导航（导航文字也来自 i18n）
        renderShowcase();        // 重新渲染含多语言对象的部件
        renderLists();           // 重新渲染列表（里面的四语言对象也要跟着变）
        renderLangSeg();         // 更新语言按钮高亮
        if (save !== false) { try { localStorage.setItem('lang', l); } catch (e) {} }
    }

    /* ==================================================================
       第 4 部分：字体与背景 —— 用 CSS 变量做"配置层"
       ================================================================== */

    /* 这是这套架构里很巧的一个手法：
       JS 不改任何一条 CSS 规则，只往 html/body 上写几个 CSS 变量，
       CSS 里到处用 var(--xxx, 回退值) 读取。
       好处：默认不写变量时，CSS 用回退值 = 模板原样（零影响）；
       一旦配置，变量一写就全局生效。改主题也不用重算样式。 */
    function applyFonts() {
        var root = document.documentElement;
        if (G.font && G.font.site && G.font.site !== '#') root.style.setProperty('--font-ui', G.font.site);
        var f = cur.font || {};
        var body = document.body;
        if (f.title && f.title !== '#') body.style.setProperty('--pg-title', f.title);
        if (f.button && f.button !== '#') body.style.setProperty('--pg-btn', f.button);
        if (f.text && f.text !== '#') body.style.setProperty('--pg-text', f.text);
        if (f.modal && f.modal !== '#') body.style.setProperty('--modal-font', f.modal);
    }
    function applyBackground() {
        var root = document.documentElement;
        var b = (G && G.background) || {};
        var set = function (k, v) { if (v && v !== '#') root.style.setProperty(k, v); };
        if (b.image && b.image !== '#') set('--bg-img', 'url("' + String(b.image).replace(/"/g, '%22') + '")');
        set('--bg-color', b.color);
        if (b.blur && b.blur !== '#') set('--bg-blur', parseFloat(b.blur) + 'px');
        set('--bg-bright', b.brightness);
        var ov = $('.background-overlay');
        if (ov) {
            if (b.overlay === false) ov.style.display = 'none';
            ['blue', 'purple'].forEach(function (t) { ov.classList.remove('tone-' + t); });
            if (b.tone && b.tone !== '#' && ['blue', 'purple'].indexOf(b.tone) >= 0) ov.classList.add('tone-' + b.tone);
        }
    }

    /* ==================================================================
       第 5 部分：数据驱动渲染 —— 把数组变成页面上的卡片
       ================================================================== */

    /* 渲染函数的"注册表"：键名对应配置里的数组名，也对应 HTML 上的 data-list 值。
       <div data-list="features"></div> → 引擎找到 features 数组 → 调用这里的函数生成卡片。
       想新增一种列表？只要：① 配置里加一个数组；② 这里加一个同名函数；
       ③ HTML 放一个 data-list="数组名" 的空容器。三步即可，互不影响。 */
    var RENDERERS = {

        /* 首页功能卡片 */
        features: function (item) {
            var paras = (item.paras || []).map(function (p) {
                return '<p>' + esc(L(p)) + '</p>';
            }).join('');
            return '<article class="card reveal">' +
                '<div class="card-icon">' + esc(item.icon || '✦') + '</div>' +
                '<h3>' + esc(L(item.desc)) + '</h3>' + paras +
                '</article>';
        },

        /* 关于页作品卡片 */
        works: function (item) {
            var unset = !item.url;
            return '<article class="card work-card reveal">' +
                '<div class="work-badge">' + esc(L(item.tag)) + '</div>' +
                '<h3>' + esc(L(item.title)) + '</h3>' +
                '<p>' + esc(L(item.desc)) + '</p>' +
                (unset
                    ? '<button class="btn btn-ghost" data-link-unset>按钮</button>'
                    : '<a class="btn btn-ghost" href="' + esc(item.url) + '" target="_blank" rel="noopener">按钮</a>') +
                '</article>';
        }
    };

    /* 通用列表渲染器：扫描所有 [data-list] 容器，按名字找数组和渲染函数。 */
    function renderLists() {
        $$('[data-list]').forEach(function (box) {
            var name = box.getAttribute('data-list');
            var arr = cur[name];
            var fn = RENDERERS[name];
            if (!arr || !fn) return;
            box.innerHTML = arr.map(function (item, i) {
                var html = fn(item, i);
                // 给每张卡片一个错开的进场延时，形成"循序渐进"出现的效果
                return html.replace('class="', 'style="animation-delay:' + ((i % 4) * 0.08) + 's" class="');
            }).join('');
            observeReveals();
        });
    }

    /* 渲染导航：数组 → 一串 <a>，当前页加 active 高亮。 */
    function renderNav() {
        var box = $('#navLinks');
        if (!box) return;
        var d = I18N[state.lang] || {};
        box.innerHTML = (G.nav || []).map(function (n) {
            var active = n.page === pageKey ? ' class="active"' : '';
            return '<a href="' + esc(n.href || '#') + '"' + active + '>' + esc(d[n.i18n] || '按钮') + '</a>';
        }).join('');
        var brand = $('#brandText');
        if (brand) brand.textContent = d.brand || '标题';
    }

    /* 渲染语言切换按钮并绑定点击。 */
    var LANG_NAME = { zh: '中', en: 'EN', tw: '繁', ja: '日' };
    function renderLangSeg() {
        var box = $('#langSeg');
        if (!box) return;
        box.innerHTML = Object.keys(LANG_NAME).map(function (l) {
            return '<button type="button" data-lang="' + l + '"' +
                (l === state.lang ? ' class="active"' : '') + '>' + LANG_NAME[l] + '</button>';
        }).join('');
    }

    /* 渲染图片展示块：图片地址、四语言文字、按钮链接都来自配置。
       第 9 部分的 applyFx 会在这里把 showcase.fx 里的滤镜写到图片上。 */
    function renderShowcase() {
        var box = $('#showcase');
        if (!box) return;
        var sc = cur.showcase || {};
        var img = $('#showcaseImg');
        if (img) { img.src = sc.img || ph(800, 420, '图片'); applyFx(img, sc.fx || (G.imageFx || {})); }
        var t = $('#showcaseTitle'); if (t) t.textContent = L(sc.title);
        var d = $('#showcaseDesc');  if (d) d.textContent = L(sc.desc);
        var b = $('#showcaseBtn');
        if (b) {
            var txt = $('#showcaseBtnText'); if (txt) txt.textContent = L(sc.btn);
            if (sc.url) { b.setAttribute('href', sc.url); b.removeAttribute('data-link-unset'); }
            else { b.setAttribute('href', '#'); b.setAttribute('data-link-unset', ''); }
        }
        box.style.maxWidth = (sc.width && sc.width !== '#') ? String(sc.width) : '560px';
        box.style.setProperty('--sc-scale', sc.scale || 1);
    }

    /* 打字机：逐字显示 typed.full，末尾的 highlight 用强调色。 */
    function typeWriter() {
        var el = $('#typed');
        if (!el || !cur.typed) return;
        var full = L(cur.typed.full) || '';
        var hi = L(cur.typed.highlight) || '';
        var i = 0;
        function step() {
            i++;
            var shown = full.slice(0, i);
            // 简单处理：如果显示出的部分已经包含高亮词，就把它包一层强调色
            var pos = hi ? shown.indexOf(hi) : -1;
            if (pos >= 0) {
                el.innerHTML = esc(shown.slice(0, pos)) +
                    '<span class="accent">' + esc(hi) + '</span>' +
                    esc(shown.slice(pos + hi.length)) + '<span class="cursor"></span>';
            } else {
                el.textContent = shown;
                var cur2 = document.createElement('span');
                cur2.className = 'cursor'; el.appendChild(cur2);
            }
            if (i < full.length) setTimeout(step, 90);
        }
        step();
    }

    /* ==================================================================
       第 6 部分：进场动画、Toast、事件绑定
       ================================================================== */

    /* IntersectionObserver：元素滚进视口时才加 .in 触发淡入。
       对不支持的浏览器直接全部显示，保证内容可读。 */
    var revealIO = null;
    function initReveal() {
        if (!('IntersectionObserver' in window)) return;
        revealIO = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
            });
        }, { threshold: 0.12 });
    }
    function observeReveals() {
        $$('.reveal:not(.in)').forEach(function (el) {
            if (el.__observed) return;
            el.__observed = true;
            if (revealIO) revealIO.observe(el); else el.classList.add('in');
        });
    }

    /* Toast：轻量提示条，用于"链接未配置"这类反馈。 */
    var toastTimer = null;
    function showToast(msg) {
        var t = $('#toast');
        if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
        t.textContent = msg || '内容';
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
    }

    /* 事件绑定用"事件委托"：只在 document 上挂一个点击监听，
       通过 closest 判断点到了哪类元素。这样后面动态生成的卡片也能响应，
       不用每生成一批就重新绑定一次。 */
    function bindUI() {
        var tb = $('#themeToggle');
        if (tb) tb.addEventListener('click', function () { setTheme(state.theme === 'light' ? 'dark' : 'light'); });

        /* 导航滚动时加 .scrolled：让顶栏出现毛玻璃底色 */
        var nav = $('.nav');
        if (nav) {
            var onScroll = function () {
                if (window.scrollY > 30) nav.classList.add('scrolled');
                else nav.classList.remove('scrolled');
            };
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();
        }

        document.addEventListener('click', function (e) {
            var langBtn = e.target.closest && e.target.closest('#langSeg button[data-lang]');
            if (langBtn) { setLang(langBtn.getAttribute('data-lang')); return; }

            var unset = e.target.closest && e.target.closest('[data-link-unset]');
            if (unset) { e.preventDefault(); showToast((I18N[state.lang] || {}).toast_unset || '弹窗内容'); return; }

            var modalBtn = e.target.closest && e.target.closest('[data-modal]');
            if (modalBtn) { e.preventDefault(); openModal(); }
        });
    }

    /* 通用信息弹窗 */
    function openModal() {
        var m = $('#infoModal'); if (!m) return;
        var d = I18N[state.lang] || {};
        var t = $('#infoModalTitle'); if (t) t.textContent = d.modal_title || '标题';
        var h = $('#infoModalHint');  if (h) h.textContent = d.modal_hint || '弹窗内容';
        var c = $('#infoModalClose'); if (c) c.textContent = d.modal_close || '按钮';
        m.classList.add('open'); m.setAttribute('aria-hidden', 'false');
    }
    function closeModal() {
        var m = $('#infoModal'); if (!m) return;
        m.classList.remove('open'); m.setAttribute('aria-hidden', 'true');
    }
    function bindModal() {
        var m = $('#infoModal'); if (!m) return;
        var c = $('#infoModalClose'); if (c) c.addEventListener('click', closeModal);
        m.addEventListener('click', function (e) { if (e.target === m) closeModal(); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
    }

    /* ==================================================================
       第 8 部分：自动翻译 API（谷歌 / 必应 / 有道，默认关闭）
       ------------------------------------------------------------------
       这一整块是"可选功能"：content/i18n.txt 里 enabled: '#' 时，
       autoEnabled() 返回 false，init 根本不会调用，页面零网络请求。
       开启后：收集全站中文槽位（i18n 文案 + 所有 {zh,en,tw,ja} 对象），
       调翻译 API 把中文译成 en/tw/ja，写回配置并重新渲染。
       ★ 与 studio 模板的实现完全一致，方便两个项目互相借鉴。
       ================================================================== */
    var LANG_GOOGLE = { zh: 'zh-CN', en: 'en', tw: 'zh-TW', ja: 'ja' };
    var LANG_BING = { zh: 'zh-Hans', en: 'en', tw: 'zh-Hant', ja: 'ja' };
    var LANG_YOUDAO = { zh: 'zh-CHS', en: 'en', tw: 'zh-TW', ja: 'ja' };
    function autoEnabled() { return AI18N && AI18N.enabled === true && !!AI18N.provider; }
    function decodeEntities(s) { var t = document.createElement('textarea'); t.innerHTML = s == null ? '' : String(s); return t.value; }
    function jsonResponse(r) {
        return r.text().then(function (raw) {
            var data; try { data = JSON.parse(raw); } catch (e) { throw new Error('API 返回非 JSON：' + String(raw).slice(0, 120)); }
            if (!r.ok || data.error) throw new Error(String((data.error && (data.error.message || data.error.code)) || ('HTTP ' + r.status)));
            return data;
        });
    }
    function sha256Hex(msg) {
        if (!window.crypto || !crypto.subtle || !window.TextEncoder) return Promise.reject(new Error('有道签名需要 Web Crypto（https 或 localhost）'));
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg)).then(function (buf) {
            var bytes = new Uint8Array(buf), hex = '';
            for (var i = 0; i < bytes.length; i++) hex += ('0' + bytes[i].toString(16)).slice(-2);
            return hex;
        });
    }
    function trGoogle(texts, lang) {
        var g = AI18N.google || {}; if (!g.apiKey) return Promise.reject(new Error('未填写谷歌 apiKey'));
        var p = new URLSearchParams();
        p.set('key', g.apiKey); p.set('source', LANG_GOOGLE.zh); p.set('target', LANG_GOOGLE[lang] || lang); p.set('format', 'text');
        texts.forEach(function (t) { p.append('q', t); });
        return fetch('https://translation.googleapis.com/language/translate/v2?' + p.toString()).then(jsonResponse).then(function (data) {
            var arr = (data.data && data.data.translations) || [];
            return texts.map(function (t, i) { return arr[i] ? decodeEntities(arr[i].translatedText) : t; });
        });
    }
    function trBing(texts, lang) {
        var b = AI18N.bing || {}; if (!b.apiKey) return Promise.reject(new Error('未填写必应 apiKey'));
        var p = new URLSearchParams(); p.set('api-version', '3.0'); p.set('from', LANG_BING.zh); p.set('to', LANG_BING[lang] || lang);
        var headers = { 'Ocp-Apim-Subscription-Key': b.apiKey, 'Content-Type': 'application/json' };
        if (b.region) headers['Ocp-Apim-Subscription-Region'] = b.region;
        return fetch('https://api.cognitive.microsofttranslator.com/translate?' + p.toString(), {
            method: 'POST', headers: headers, body: JSON.stringify(texts.map(function (t) { return { text: t }; }))
        }).then(jsonResponse).then(function (data) {
            return data.map(function (item, i) { var tr = (item.translations || [])[0]; return tr ? tr.text : texts[i]; });
        });
    }
    function trYoudao(texts, lang) {
        var y = AI18N.youdao || {}; if (!y.appKey || !y.appSecret) return Promise.reject(new Error('未填写有道 appKey/appSecret'));
        var q = texts.join('\n');
        var salt = String(Date.now()) + String(Math.floor(Math.random() * 100000));
        var curtime = String(Math.floor(Date.now() / 1000));
        var input = q.length <= 20 ? q : q.substring(0, 10) + q.length + q.substring(q.length - 10);
        return sha256Hex((y.appKey || '') + input + salt + curtime + (y.appSecret || '')).then(function (sign) {
            var p = new URLSearchParams();
            p.set('q', q); p.set('from', LANG_YOUDAO.zh); p.set('to', LANG_YOUDAO[lang] || lang);
            p.set('appKey', y.appKey); p.set('salt', salt); p.set('sign', sign); p.set('signType', 'v3'); p.set('curtime', curtime);
            return fetch('https://openapi.youdao.com/api?' + p.toString()).then(jsonResponse).then(function (data) {
                if (data.errorCode && data.errorCode !== '0') throw new Error('有道错误码 ' + data.errorCode);
                var arr = data.translation || [];
                var lines = (Array.isArray(arr) ? arr.join('\n') : String(arr)).split('\n');
                return texts.map(function (t, i) { return lines[i] != null ? lines[i] : (lines[0] || t); });
            });
        });
    }
    function translator() {
        if (AI18N.provider === 'bing') return trBing;
        if (AI18N.provider === 'youdao') return trYoudao;
        return trGoogle;
    }
    /* 收集所有中文槽位：i18n 字符串 + 任意 {zh,en,tw,ja} 多语言对象（覆盖所有列表） */
    function collectSlots() {
        var slots = [];
        Object.keys(I18N.zh || {}).forEach(function (k) {
            var zh = I18N.zh[k];
            if (typeof zh === 'string' && zh) {
                slots.push({ zh: zh, get: function (l) { return I18N[l] && I18N[l][k]; }, set: function (l, v) { I18N[l] = I18N[l] || {}; I18N[l][k] = v; } });
            }
        });
        function addML(o) {
            if (o && typeof o === 'object' && typeof o.zh === 'string' && o.zh) {
                slots.push({ zh: o.zh, get: function (l) { return o[l]; }, set: function (l, v) { o[l] = v; } });
                return true;
            }
            return false;
        }
        function walk(v, depth) {
            if (!v || typeof v !== 'object' || depth > 6) return;
            if (Array.isArray(v)) { v.forEach(function (x) { walk(x, depth + 1); }); return; }
            if (addML(v)) return;
            Object.keys(v).forEach(function (k) { if (k !== 'i18n') walk(v[k], depth + 1); });
        }
        [G, cur].forEach(function (root) { walk(root, 0); });
        return slots;
    }
    function wantTranslate(slot, lang) {
        if (AI18N.onlyFillMissing === false) return true;
        var c = slot.get(lang);
        return !c || c === slot.zh;
    }
    function runAutoTranslate(done) {
        if (!autoEnabled()) { if (done) done(); return; }
        var slots = collectSlots();
        var targets = (AI18N.targets && AI18N.targets.length) ? AI18N.targets : ['en', 'tw', 'ja'];
        var fn = translator();
        var chains = [];
        targets.forEach(function (lang) {
            var need = slots.filter(function (s) { return wantTranslate(s, lang); });
            if (!need.length) return;
            var byText = {};
            need.forEach(function (s) { (byText[s.zh] = byText[s.zh] || []).push(s); });
            var uniq = Object.keys(byText), batches = [];
            for (var i = 0; i < uniq.length; i += 40) batches.push(uniq.slice(i, i + 40));
            chains.push(Promise.all(batches.map(function (batch) {
                return Promise.resolve().then(function () { return fn(batch, lang); }).then(function (results) {
                    batch.forEach(function (text, i) {
                        var v = results[i] != null ? results[i] : text;
                        byText[text].forEach(function (s) { s.set(lang, v); });
                    });
                });
            })));
        });
        Promise.all(chains).then(function () { if (done) done(); }).catch(function (e) {
            if (window.console) console.warn('[i18n] 自动翻译未完成：' + ((e && e.message) || e));
            if (done) done();
        });
    }

    /* ==================================================================
       第 9 部分：图片修改 API（运行时换图 + CSS 滤镜，配置 + 动态）
       ------------------------------------------------------------------
       两个入口：
         A) 配置：在 txt 里写 showcase.fx / imageFx 对象（字段见下），
            引擎渲染时把滤镜写到图片上，和字/背景一样"改 txt 即改外观"。
         B) 运行时：window.UZ.image.set()/filter()/reset()/applyAll()，
            AI Agent 或开发者在控制台调用即可即时换图、调滤镜。
       支持的滤镜字段（都是可选，写 '#' 或等于默认值 = 不生效）：
         brightness 亮度(1) contrast 对比度(1) saturate 饱和度(1)
         grayscale 灰度(0) blur 模糊px(0) sepia 复古(0) invert 反色(0)
         hueRotate 色相旋转deg(0) opacity 不透明度(1)
       变换字段（走 transform，不是 filter）：
         rotate 旋转deg(0) scale 缩放(1) flipX/flipY 水平/垂直翻转(false)
       ================================================================== */
    var FILTER_FIELDS = [
        ['brightness', 'brightness', '', 1],
        ['contrast', 'contrast', '', 1],
        ['saturate', 'saturate', '', 1],
        ['grayscale', 'grayscale', '', 0],
        ['blur', 'blur', 'px', 0],
        ['sepia', 'sepia', '', 0],
        ['invert', 'invert', '', 0],
        ['hueRotate', 'hue-rotate', 'deg', 0],
        ['opacity', 'opacity', '', 1]
    ];
    /* 把滤镜对象转成 CSS filter 字符串 */
    function filterCSS(fx) {
        if (!fx || typeof fx !== 'object') return '';
        var parts = [];
        FILTER_FIELDS.forEach(function (f) {
            var v = fx[f[0]];
            if (v == null || v === '#' || Number(v) === f[3]) return;
            parts.push(f[1] + '(' + v + f[2] + ')');
        });
        return parts.join(' ');
    }
    /* 把变换对象转成 CSS transform 字符串（rotate/scale/flip） */
    function transformCSS(fx) {
        if (!fx || typeof fx !== 'object') return '';
        var parts = [];
        if (fx.rotate != null && fx.rotate !== '#' && Number(fx.rotate) !== 0) parts.push('rotate(' + fx.rotate + 'deg)');
        if (fx.scale != null && fx.scale !== '#' && Number(fx.scale) !== 1) parts.push('scale(' + fx.scale + ')');
        var sx = fx.flipX === true ? -1 : 1, sy = fx.flipY === true ? -1 : 1;
        if (sx !== 1 || sy !== 1) parts.push('scale(' + sx + ',' + sy + ')');
        return parts.join(' ');
    }
    /* 把滤镜写到某个 <img> 上 */
    function applyFx(img, fx) {
        if (!img) return;
        var f = filterCSS(fx), t = transformCSS(fx);
        if (f) img.style.filter = f;
        if (t) img.style.transform = t;
        img.setAttribute('data-fx-current', JSON.stringify(fx || {}));
    }
    /* 清掉某张图的滤镜，恢复原样 */
    function resetFx(img) {
        if (!img) return;
        img.style.filter = '';
        img.style.transform = '';
        img.setAttribute('data-fx-current', '{}');
    }
    /* 把配置里所有的图片滤镜应用一遍（展示块 + 带 data-fx 的图片） */
    function applyImageFxAll() {
        var img = $('#showcaseImg');
        if (img) { var sc = cur.showcase || {}; applyFx(img, sc.fx || (G.imageFx || {})); }
        $$('img[data-fx]').forEach(function (el) {
            try { applyFx(el, JSON.parse(el.getAttribute('data-fx'))); } catch (e) {}
        });
    }
    /* 运行时换图：sel 可以是 CSS 选择器，也可以是 DOM 元素 */
    function setImage(sel, src) {
        var el = typeof sel === 'string' ? $(sel) : sel;
        if (!el || el.tagName !== 'IMG') return false;
        el.src = src || ph();
        return true;
    }
    /* 运行时改滤镜：返回生成的 CSS filter，便于调用方确认 */
    function setFilter(sel, fx) {
        var el = typeof sel === 'string' ? $(sel) : sel;
        applyFx(el, fx);
        return filterCSS(fx);
    }
    /* 读取某张图的当前状态（地址 + 滤镜），AI Agent 可先读后改 */
    function getImageInfo(sel) {
        var el = typeof sel === 'string' ? $(sel) : sel;
        if (!el || el.tagName !== 'IMG') return null;
        var raw = el.getAttribute('data-fx-current') || '{}';
        var fx; try { fx = JSON.parse(raw); } catch (e) { fx = {}; }
        return { selector: typeof sel === 'string' ? sel : '(element)', src: el.getAttribute('src'), filter: el.style.filter, transform: el.style.transform, fx: fx };
    }

    /* ==================================================================
       第 10 部分：AI Agent 接入 API（window.UZ.ai）
       ------------------------------------------------------------------
       目标：让 AI Agent / 开发者用一组稳定、语义化的方法读写这个站点，
       不必先读 engine.js 源码。设计原则：
         · describe() 自描述：Agent 调用它就知道有哪些能力、怎么传参；
         · getConfig()/exportConfig() 先读现状，再决定怎么改；
         · 每个 set* 改完立即重渲染，"所见即所得"；
         · apply([...]) 批量执行，一次完成多处修改。
       ================================================================== */
    function aiDescribe() {
        return {
            project: 'UZENS CCWST',
            fullName: 'UZENS Convenient Configure WebSite Technology',
            version: '1.1',
            summary: '通过 window.UZ.ai 读写本站内容与外观；所有修改会即时渲染到页面。',
            capabilities: [
                { name: 'describe', args: [], desc: '返回本能力清单。' },
                { name: 'getState', args: [], desc: '返回当前 lang / theme / page。' },
                { name: 'getConfig', args: [], desc: '返回当前页配置与全站配置的副本。' },
                { name: 'exportConfig', args: [], desc: '把整个 window.SITE_PAGES 导出为 JSON 字符串。' },
                { name: 'setLang', args: ['lang'], desc: "切换语言：'zh'|'en'|'tw'|'ja'。" },
                { name: 'setTheme', args: ['theme'], desc: "切换主题：'light'|'dark'。" },
                { name: 'setText', args: ['key', 'value', 'lang?'], desc: '改某条 i18n 文案；lang 省略则用当前语言。' },
                { name: 'setPageName', args: ['name', 'lang?'], desc: '改本页网页名称/题头（document.title + #pageName）；lang 省略则用当前语言。' },
                { name: 'setList', args: ['name', 'array'], desc: '整体替换一个数据列表（如 features/works）。' },
                { name: 'addListItem', args: ['name', 'item'], desc: '向某个数据列表追加一项。' },
                { name: 'setImage', args: ['selector', 'src'], desc: '替换某张图片地址。selector 如 "#showcaseImg"。' },
                { name: 'setImageFilter', args: ['selector', 'fx'], desc: '给某张图片设置滤镜对象（见第9部分字段）。' },
                { name: 'getImageInfo', args: ['selector'], desc: '读取某张图片的地址与当前滤镜。' },
                { name: 'showToast', args: ['msg'], desc: '弹出一条轻提示。' },
                { name: 'openModal', args: [], desc: '打开信息弹窗。' },
                { name: 'closeModal', args: [], desc: '关闭信息弹窗。' },
                { name: 'translateTo', args: ['lang'], desc: '触发自动翻译到指定语言（需先在 i18n.txt 开启并填密钥）。' },
                { name: 'rerender', args: [], desc: '按当前配置重新渲染全部部件。' },
                { name: 'apply', args: ['changes'], desc: '批量执行：changes 为 [{op, args:[]}...]，如 [{op:"setLang",args:["en"]}]。' }
            ]
        };
    }
    function aiGetState() {
        return { lang: state.lang, theme: state.theme, page: pageKey, url: location.href };
    }
    function aiGetConfig() {
        return { global: JSON.parse(JSON.stringify(G)), page: JSON.parse(JSON.stringify(cur)), i18n: JSON.parse(JSON.stringify(I18N)), i18nConfig: JSON.parse(JSON.stringify(AI18N)) };
    }
    function aiExportConfig() {
        try { return JSON.stringify(window.SITE_PAGES, null, 2); } catch (e) { return ''; }
    }
    function aiSetText(key, value, lang) {
        lang = lang || state.lang;
        I18N[lang] = I18N[lang] || {};
        I18N[lang][key] = value;
        // 同步回写源配置，保证 exportConfig 也反映修改
        if (lang === 'zh' && G.i18n && G.i18n.zh && (key in G.i18n.zh)) G.i18n.zh[key] = value;
        if (cur.i18n && cur.i18n[lang] && (key in cur.i18n[lang])) cur.i18n[lang][key] = value;
        applyI18n(); renderNav(); renderShowcase(); renderLists();
        return value;
    }
    /* 改本页网页名称（题头）：写入 cur.pageName 的对应语言，
       再走 applyPageName 同步 document.title 与可见标题。 */
    function aiSetPageName(name, lang) {
        lang = lang || state.lang;
        cur.pageName = cur.pageName || {};
        cur.pageName[lang] = name;
        if (lang === state.lang) applyPageName();
        return name;
    }
    function aiSetList(name, array) {
        if (!Array.isArray(array)) return false;
        cur[name] = array;
        renderLists();
        return true;
    }
    function aiAddListItem(name, item) {
        if (!Array.isArray(cur[name])) cur[name] = [];
        cur[name].push(item);
        renderLists();
        return cur[name].length;
    }
    function aiRerender() {
        mergeI18n();
        applyFonts(); applyBackground();
        applyImageFxAll();
        setLang(state.lang, false);
    }
    function aiApply(changes) {
        if (!Array.isArray(changes)) return { ok: 0, fail: 0, errors: ['changes 必须是数组'] };
        var ok = 0, fail = 0, errors = [];
        changes.forEach(function (c) {
            var fn = UZ && UZ.ai && c && UZ.ai[c.op];
            if (typeof fn !== 'function') { fail++; errors.push('未知操作：' + (c && c.op)); return; }
            try { fn.apply(null, c.args || []); ok++; }
            catch (e) { fail++; errors.push((c && c.op) + ': ' + ((e && e.message) || e)); }
        });
        return { ok: ok, fail: fail, errors: errors };
    }
    var UZ_AI = {
        version: '1.1',
        describe: aiDescribe,
        getState: aiGetState,
        getConfig: aiGetConfig,
        exportConfig: aiExportConfig,
        setLang: function (l) { if (I18N[l]) setLang(l); return state.lang; },
        setTheme: function (t) { if (t === 'light' || t === 'dark') setTheme(t); return state.theme; },
        setText: aiSetText,
        setPageName: aiSetPageName,
        setList: aiSetList,
        addListItem: aiAddListItem,
        setImage: setImage,
        setImageFilter: setFilter,
        resetImageFilter: function (sel) { resetFx(typeof sel === 'string' ? $(sel) : sel); return true; },
        getImageInfo: getImageInfo,
        applyImageFxAll: applyImageFxAll,
        filterCSS: filterCSS,
        transformCSS: transformCSS,
        showToast: showToast,
        openModal: openModal,
        closeModal: closeModal,
        translateTo: function (lang) { return runAutoTranslate(function () { setLang(state.lang, false); }); },
        rerender: aiRerender,
        apply: aiApply
    };

    /* ==================================================================
       第 7 部分：启动
       ================================================================== */
    function init() {
        mergeI18n();                              // ① 先合并字典，后面才能取文字
        state.lang = detectLang();                // ② 确定语言和主题
        state.theme = detectTheme();
        document.documentElement.setAttribute('data-theme', state.theme);
        applyFonts(); applyBackground();          // ③ 写入字体/背景 CSS 变量
        applyImageFxAll();                        //    应用配置里的图片滤镜
        initReveal();
        bindUI(); bindModal();
        setLang(state.lang, false);               // ④ 应用文字 + 触发所有渲染（含导航）
        if (pageKey === 'index') typeWriter();    // ⑤ 首页才跑打字机
        if (autoEnabled()) runAutoTranslate(function () { setLang(state.lang, false); }); // ⑥ 可选自动翻译
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    /* 暴露工具到 window.UZ，方便学习者调试、自定义交互，以及 AI Agent 接入。
       · UZ.*     ：基础工具（与旧版一致，向后兼容）
       · UZ.image ：第 9 部分的图片修改 API
       · UZ.ai    ：第 10 部分的 AI Agent 接入 API（自描述、可批量） */
    window.UZ = {
        $: $, $$: $$, L: L, esc: esc, showToast: showToast, setLang: setLang, setTheme: setTheme,
        I18N: I18N, state: state,
        image: {
            set: setImage, filter: setFilter, reset: resetFx,
            get: getImageInfo, applyAll: applyImageFxAll,
            filterCSS: filterCSS, transformCSS: transformCSS
        },
        ai: UZ_AI
    };
})();
