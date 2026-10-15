import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  const { data: courses, error } = await supabase.from('courses').select('id,slug,code');
  if (error) { console.error(error); process.exit(1); }

  for (const c of courses) {
    const { data: lec } = await supabase.from('lectures').select('duration_minutes').eq('course_slug', c.slug);
    const totalMin = (lec || []).reduce((s, l) => s + (l.duration_minutes || 0), 0);
    // Use actual read time; keep a minimum of 1h for sanity
    const hours = Math.max(1, Math.round(totalMin / 60));
    const { error: upErr } = await supabase.from('courses').update({ duration_hours: hours }).eq('id', c.id);
    if (upErr) console.warn(`  ✗ ${c.slug}: ${upErr.message}`);
    else console.log(`  ✓ ${c.code} → ${hours}h (${totalMin} min from ${lec.length} lectures)`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });