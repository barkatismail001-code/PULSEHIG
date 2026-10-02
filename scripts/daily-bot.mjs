import { createClient } from '@supabase/supabase-js';

// 1. إعدادات الاتصال
const SUPABASE_URL = 'https://ijgvrjkpiofamwcmkmgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5NcPMPDtyNXRg-oduydRUA_JM6IeV9k'; // استخدم Service Role Key هنا للأمان
const GROQ_API_KEY = process.env.GROQ_API_KEY; // يتم تخزينه في GitHub Secrets

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. قائمة المواضيع المقترحة
const topics = [
  "ESP32 power management techniques",
  "STM32 interrupt handling best practices",
  "Python automation for engineers",
  "LNG safety protocols",
  "SCADA system architecture"
];

async function generateDailyArticle() {
  // اختيار موضوع عشوائي
  const topic = topics[Math.floor(Math.random() * topics.length)];
  
  console.log(`🤖 Generating article about: ${topic}`);

  // 3. طلب التوليد من Groq (نص فقط هذه المرة)
  const prompt = `Write a deep, technical, and useful article about "${topic}". 
  Return ONLY a raw JSON object with this exact structure:
  {
    "title": "A professional title",
    "excerpt": "A concise technical abstract",
    "content": "Extensive technical content separated by double newlines",
    "tags": "tag1, tag2, tag3",
    "readTime": "5 min read",
    "category": "Technology"
  }`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama3-70b-8192", // أو أي موديل نصي متاح
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    })
  });

  const data = await response.json();
  const articleData = JSON.parse(data.choices[0].message.content.replace(/```json|```/g, '').trim());

  // 4. جلب صورة تلقائية (اختياري - يمكن استخدام Unsplash API)
  // هنا نضع صورة افتراضية أو نجلبها من API خارجي
  const imageUrl = "https://www.pulsehig.com/assets/og-default.png"; 

  // 5. الحفظ في Supabase
  const { error } = await supabase.from('articles').insert([{
    title: articleData.title,
    excerpt: articleData.excerpt,
    content: articleData.content,
    category: articleData.category || 'Technology',
    author: 'TechPulse AI Bot',
    date: new Date().toISOString().slice(0, 10),
    readTime: articleData.readTime,
    tags: articleData.tags.split(',').map(t => t.trim()),
    image: imageUrl,
    featured: false,
    likes: 0
  }]);

  if (error) {
    console.error("❌ Error saving to Supabase:", error);
  } else {
    console.log("✅ Article published successfully!");
  }
}

generateDailyArticle();
