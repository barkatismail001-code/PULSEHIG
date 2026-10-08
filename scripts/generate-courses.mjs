// scripts/generate-courses.mjs
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.pulsehig.com';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ijgvrjkpiofamwcmkmgi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || 'sb_publishable_5NcPMPDtyNXRg-oduydRUA_JM6IeV9k';

const esc = s => String(s ?? '').replace(/[<>&'"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&#39;','"':'&quot;'}[c]));

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  return res.json();
}

function renderContent(text) {
  // Simple markdown â†’ HTML
  return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}

function page(course, lectures, assignments, exams) {
  const url = `${SITE}/course/${course.slug}.html`;
  const title = course.title;
  
  // hreflang
  const langs = ['en', 'zh', 'es', 'hi', 'fr', 'pt'];
  const hreflang = langs.map(l => {
    const href = l === 'en' ? url : `${url}?lang=${l}`;
    return `  <link rel="alternate" hreflang="${l}" href="${href}">`;
  }).join('\n');
  
  // Lectures HTML
  const lecturesHTML = lectures.map(l => `
    <div class="lecture-item">
      <div class="lecture-header">
        <div class="lecture-num">${l.number}</div>
        <div class="lecture-content">
          <h4>${esc(l.title)}</h4>
          <p>${esc((l.content || '').slice(0, 220))}...</p>
          <div class="lecture-meta">
            <span>âڈ± ${l.duration_minutes || 50} min read</span>
          </div>
        </div>
      </div>
      <div class="lecture-full">
        <div class="lecture-full-content">${renderContent(l.content)}</div>
      </div>
    </div>
  `).join('');
  
  // Assignments HTML
  const assignmentsHTML = assignments.map(a => {
    const problems = Array.isArray(a.problems) ? a.problems : [];
    return `
      <div class="assignment-item">
        <h3>ًں“‌ ${esc(a.title)}</h3>
        ${problems.map((p, i) => `
          <div class="problem-item">
            <p><strong>Q${i+1}.</strong> ${esc(p.question)}</p>
            <details><summary>Show Solution</summary><p>${esc(p.solution)}</p></details>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');
  
  // Exams HTML
  const examsHTML = exams.map(e => {
    const problems = Array.isArray(e.problems) ? e.problems : [];
    return `
      <div class="exam-item">
        <h3>ًںژ¯ ${esc(e.title)}</h3>
        ${problems.map((p, i) => `
          <div class="problem-item">
            <p><strong>Q${i+1}.</strong> ${esc(p.question)}</p>
            <details><summary>Show Solution</summary><p>${esc(p.solution)}</p></details>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');
  
  // Schema.org
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: title,
    description: course.description,
    provider: { '@type': 'Organization', name: course.university || 'TechPulse Academy' },
    url: url,
    courseCode: course.code,
    hasCourseInstance: lectures.map(l => ({
      '@type': 'CourseInstance',
      name: l.title,
      courseMode: 'online'
    }))
  };
  
  return `<!DOCTYPE html>
<html lang="en" dir="ltr" translate="no">
<head>
<meta charset="UTF-8">
<meta name="google" content="notranslate">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} â€” ${esc(course.university)} | TechPulse Academy</title>
<meta name="description" content="${esc(course.description)}">
<link rel="canonical" href="${url}">
${hreflang}
<link rel="alternate" hreflang="x-default" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(course.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/og-academy.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico">
<link rel="stylesheet" href="/css/style.css?v=20261007">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<style>
  .course-page-wrap { max-width: 980px; margin: 24px auto 60px; }
  .course-hero { background: linear-gradient(135deg, #0f172a, #1e3a8a); color: #fff; border-radius: 16px; padding: 40px 36px; margin-bottom: 28px; }
  .course-hero h1 { font-size: 2rem; margin: 0 0 12px; }
  .course-hero p { opacity: 0.92; line-height: 1.65; margin: 0; }
  .course-code-badge { display: inline-block; background: rgba(255,255,255,0.15); padding: 5px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; margin-bottom: 12px; }
  .course-hero-stats { display: flex; gap: 28px; flex-wrap: wrap; padding-top: 24px; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.2); }
  .course-stat-num { font-size: 1.6rem; font-weight: 900; color: #fbbf24; display: block; }
  .course-stat-label { font-size: 0.75rem; text-transform: uppercase; opacity: 0.85; }
  .course-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; border-bottom: 2px solid var(--border); }
  .course-tab { background: transparent; border: none; color: var(--text-muted); padding: 12px 20px; font-size: 0.95rem; font-weight: 600; cursor: pointer; border-bottom: 3px solid transparent; margin-bottom: -2px; }
  .course-tab.active { color: var(--primary); border-bottom-color: var(--primary); }
  .course-panel { display: none; }
  .course-panel.active { display: block; }
  .course-section { background: var(--bg-alt); border: 1px solid var(--border); border-radius: 12px; padding: 0; overflow: hidden; }
  .lecture-item { border-bottom: 1px solid var(--border); }
  .lecture-item:last-child { border-bottom: none; }
  .lecture-header { display: flex; gap: 16px; padding: 20px 24px; cursor: pointer; }
  .lecture-num { width: 44px; height: 44px; background: var(--primary-soft, #dbeafe); color: var(--primary, #2563eb); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; }
  .lecture-content h4 { margin: 0 0 6px; font-size: 1.05rem; }
  .lecture-content p { font-size: 0.9rem; color: var(--text-muted); margin: 0 0 8px; }
  .lecture-meta { font-size: 0.8rem; color: var(--text-muted); }
  .lecture-full { max-height: 0; overflow: hidden; transition: max-height 0.4s ease; }
  .lecture-item.open .lecture-full { max-height: 10000px; }
  .lecture-full-content { padding: 0 24px 24px 84px; line-height: 1.75; border-top: 1px dashed var(--border); padding-top: 20px; }
  .assignment-item, .exam-item { padding: 24px; border-bottom: 1px solid var(--border); }
  .problem-item { padding: 14px 0; border-bottom: 1px dashed var(--border); }
  .problem-item:last-child { border-bottom: none; }
  .problem-item details { margin-top: 10px; }
  .problem-item details p { background: var(--bg-soft); padding: 14px; border-left: 3px solid var(--success); margin-top: 8px; }
  .problem-item summary { cursor: pointer; color: var(--primary); font-weight: 600; }
  @media (max-width: 720px) {
    .lecture-full-content { padding-left: 24px; }
  }
</style>
</head>
<body>
<header class="main-header">
  <div class="container">
    <div class="logo"><a href="/index.html"><span>TechPulse</span></a></div>
    <nav class="nav-links">
      <a href="/index.html">Home</a>
      <a href="/academy.html" class="active">Academy</a>
      <a href="/tools.html">Tools</a>
      <a href="/best-picks.html">Best Picks</a>
      <a href="/guides.html">Guides</a>
      <a href="/qa.html">Q&A</a>
      <a href="/forum.html">Forum</a>
      <a href="/news.html">News</a>
    </nav>
  </div>
</header>

<main class="container">
  <div class="course-page-wrap">
    <nav class="breadcrumb" style="margin-bottom:16px">
      <a href="/index.html">Home</a> &gt; <a href="/academy.html">Academy</a> &gt; <span>${esc(title)}</span>
    </nav>
    
    <div class="course-hero">
      <span class="course-code-badge">${esc(course.code)} آ· ${esc(course.university)}</span>
      <h1>${esc(title)}</h1>
      <p>${esc(course.description)}</p>
      <div class="course-hero-stats">
        <div><span class="course-stat-num">${lectures.length}</span><span class="course-stat-label">Lectures</span></div>
        <div><span class="course-stat-num">${assignments.length}</span><span class="course-stat-label">Assignments</span></div>
        <div><span class="course-stat-num">${exams.length}</span><span class="course-stat-label">Exams</span></div>
        <div><span class="course-stat-num">${course.duration_hours || 0}h</span><span class="course-stat-label">Duration</span></div>
      </div>
    </div>
    
    <div class="course-tabs">
      <button class="course-tab active" data-tab="lectures">ًںژ¬ Lectures (${lectures.length})</button>
      <button class="course-tab" data-tab="assignments">ًں“‌ Assignments (${assignments.length})</button>
      <button class="course-tab" data-tab="exams">ًںژ¯ Exams (${exams.length})</button>
    </div>
    
    <div class="course-panel active" data-panel="lectures">
      <div class="course-section">${lecturesHTML || '<p style="padding:24px;text-align:center;color:var(--text-muted)">Lectures coming soon.</p>'}</div>
    </div>
    
    <div class="course-panel" data-panel="assignments">
      <div class="course-section">${assignmentsHTML || '<p style="padding:24px;text-align:center;color:var(--text-muted)">Assignments coming soon.</p>'}</div>
    </div>
    
    <div class="course-panel" data-panel="exams">
      <div class="course-section">${examsHTML || '<p style="padding:24px;text-align:center;color:var(--text-muted)">Exams coming soon.</p>'}</div>
    </div>
  </div>
</main>

<footer class="main-footer">
  <div class="container">
    <p>&copy; 2026 TechPulse. All rights reserved.</p>
  </div>
</footer>

<script src="/js/common.js?v=20261007" defer></script>
<script src="/js/i18n.js?v=20261007" defer></script>
<script>
document.addEventListener('DOMContentLoaded', function () {
  // Tab switching
  document.querySelectorAll('.course-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.course-tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.course-panel').forEach(function (p) { p.classList.remove('active'); });
      tab.classList.add('active');
      var panel = document.querySelector('.course-panel[data-panel="' + tab.dataset.tab + '"]');
      if (panel) panel.classList.add('active');
    });
  });
  
  // Lecture toggle
  document.querySelectorAll('.lecture-header').forEach(function (header) {
    header.addEventListener('click', function () {
      var item = header.closest('.lecture-item');
      if (item) item.classList.toggle('open');
    });
  });
  
  // Language switcher via ?lang=
  var params = new URLSearchParams(location.search);
  var lang = params.get('lang');
  if (lang && lang !== 'en' && window.TPI18N) {
    window.TPI18N.setLang(lang);
  }
});
</script>
</body>
</html>`;
}

async function main() {
  console.log('ًں“ڑ Generating static course pages...');
  
  const courses = await sbGet('courses?select=*&order=code.asc');
  console.log(`   Found ${courses.length} courses`);
  
  await mkdir(join(ROOT, 'course'), { recursive: true });
  
  let generated = 0;
  for (const course of courses) {
    try {
      const [lectures, assignments, exams] = await Promise.all([
        sbGet(`lectures?select=*&course_slug=eq.${course.slug}&order=number.asc`),
        sbGet(`assignments?select=*&course_slug=eq.${course.slug}&order=number.asc`),
        sbGet(`exams?select=*&course_slug=eq.${course.slug}&order=id.asc`)
      ]);
      
      const html = page(course, lectures || [], assignments || [], exams || []);
      await writeFile(join(ROOT, 'course', `${course.slug}.html`), html);
      console.log(`   âœ“ /course/${course.slug}.html (${lectures.length} lec, ${assignments.length} asg, ${exams.length} exm)`);
      generated++;
    } catch (e) {
      console.warn(`   âœ— Failed ${course.slug}: ${e.message}`);
    }
  }
  
  console.log(`\nâœ… Generated ${generated}/${courses.length} course pages`);
}

main().catch(e => { console.error('â‌Œ', e); process.exit(1); });