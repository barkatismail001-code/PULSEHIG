// patch-admin.mjs - improve admin.js: temperature, anti-AI rules, SEO validation
import { readFile, writeFile } from 'node:fs/promises';

const file = 'js/admin.js';
let src = await readFile(file, 'utf8');
const orig = src;
const log = [];

// 1. temperature 0.5 -> 0.75
if (/temperature:\s*0\.5\b/.test(src)) {
  src = src.replace(/temperature:\s*0\.5\b/, 'temperature: 0.75');
  log.push('OK temperature 0.5 -> 0.75');
} else if (/temperature:\s*0\.75\b/.test(src)) {
  log.push('= temperature already 0.75');
} else {
  log.push('WARN temperature pattern not found');
}

// 2. Anti-AI + E-E-A-T rules inserted as new lines before STRUCTURE line
const lines = src.split('\n');
let structIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('STRUCTURE (mandatory):')) {
    structIdx = i;
    break;
  }
}
if (structIdx > 0) {
  const indent = (lines[structIdx].match(/^(\s*)/) || ['', '          '])[1];
  const rules = [
    indent + "'AVOID these AI-typical phrases: delve, navigate the complexities, leverage, seamless, robust solution, game-changer, in today\\'s fast-paced world. Never use them.\\n\\n' +",
    indent + "'USE specific numbers with units (4.7k ohm, 3.3V, 12.4mA), first-person experience (I tested, we measured), one real failure story (what broke and how you debugged it), and a Sources section with 3-5 verifiable URLs at the end. Include one markdown table of real measurements.\\n\\n' +"
  ];
  lines.splice(structIdx, 0, ...rules);
  src = lines.join('\n');
  log.push('OK anti-AI + E-E-A-T rules inserted');
} else {
  log.push('WARN STRUCTURE line not found');
}

// 3. Pre-publish SEO validation inserted before payload declaration
const payloadMarker = '        var payload = {';
if (src.includes(payloadMarker)) {
  const NL = 'String.fromCharCode(10)';
  const validation = [
    '        // SEO pre-publish validation',
    '        var seoWc = content.split(/\\s+/).filter(Boolean).length;',
    '        var seoFails = [];',
    "        if (seoWc < 800) seoFails.push('Content is ' + seoWc + ' words (min 800)');",
    "        if (title.length > 60) seoFails.push('Title is ' + title.length + '/60 chars');",
    "        if (excerpt.length > 155) seoFails.push('Excerpt is ' + excerpt.length + '/155 chars');",
    "        if (!slug || !/^[a-z0-9-]+$/.test(slug)) seoFails.push('Invalid slug (lowercase/numbers/hyphens)');",
    '        if (seoFails.length > 0) {',
    "          var seoMsg = 'SEO warnings:' + " + NL + " + " + NL + " + seoFails.join(" + NL + ") + " + NL + " + " + NL + " + 'Publish anyway?';",
    '          if (!confirm(seoMsg)) return;',
    '        }',
    '',
    ''
  ].join('\n');
  src = src.replace(payloadMarker, validation + payloadMarker);
  log.push('OK SEO pre-publish validation inserted');
} else {
  log.push('WARN payload marker not found');
}

if (src !== orig) {
  await writeFile(file, src);
  log.push('');
  log.push('Saved ' + file + ' (+' + (src.length - orig.length) + ' chars)');
} else {
  log.push('');
  log.push('No changes made');
}

console.log(log.join('\n'));