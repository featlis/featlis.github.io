// rebuild/portfolio-v2: パステルポップ × 控えめサイバー
// 動きは「見せ場」にだけ。prefers-reduced-motion の場合は静かにする。
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// アニメーションなどの初期化処理
function initPage() {
    // 1. スクロールに応じたフェードイン
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll('.fade-in-up').forEach(element => {
        observer.observe(element);
    });

    // 2. 数字のカウントアップ（data-count を持つ要素だけ）
    const counter = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            counter.unobserve(el);
            const target = parseFloat(el.dataset.count);
            if (Number.isNaN(target) || REDUCED) {
                el.textContent = el.dataset.count;
                return;
            }
            const started = performance.now();
            const tick = (now) => {
                const t = Math.min((now - started) / 1200, 1);
                el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
                if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
    }, { threshold: 0.4 });

    document.querySelectorAll('[data-count]').forEach(el => counter.observe(el));

    // 3. メインタイトルのタイピングエフェクト
    const title = document.querySelector('.typing-effect');
    if (title) {
        if (REDUCED) {
            title.style.borderRight = 'none';
        } else {
            const text = title.textContent;
            title.textContent = '';
            let i = 0;
            const typeWriter = () => {
                if (i < text.length) {
                    title.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, 100);
                } else {
                    setTimeout(() => { title.style.borderRight = 'none'; }, 1000);
                }
            };
            setTimeout(typeWriter, 300);
        }
    }

    // 4. カードの軽い傾き（細かいポインタ＋動きOKのときだけ）
    if (!REDUCED && window.matchMedia('(pointer: fine)').matches) {
        document.querySelectorAll('.card').forEach(card => {
            if (card.dataset.tiltBound) return;
            card.dataset.tiltBound = 'true';
            card.addEventListener('pointermove', (e) => {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                card.style.transform = `translateY(-8px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 3).toFixed(2)}deg)`;
            });
            card.addEventListener('pointerleave', () => { card.style.transform = ''; });
        });
    }

    bindPjaxLinks();
}

// パステルの粒（1回のみ）
function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ffa8c5', '#8ce8c3', '#c9b8ff', '#9fd8ff', '#ffe08a', '#ffbfa8'];
    const particlesArray = [];

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 5 + 2;
            this.speedX = Math.random() * 0.6 - 0.3;
            this.speedY = Math.random() * -0.7 - 0.2;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.opacity = Math.random() * 0.35 + 0.12;
            this.square = Math.random() < 0.25; // たまに四角（ピクセル感）
            this.angle = Math.random() * Math.PI;
            this.spin = (Math.random() - 0.5) * 0.01;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.angle += this.spin;
            if (this.y < -10) { this.y = canvas.height + 10; this.x = Math.random() * canvas.width; }
            if (this.x < -10) this.x = canvas.width + 10;
            if (this.x > canvas.width + 10) this.x = -10;
        }
        draw() {
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            if (this.square) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }
    }

    for (let i = 0; i < 42; i++) particlesArray.push(new Particle());

    if (REDUCED) {
        particlesArray.forEach(p => p.draw()); // 1枚だけ描いて止める
        return;
    }

    const animateParticles = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particlesArray.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animateParticles);
    };
    animateParticles();

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// PJAX: リンクのクリックイベント設定
function bindPjaxLinks() {
    document.querySelectorAll('a').forEach(link => {
        if (link.dataset.pjaxBound || link.target === "_blank" || !link.href.startsWith(window.location.origin)) {
            return;
        }
        if (!link.pathname.match(/\.[a-zA-Z0-9]+$/) || link.pathname.endsWith('/')) {
            link.dataset.pjaxBound = 'true';
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                await loadPage(link.href, true);
            });
        }
    });
}

// ページコンテンツの読み込みと差し替え
async function loadPage(url, pushState = true) {
    const swap = async () => {
        const currentContainer = document.querySelector('.container');
        const currentSideNav = document.querySelector('.side-nav');
        if (currentContainer) currentContainer.style.opacity = '0';

        try {
            let response = await fetch(url);
            if (!response.ok && !url.endsWith('.html')) {
                const retry = await fetch(url + '.html');
                if (retry.ok) response = retry;
            }
            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');

            const newContainer = doc.querySelector('.container');
            const newSideNav = doc.querySelector('.side-nav');

            if (currentSideNav && !newSideNav) currentSideNav.style.opacity = '0';
            document.title = doc.title;

            await new Promise(resolve => setTimeout(resolve, 250));

            if (newContainer) {
                newContainer.style.opacity = '0';
                newContainer.style.transition = 'opacity 0.3s ease';
                if (currentContainer) {
                    currentContainer.replaceWith(newContainer);
                } else {
                    document.body.insertBefore(newContainer, document.querySelector('script'));
                }
            }

            if (newSideNav) {
                if (currentSideNav) {
                    newSideNav.style.opacity = '1';
                    newSideNav.style.transition = 'opacity 0.3s ease';
                    currentSideNav.replaceWith(newSideNav);
                } else {
                    newSideNav.style.opacity = '0';
                    newSideNav.style.transition = 'opacity 0.3s ease';
                    document.body.insertBefore(newSideNav, document.querySelector('script'));
                }
            } else if (currentSideNav) {
                currentSideNav.remove();
            }

            if (pushState) history.pushState(null, '', url);
            window.scrollTo(0, 0);

            setTimeout(() => {
                const finalContainer = document.querySelector('.container');
                const finalSideNav = document.querySelector('.side-nav');
                if (finalContainer) finalContainer.style.opacity = '1';
                if (finalSideNav && !currentSideNav) finalSideNav.style.opacity = '1';
                initPage();
            }, 50);

        } catch (error) {
            console.error('Page load error:', error);
            window.location.href = url;
        }
    };

    // 対応ブラウザでは View Transitions でつなぐ
    if (document.startViewTransition && !REDUCED) {
        document.startViewTransition(swap);
    } else {
        await swap();
    }
}

window.addEventListener('popstate', () => {
    loadPage(window.location.href, false);
});

document.addEventListener('DOMContentLoaded', () => {
    const c = document.querySelector('.container');
    const s = document.querySelector('.side-nav');
    if (c) c.style.transition = 'opacity 0.3s ease';
    if (s) s.style.transition = 'opacity 0.3s ease';

    initParticles();
    initPage();
});
