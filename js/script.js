// Featlis's Portfolio — console script (rebuild v3.1)
const reducedMql = window.matchMedia('(prefers-reduced-motion: reduce)');
const darkMql = window.matchMedia('(prefers-color-scheme: dark)');
const isReduced = () => reducedMql.matches;

const ACCENTS = ['pink', 'mint', 'lavender', 'blue', 'yellow', 'peach'];
const ACCENT_NAMES = {
    pink: 'Pink',
    mint: 'Mint',
    lavender: 'Lavender',
    blue: 'Blue',
    yellow: 'Yellow',
    peach: 'Peach',
    auto: 'Auto',
};

const SVG_SUN = '<svg class="ic" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z"/></svg>';
const SVG_MOON = '<svg class="ic" viewBox="0 0 384 512" aria-hidden="true" focusable="false"><path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"/></svg>';

let clockTimer = null;
let countObserver = null;
let revealObserver = null;
let typingTimers = [];
let navController = null;
let introActive = false;
let lastRoute = location.pathname + location.search;

function resolveAppUrl(slug) {
    if (location.protocol === 'file:') {
        return slug === '/' ? './index.html' : './' + slug.replace(/^\//, '') + '.html';
    }
    return slug === '/' ? '/' : '/' + slug.replace(/^\//, '');
}

function getStorage(store, key) {
    try { return store.getItem(key); } catch (e) { return null; }
}
function setStorage(store, key, val) {
    try { store.setItem(key, val); } catch (e) { /* そのまま */ }
}
function removeStorage(store, key) {
    try { store.removeItem(key); } catch (e) { /* そのまま */ }
}

/* ---------- テーマ & アクセントカラー ---------- */
function setColorSchemeMeta(val) {
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute('content', val);
}

function applyThemeIcon() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.innerHTML = dark ? SVG_SUN : SVG_MOON;
    btn.setAttribute('aria-label', dark ? 'ライトモードに切り替え' : 'ダークモードに切り替え');
    btn.setAttribute('aria-pressed', String(dark));
}

function syncStats() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.querySelectorAll('img.stats-card[data-light-src]').forEach((img) => {
        img.src = dark ? img.getAttribute('data-dark-src') : img.getAttribute('data-light-src');
    });
}

function applyTheme(dark, persist) {
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    else if (persist) document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');

    if (persist) {
        const val = dark ? 'dark' : 'light';
        setStorage(localStorage, 'theme', val);
        setColorSchemeMeta(val);
    } else {
        setColorSchemeMeta('light dark');
    }
    applyThemeIcon();
    syncStats();
    updateStatusTelemetry();
}

function toggleTheme() {
    const nextDark = document.documentElement.getAttribute('data-theme') !== 'dark';
    applyTheme(nextDark, true);
    return nextDark;
}

function initTheme() {
    const btn = document.getElementById('themeToggle');
    const saved = getStorage(localStorage, 'theme');
    if (saved === 'dark' || saved === 'light') {
        setColorSchemeMeta(saved);
        document.documentElement.setAttribute('data-theme', saved);
    } else {
        setColorSchemeMeta('light dark');
        if (darkMql.matches) document.documentElement.setAttribute('data-theme', 'dark');
        else document.documentElement.removeAttribute('data-theme');
    }
    applyThemeIcon();
    if (btn) btn.addEventListener('click', () => toggleTheme());
    darkMql.addEventListener('change', (e) => {
        if (!getStorage(localStorage, 'theme')) applyTheme(e.matches, false);
    });
}

function applyAccent(name, persist = true) {
    const valid = ACCENTS.includes(name) ? name : 'auto';
    if (valid === 'auto') {
        document.documentElement.removeAttribute('data-accent');
        if (persist) removeStorage(localStorage, 'accent');
    } else {
        document.documentElement.setAttribute('data-accent', valid);
        if (persist) setStorage(localStorage, 'accent', valid);
    }
    document.querySelectorAll('[data-accent-pick]').forEach((btn) => {
        const active = btn.getAttribute('data-accent-pick') === valid;
        btn.classList.toggle('on', active);
        btn.setAttribute('aria-pressed', String(active));
    });
}

function cycleAccent() {
    const cur = document.documentElement.getAttribute('data-accent');
    const idx = cur ? ACCENTS.indexOf(cur) : -1;
    const next = idx === ACCENTS.length - 1 ? 'auto' : ACCENTS[idx + 1];
    applyAccent(next, true);
    return next;
}

