// patch-hero.mjs — translate hero_title to match English version
import { readFile, writeFile } from 'node:fs/promises';

const file = 'js/i18n.js';
let src = await readFile(file, 'utf8');

// The English title is now 'Smart Solutions for Everyday Problems'.
// Update each locale's hero_title to the equivalent translation.
const replacements = [
  // Chinese
  ["hero_title: '\u9AD8\u7EA7\u5D4C\u5165\u5F0F\u7CFB\u7EDF\u4E0E\u6280\u672F\u6307\u5357'",
   "hero_title: '\u65E5\u5E38\u95EE\u9898\u7684\u667A\u80FD\u89E3\u51B3\u65B9\u6848'"],

  // Spanish
  ["hero_title: 'Sistemas Embebidos Avanzados y Gu\u00EDas T\u00E9cnicas'",
   "hero_title: 'Soluciones Inteligentes para Problemas Cotidianos'"],

  // Hindi
  ["hero_title: '\u0909\u0928\u094D\u0928\u0924 \u090F\u092E\u094D\u092C\u0947\u0921\u0947\u0921 \u0938\u093F\u0938\u094D\u091F\u092E \u0914\u0930 \u0924\u0915\u0928\u0940\u0915\u0940 \u0917\u093E\u0907\u0921'",
   "hero_title: '\u0930\u094B\u091C\u093C\u092E\u0930\u094D\u0930\u093E \u0915\u0940 \u0938\u092E\u0938\u094D\u092F\u093E\u0913\u0902 \u0915\u0947 \u0932\u093F\u090F \u0938\u094D\u092E\u093E\u0930\u094D\u091F \u0938\u092E\u093E\u0927\u093E\u0928'"],

  // French
  ["hero_title: 'Syst\u00E8mes Embarqu\u00E9s Avanc\u00E9s et Guides Techniques'",
   "hero_title: 'Solutions Intelligentes pour les Probl\u00E8mes Quotidiens'"],

  // Portuguese
  ["hero_title: 'Sistemas Embarcados Avan\u00E7ados e Guias T\u00E9cnicos'",
   "hero_title: 'Solu\u00E7\u00F5es Inteligentes para Problemas do Dia a Dia'"]
];

let changed = 0;
for (const [oldStr, newStr] of replacements) {
  if (src.includes(oldStr)) {
    src = src.replace(oldStr, newStr);
    changed++;
  }
}

if (changed > 0) {
  await writeFile(file, src, 'utf8');
  console.log('Updated ' + changed + ' hero_title translations');
} else {
  console.log('No changes (patterns not found)');
}

// Verify
const after = await readFile(file, 'utf8');
const lines = after.split('\n');
console.log('\nCurrent hero_title lines:');
lines.forEach((l, i) => {
  if (/^\s*hero_title:/.test(l)) {
    console.log('  line ' + (i + 1) + ': ' + l.trim());
  }
});