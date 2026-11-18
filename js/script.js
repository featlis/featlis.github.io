// Featlis's Portfolio — console script (rebuild v3)
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- テーマ切替 ---------- */
function applyThemeIcon() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.innerHTML = dark ? '<svg class="ic" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z"/></svg>' : '<svg class="ic" viewBox="0 0 384 512" aria-hidden="true" focusable="false"><path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"/></svg>';
    btn.setAttribute('aria-label', dark ? 'ライトモードに切り替え' : 'ダークモードに切り替え');
}
function initTheme() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    applyThemeIcon();
    btn.addEventListener('click', () => {
        const dark = document.documentElement.getAttribute('data-theme') !== 'dark';
        if (dark) document.documentElement.setAttribute('data-theme', 'dark');
        else document.documentElement.removeAttribute('data-theme');
        try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) { /* そのまま */ }
        applyThemeIcon();
        syncStats();
    });
}


function syncStats() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.querySelectorAll('img.stats-card[data-light-src]').forEach((img) => {
        img.src = dark ? img.getAttribute('data-dark-src') : img.getAttribute('data-light-src');
    });
}

/* ---------- 入場演出 ---------- */
let introActive = false;
function initIntro() {
    const intro = document.getElementById('intro');
    if (!intro) return false;
    let seen = false;
    try { seen = sessionStorage.getItem('introSeen') === '1'; } catch (e) { /* そのまま */ }
    if (REDUCED || seen) { intro.remove(); return false; }
    document.body.style.overflow = 'hidden';
    const finish = () => {
        if (!intro.isConnected) return;
        intro.classList.add('done');
        try { sessionStorage.setItem('introSeen', '1'); } catch (e) { /* そのまま */ }
        document.body.style.overflow = '';
        setTimeout(() => intro.remove(), 780);
    };
    intro.addEventListener('click', finish);
    setTimeout(finish, 1250);
    return true;
}

/* ---------- タイトルのタイピング ---------- */
function initTyping() {
    const el = document.getElementById('typedTitle');
    if (!el) return;
    const text = el.getAttribute('data-text') || el.textContent.trim();
    if (REDUCED) { el.textContent = text; return; }
    el.innerHTML = '<span class="typed"></span><span class="caret">|</span>';
    const out = el.querySelector('.typed');
    let i = 0;
    const step = () => {
        if (!el.isConnected) return;
        out.textContent = text.slice(0, ++i);
        if (i < text.length) setTimeout(step, 62);
        else setTimeout(() => { const c = el.querySelector('.caret'); if (c) c.remove(); }, 2600);
    };
    setTimeout(step, introActive ? 1150 : 250);
}

/* ---------- 時計とカウントアップ ---------- */
function initClock() {
    const el = document.getElementById('clock');
    if (!el) return;
    const fmt = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const tick = () => { if (el.isConnected) el.textContent = fmt.format(new Date()) + ' JST'; };
    tick();
    setInterval(tick, 1000);
}
function initCounts() {
    const nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;
    const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
            if (!en.isIntersecting) return;
            io.unobserve(en.target);
            const target = parseFloat(en.target.getAttribute('data-count'));
            if (REDUCED) { en.target.textContent = target; return; }
            const t0 = performance.now();
            const step = (now) => {
                const p = Math.min((now - t0) / 900, 1);
                en.target.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
                if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        });
    }, { threshold: 0.4 });
    nums.forEach((n) => io.observe(n));
}

/* ---------- スキルの絞り込み ---------- */
function initSkillFilter() {
    const chips = document.querySelectorAll('[data-filter]');
    if (!chips.length) return;
    chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            chips.forEach((c) => c.classList.remove('on'));
            chip.classList.add('on');
            const f = chip.getAttribute('data-filter');
            document.querySelectorAll('[data-cat]').forEach((g) => {
                g.style.display = (f === 'all' || g.getAttribute('data-cat') === f) ? '' : 'none';
            });
        });
    });
}