/* ---------- ステータス通知トースト (popover="manual") ---------- */
let toastTimer = null;
let toastReturnFocus = null;

function ensureToastElements() {
    let region = document.getElementById('toastRegion');
    if (!region) {
        region = document.createElement('div');
        region.id = 'toastRegion';
        region.setAttribute('role', 'region');
        region.setAttribute('aria-label', '通知');
        document.body.appendChild(region);
    }
    let live = document.getElementById('toastLive');
    if (!live) {
        live = document.createElement('div');
        live.id = 'toastLive';
        live.className = 'sr-only';
        live.setAttribute('aria-live', 'polite');
        document.body.appendChild(live);
    }
    let toast = document.getElementById('consoleToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'consoleToast';
        toast.className = 'console-toast';
        toast.setAttribute('popover', 'manual');
        toast.setAttribute('role', 'status');

        const msg = document.createElement('span');
        msg.className = 'toast-msg';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'toast-close';
        closeBtn.setAttribute('popovertarget', 'consoleToast');
        closeBtn.setAttribute('popovertargetaction', 'hide');
        closeBtn.setAttribute('aria-label', '閉じる');
        closeBtn.textContent = '×';

        toast.append(msg, closeBtn);
        region.appendChild(toast);

        const scheduleHide = () => {
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => hideToast(false), 2800);
        };
        toast.addEventListener('mouseenter', () => clearTimeout(toastTimer));
        toast.addEventListener('mouseleave', scheduleHide);
        toast.addEventListener('focusin', () => clearTimeout(toastTimer));
        toast.addEventListener('focusout', () => {
            if (!toast.contains(document.activeElement)) scheduleHide();
        });
        closeBtn.addEventListener('click', () => hideToast(true));
    }
    return { toast, live };
}

function hideToast(manual = false) {
    const toast = document.getElementById('consoleToast');
    if (!toast) return;
    const hadFocus = toast.contains(document.activeElement);
    clearTimeout(toastTimer);
    if ('popover' in HTMLElement.prototype && typeof toast.hidePopover === 'function') {
        try { if (toast.matches(':popover-open')) toast.hidePopover(); } catch (e) { /* そのまま */ }
    }
    toast.classList.remove('is-open');
    if (manual && hadFocus && toastReturnFocus && toastReturnFocus.isConnected) {
        toastReturnFocus.focus();
    }
}

function showToast(message) {
    const palette = document.getElementById('palette');
    if (palette && palette.open) return;

    toastReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const { toast, live } = ensureToastElements();
    const msgEl = toast.querySelector('.toast-msg');
    if (msgEl) msgEl.textContent = message;

    if ('popover' in HTMLElement.prototype && typeof toast.showPopover === 'function') {
        try { if (!toast.matches(':popover-open')) toast.showPopover(); } catch (e) { toast.classList.add('is-open'); }
    } else {
        toast.classList.add('is-open');
    }

    if (typeof document.ariaNotify === 'function') {
        try { document.ariaNotify(message); } catch (e) { live.textContent = message; }
    } else {
        live.textContent = '';
        requestAnimationFrame(() => { live.textContent = message; });
    }

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        if (!toast.matches(':hover') && !toast.contains(document.activeElement)) {
            hideToast(false);
        }
    }, 2800);
}

/* ---------- クリップボードコピー ---------- */
async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) { /* fallback */ }
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
}

function initCopyButtons() {
    document.querySelectorAll('[data-copy]').forEach((btn) => {
        if (btn.dataset.copyBound === '1') return;
        btn.dataset.copyBound = '1';
        const defaultText = btn.textContent;
        btn.addEventListener('click', async () => {
            const val = btn.getAttribute('data-copy');
            const label = btn.getAttribute('data-copy-label') || val;
            if (!val) return;
            const ok = await copyText(val);
            if (ok) {
                btn.classList.add('copied');
                btn.textContent = 'コピー済み';
                setTimeout(() => {
                    if (!btn.isConnected) return;
                    btn.classList.remove('copied');
                    btn.textContent = defaultText;
                }, 1800);
                showToast(`COPIED: ${label}`);
            } else {
                showToast('コピーに失敗しました');
            }
        });
    });
}

