/* The guide works from a local file as well as a static web server. */
const articles = window.KEYLINKER_GUIDE;
history.scrollRestoration = 'manual';
const main = document.querySelector('main');
const modeNames = { remap: '改键模式', direct: '安卓直连模式' };
const icons = { keys: 'A↔B', stick: '◎', motor: '≋', turbo: '↯', macro: '⌘', light: '☼', tools: '⊙', test: '⊕', connect: '⌁', motion: '↻', swipe: '↗', recoil: '⇣', cloud: '☁', save: '↓', cast: '▣' };
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const articleUrl = article => `#/${article.mode}/${article.id}`;
let currentMode = 'remap';
let lastViewerTrigger;

function getCrop(step, full = false) {
  if (full || !step.marks?.length) return { x: 0, y: 0, w: 100, h: 100 };
  const marks = step.marks;
  const minX = Math.min(...marks.map(mark => mark.x));
  const minY = Math.min(...marks.map(mark => mark.y));
  const maxX = Math.max(...marks.map(mark => mark.x + mark.w));
  const maxY = Math.max(...marks.map(mark => mark.y + mark.h));
  const w = Math.min(100, Math.max(38, maxX - minX + 12));
  const h = Math.min(100, Math.max(13, maxY - minY + 8));
  return { x: Math.max(0, Math.min(100 - w, (minX + maxX - w) / 2)), y: Math.max(0, Math.min(100 - h, (minY + maxY - h) / 2)), w, h };
}

function shotHtml(step, full = false, viewer = false) {
  const dimensions = window.KEYLINKER_IMAGES[step.image];
  const crop = getCrop(step, full);
  const ratio = dimensions.width * crop.w / (dimensions.height * crop.h);
  const marks = (step.marks || []).map((mark, i) => `<span class="mark" style="left:${(mark.x - crop.x) / crop.w * 100}%;top:${(mark.y - crop.y) / crop.h * 100}%;width:${mark.w / crop.w * 100}%;height:${mark.h / crop.h * 100}%"><b>${i + 1}</b></span>`).join('');
  let sizing = '';
  if (viewer) {
    const width = Math.min(dimensions.width, window.innerWidth * .9, (window.innerHeight * .94 - 170) * ratio);
    sizing = `width:${width}px;`;
  }
  return `<div class="shot-viewport ${ratio < .85 ? 'portrait' : ''}" style="${sizing}aspect-ratio:${ratio}" data-natural-width="${dimensions.width}">
    <img loading="${viewer ? 'eager' : 'lazy'}" src="${escapeHtml(step.image)}" alt="${escapeHtml(step.caption || step.title)}" width="${dimensions.width}" height="${dimensions.height}" style="width:${10000 / crop.w}%;left:${-crop.x / crop.w * 100}%;top:${-crop.y / crop.h * 100}%">
    ${marks}
  </div>`;
}

function modeSwitch(mode) {
  return `<nav class="mode-switch" aria-label="选择连接模式"><a href="#/remap" class="${mode === 'remap' ? 'active' : ''}" ${mode === 'remap' ? 'aria-current="page"' : ''}>改键模式</a><a href="#/direct" class="${mode === 'direct' ? 'active' : ''}" ${mode === 'direct' ? 'aria-current="page"' : ''}>安卓直连模式</a></nav>`;
}

function cardHtml(article, featured = false) {
  const preview = article.mode === 'remap' ? { image: 'remap-03.png', crop: { x: 9, y: 18, w: 81, h: 32 } } : { image: 'direct-03-editor.png', crop: { x: 0, y: 0, w: 100, h: 100 } };
  const iconText = icons[article.icon] || '⊕';
  const graphic = `<div class="guide-icon" aria-hidden="true" ${article.icon === 'keys' ? 'style="font-size:18px"' : ''}>${iconText}</div>`;
  const body = `${graphic}<h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(article.summary)}</p><span class="go">查看操作步骤 <span aria-hidden="true">↗</span></span>`;
  if (!featured) return `<a class="guide-card" href="${articleUrl(article)}">${body}</a>`;
  const c = preview.crop;
  return `<a class="guide-card featured" href="${articleUrl(article)}"><div class="card-copy">${body}</div><div class="card-preview" aria-hidden="true"><img src="${preview.image}" alt="" style="width:${10000 / c.w}%;left:${-c.x / c.w * 100}%;top:${-c.y / c.h * 100}%"></div></a>`;
}

