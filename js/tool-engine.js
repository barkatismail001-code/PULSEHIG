/* TechPulse tool-engine.js — loads the interactive calculator for /tool.html */
(function(){
  'use strict';
  function getSlug(){ return new URLSearchParams(location.search).get('slug'); }
  function loadError(msg){
    var c = document.getElementById('toolContainer');
    if (c) c.innerHTML = '<p class="loading-state">' + (msg||'Unable to load tool.') + '</p>';
  }
  async function init(){
    var slug = getSlug();
    if (!slug) { loadError('No tool specified.'); return; }
    try {
      var res = await fetch('data/tools.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var tools = await res.json();
      var tool = (tools || []).find(function(t){ return (t.slug||t.id) === slug; });
      if (!tool) { loadError('Tool not found: ' + slug); return; }
      document.title = tool.title + ' | TechPulse';
      var c = document.getElementById('toolContainer');
      if (c) c.innerHTML = '<h2>' + (tool.icon||'🔧') + ' ' + tool.title + '</h2><p>' + (tool.description||'') + '</p><p style="color:var(--text-muted)">Calculator engine coming soon.</p>';
    } catch(e){ loadError(e.message); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();