const fs = require('fs');
const iconv = require('iconv-lite');

const files = ['js/common.js', 'js/main.js', 'js/i18n.js', 'index.html'];

for (const f of files) {
  if (!fs.existsSync(f)) { console.log('SKIP (missing):', f); continue; }

  let content = fs.readFileSync(f, 'utf8');
  const original = content;

  // 1) Strip BOM
  let bomStripped = false;
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
    bomStripped = true;
  }

  // 2) Reverse Windows-1252 corruption (NOT CP1256)
  const bytes = iconv.encode(content, 'windows-1252');
  const fixed = iconv.decode(bytes, 'utf8');

  // 3) Metrics
  const hasEmoji  = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(fixed);
  const hasCJK    = /[\u4E00-\u9FFF]/.test(fixed);
  const hasDeva   = /[\u0900-\u097F]/.test(fixed);
  const hasArabic = /[\u0600-\u06FF]/.test(fixed);
  const replaced  = (fixed.match(/\uFFFD/g) || []).length;

  console.log('\n=== ' + f + ' ===');
  console.log('BOM stripped: ' + bomStripped);
  console.log('Emoji: ' + hasEmoji + '  CJK: ' + hasCJK + '  Devanagari: ' + hasDeva + '  Arabic: ' + hasArabic);
  console.log('Replacement chars: ' + replaced);

  // Save only if improvement
  const improved = (hasEmoji || hasCJK || hasDeva) && !hasArabic && replaced < 5;
  if (improved && fixed !== content) {
    fs.writeFileSync(f, fixed, 'utf8');
    console.log('  SAVED');
  } else {
    console.log('  SKIP (no clear improvement)');
  }
}

console.log('\n=== Done ===');