/* ---------- 入場演出 ---------- */
function initIntro() {
    const intro = document.getElementById('intro');
    if (!intro) return false;
    const seen = getStorage(sessionStorage, 'introSeen') === '1';
    if (isReduced() || seen) {
        document.documentElement.setAttribute('data-intro', 'skip');
        intro.remove();
        return false;
    }

    let finished = false;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
        if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            finish();
        }
    };
    const finish = () => {
        if (finished) return;
        finished = true;
        introActive = false;
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = '';
        setStorage(sessionStorage, 'introSeen', '1');
        if (!intro.isConnected) return;
        intro.classList.add('done');
        setTimeout(() => {
            document.documentElement.setAttribute('data-intro', 'skip');
            intro.remove();
        }, 780);
    };

    intro.addEventListener('click', finish);
    document.addEventListener('keydown', onKey);
    setTimeout(finish, 1250);
    return true;
}

function replayIntro() {
    if (isReduced()) {
        showToast('reduced-motion が有効なため再生をスキップしました');
        return;
    }
    removeStorage(sessionStorage, 'introSeen');
    document.documentElement.removeAttribute('data-intro');
    if (normalizePath(location.pathname) !== '/') {
        window.location.href = resolveAppUrl('/');
        return;
    }
    if (!document.getElementById('intro')) {
        const div = document.createElement('div');
        div.id = 'intro';
        div.setAttribute('aria-hidden', 'true');
        div.innerHTML = '<div class="intro-inner"><span class="chip c-pink">FEATLIS.GITHUB.IO</span><div class="intro-title">Featlis\'s Portfolio</div><div class="intro-bar"><span></span><span></span><span></span><span></span><span></span><span></span></div><div class="intro-note">LOADING</div></div>';
        document.body.prepend(div);
    }
    introActive = initIntro();
    cleanupTyping();
    initTyping();
}

/* ---------- タイトルのタイピング ---------- */
function cleanupTyping() {
    typingTimers.forEach((id) => clearTimeout(id));
    typingTimers = [];
}

function initTyping() {
    const el = document.getElementById('typedTitle');
    if (!el) return;
    const text = el.getAttribute('data-text') || el.textContent.trim();
    if (isReduced()) { el.textContent = text; return; }
    el.innerHTML = '<span class="typed"></span><span class="caret">|</span>';
    const out = el.querySelector('.typed');
    let i = 0;
    const step = () => {
        if (!el.isConnected) return;
        out.textContent = text.slice(0, ++i);
        if (i < text.length) {
            typingTimers.push(setTimeout(step, 62));
        } else {
            typingTimers.push(setTimeout(() => {
                const c = el.querySelector('.caret');
                if (c) c.remove();
            }, 2600));
        }
    };
    typingTimers.push(setTimeout(step, introActive ? 1150 : 250));
}

/* ---------- STATUS 計器盤・時計・挨拶・アクセサリ ---------- */
function updateStatusTelemetry() {
    const visitsEl = document.getElementById('metaVisits');
    const themeEl = document.getElementById('metaTheme');
    const vpEl = document.getElementById('metaViewport');
    if (visitsEl) visitsEl.textContent = getStorage(sessionStorage, 'visitCount') || '1';
    if (themeEl) {
        const dark = document.documentElement.getAttribute('data-theme') === 'dark';
        themeEl.textContent = dark ? 'DARK' : 'LIGHT';
    }
    if (vpEl) vpEl.textContent = `${window.innerWidth}×${window.innerHeight}`;
}

function initStatusConsole() {
    const el = document.getElementById('clock');
    const greetEl = document.getElementById('jstGreeting');
    if (el) {
        const fmt = new Intl.DateTimeFormat('ja-JP', {
            timeZone: 'Asia/Tokyo',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
        const hourFmt = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Tokyo',
            hour: 'numeric',
            hour12: false,
        });
        const tick = () => {
            if (!el.isConnected) return;
            const now = new Date();
            el.textContent = fmt.format(now) + ' JST';
            if (greetEl) {
                const h = Number(hourFmt.format(now)) % 24;
                greetEl.textContent = h >= 5 && h < 11 ? 'おはよう (JST)' : h >= 11 && h < 18 ? 'こんにちは (JST)' : 'こんばんは (JST)';
            }
        };
        tick();
        clockTimer = setInterval(tick, 1000);
    }

    const savedAccent = getStorage(localStorage, 'accent') || 'auto';
    applyAccent(savedAccent, false);
    document.querySelectorAll('[data-accent-pick]').forEach((btn) => {
        if (btn.dataset.accentBound === '1') return;
        btn.dataset.accentBound = '1';
        btn.addEventListener('click', () => {
            const name = btn.getAttribute('data-accent-pick') || 'auto';
            applyAccent(name, true);
        });
    });

    updateStatusTelemetry();
}

