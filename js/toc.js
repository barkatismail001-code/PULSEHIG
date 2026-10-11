/* ==========================================================================
   TechPulse — Table of Contents (toc.js) v20261005
   Auto-builds a sticky TOC from h2 headings inside .article-content.
   - Requires at least 3 headings
   - Smooth scroll on click
   - Active heading highlight via IntersectionObserver
   - Anchor links for direct sharing
   - Copy-link button on hover
   ========================================================================== */
window.TPToc = (function () {
  'use strict';

  function slugifyHeading(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'section';
  }

  function build(contentEl, options) {
    if (!contentEl) return null;

    var opts = Object.assign({
      minHeadings: 3,
      containerSelector: null,
      scrollOffset: 90
    }, options || {});

    var headings = Array.prototype.slice.call(contentEl.querySelectorAll('h2'));
    if (headings.length < opts.minHeadings) return null;

    var items = headings.map(function (h, idx) {
      var id = h.id;
      if (!id) {
        id = slugifyHeading(h.textContent);
        var suffix = 1;
        var unique = id;
        while (document.getElementById(unique)) {
          unique = id + '-' + (++suffix);
        }
        id = unique;
        h.id = id;
      }
      if (!h.querySelector('.heading-anchor')) {
        var anchor = document.createElement('a');
        anchor.className = 'heading-anchor';
        anchor.href = '#' + id;
        anchor.setAttribute('aria-label', 'Direct link to this section');
        anchor.textContent = '#';
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          history.pushState(null, '', '#' + id);
          var top = h.getBoundingClientRect().top + window.scrollY - opts.scrollOffset;
          window.scrollTo({ top: top, behavior: 'smooth' });
        });
        h.appendChild(anchor);
      }
      return {
        id: id,
        text: h.textContent.replace('#', '').trim(),
        el: h,
        index: idx
      };
    });

    var tocHTML =
      '<nav class="toc-nav" aria-label="Table of contents">' +
        '<div class="toc-header">' +
          '<span class="toc-title">📑 On this page</span>' +
          '<button type="button" class="toc-toggle" aria-label="Toggle TOC" aria-expanded="true">−</button>' +
        '</div>' +
        '<ol class="toc-list">' +
          items.map(function (it) {
            return '<li class="toc-item">' +
              '<a href="#' + it.id + '" class="toc-link" data-toc-target="' + it.id + '">' +
                it.text +
              '</a>' +
            '</li>';
          }).join('') +
        '</ol>' +
        '<div class="toc-progress" aria-hidden="true">' +
          '<div class="toc-progress-bar"></div>' +
        '</div>' +
      '</nav>';

    var tocEl;

    if (opts.containerSelector) {
      var container = document.querySelector(opts.containerSelector);
      if (container) {
        container.innerHTML = tocHTML;
        tocEl = container.querySelector('.toc-nav');
      }
    }

    if (!tocEl) {
      var wrapper = document.createElement('aside');
      wrapper.className = 'toc-floating';
      wrapper.innerHTML = tocHTML;
      document.body.appendChild(wrapper);
      tocEl = wrapper.querySelector('.toc-nav');

      var fab = document.createElement('button');
      fab.type = 'button';
      fab.className = 'toc-fab';
      fab.setAttribute('aria-label', 'Table of contents');
      fab.textContent = '📑';
      fab.addEventListener('click', function () {
        wrapper.classList.toggle('open');
      });
      document.body.appendChild(fab);
    }

    tocEl.querySelectorAll('.toc-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.getElementById(link.dataset.tocTarget);
        if (!target) return;
        var top = target.getBoundingClientRect().top + window.scrollY - opts.scrollOffset;
        window.scrollTo({ top: top, behavior: 'smooth' });
        history.pushState(null, '', '#' + link.dataset.tocTarget);
        var floating = tocEl.closest('.toc-floating');
        if (floating) floating.classList.remove('open');
      });
    });

    var toggle = tocEl.querySelector('.toc-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var collapsed = tocEl.classList.toggle('collapsed');
        toggle.textContent = collapsed ? '+' : '−';
        toggle.setAttribute('aria-expanded', String(!collapsed));
      });
    }

    var linkMap = {};
    items.forEach(function (it) {
      linkMap[it.id] = tocEl.querySelector('[data-toc-target="' + it.id + '"]');
    });

    var lastActive = null;

    function setActive(id) {
      if (lastActive === id) return;
      lastActive = id;
      Object.keys(linkMap).forEach(function (key) {
        var link = linkMap[key];
        if (!link) return;
        link.classList.toggle('active', key === id);
      });
    }

    if ('IntersectionObserver' in window) {
      var visible = {};
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          visible[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0;
        });
        var best = null;
        var bestRatio = 0;
        Object.keys(visible).forEach(function (id) {
          if (visible[id] > bestRatio) {
            bestRatio = visible[id];
            best = id;
          }
        });
        if (best) setActive(best);
      }, {
        rootMargin: '-' + (opts.scrollOffset + 20) + 'px 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1]
      });
      items.forEach(function (it) { io.observe(it.el); });
    }

    var progressBar = tocEl.querySelector('.toc-progress-bar');
    if (progressBar) {
      var updateProgress = function () {
        var rect = contentEl.getBoundingClientRect();
        var total = contentEl.offsetHeight - window.innerHeight;
        var scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
        var pct = total > 0 ? (scrolled / total) * 100 : 0;
        progressBar.style.width = Math.min(100, Math.max(0, pct)) + '%';
      };
      window.addEventListener('scroll', updateProgress, { passive: true });
      updateProgress();
    }

    return {
      tocEl: tocEl,
      items: items
    };
  }

  return {
    build: build,
    slugifyHeading: slugifyHeading
  };
})();