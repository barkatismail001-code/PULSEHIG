/* TechPulse — the ONLY place to edit site settings.
   Used by the website, the admin page and scripts/build-feeds.mjs. */
(function (root, factory) {
  var cfg = factory();
  if (typeof module === 'object' && module.exports) module.exports = cfg;
  else root.TP_CONFIG = cfg;
})(typeof self !== 'undefined' ? self : this, function () {
  return {
    // Must match the CNAME file (apex domain, no "www").
    SITE_URL: 'https://pulsehig.com',
    SITE_NAME: 'TechPulse',

    SUPABASE_URL: 'https://cescfarawvpzmilteufq.supabase.co',
    SUPABASE_KEY: 'sb_publishable_OK1bvVPK50JpOlxaNMVQeg_dTKo3Dru',

    // Same e-mail as in sql/setup.sql (function is_admin).
    ADMIN_EMAIL: 'barkatismail001@gmail.com',

    GA_ID: 'G-FZY178VSH5',
    // Web3Forms access key (contact form + newsletter sign-ups arrive in your inbox)
    FORM_KEY: '3cdd18de-34b1-42eb-bdc8-773a77f36f92',
    BUCKET: 'article-images',

    // Top-level topics (navigation + category pages). Sub-topics are free text saved on each article.
    CATEGORIES: [
      { name: 'Home Repair',    slug: 'home-repair',  icon: '🏠',
        desc: 'Step-by-step fixes for plumbing, electrical, heating and cooling, appliances and everyday household problems.',
        subs: ['Plumbing', 'Electrical', 'Heating & Cooling', 'Appliances', 'Walls & Floors'] },
      { name: 'Smart Tech',     slug: 'smart-tech',   icon: '🔌',
        desc: 'ESP32 and Arduino projects, smart-home automation, electronics and code you can copy and use.',
        subs: ['ESP32 & Arduino', 'Smart Home', 'Electronics', 'Coding'] },
      { name: 'Auto',           slug: 'auto',         icon: '🚗',
        desc: 'Diagnose and fix common car problems: sensors, engine faults, electrical issues and routine maintenance.',
        subs: ['Diagnostics', 'Maintenance', 'Car Electrical'] },
      { name: 'Tools & Gear',   slug: 'tools-gear',   icon: '🧰',
        desc: 'Honest reviews and buying guides for the tools, meters and gadgets that are worth owning.',
        subs: ['Reviews', 'Buying Guides', 'Hand & Power Tools', 'Test Equipment'] },
      { name: 'Tips & Savings', slug: 'tips-savings', icon: '💡',
        desc: 'Safety rules, energy-saving ideas, cleaning tricks and smart ways to save money at home.',
        subs: ['Safety', 'Energy Saving', 'Cleaning', 'Saving Money'] }
    ],

    // Article types (shown as a badge and used by the home page sections)
    KINDS: [
      { id: 'guide',     label: 'Guide' },
      { id: 'diagnosis', label: 'Diagnosis' },
      { id: 'project',   label: 'Project' },
      { id: 'review',    label: 'Review' },
      { id: 'tip',       label: 'Tip' }
    ],
    SKILLS: ['Beginner', 'Intermediate', 'Advanced'],
    SAFETY: ['Low', 'Medium', 'High']
  };
});
