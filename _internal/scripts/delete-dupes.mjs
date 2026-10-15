import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const DUP_SLUGS = [
  'driving-a-dc-motor-from-an-esp32-with-a-low-side-mosfet-24',
  'driving-a-dc-motor-from-an-esp32-with-a-low-side-mosfet-37',
  'esp32-won-t-wake-from-deep-sleep-causes-and-fixes-34',
  'fixing-relay-chatter-when-switching-ac-loads-from-an-esp32-39',
  'i2c-timeouts-when-your-esp32-freezes-in-real-life-3',
  'i2c-timeouts-when-your-esp32-freezes-in-real-life-42',
  'pc-won-t-boot-the-7-step-no-post-checklist-17',
  'pc-won-t-boot-the-7-step-no-post-checklist-36',
  'router-keeps-rebooting-6-causes-you-can-fix-today-19',
  'stop-your-raspberry-pi-from-overheating-in-a-closed-case-41',
  'turn-a-2015-laptop-into-a-fast-machine-ssd-ram-upgrade-guide-35',
  'why-your-esp32-wi-fi-keeps-dropping-and-how-to-fix-it-26',
  'why-your-esp32-wi-fi-keeps-dropping-and-how-to-fix-it-38',
  'why-your-led-strip-flickers-pwm-power-and-ground-explained-40'
];

async function main() {
  const before = await supabase.from('articles').select('slug');
  console.log('  قبل الحذف: ' + (before.data || []).length + ' مقالاً');

  const { error, count } = await supabase.from('articles').delete({ count: 'exact' }).in('slug', DUP_SLUGS);
  if (error) { console.error('  ERR: ' + error.message); process.exit(1); }
  console.log('  ✅ حُذف: ' + (count || DUP_SLUGS.length));

  const after = await supabase.from('articles').select('slug');
  console.log('  بعد الحذف: ' + (after.data || []).length + ' مقالاً');
}
main().catch(e => { console.error(e); process.exit(1); });