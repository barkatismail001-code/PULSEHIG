$ErrorActionPreference = 'Stop'
$site = 'D:\SITEWEB\PULSETECH'
Set-Location $site
$enc = New-Object System.Text.UTF8Encoding $false

Write-Host "[1/4] Inspect .env" -ForegroundColor Cyan
$envPath = Join-Path $site '.env'

if (-not (Test-Path $envPath)) {
  Write-Host "  .env MISSING" -ForegroundColor Red
  Write-Host "  Create it with: SUPABASE_URL and SUPABASE_SERVICE_KEY" -ForegroundColor Yellow
  exit 1
}

$lines = Get-Content $envPath
$envMap = @{}
foreach ($l in $lines) {
  if ($l -match '^\s*([A-Z_]+)\s*=\s*(.*)$') {
    $k = $Matches[1]
    $v = $Matches[2].Trim().Trim('"').Trim("'")
    $envMap[$k] = $v
    $masked = if ($v.Length -gt 12) { $v.Substring(0,8) + '...' + $v.Substring($v.Length-4) } else { '(empty)' }
    $status = if ($v.Length -lt 10) { 'INVALID' } else { 'OK' }
    Write-Host ("  {0} = {1}  [{2}]" -f $k, $masked, $status) -ForegroundColor $(if($status -eq 'OK'){'Green'}else{'Red'})
  }
}

$sbKey = if ($envMap['SUPABASE_SERVICE_KEY']) { $envMap['SUPABASE_SERVICE_KEY'] }
         elseif ($envMap['SUPABASE_KEY']) { $envMap['SUPABASE_KEY'] }
         else { '' }

if ($sbKey.Length -lt 20) {
  Write-Host ""
  Write-Host "  No valid Supabase key in .env" -ForegroundColor Red
  Write-Host "  1. Open: notepad $envPath" -ForegroundColor Yellow
  Write-Host "  2. Set SUPABASE_SERVICE_KEY to your real service_role key" -ForegroundColor Yellow
  Write-Host "     Get it: https://supabase.com/dashboard/project/cescfarawvpzmilteufq/settings/api" -ForegroundColor Yellow
  exit 1
}
Write-Host "  Supabase key valid (length $($sbKey.Length))" -ForegroundColor Green

Write-Host ""
Write-Host "[2/4] Test Supabase REST" -ForegroundColor Cyan
$sbUrl = if ($envMap['SUPABASE_URL']) { $envMap['SUPABASE_URL'] } else { 'https://cescfarawvpzmilteufq.supabase.co' }
try {
  $r = Invoke-RestMethod -Uri "$sbUrl/rest/v1/articles?select=id&limit=3" -Headers @{
    apikey = $sbKey
    Authorization = "Bearer $sbKey"
    'User-Agent' = 'techpulse-build/1.0 (server)'
    'X-Client-Info' = 'techpulse-build'
  } -TimeoutSec 15
  Write-Host "  Supabase OK - $($r.Count) articles" -ForegroundColor Green
} catch {
  Write-Host "  Supabase FAIL: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "[3/4] Patch generate-seo.mjs with SAFETY-GUARD" -ForegroundColor Cyan
$gsPath = Join-Path $site 'scripts\generate-seo.mjs'
$g = [System.IO.File]::ReadAllText($gsPath, $enc)

if ($g -match 'SAFETY-GUARD') {
  Write-Host "  already present" -ForegroundColor Yellow
} else {
  $anchor = "  const rawAll = (await loadFromSupabase()).filter((a) => a && a.id);"
  $i = $g.IndexOf($anchor)
  if ($i -lt 0) {
    Write-Host "  anchor not found - dumping context" -ForegroundColor Red
    $idx2 = $g.IndexOf('rawAll')
    if ($idx2 -ge 0) { Write-Host $g.Substring([Math]::Max(0,$idx2-200), 500) }
    exit 1
  }
  $guard = "`n  // SAFETY-GUARD: refuse to wipe static files when Supabase is empty`n" +
    "  if (rawAll.length === 0 && !process.env.SUPABASE_ALLOW_EMPTY) {`n" +
    "    console.error('SAFETY ABORT: Supabase returned 0 articles. Refusing to wipe.');`n" +
    "    process.exit(1);`n" +
    "  }`n"
  $lineEnd = $g.IndexOf("`n", $i + $anchor.Length)
  if ($lineEnd -lt 0) { $lineEnd = $g.Length }
  $g = $g.Substring(0, $lineEnd + 1) + $guard + $g.Substring($lineEnd + 1)
  [System.IO.File]::WriteAllText($gsPath, $g, $enc)
  Write-Host "  SAFETY-GUARD inserted" -ForegroundColor Green
}

Write-Host ""
Write-Host "[4/4] Rebuild" -ForegroundColor Cyan
node scripts\generate-seo.mjs
Write-Host ""
node scripts\verify-build.mjs

Write-Host ""
Write-Host "=== Final check ===" -ForegroundColor Cyan
$ssPath = Join-Path $site 'data\static-slugs.json'
$ss = Get-Content $ssPath -Raw | ConvertFrom-Json
$keys = ($ss.PSObject.Properties | Where-Object { $_.Name -notlike '_*' }).Count
Write-Host "static-slugs.json:   $keys entries"
Write-Host "sitemap-posts.xml:   $((Select-String -Path (Join-Path $site 'sitemap-posts.xml') -Pattern '<loc>').Count) URLs"
Write-Host "sitemap-courses.xml: $((Select-String -Path (Join-Path $site 'sitemap-courses.xml') -Pattern '<loc>').Count) URLs"

Write-Host ""
Write-Host "DONE" -ForegroundColor Green