/* ---------- カウントアップ ---------- */
function initCounts() {
    const nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;
    if (isReduced()) {
        nums.forEach((el) => { el.textContent = el.getAttribute('data-count'); });
        return;
    }
    countObserver = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
            if (!en.isIntersecting) return;
            countObserver.unobserve(en.target);
            const target = parseFloat(en.target.getAttribute('data-count'));
            const t0 = performance.now();
            const step = (now) => {
                if (!en.target.isConnected) return;
                const p = Math.min((now - t0) / 900, 1);
                en.target.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
                if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        });
    }, { threshold: 0.4 });
    nums.forEach((n) => countObserver.observe(n));
}

/* ---------- GitHub コンソール（案3: REST API + 静的フォールバック） ---------- */
function renderGithubConsoleData(data) {
    const reposEl = document.getElementById('ghRepos');
    const starsEl = document.getElementById('ghStars');
    const followersEl = document.getElementById('ghFollowers');
    const barEl = document.getElementById('ghLangBar');
    const legendEl = document.getElementById('ghLangLegend');
    const listEl = document.getElementById('ghRepoList');
    if (!reposEl || !barEl || !legendEl || !listEl) return;

    if (typeof data.publicRepos === 'number') reposEl.textContent = String(data.publicRepos);
    if (typeof data.totalStars === 'number' && starsEl) starsEl.textContent = String(data.totalStars);
    if (typeof data.followers === 'number' && followersEl) followersEl.textContent = String(data.followers);

    if (Array.isArray(data.langs) && data.langs.length) {
        barEl.textContent = '';
        legendEl.textContent = '';
        const total = data.langs.reduce((s, l) => s + l.count, 0) || 1;
        data.langs.forEach((item, idx) => {
            const pct = Math.max(4, Math.round((item.count / total) * 100));
            const seg = document.createElement('span');
            seg.className = `gh-lang-seg seg-${idx % 6}`;
            seg.style.width = `${(item.count / total) * 100}%`;
            seg.title = `${item.name} ${pct}%`;
            barEl.appendChild(seg);

            const leg = document.createElement('span');
            const dot = document.createElement('i');
            dot.className = `gh-lang-dot seg-${idx % 6}`;
            leg.append(dot, document.createTextNode(`${item.name} ${Math.round((item.count / total) * 100)}%`));
            legendEl.appendChild(leg);
        });
    }

    if (Array.isArray(data.recentRepos) && data.recentRepos.length) {
        listEl.textContent = '';
        data.recentRepos.forEach((repo) => {
            const a = document.createElement('a');
            a.className = 'gh-repo';
            a.href = repo.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';

            const name = document.createElement('span');
            name.className = 'gh-repo-name';
            name.textContent = repo.name;
            a.appendChild(name);

            if (repo.lang) {
                const pill = document.createElement('span');
                pill.className = 'gh-lang-pill';
                pill.textContent = repo.lang;
                a.appendChild(pill);
            }

            const date = document.createElement('span');
            date.className = 'gh-repo-date';
            date.textContent = `${repo.updated} ↗`;
            a.appendChild(date);

            listEl.appendChild(a);
        });
    }
}

async function initGithubConsole() {
    const root = document.getElementById('ghConsole');
    if (!root) return;

    const cacheKey = 'ghConsoleV1';
    try {
        const raw = getStorage(sessionStorage, cacheKey);
        if (raw) {
            const cached = JSON.parse(raw);
            if (cached && Date.now() - cached.ts < 10 * 60 * 1000) {
                renderGithubConsoleData(cached.data);
                return;
            }
        }
    } catch (e) { /* キャッシュ無視 */ }

    try {
        const [uRes, rRes] = await Promise.all([
            fetch('https://api.github.com/users/featlis'),
            fetch('https://api.github.com/users/featlis/repos?per_page=100&sort=updated'),
        ]);
        if (!uRes.ok || !rRes.ok) return;
        const user = await uRes.json();
        const repos = await rRes.json();
        if (!Array.isArray(repos)) return;

        const own = repos.filter((r) => !r.fork);
        const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
        const counts = new Map();
        own.forEach((r) => {
            if (r.language) counts.set(r.language, (counts.get(r.language) || 0) + 1);
        });
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
        const topLangs = sorted.slice(0, 4).map(([name, count]) => ({ name, count }));
        const otherCount = sorted.slice(4).reduce((s, [, c]) => s + c, 0);
        if (otherCount > 0) topLangs.push({ name: 'Other', count: otherCount });

        const recentRepos = own.slice(0, 3).map((r) => ({
            name: r.name,
            lang: r.language || null,
            updated: (r.updated_at || '').slice(0, 10),
            url: r.html_url,
        }));

        const data = {
            publicRepos: user.public_repos,
            followers: user.followers,
            totalStars,
            langs: topLangs,
            recentRepos,
        };
        if (root.isConnected) renderGithubConsoleData(data);
        setStorage(sessionStorage, cacheKey, JSON.stringify({ ts: Date.now(), data }));
    } catch (e) {
        /* API失敗時はHTML静的フォールバックをそのまま表示 */
    }
}

