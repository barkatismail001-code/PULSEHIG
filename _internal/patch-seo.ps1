$ErrorActionPreference = 'Stop'
$site = 'D:\SITEWEB\PULSETECH'
Set-Location $site
$enc = New-Object System.Text.UTF8Encoding $false
$gsPath = Join-Path $site 'scripts\generate-seo.mjs'
$g = [System.IO.File]::ReadAllText($gsPath, $enc)

Write-Host "[1/7] canonical-overrides.json" -ForegroundColor Cyan
$coPath = Join-Path $site 'data\canonical-overrides.json'
if (-not (Test-Path $coPath)) {
  $co = '{"_comment":"Deprecated ID -> canonical ID.","3":32,"4":24,"5":25,"16":28,"17":29,"18":30,"19":31,"23":2,"26":7,"27":14}'
  [System.IO.File]::WriteAllText($coPath, $co, $enc)
  Write-Host "  created" -ForegroundColor Green
} else {
  Write-Host "  present" -ForegroundColor Yellow
}

Write-Host "[2/7] Helpers before main()" -ForegroundColor Cyan
if ($g -match 'loadCanonicalOverrides') {
  Write-Host "  present" -ForegroundColor Yellow
} else {
  $helpers = "async function loadCanonicalOverrides() {`n" +
    "  try {`n" +
    "    const j = JSON.parse(await readFile(join(ROOT, 'data', 'canonical-overrides.json'), 'utf8'));`n" +
    "    const out = {};`n" +
    "    for (const [k, v] of Object.entries(j)) {`n" +
    "      if (k.startsWith('_')) continue;`n" +
    "      out[String(k)] = String(v);`n" +
    "    }`n" +
    "    return out;`n" +
    "  } catch { return {}; }`n" +
    "}`n`n" +
    "async function loadExistingSlugs() {`n" +
    "  try {`n" +
    "    const j = JSON.parse(await readFile(join(ROOT, 'data', 'static-slugs.json'), 'utf8'));`n" +
    "    return (j && typeof j === 'object') ? j : {};`n" +
    "  } catch { return {}; }`n" +
    "}`n`n" +
    "function depStubPage(title, canonicalSlug) {`n" +
    "  const t = String(title).replace(/[<>&'`"]/g, function(c){return ({'<':'&lt;','>':'&gt;','&':'&amp;',`"'":'&#39;','`"':'&quot;'})[c];});`n" +
    "  return '<!DOCTYPE html>\n<html lang=`"en`"><head>\n' +`n" +
    "    '<meta charset=`"UTF-8`">\n<meta name=`"viewport`" content=`"width=device-width,initial-scale=1.0`">\n' +`n" +
    "    '<meta name=`"robots`" content=`"noindex, follow`">\n' +`n" +
    "    '<link rel=`"canonical`" href=`"https://www.pulsehig.com/a/' + canonicalSlug + '.html`">\n' +`n" +
    "    '<meta http-equiv=`"refresh`" content=`"0; url=/a/' + canonicalSlug + '.html`">\n' +`n" +
    "    '<title>' + t + '</title>\n' +`n" +
    "    '<script>location.replace(`"/a/' + canonicalSlug + '.html`");</script>\n' +`n" +
    "    '</head><body><p>Redirecting to <a href=`"/a/' + canonicalSlug + '.html`">/a/' + canonicalSlug + '.html</a></p></body></html>\n';`n" +
    "}`n`n"
  $anchor = 'async function main() {'
  $idx = $g.IndexOf($anchor)
  if ($idx -lt 0) { throw "main not found" }
  $g = $g.Substring(0, $idx) + $helpers + $g.Substring($idx)
  Write-Host "  inserted" -ForegroundColor Green
}

Write-Host "[3/7] Replace raw loading" -ForegroundColor Cyan
if ($g -match 'SAFETY-GUARD') {
  Write-Host "  present" -ForegroundColor Yellow
} else {
  $oldBlock = "  // Load from Supabase`n  const raw = (await loadFromSupabase()).filter((a) => a && a.id);`n  const articles = [];`n  const seenSlugs = new Set();`n`n  for (const a of raw) {`n    let slug = slugOf(a);`n    if (seenSlugs.has(slug)) slug += '-' + String(a.id).replace(/[^a-z0-9]/gi, '').slice(-4);`n    seenSlugs.add(slug);"
  $newBlock = "  // Load from Supabase`n  const rawAll = (await loadFromSupabase()).filter((a) => a && a.id);`n`n  // SAFETY-GUARD: refuse to wipe when Supabase is empty`n  if (rawAll.length === 0 && !process.env.SUPABASE_ALLOW_EMPTY) {`n    console.error('SAFETY ABORT: Supabase returned 0 articles. Refusing to wipe.');`n    process.exit(1);`n  }`n`n  const overrides = await loadCanonicalOverrides();`n  const existingSlugs = await loadExistingSlugs();`n  rawAll.sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));`n  const raw = rawAll.filter((a) => !overrides[String(a.id)]);`n  const articles = [];`n  const seenSlugs = new Set();`n`n  for (const a of raw) {`n    let slug = existingSlugs[String(a.id)];`n    if (!slug) {`n      slug = slugOf(a);`n      if (seenSlugs.has(slug)) slug += '-' + String(a.id).replace(/[^a-z0-9]/gi, '').slice(-4);`n    }`n    seenSlugs.add(slug);"
  if (-not $g.Contains($oldBlock)) { Write-Host "  ERROR block not found" -ForegroundColor Red; exit 1 }
  $g = $g.Replace($oldBlock, $newBlock)
  Write-Host "  replaced" -ForegroundColor Green
}

Write-Host "[4/7] Deprecated collection" -ForegroundColor Cyan
if ($g -match 'deprecatedArticles') {
  Write-Host "  present" -ForegroundColor Yellow
} else {
  $old = "  // Load manual articles`n  const manualList = [];"
  $new = "  // Deprecated articles`n  const deprecatedArticles = [];`n  for (const a of rawAll) {`n    const canId = overrides[String(a.id)];`n    if (!canId) continue;`n    const canon = articles.find((x) => x.id === canId);`n    if (!canon) continue;`n    deprecatedArticles.push({ id: String(a.id), canonicalSlug: canon.slug, raw: a });`n  }`n`n  // Load manual articles`n  const manualList = [];"
  if (-not $g.Contains($old)) { Write-Host "  ERROR manual block not found" -ForegroundColor Red; exit 1 }
  $g = $g.Replace($old, $new)
  Write-Host "  inserted" -ForegroundColor Green
}

Write-Host "[5/7] slug-map writer" -ForegroundColor Cyan
if ($g -match 'slug-map\.js written') {
  Write-Host "  present" -ForegroundColor Yellow
} else {
  $old = "  await writeFile(join(ROOT, 'data', 'static-slugs.json'), JSON.stringify(slugMap, null, 1) + '\n');"
  $new = "  for (const d of deprecatedArticles) slugMap[d.id] = d.canonicalSlug;`n  await writeFile(join(ROOT, 'data', 'static-slugs.json'), JSON.stringify(slugMap, null, 1) + '\n');`n  await mkdir(join(ROOT, 'js'), { recursive: true });`n  await writeFile(join(ROOT, 'js', 'slug-map.js'), 'window.TP_SLUG_MAP = ' + JSON.stringify(slugMap) + ';\n');`n  console.log('OK js/slug-map.js written (' + Object.keys(slugMap).length + ' entries)');"
  if (-not $g.Contains($old)) { Write-Host "  ERROR static-slugs line not found" -ForegroundColor Red; exit 1 }
  $g = $g.Replace($old, $new)
  Write-Host "  inserted" -ForegroundColor Green
}

Write-Host "[6/7] Deprecated stubs" -ForegroundColor Cyan
if ($g -match 'deprecated noindex pages') {
  Write-Host "  present" -ForegroundColor Yellow
} else {
  $old = "  console.log('OK ' + written + ' article pages written');"
  if (-not $g.Contains($old)) {
    $old = "  console.log('\u2713 ' + written + ' article pages written');"
  }
  if (-not $g.Contains($old)) {
    $old = "  console.log('\u00E2\u0153\u201C ' + written + ' article pages written');"
  }
  if (-not $g.Contains($old)) {
    Write-Host "  ERROR log line not found - trying fallback" -ForegroundColor Yellow
    $lines = $g -split "`n"
    $targetLine = -1
    for ($i = 0; $i -lt $lines.Length; $i++) {
      if ($lines[$i] -match 'article pages written') { $targetLine = $i; break }
    }
    if ($targetLine -lt 0) { Write-Host "  cannot find" -ForegroundColor Red; exit 1 }
    $indent = [regex]::Match($lines[$targetLine], '^(\s*)').Groups[1].Value
    $old = $lines[$targetLine]
  }
  $new = $old + "`n" +
    "  for (const d of deprecatedArticles) {`n" +
    "    const depSlug = d.canonicalSlug + '-' + d.id;`n" +
    "    const r = d.raw;`n" +
    "    const title = plain(typeof r.title === 'object' ? (r.title.en || Object.values(r.title).find(Boolean)) : r.title);`n" +
    "    await writeFile(join(ROOT, 'a', depSlug + '.html'), depStubPage(title, d.canonicalSlug));`n" +
    "    written++;`n" +
    "  }`n" +
    "  console.log('OK +' + deprecatedArticles.length + ' deprecated pages');"
  $g = $g.Replace($old, $new)
  Write-Host "  inserted" -ForegroundColor Green
}

[System.IO.File]::WriteAllText($gsPath, $g, $enc)

Write-Host "[7/7] Rebuild" -ForegroundColor Cyan
node scripts\generate-seo.mjs
Write-Host ""
node scripts\verify-build.mjs

Write-Host ""
Write-Host "=== Final check ===" -ForegroundColor Cyan
$ss = Get-Content (Join-Path $site 'data\static-slugs.json') -Raw | ConvertFrom-Json
$keys = ($ss.PSObject.Properties | Where-Object { $_.Name -notlike '_*' }).Count
Write-Host "static-slugs.json: $keys entries"
Write-Host "sitemap-posts: $((Select-String -Path (Join-Path $site 'sitemap-posts.xml') -Pattern '<loc>').Count) URLs"
Write-Host "sitemap-courses: $((Select-String -Path (Join-Path $site 'sitemap-courses.xml') -Pattern '<loc>').Count) URLs"
Write-Host ""
Write-Host "DONE" -ForegroundColor Green
Read-Host "Press Enter to exit"