function faqHtml(mode) {
  const faqs = mode === 'remap' ? [
    ['改键模式可以做什么？', '调整手柄按键输出、摇杆、震动、连击、宏和灯光等设置。可用功能由当前连接的手柄决定。'],
    ['应用和撤销在哪里？', '改键、摇杆、马达、连击、宏、灯光和其它配置页底部都有「撤销」「应用」。修改后点「应用」，等待保存成功。如需撤销操作，点「撤销」后核对页面内容。'],
    ['为什么我的页面没有扳机设置？', '本版采集的手柄未显示独立扳机页。不同型号开放的功能可能不同，请以连接后显示的页面和该型号说明为准。']
  ] : [
    ['现在支持哪些手机平台？', '目前直连模式仅支持安卓。请按手柄型号说明进入安卓直连模式，连接后确认 App 主页显示「安卓直连模式」。'],
    ['点击应用后，还需要保存吗？', '需要。参数页「应用」更新编辑内容，整套方案还需要通过工具栏「保存」→「手柄存储」写入手柄。'],
    ['为什么只有一个手柄存储位？', '目前多数型号提供一个手柄存储位，部分旧型号提供四个。单存储设备选择「手柄存储」后会直接开始保存。'],
    ['触点和游戏按钮对不上怎么办？', '检查方案对应的游戏布局、手机方向和底图位置，在编辑器中逐一对齐触点，再保存到手柄。连接电视或投影后出现偏移，可查看投屏设置教程。']
  ];
  return `<section class="faq"><h2>你可能还想了解</h2>${faqs.map(([title, body]) => `<details><summary>${title}</summary><p>${body}</p></details>`).join('')}</section>`;
}

function home(mode) {
  currentMode = mode;
  document.title = `${modeNames[mode]} · KeyLinker App 帮助中心`;
  main.innerHTML = `<section class="hero"><h1>手柄设置指南</h1><p>选择当前连接模式，找到你想完成的操作。</p><div class="search-wrap"><input id="search" type="search" aria-label="搜索全部教程" placeholder="搜索按键、摇杆、灯光…" autocomplete="off"></div>${modeSwitch(mode)}</section>
    <div class="home-content"><section id="catalog-section"><div class="mode-intro"><h2>${modeNames[mode]}</h2><p>${mode === 'remap' ? '调整手柄本身的按键输出、手感和灯效。' : '把实体按键与摇杆，映射为安卓游戏里的触摸操作。'}</p></div><div id="catalog" class="catalog">${articles.filter(article => article.mode === mode).map((article, i) => cardHtml(article, i === 0)).join('')}</div><p class="mode-note">${mode === 'remap' ? '可用功能随手柄型号变化，请以连接后的界面为准。' : '直连模式目前仅支持安卓。请先按手柄型号说明完成连接。'}</p></section>${faqHtml(mode)}</div>`;
  document.querySelector('#search').addEventListener('input', event => search(event.target.value));
}