/* ---------- ワンショット出現アニメーション ---------- */
function initReveal() {
    const targets = document.querySelectorAll('.tile, .card');
    if (!targets.length || isReduced() || !('IntersectionObserver' in window)) return;

    const cutoff = window.innerHeight * 0.96;
    const pending = [];
    targets.forEach((el) => {
        if (el.getBoundingClientRect().top > cutoff) {
            el.classList.add('reveal-pending');
            pending.push(el);
        }
    });
    if (!pending.length) return;

    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
            if (!en.isIntersecting) return;
            en.target.classList.add('is-revealed');
            revealObserver.unobserve(en.target);
        });
    }, { threshold: 0.05 });
    pending.forEach((el) => revealObserver.observe(el));
}

/* ---------- スキルの絞り込み ---------- */
function initSkillFilter() {
    const chips = document.querySelectorAll('[data-filter]');
    if (!chips.length) return;
    chips.forEach((chip) => {
        if (chip.dataset.filterBound === '1') return;
        chip.dataset.filterBound = '1';
        chip.addEventListener('click', () => {
            const f = chip.getAttribute('data-filter');
            chips.forEach((c) => {
                const active = c === chip;
                c.classList.toggle('on', active);
                c.setAttribute('aria-pressed', String(active));
            });
            document.querySelectorAll('[data-cat]').forEach((g) => {
                g.style.display = (f === 'all' || g.getAttribute('data-cat') === f) ? '' : 'none';
            });
        });
    });
}

/* ---------- コマンドパレット (<dialog closedby="any">) ---------- */
function buildPaletteItems() {
    return [
        { type: 'link', label: 'トップ', href: resolveAppUrl('/'), hint: 'PAGE', cls: 'c-pink', kw: 'home top index' },
        { type: 'link', label: 'アプリ配布ページ', href: resolveAppUrl('featlis-apps'), hint: 'PAGE', cls: 'c-lavender', kw: 'apps windows' },
        { type: 'link', label: 'Discord Bot 配布ページ', href: resolveAppUrl('featlis-discordbot'), hint: 'PAGE', cls: 'c-pink', kw: 'bot discord' },
        { type: 'link', label: 'ClipFlyout 詳細', href: resolveAppUrl('clipflyout'), hint: 'APP', cls: 'c-blue', kw: 'clipboard' },
        { type: 'link', label: 'トレンド検索 Bot (FindTrends)', href: resolveAppUrl('find-trends'), hint: 'BOT', cls: 'c-mint', kw: 'trends news' },
        { type: 'link', label: 'ツイート印刷 Bot (PrintTweet)', href: resolveAppUrl('print-tweet'), hint: 'BOT', cls: 'c-lavender', kw: 'tweet print' },
        { type: 'link', label: '時報 Bot (TimeSignal)', href: resolveAppUrl('time-signal'), hint: 'BOT', cls: 'c-yellow', kw: 'time signal' },
        { type: 'link', label: 'Twitter 翻訳 Bot', href: resolveAppUrl('twitter-translate-bot'), hint: 'BOT', cls: 'c-peach', kw: 'translate twitter' },
        { type: 'action', label: 'ダーク / ライトモード切替', action: 'toggle-theme', hint: 'CMD', cls: 'c-yellow', kw: 'theme dark light テーマ' },
        { type: 'action', label: 'アクセントカラー切替', action: 'cycle-accent', hint: 'CMD', cls: 'c-mint', kw: 'color accent theme 色' },
        { type: 'action', label: 'Discord ID をコピー (featlis)', action: 'copy-discord', hint: 'CMD', cls: 'c-lavender', kw: 'discord id copy コピー' },
        { type: 'action', label: '入場演出をもう一度見る', action: 'replay-intro', hint: 'CMD', cls: 'c-pink', kw: 'intro loading 演出' },
        { type: 'action', label: 'ページの先頭へ戻る', action: 'scroll-top', hint: 'CMD', cls: 'c-blue', kw: 'top scroll 先頭' },
        { type: 'link', label: 'Project Tsubomi 紹介', href: 'https://featlis.github.io/Project-Tsubomi/', hint: 'EXT', cls: 'c-mint', ext: true, kw: 'ai tsubomi' },
        { type: 'link', label: 'GitHub (@featlis)', href: 'https://github.com/featlis', hint: 'EXT', cls: 'c-blue', ext: true, kw: 'github' },
        { type: 'link', label: 'Discord プロフィール', href: 'https://discord.com/users/533128660044218408', hint: 'EXT', cls: 'c-lavender', ext: true, kw: 'discord contact' },
    ];
}

