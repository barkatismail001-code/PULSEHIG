/* ==========================================================================
   TechPulse — Table of Contents (TOC) Generator
   Auto-builds a sticky TOC from <h2> headings inside .article-content.
   - Requires at least 3 headings to appear
   - Smooth scroll on click
   - Active heading highlight via IntersectionObserver
   - Anchor links for sharing
   - Copy-link button on hover for each heading
   ========================================================================== */
window.TPToc = (function () {
  'use strict';

  function slugifyHeading(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'section';
  }

  function build(contentEl, options) {
    if (!contentEl) return null;
    const opts = Object.assign({
      minHeadings: 3,
      containerSelector: null,     // if null, we create a floating panel
      mobileBreakpoint: 960,
      scrollOffset: 90,            // sticky header height
    }, options || {});

    const headings = Array.from(contentEl.querySelectorAll('h2'));
    if (headings.length < opts.minHeadings) return null;

    // Ensure each heading has an id + anchor + copy button
    const items = headings.map((h, idx) => {
      let id = h.id;
      if (!id) {
        id = slugifyHeading(h.textContent);
        // Avoid duplicates
        let suffix = 1;
        let unique = id;
        while (document.getElementById(unique)) {
          unique = id + '-' + (++suffix);
        }
        id = unique;
        h.id = id;
      }
      // Add an anchor icon for direct linking
      if (!h.querySelector('.heading-anchor')) {
        const anchor = document.createElement('a');
        anchor.className = 'heading-anchor';
        anchor.href = '#' + id;
        anchor.setAttribute('aria-label', 'Direct link to this section');
        anchor.innerHTML = '#';
        anchor.addEventListener('click', (e) => {
          e.preventDefault();
          history.pushState(null, '', '#' + id);
          window.scrollTo({ top: h.getBoundingClientRect().top + window.scrollY - opts.scrollOffset, behavior: 'smooth' });
        });
        h.appendChild(anchor);
      }
      return { id, text: h.textContent.replace('#', '').trim(), el: h, index: idx };
    });

    // Build TOC markup
    const tocHTML = `
      <nav class="toc-nav" aria-label="Table of contents">
        <div class="toc-header">
          <span class="toc-title">📑 On this page</span>
          <button type="button" class="toc-toggle" aria-label="Toggle TOC" aria-expanded="true">−</button>
        </div>
        <ol class="toc-list">
          ${items.map(it => `
            <li class="toc-item">
              <a href="#${it.id}" class="toc-link" data-toc-target="${it.id}">
                ${it.text}
              </a>
            </li>
          `).join('')}
        </ol>
        <div class="toc-progress" aria-hidden="true">
          <div class="toc-progress-bar"></div>
        </div>
      </nav>
    `;

    // Place TOC
    let tocEl;
    if (opts.containerSelector) {
      const container = document.querySelector(opts.containerSelector);
      if (container) {
        container.innerHTML = tocHTML;
        tocEl = container.querySelector('.toc-nav');
      }
    }

    if (!tocEl) {
      // Create a floating side panel injected into body
      const wrapper = document.createElement('aside');
      wrapper.className = 'toc-floating';
      wrapper.innerHTML = tocHTML;
      document.body.appendChild(wrapper);
      tocEl = wrapper.querySelector('.toc-nav');

      // Hide on mobile via CSS by default; toggle button shows it
      const fab = document.createElement('button');
      fab.type = 'button';
      fab.className = 'toc-fab';
      fab.setAttribute('aria-label', 'Table of contents');
      fab.innerHTML = '📑';
      fab.addEventListener('click', () => wrapper.classList.toggle('open'));
      document.body.appendChild(fab);
    }

    // Smooth scroll for TOC links
    tocEl.querySelectorAll('.toc-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(link.dataset.tocTarget);
        if (!target) return;
        const top = target.getBoundingClientRect().top + window.scrollY - opts.scrollOffset;
        window.scrollTo({ top, behavior: 'smooth' });
        history.pushState(null, '', '#' + link.dataset.tocTarget);
        // Close floating panel on mobile after selecting
        if (tocEl.closest('.toc-floating')) tocEl.closest('.toc-floating').classList.remove('open');
      });
    });

    // Collapse button
    const toggle = tocEl.querySelector('.toc-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const collapsed = tocEl.classList.toggle('collapsed');
        toggle.textContent = collapsed ? '+' : '−';
        toggle.setAttribute('aria-expanded', String(!collapsed));
      });
    }

    // Active heading highlight via IntersectionObserver
    const linkMap = new Map(items.map(it => [it.id, tocEl.querySelector(`[data-toc-target="${it.id}"]`)]));
    let lastActive = null;

    function setActive(id) {
      if (lastActive === id) return;
      lastActive = id;
      linkMap.forEach((link, key) => {
        if (!link) return;
        link.classList.toggle('active', key === id);
      });
    }

    if ('IntersectionObserver' in window) {
      const visible = new Map();
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => {
          visible.set(en.target.id, en.isIntersecting ? en.intersectionRatio : 0);
        });
        // Pick the topmost visible heading
        let best = null, bestRatio = 0;
        for (const [id, ratio] of visible.entries()) {
          if (ratio > bestRatio) { bestRatio = ratio; best = id; }
        }
        if (best) setActive(best);
      }, {
        rootMargin: `-${opts.scrollOffset + 20}px 0px -60% 0px`,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      });
      items.forEach(it => io.observe(it.el));
    }

    // TOC progress bar (how far through the article)
    const progressBar = tocEl.querySelector('.toc-progress-bar');
    if (progressBar) {
      function updateProgress() {
        const rect = contentEl.getBoundingClientRect();
        const total = contentEl.offsetHeight - window.innerHeight;
        const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
        const pct = total > 0 ? (scrolled / total) * 100 : 0;
        progressBar.style.width = Math.min(100, Math.max(0, pct)) + '%';
      }
      window.addEventListener('scroll', updateProgress, { passive: true });
      updateProgress();
    }

    return { tocEl, items };
  }

  return { build, slugifyHeading };
})();