function search(query) {
  const normalized = query.trim().toLowerCase().replaceAll('改建', '改键');
  const catalog = document.querySelector('#catalog');
  const heading = document.querySelector('.mode-intro');
  catalog.classList.toggle('search-results', Boolean(normalized));
  if (!normalized) {
    heading.innerHTML = `<h2>${modeNames[currentMode]}</h2><p>${currentMode === 'remap' ? '调整手柄本身的按键输出、手感和灯效。' : '把实体按键与摇杆，映射为安卓游戏里的触摸操作。'}</p>`;
    catalog.innerHTML = articles.filter(article => article.mode === currentMode).map((article, i) => cardHtml(article, i === 0)).join('');
    return;
  }
  const results = articles.filter(article => `${modeNames[article.mode]} ${article.title} ${article.summary} ${article.intro} ${article.steps.map(step => step.body).join(' ')}`.toLowerCase().includes(normalized));
  heading.innerHTML = `<h2>搜索结果</h2><p role="status">全部模式 · 找到 ${results.length} 篇教程</p>`;
  catalog.innerHTML = results.length ? results.map(article => `<a class="guide-card" href="${articleUrl(article)}"><span class="eyebrow">${modeNames[article.mode]}</span><h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(article.summary)}</p><span class="go">查看步骤 ↗</span></a>`).join('') : '<div class="empty">暂未找到匹配教程。试试「按键」「宏」或「保存」。</div>';
}

function articlePage(article) {
  currentMode = article.mode;
  document.title = `${article.title} · KeyLinker`;
  const siblings = articles.filter(item => item.mode === article.mode);
  const links = siblings.map(item => `<a href="${articleUrl(item)}" ${item.id === article.id ? 'aria-current="page"' : ''}>${escapeHtml(item.title)}</a>`).join('');
  main.innerHTML = `<div class="article-shell"><nav class="side-nav" aria-label="${modeNames[article.mode]}教程"><p>${modeNames[article.mode]}</p>${links}</nav><article class="article"><div class="breadcrumbs"><a href="#/">帮助中心</a><span aria-hidden="true">›</span><a href="#/${article.mode}">${modeNames[article.mode]}</a></div><details class="mobile-catalog"><summary>本模式全部教程</summary>${links}</details><h1>${escapeHtml(article.title)}</h1><p class="article-lead">${escapeHtml(article.intro)}</p>
    ${article.example ? `<aside class="example"><strong>${escapeHtml(article.example.title)}</strong><p>${escapeHtml(article.example.body)}</p></aside>` : ''}
    ${article.steps.map((step, index) => `<section class="step ${step.image && window.KEYLINKER_IMAGES[step.image].height > window.KEYLINKER_IMAGES[step.image].width ? 'has-portrait' : ''}"><div class="step-heading"><span class="step-number" aria-hidden="true">${index + 1}</span><h2>${escapeHtml(step.title)}</h2></div><p class="step-body">${escapeHtml(step.body)}</p>${step.image ? `<figure><button type="button" class="shot-button" data-view="${index}" aria-label="查看${escapeHtml(step.title)}的完整标注大图">${shotHtml(step)}</button><figcaption><div class="caption-line"><span>${escapeHtml(step.caption || step.title)}</span><button type="button" data-view="${index}">查看完整标注大图 ↗</button></div>${step.marks?.length ? `<div class="mark-legend">${step.marks.map((mark, i) => `<span><b>${i + 1}</b>${escapeHtml(mark.label)}</span>`).join('')}</div>` : ''}</figcaption></figure>` : ''}</section>`).join('')}
    ${article.notes?.length ? `<aside class="notes"><h2>使用提示</h2>${article.notes.map(note => `<p>${escapeHtml(note)}</p>`).join('')}</aside>` : ''}
    <section class="related"><h2>接下来可以查看</h2>${(article.related || []).map(id => articles.find(item => item.id === id)).filter(Boolean).map(item => `<a href="${articleUrl(item)}">${escapeHtml(item.title)}</a>`).join('')}<a href="#/${article.mode}">返回${modeNames[article.mode]}目录</a></section></article></div>`;
  main.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => openViewer(article.steps[Number(button.dataset.view)], button)));
}

