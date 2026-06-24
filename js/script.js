// アニメーションなどの初期化処理
function initPage() {
    // 1. スクロールに応じたカードのフェードインアニメーション
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // 要素ごとに少しずつ遅延をつけてフェードインさせる
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(element => {
        observer.observe(element);
    });

    // 2. メインタイトルのタイピングエフェクト
    const title = document.querySelector('.typing-effect');
    if (title) {
        const text = title.textContent;
        title.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                title.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            } else {
                // タイピング完了後、カーソルの点滅(border)を消す
                setTimeout(() => {
                    title.style.borderRight = 'none';
                }, 1000);
            }
        };
        
        // 少し待ってからタイピング開始
        setTimeout(typeWriter, 300);
    }

    // リンクのイベントリスナー再設定
    bindPjaxLinks();
}

// パーティクルの初期化（1回のみ）
function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particlesArray = [];
    const colors = ['#ff6584', '#f3d6e4', '#ffb3c6', '#ffd6e0'];
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 4 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * -1 - 0.5; // 上に向かってゆっくり浮かぶ
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.opacity = Math.random() * 0.5 + 0.1;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            // 画面外に出たら反対側からループさせる
            if (this.y < 0) this.y = canvas.height;
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
        }
        
        draw() {
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }
    
    for (let i = 0; i < 50; i++) {
        particlesArray.push(new Particle());
    }
    
    const animateParticles = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
        }
        requestAnimationFrame(animateParticles);
    };
    
    animateParticles();
    
    // リサイズ対応
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// PJAX: リンクのクリックイベント設定
function bindPjaxLinks() {
    document.querySelectorAll('a').forEach(link => {
        // すでにバインド済みかチェック、または外部・別タブリンクは除外
        if (link.dataset.pjaxBound || link.target === "_blank" || !link.href.startsWith(window.location.origin)) {
            return;
        }

        // HTMLページへの遷移のみを処理
        if (link.href.endsWith('.html') || link.href.endsWith('/')) {
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
    const currentContainer = document.querySelector('.container');
    const currentSideNav = document.querySelector('.side-nav');

    // フェードアウト
    if (currentContainer) currentContainer.style.opacity = '0';
    if (currentSideNav) currentSideNav.style.opacity = '0';

    try {
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const newContainer = doc.querySelector('.container');
        const newSideNav = doc.querySelector('.side-nav');

        // タイトルの更新
        document.title = doc.title;

        // フェードアウトの完了を少し待つ
        await new Promise(resolve => setTimeout(resolve, 300));

        // DOMの差し替え
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
            newSideNav.style.opacity = '0';
            newSideNav.style.transition = 'opacity 0.3s ease';
            if (currentSideNav) {
                currentSideNav.replaceWith(newSideNav);
            } else {
                document.body.insertBefore(newSideNav, document.querySelector('script'));
            }
        } else if (currentSideNav) {
            currentSideNav.remove();
        }

        if (pushState) {
            history.pushState(null, '', url);
        }

        window.scrollTo(0, 0);

        // 新しいDOM要素のフェードイン準備
        // 少し遅延させてから opacity = 1 にする
        setTimeout(() => {
            const finalContainer = document.querySelector('.container');
            const finalSideNav = document.querySelector('.side-nav');
            if (finalContainer) finalContainer.style.opacity = '1';
            if (finalSideNav) finalSideNav.style.opacity = '1';
            
            // ページ初期化処理を再実行
            initPage();
        }, 50);

    } catch (error) {
        console.error('Page load error:', error);
        window.location.href = url; // フォールバック
    }
}

// 戻る/進むボタン(popstate)のハンドリング
window.addEventListener('popstate', () => {
    loadPage(window.location.href, false);
});

// 初回ロード時
document.addEventListener('DOMContentLoaded', () => {
    // .container と .side-nav にトランジションを仕込んでおく
    const c = document.querySelector('.container');
    const s = document.querySelector('.side-nav');
    if(c) c.style.transition = 'opacity 0.3s ease';
    if(s) s.style.transition = 'opacity 0.3s ease';

    initParticles();
    initPage();
});
