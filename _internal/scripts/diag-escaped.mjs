import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const { data } = await sb.from('articles').select('id,slug,content');
const sus = (data || []).filter(a => /&lt;|&gt;|&amp;lt;|&amp;gt;/.test(a.content || ''));

console.log('Total articles:', data.length);
console.log('Suspicious    :', sus.length);
console.log('');
for (const a of sus.slice(0, 12)) {
  const snippet = (a.content || '').slice(0, 220).replace(/\n/g, ' ');
  console.log(`[id=${a.id}] ${a.slug}`);
  console.log(`  ${snippet}…`);
  console.log('');
}