let paletteSel = 0;

function runPaletteAction(action) {
    closePalette();
    if (action === 'toggle-theme') {
        const dark = toggleTheme();
        showToast(dark ? 'THEME: DARK' : 'THEME: LIGHT');
    } else if (action === 'cycle-accent') {
        const next = cycleAccent();
        showToast(`ACCENT: ${ACCENT_NAMES[next] || next}`);
    } else if (action === 'copy-discord') {
        copyText('featlis').then((ok) => {
            showToast(ok ? 'COPIED: Discord ID (featlis)' : 'コピーに失敗しました');
        });
    } else if (action === 'replay-intro') {
        replayIntro();
    } else if (action === 'scroll-top') {
        window.scrollTo({ top: 0, behavior: isReduced() ? 'auto' : 'smooth' });
    }
}

function updatePaletteSelection(list, nextSel) {
    const rows = list.querySelectorAll('.palette-row');
    if (!rows.length) return;
    paletteSel = (nextSel + rows.length) % rows.length;
    rows.forEach((row, i) => {
        const active = i === paletteSel;
        row.classList.toggle('sel', active);
        row.setAttribute('aria-selected', String(active));
    });
    rows[paletteSel].scrollIntoView({ block: 'nearest' });
}

function renderPalette(q) {
    const list = document.getElementById('paletteList');
    if (!list) return;
    const query = q.trim().toLowerCase();
    const items = buildPaletteItems().filter((it) => {
        if (!query) return true;
        return it.label.toLowerCase().includes(query) ||
            it.hint.toLowerCase().includes(query) ||
            (it.kw && it.kw.toLowerCase().includes(query));
    });

    list.textContent = '';
    if (!items.length) {
        paletteSel = 0;
        const empty = document.createElement('div');
        empty.className = 'palette-empty';
        empty.textContent = '見つかりませんでした';
        list.appendChild(empty);
        return;
    }

    paletteSel = Math.min(paletteSel, items.length - 1);
    items.forEach((it, i) => {
        const el = document.createElement(it.type === 'action' ? 'button' : 'a');
        el.className = 'palette-row' + (it.type === 'action' ? ' palette-action' : '') + (i === paletteSel ? ' sel' : '');
        el.setAttribute('role', 'option');
        el.setAttribute('aria-selected', String(i === paletteSel));

        if (it.type === 'action') {
            el.type = 'button';
            el.addEventListener('click', () => runPaletteAction(it.action));
        } else {
            el.href = it.href;
            if (it.ext) {
                el.target = '_blank';
                el.rel = 'noopener noreferrer';
                el.dataset.pjaxSkip = '1';
            }
            el.addEventListener('click', () => closePalette());
        }

        const dot = document.createElement('span');
        dot.className = `dot ${it.cls}`;
        const label = document.createTextNode(it.label);
        const hint = document.createElement('span');
        hint.className = 'hint';
        hint.textContent = it.hint;

        el.append(dot, label, hint);
        list.appendChild(el);
    });
}

function openPalette() {
    const p = document.getElementById('palette');
    if (!p) return;
    if (!p.open) {
        if (typeof p.showModal === 'function') p.showModal();
        else p.setAttribute('open', '');
    }
    paletteSel = 0;
    const input = document.getElementById('paletteInput');
    if (input) {
        input.value = '';
        renderPalette('');
        setTimeout(() => input.focus(), 20);
    }
}

function closePalette() {
    const p = document.getElementById('palette');
    if (!p || !p.open) return;
    if (typeof p.close === 'function') p.close();
    else p.removeAttribute('open');
}