/* ---------- コマンドパレット ---------- */
const PALETTE_ITEMS = [
    { label: 'トップ', href: './', hint: 'PAGE', cls: 'c-pink' },
    { label: 'アプリ配布ページ', href: 'featlis-apps', hint: 'PAGE', cls: 'c-lavender' },
    { label: 'Discord Bot 配布ページ', href: 'featlis-discordbot', hint: 'PAGE', cls: 'c-pink' },
    { label: 'ClipFlyout 詳細', href: 'clipflyout', hint: 'APP', cls: 'c-blue' },
    { label: 'トレンド検索 Bot', href: 'find-trends', hint: 'BOT', cls: 'c-mint' },
    { label: 'ツイート印刷 Bot', href: 'print-tweet', hint: 'BOT', cls: 'c-lavender' },
    { label: '時報 Bot', href: 'time-signal', hint: 'BOT', cls: 'c-yellow' },
    { label: 'Twitter 翻訳 Bot', href: 'twitter-translate-bot', hint: 'BOT', cls: 'c-peach' },
    { label: 'Project Tsubomi 紹介', href: 'https://featlis.github.io/Project-Tsubomi/', hint: 'EXT', cls: 'c-mint' },
    { label: 'GitHub', href: 'https://github.com/featlis', hint: 'EXT', cls: 'c-blue' },
    { label: 'Discord', href: 'https://discord.com/users/533128660044218408', hint: 'EXT', cls: 'c-lavender' }
];
let paletteSel = 0;
function renderPalette(q) {
    const list = document.getElementById('paletteList');
    if (!list) return;
    const items = PALETTE_ITEMS.filter((it) => it.label.toLowerCase().includes(q.toLowerCase()));
    paletteSel = Math.min(paletteSel, Math.max(items.length - 1, 0));
    list.innerHTML = items.map((it, i) =>
        `<a href="${it.href}" class="${i === paletteSel ? 'sel' : ''}" data-pjax-skip="${it.hint === 'EXT' ? '1' : ''}" ${it.hint === 'EXT' ? 'target="_blank"' : ''}><span class="dot ${it.cls}"></span>${it.label}<span class="hint">${it.hint}</span></a>`
    ).join('') || '<a href="#" onclick="return false">見つかりませんでした</a>';
    list.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => closePalette()));
}
function openPalette() {
    const p = document.getElementById('palette');
    if (!p) return;
    p.classList.add('open');
    paletteSel = 0;
    renderPalette('');
    const input = document.getElementById('paletteInput');
    input.value = '';
    setTimeout(() => input.focus(), 30);
}
function closePalette() {
    const p = document.getElementById('palette');
    if (p) p.classList.remove('open');
}
function initPalette() {
    const p = document.getElementById('palette');
    if (!p) return;
    const input = document.getElementById('paletteInput');
    input.addEventListener('input', () => { paletteSel = 0; renderPalette(input.value); });
    input.addEventListener('keydown', (e) => {
        const links = p.querySelectorAll('.palette-list a[href]');
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            paletteSel = (paletteSel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
            renderPalette(input.value);
        } else if (e.key === 'Enter') {
            const cur = p.querySelector('.palette-list a.sel');
            if (cur) cur.click();
        }
    });
    p.addEventListener('click', (e) => { if (e.target === p) closePalette(); });
    const btn = document.getElementById('paletteBtn');
    if (btn) btn.addEventListener('click', openPalette);
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
        if (e.key === 'Escape') closePalette();
    });
}

/* ---------- トップバー・進捗・トップへ戻る ---------- */
function initChrome() {
    const bar = document.getElementById('progressBar');
    const toTop = document.getElementById('toTop');
    window.addEventListener('scroll', () => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        if (bar) bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
        if (toTop) toTop.classList.toggle('show', h.scrollTop > 500);
    }, { passive: true });
    if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }));
    const path = location.pathname.replace(/\/$/, '');
    document.querySelectorAll('.topbar nav a').forEach((a) => {
        const href = a.getAttribute('href');
        if (!href) return;
        const target = href === './' ? '' : href.replace(/^\.\//, '');
        if (path.endsWith(target) && target !== '') a.classList.add('now');
        if (target === '' && (path === '' || path.endsWith('index.html'))) a.classList.add('now');
    });
}

/* ---------- ページ初期化 ---------- */
function initPage() {
    syncStats();
    initTyping();
    initClock();
    initCounts();
    initSkillFilter();
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
}

/* ---------- PJAX ---------- */
async function loadPage(url, push = true) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('fetch failed');
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const newContainer = doc.querySelector('.container');
        const curContainer = document.querySelector('.container');
        if (!newContainer || !curContainer) throw new Error('container missing');
        const swap = () => {
            curContainer.replaceWith(newContainer);
            document.title = doc.title;
            document.body.className = doc.body.className;
            window.scrollTo(0, 0);
            initPage();
            initChrome();
        };
        if (document.startViewTransition && !REDUCED) document.startViewTransition(swap);
        else swap();
        if (push) history.pushState(null, '', url);
    } catch (e) {
        window.location.href = url;
    }
}
function initPjax() {
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href || a.getAttribute('target') === '_blank' || a.dataset.pjaxSkip === '1') return;
        if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;
        e.preventDefault();
        loadPage(href);
    });
    window.addEventListener('popstate', () => loadPage(location.href, false));
}

document.addEventListener('DOMContentLoaded', () => {
    introActive = initIntro();
    initTheme();
    initPalette();
    initChrome();
    initPage();
    initPjax();
});