function aboutPage() {
  document.title = '关于本版指南 · KeyLinker';
  main.innerHTML = `<article class="about"><div class="breadcrumbs"><a href="#/">帮助中心</a><span>›</span><span>关于本版指南</span></div><h1>关于本版指南</h1><p>本版根据 2026 年 11 月 10 日的 ADB 实机截图、App 内置说明和功能读取记录整理，参考 Android App 3.73 与当时连接的设备版本 1.21。</p><h2>选择适用的模式</h2><p>改键模式用于调整手柄本身的输出和参数。安卓直连模式用于配置手机屏幕的触摸映射。两种模式的宏、连击和保存流程各有对应教程。</p><div class="flow">改键模式<br>修改参数 → 点击应用 → 等待保存成功 → 检查输出</div><div class="flow">安卓直连模式<br>编辑触点与参数 → 应用到编辑内容 → 保存到手柄 → 核对游戏布局</div><h2>按当前设备的界面操作</h2><p>目前直连仅支持安卓。多数现款提供一个手柄存储位，部分旧款提供四个。具体功能、分组和参数以连接设备后显示的界面为准。截图中的数值用于展示界面。</p><h2>第一版的内容范围</h2><p>本版整理了已采集的配置页面与操作路径。改键模式的撤销恢复范围、实体连击启停、宏录制与循环效果，以及直连在实际游戏中的触摸效果和投屏校准结果，仍需结合具体手柄进行验证。固件升级等仅确认菜单入口的功能保留入口说明。</p><a class="back-home" href="#/">← 返回帮助中心</a></article>`;
}

function route() {
  const [, mode, id] = location.hash.split('/');
  const article = articles.find(item => item.id === id && item.mode === mode);
  if (mode === 'about') aboutPage();
  else if (article) articlePage(article);
  else if (mode === undefined || mode === '' || ['remap', 'direct'].includes(mode) && !id) home(mode === 'direct' ? 'direct' : 'remap');
  else { main.innerHTML = '<div class="about"><h1>这篇教程暂未收录</h1><a href="#/">返回帮助中心</a></div>'; }
  document.querySelectorAll('.header-inner nav a').forEach(link => {
    if (link.hash === `#/${currentMode}` && mode !== 'about') link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  window.scrollTo(0, 0);
  requestAnimationFrame(() => window.scrollTo(0, 0));
}

function openViewer(step, trigger) {
  lastViewerTrigger = trigger;
  const viewer = document.querySelector('#viewer');
  const scroll = document.querySelector('#viewer-scroll');
  document.querySelector('#viewer-title').textContent = step.title;
  document.querySelector('#viewer-caption').textContent = (step.marks || []).map((mark, i) => `${i + 1} ${mark.label}`).join('　') || step.caption;
  scroll.classList.remove('zoomed');
  scroll.innerHTML = shotHtml(step, true, true);
  document.querySelector('#zoom').textContent = '放大原图';
  viewer.showModal();
  scroll.scrollTop = 0;
}

document.querySelector('#close-viewer').addEventListener('click', () => document.querySelector('#viewer').close());
document.querySelector('#viewer').addEventListener('close', () => lastViewerTrigger?.focus());
document.querySelector('#viewer').addEventListener('click', event => { if (event.target === event.currentTarget) event.currentTarget.close(); });
document.querySelector('#zoom').addEventListener('click', event => {
  const scroll = document.querySelector('#viewer-scroll');
  const shot = scroll.querySelector('.shot-viewport');
  const zoomed = scroll.classList.toggle('zoomed');
  if (!shot.dataset.fittedWidth) shot.dataset.fittedWidth = shot.style.width;
  shot.style.width = zoomed ? `${shot.dataset.naturalWidth}px` : shot.dataset.fittedWidth;
  event.currentTarget.textContent = zoomed ? '适应屏幕' : '放大原图';
});
window.addEventListener('hashchange', () => { route(); main.focus({ preventScroll: true }); });
document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  main.focus();
  main.scrollIntoView();
});
route();