function initPalette() {
    const p = document.getElementById('palette');
    if (!p) return;
    const input = document.getElementById('paletteInput');
    const list = document.getElementById('paletteList');
    const closeBtn = document.getElementById('paletteClose');

    if (input && list) {
        input.addEventListener('input', () => {
            paletteSel = 0;
            renderPalette(input.value);
        });
        input.addEventListener('keydown', (e) => {
            if (e.isComposing || e.keyCode === 229) return;
            const rows = list.querySelectorAll('.palette-row');
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (!rows.length) return;
                updatePaletteSelection(list, paletteSel + (e.key === 'ArrowDown' ? 1 : -1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const cur = list.querySelector('.palette-row.sel');
                if (cur) cur.click();
            }
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', closePalette);

    // closedby="any" 非対応ブラウザ（Safari 等）向けフォールバック（MWG light-dismiss-a-dialog 準拠）
    if (!('closedBy' in HTMLDialogElement.prototype)) {
        p.addEventListener('click', (event) => {
            if (event.target !== p) return;
            const rect = p.getBoundingClientRect();
            const isDialogContent = (
                rect.top <= event.clientY &&
                event.clientY <= rect.top + rect.height &&
                rect.left <= event.clientX &&
                event.clientX <= rect.left + rect.width
            );
            if (!isDialogContent) closePalette();
        });
    }

    const btn = document.getElementById('paletteBtn');
    if (btn) btn.addEventListener('click', openPalette);

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (p.open) closePalette();
            else openPalette();
        }
    });
}

/* ---------- トップバー・進捗・アクティブナビ ---------- */
function normalizePath(rawPath) {
    let p = (rawPath || '/').replace(/\/+$/, '');
    if (p === '' || p === '/index' || p === '/index.html') return '/';
    return p.replace(/\.html$/, '');
}

function updateScrollUi() {
    const bar = document.getElementById('progressBar');
    const toTop = document.getElementById('toTop');
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    if (toTop) toTop.classList.toggle('show', h.scrollTop > 500);
}

function updateActiveNav(urlStr = location.href) {
    let curPath = '/';
    try {
        curPath = normalizePath(new URL(urlStr, location.href).pathname);
    } catch (e) {
        curPath = normalizePath(location.pathname);
    }
    const botSubpages = ['/find-trends', '/print-tweet', '/time-signal', '/twitter-translate-bot'];
    const isBotSub = botSubpages.includes(curPath);

    document.querySelectorAll('.topbar nav a').forEach((a) => {
        a.classList.remove('now');
        a.removeAttribute('aria-current');
        const href = a.getAttribute('href');
        if (!href) return;
        let targetPath = '/';
        try {
            targetPath = normalizePath(new URL(href, location.href).pathname);
        } catch (e) { return; }

        if (targetPath === curPath) {
            a.classList.add('now');
            a.setAttribute('aria-current', 'page');
        } else if (isBotSub && targetPath === '/featlis-discordbot') {
            a.classList.add('now');
        }
    });
}

function initChromeOnce() {
    window.addEventListener('scroll', updateScrollUi, { passive: true });
    window.addEventListener('resize', updateStatusTelemetry, { passive: true });
    const toTop = document.getElementById('toTop');
    if (toTop) {
        toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: isReduced() ? 'auto' : 'smooth' }));
    }
    updateScrollUi();
    updateActiveNav(location.href);
}

/* ---------- イースターエッグ（ロゴ5連打 / コナミコマンド） ---------- */
function triggerOverdrive() {
    showToast('CONSOLE OVERDRIVE! ★ パステル出力 120%');
    if (isReduced()) return;

    const layer = document.createElement('div');
    layer.className = 'confetti-layer';
    layer.setAttribute('aria-hidden', 'true');
    const colors = ['#ffd6e7', '#c8f4de', '#e3dcff', '#cdeffd', '#ffefc2', '#ffe0d1'];
    for (let i = 0; i < 24; i++) {
        const piece = document.createElement('span');
        piece.className = 'confetti-piece';
        piece.style.left = `${(i * 4.1 + Math.random() * 4).toFixed(1)}%`;
        piece.style.background = colors[i % colors.length];
        piece.style.animationDelay = `${(Math.random() * 0.25).toFixed(2)}s`;
        piece.style.setProperty('--dx', `${Math.round((Math.random() - 0.5) * 160)}px`);
        piece.style.setProperty('--rot', `${Math.round((Math.random() > 0.5 ? 1 : -1) * (240 + Math.random() * 320))}deg`);
        layer.appendChild(piece);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 1950);
}

