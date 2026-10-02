/* ============================================
   TechPulse — Single Article (article.js) - Fixed Supabase Sync
   ============================================ */
(function () {
    'use strict';
    const C = window.TPCommon;
    const I = window.TPI18N;

    const $ = (s, c = document) => c.querySelector(s);

    function getParam(name) {
        return new URLSearchParams(location.search).get(name);
    }

    function renderNotFound() {
        $('#articleContainer').innerHTML = `
            <div class="not-found">
                <div class="not-found-icon">🔍</div>
                <h1 data-i18n="not_found_title">${I.t('not_found_title')}</h1>
                <p data-i18n="not_found_desc">${I.t('not_found_desc')}</p>
                <a href="index.html" class="btn-primary" data-i18n="back_home">${I.t('back_home')}</a>
            </div>`;
        document.title = `${I.t('not_found_title')} | TechPulse`;
    }

    function renderArticle(rawArticle, rawAllArticles) {
        const lang = I.getLang();
        const article = C.localizeArticle(rawArticle, lang);

        document.title = `${article.title} | TechPulse`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', article.excerpt || '');

        setMeta('og:title', article.title);
        setMeta('og:description', article.excerpt || '');
        setMeta('og:type', 'article');

        const crumb = $('#breadcrumbTitle');
        if (crumb) crumb.textContent = article.title.length > 40
            ? article.title.slice(0, 40) + '…'
            : article.title;

        const readMin = C.calcReadMinutes(article.content);
        const views = C.registerView(article.id);
        const liked = C.hasLiked(article.id);
        const likeCount = C.getLikeCount(article.id);
        const bookmarked = C.isBookmarked(article.id);

        const related = rawAllArticles
            .filter(a => String(a.id) !== String(rawArticle.id) && a.category === rawArticle.category)
            .concat(rawAllArticles.filter(a => String(a.id) !== String(rawArticle.id) && a.category !== rawArticle.category))
            .slice(0, 3)
            .map(a => C.localizeArticle(a, lang));

        const relatedHTML = related.length ? `
            <section class="related-section">
                <h2 class="section-heading" data-i18n="related_heading">${I.t('related_heading')}</h2>
                <div class="articles-grid">
                    ${related.map(r => `
                        <article class="article-card">
                            <span class="card-category">${C.esc(C.translateCategory(r.category, lang))}</span>
                            <h3><a href="article.html?id=${encodeURIComponent(r.id)}">${C.esc(r.title)}</a></h3>
                            <p>${C.esc(r.excerpt)}</p>
                            <a href="article.html?id=${encodeURIComponent(r.id)}" class="read-more" data-i18n="read_more">${I.t('read_more')}</a>
                        </article>
                    `).join('')}
                </div>
            </section>` : '';

        const contentHTML = String(article.content || '')
            .split(/\n\n+/)
            .map(p => `<p>${C.esc(p).replace(/\n/g, '<br>')}</p>`)
            .join('');

        const imgHTML = article.image
            ? `<img src="${C.esc(article.image)}" alt="${C.esc(article.title)}" class="article-hero-img" loading="eager">`
            : '';

        const galleryImages = Array.isArray(article.images) ? article.images.filter(Boolean) : [];
        const galleryHTML = galleryImages.length ? `
            <div class="article-gallery">
                ${galleryImages.map(src => `
                    <img src="${C.esc(src)}" alt="${C.esc(article.title)}" loading="lazy" class="gallery-img">
                `).join('')}
            </div>` : '';

        $('#articleContainer').innerHTML = `
            <article class="single-article">
                <header class="article-header">
                    <span class="article-category">${C.esc(C.translateCategory(article.category, lang))}</span>
                    <h1>${C.esc(article.title)}</h1>
                    <div class="article-meta">
                        <span>👤 ${C.esc(article.author || 'TechPulse Team')}</span>
                        <span>📅 ${C.formatDate(article.date, lang) || C.formatDate(new Date().toISOString(), lang)}</span>
                        <span>⏱ ${readMin} <span data-i18n="read_time">${I.t('read_time')}</span></span>
                        <span>👁️ ${views} <span data-i18n="views">${I.t('views')}</span></span>
                    </div>
                </header>

                ${imgHTML}

                <div class="article-excerpt"><p>${C.esc(article.excerpt)}</p></div>

                <div class="article-content">${contentHTML}</div>

                ${galleryHTML}

                <div class="share-buttons">
                    <span class="share-label" data-i18n="share_label">${I.t('share_label')}</span>
                    <button class="like-btn${liked ? ' liked' : ''}" id="articleLikeBtn" type="button" aria-label="Like">
                        ${liked ? '❤️' : '🤍'} <span class="like-count">${likeCount}</span>
                    </button>
                    <button class="share-btn" id="articleBookmarkBtn" type="button">${bookmarked ? '📌' : '🔖'} Save</button>
                    <button class="share-btn" data-share="twitter" type="button">𝕏 Twitter</button>
                    <button class="share-btn" data-share="facebook" type="button">Facebook</button>
                    <button class="share-btn" data-share="linkedin" type="button">LinkedIn</button>
                    <button class="share-btn" data-share="whatsapp" type="button">WhatsApp</button>
                    <button class="share-btn" data-share="copy" type="button">🔗 Copy Link</button>
                </div>

                <div class="back-row">
                    <a href="index.html" class="btn-secondary" data-i18n="back_all">${I.t('back_all')}</a>
                </div>

                <section class="comments-section">
                    <h2 class="section-heading" data-i18n="comments_title">${I.t('comments_title')}</h2>
                    <div id="commentsContainer"></div>
                </section>
            </article>
            ${relatedHTML}
        `;

        C.loadDisqusThread(document.getElementById('commentsContainer'), {
            identifier: article.id,
            url: location.href,
            title: article.title
        });

        const likeBtn = $('#articleLikeBtn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => {
                const { liked, count } = C.toggleLike(article.id);
                likeBtn.classList.toggle('liked', liked);
                likeBtn.innerHTML = `${liked ? '❤️' : '🤍'} <span class="like-count">${count}</span>`;
            });
        }

        const bmBtn = $('#articleBookmarkBtn');
        if (bmBtn) {
            bmBtn.addEventListener('click', () => {
                C.toggleBookmark(article.id, article.title);
                bmBtn.innerHTML = `${C.isBookmarked(article.id) ? '📌' : '🔖'} Save`;
            });
        }

        document.querySelectorAll('.share-btn[data-share]').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.share;
                const url = encodeURIComponent(location.href);
                const title = encodeURIComponent(article.title);

                if (type === 'copy') {
                    navigator.clipboard?.writeText(location.href).then(() => {
                        btn.textContent = '✓ Copied!';
                        setTimeout(() => btn.textContent = '🔗 Copy Link', 1800);
                    });
                    return;
                }
                const map = {
                    twitter:  `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
                    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
                    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
                    whatsapp: `https://wa.me/?text=${title}%20${url}`
                };
                if (map[type]) window.open(map[type], '_blank', 'noopener,noreferrer,width=600,height=500');
            });
        });
    }

    function setMeta(property, content) {
        let el = document.querySelector(`meta[property="${property}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute('property', property);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content || '');
    }

    function injectStructuredData(article) {
        const old = document.getElementById('article-jsonld');
        if (old) old.remove();

        const lang = I.getLang();
        const data = {
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            headline: C.pickLocalized(article.title, lang),
            description: C.pickLocalized(article.excerpt, lang),
            datePublished: article.date || '',
            author: { '@type': 'Person', name: article.author || 'TechPulse Team' },
            image: article.image ? [new URL(article.image, location.href).href] : undefined,
            mainEntityOfPage: location.href
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'article-jsonld';
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
    }

    (function readingProgress() {
        const bar = $('#readingProgressBar');
        const top = $('#scrollTopBtn');
        function onScroll() {
            if (bar) {
                const h = document.documentElement;
                const p = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
                bar.style.width = Math.min(100, p) + '%';
            }
            if (top) top.classList.toggle('visible', window.scrollY > 400);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        if (top) top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    })();

    let currentArticle = null, currentAllArticles = [];

    document.addEventListener('tp:langchange', () => {
        if (currentArticle) renderArticle(currentArticle, currentAllArticles);
    });

    document.addEventListener('DOMContentLoaded', async () => {
        C.initDarkMode();
        C.initAdminGate();
        C.initTicker();

        const id = getParam('id') || getParam('slug');
        if (!id) { renderNotFound(); return; }

        const articles = await C.getArticles();
        
        // استخدام مطابقة مرنة (String comparison) لتفادي خطأ اختلاف النوع بين المعرف النصي والرقمي
        const article = articles.find(a => String(a.id) === String(id) || String(a.slug) === String(id));
        
        if (!article) { renderNotFound(); return; }

        currentArticle = article;
        currentAllArticles = articles;
        renderArticle(article, articles);
        injectStructuredData(article);
    });
})();