function initEasterEgg() {
    const logo = document.querySelector('.topbar .logo');
    let clicks = 0;
    let resetTimer = null;
    if (logo) {
        logo.addEventListener('click', (e) => {
            clicks += 1;
            clearTimeout(resetTimer);
            resetTimer = setTimeout(() => { clicks = 0; }, 1800);
            if (clicks >= 5) {
                e.preventDefault();
                e.stopImmediatePropagation();
                clicks = 0;
                triggerOverdrive();
            }
        }, true);
    }

    const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let pos = 0;
    document.addEventListener('keydown', (e) => {
        const tag = e.target && e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (k === seq[pos]) {
            pos += 1;
            if (pos === seq.length) {
                pos = 0;
                triggerOverdrive();
            }
        } else {
            pos = k === seq[0] ? 1 : 0;
        }
    });
}

/* ---------- ページ初期化 & クリーンアップ ---------- */
function cleanupPage() {
    if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
    if (countObserver) { countObserver.disconnect(); countObserver = null; }
    if (revealObserver) { revealObserver.disconnect(); revealObserver = null; }
    cleanupTyping();
}

function initPage() {
    syncStats();
    initTyping();
    initStatusConsole();
    initCounts();
    initSkillFilter();
    initCopyButtons();
    initGithubConsole();
    initReveal();
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
}

/* ---------- PJAX ---------- */
function syncHeadMeta(doc) {
    const copyAttr = (sel, attr) => {
        const src = doc.querySelector(sel);
        const dst = document.querySelector(sel);
        if (src && dst) dst.setAttribute(attr, src.getAttribute(attr) || '');
    };
    copyAttr('meta[name="description"]', 'content');
    copyAttr('meta[property="og:title"]', 'content');
    copyAttr('meta[property="og:description"]', 'content');
    copyAttr('meta[property="og:url"]', 'content');
    copyAttr('link[rel="canonical"]', 'href');
}

async function loadPage(url, push = true) {
    if (navController) navController.abort();
    navController = new AbortController();
    const signal = navController.signal;

    try {
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        if (signal.aborted) return;

        const doc = new DOMParser().parseFromString(html, 'text/html');
        const newContainer = doc.querySelector('.container');
        const curContainer = document.querySelector('.container');
        if (!newContainer || !curContainer) throw new Error('container missing');

        const swap = () => {
            cleanupPage();
            curContainer.replaceWith(newContainer);
            document.title = doc.title;
            document.body.className = doc.body.className;
            syncHeadMeta(doc);

            const curVisits = Number(getStorage(sessionStorage, 'visitCount') || '1');
            setStorage(sessionStorage, 'visitCount', String(curVisits + 1));

            if (push) history.pushState({ pjax: true }, '', url);
            lastRoute = location.pathname + location.search;

            updateActiveNav(location.href);
            if (location.hash) {
                const target = document.getElementById(location.hash.slice(1));
                if (target) target.scrollIntoView({ behavior: 'auto' });
                else window.scrollTo(0, 0);
            } else {
                window.scrollTo(0, 0);
            }
            updateScrollUi();
            initPage();

            const main = document.querySelector('main');
            if (main) {
                main.setAttribute('tabindex', '-1');
                main.focus({ preventScroll: true });
            }
        };

        if (document.startViewTransition && !isReduced()) document.startViewTransition(swap);
        else swap();
    } catch (e) {
        if (e && e.name === 'AbortError') return;
        window.location.href = url;
    }
}

function initPjax() {
    document.addEventListener('click', (e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = e.target.closest('a');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href || a.getAttribute('target') === '_blank' || a.hasAttribute('download') || a.dataset.pjaxSkip === '1') return;
        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;

        let target;
        try { target = new URL(href, location.href); } catch (err) { return; }
        if (target.origin !== location.origin) return;
        if (target.pathname === location.pathname && target.search === location.search && target.hash) return;

        e.preventDefault();
        loadPage(target.href);
    });

    window.addEventListener('popstate', () => {
        const nextRoute = location.pathname + location.search;
        if (nextRoute === lastRoute) return;
        loadPage(location.href, false);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (!getStorage(sessionStorage, 'visitCount')) setStorage(sessionStorage, 'visitCount', '1');
    introActive = initIntro();
    initTheme();
    initPalette();
    initChromeOnce();
    initEasterEgg();
    initPage();
    initPjax();
});
