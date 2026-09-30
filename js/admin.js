/* ============================================
   TechPulse — Admin Controller (Global & Professional Edition)
   ============================================ */
(function () {
    'use strict';

    const $  = (s, c = document) => c.querySelector(s);               const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    
    // إعدادات اتصال Supabase
    const SUPABASE_URL = 'https://ijgvrjkpiofamwcmkmgi.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_5NcPMPDtyNXRg-oduydRUA_JM6IeV9k';
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let articlesCache = [];

    async function loadArticles() {
        const { data, error } = await supabaseClient
            .from('articles')
            .select('*')
            .order('id', { ascending: false });
            
        if (error) {
            console.error('Error loading articles:', error);
            toast('❌ Failed to load articles from database');
            articlesCache = [];
        } else {
            articlesCache = data || [];
        }
        return articlesCache;
    }

    function getArticles() { return articlesCache; }
    function toast(msg) { window.showToast && window.showToast(msg); }

    if (window.TPCommon && window.TPCommon.initDarkMode) {
        window.TPCommon.initDarkMode();
    }

    /* ---------- عناصر الواجهة المحدثة ---------- */
    const form = $('#article-form');
    const articleIdInput = $('#article-id');
    const titleInput = $('#title');
    const slugInput = $('#slug');
    const excerptInput = $('#excerpt');
    const contentInput = $('#content');
    const categoryInput = $('#category');
    const authorInput = $('#author');
    const dateInput = $('#date');
    const readTimeInput = $('#readTime');
    const tagsInput = $('#tags');
    const featuredInput = $('#featured');
    const imageInput = $('#image-file');
    const imagePreview = $('#image-preview');
    const removeImageBtn = $('#remove-image');
    const formTitle = $('#form-title');
    const resetBtn = $('#reset-btn');
    const listContainer = $('#admin-articles-list');
    const galleryStrip = $('#gallery-strip');
    const galleryFileInput = $('#gallery-file');
    const addGalleryBtn = $('#add-gallery-btn');

    let currentImageData = '';
    let currentGalleryImages = [];

    /* ---------- رفع الصورة الرئيسية (Hero Image) الاحترافية ---------- */
    if (imagePreview && imageInput) {
        imagePreview.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', () => {
            const file = imageInput.files[0];
            if (!file) return;
            if (file.size > 3 * 1024 * 1024) {
                toast('Image too large (max 3 MB)');
                imageInput.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                currentImageData = ev.target.result;
                imagePreview.innerHTML = `<img src="${currentImageData}" alt="Preview" style="width:150px;height:100px;object-fit:cover;border-radius:4px;">`;
                if (removeImageBtn) removeImageBtn.style.display = 'inline-block';
            };
            reader.readAsDataURL(file);
        });
    }
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentImageData = '';
            imageInput.value = '';
            imagePreview.innerHTML = '<span class="image-hint">Click to upload professional hero image (max 3 MB)</span>';
            removeImageBtn.style.display = 'none';
        });
    }

    /* ---------- معرض الصور (Gallery Strip) الاحترافي ---------- */
    function renderGalleryStrip() {
        if (!galleryStrip) return;
        galleryStrip.innerHTML = currentGalleryImages.map((src, i) => `
            <div class="gallery-thumb" data-idx="${i}" style="position:relative;display:inline-block;margin:5px;">
                <img src="${src}" alt="Gallery image ${i + 1}" style="width:80px;height:80px;object-fit:cover;border-radius:4px;">
                <button type="button" class="remove-thumb" data-remove-gallery="${i}" style="position:absolute;top:0;right:0;background:red;color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;">×</button>
            </div>
        `).join('');
    }
    if (addGalleryBtn && galleryFileInput) {
        addGalleryBtn.addEventListener('click', () => galleryFileInput.click());
        galleryFileInput.addEventListener('change', () => {
            const files = Array.from(galleryFileInput.files || []);
            let remaining = files.length;
            if (!remaining) return;
            files.forEach(file => {
                if (file.size > 3 * 1024 * 1024) {
                    toast(`Skipped "${file.name}" (max 3 MB)`);
                    if (--remaining === 0) galleryFileInput.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = (ev) => {
                    currentGalleryImages.push(ev.target.result);
                    renderGalleryStrip();
                    if (--remaining === 0) galleryFileInput.value = '';
                };
                reader.readAsDataURL(file);
            });
        });
    }
    if (galleryStrip) {
        galleryStrip.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-remove-gallery]');
            if (!btn) return;
            currentGalleryImages.splice(Number(btn.dataset.removeGallery), 1);
            renderGalleryStrip();
        });
    }

    /* ---------- توليد الـ Slug الاحترافي ---------- */
    let slugEdited = false;
    if (slugInput && titleInput) {
        slugInput.addEventListener('input', () => { slugEdited = true; });
        titleInput.addEventListener('input', () => {
            if (!slugEdited && window.TPCommon && window.TPCommon.slugify) {
                slugInput.value = window.TPCommon.slugify(titleInput.value);
            }
        });
    }

    /* ---------- عرض قائمة المقالات في لوحة التحكم ---------- */
    function renderAdminList() {
        const articles = [...getArticles()].sort((a, b) =>
            (b.date || '').localeCompare(a.date || '')
        );

        const stats = $('#adminStats');
        if (stats) {
            const cats = new Set(articles.map(a => a.category).filter(Boolean)).size;
            const featured = articles.filter(a => a.featured).length;
            stats.innerHTML = `
                <div class="stat"><div class="stat-label">Total Articles</div><div class="stat-value">${articles.length}</div></div>
                <div class="stat"><div class="stat-label">Categories</div><div class="stat-value">${cats}</div></div>
                <div class="stat"><div class="stat-label">Featured</div><div class="stat-value">${featured}</div></div>
            `;
        }

        if (!articles.length) {
            listContainer.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px">No global articles published yet.</p>';
            return;
        }

        listContainer.innerHTML = articles.map(art => {
            const escText = (t) => window.TPCommon && window.TPCommon.esc ? window.TPCommon.esc(t) : t;
            return `
            <div class="admin-article-item" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid #334155;">
                <div>
                    <h4 style="margin:0;color:#38bdf8;">${escText(art.title)}</h4>
                    <p style="margin:4px 0;font-size:0.85rem;color:#94a3b8;">${escText(art.excerpt)}</p>
                    <small style="color:#64748b;">${escText(art.category || '—')} · ${escText(art.date || '')} · ${art.featured ? '⭐ Featured' : ''}</small>
                </div>
                <div class="item-btns" style="display:flex;gap:8px;">
                    <button type="button" data-edit="${art.id}" class="btn-edit" style="background:#0284c7;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">Edit</button>
                    <button type="button" data-delete="${art.id}" class="btn-delete" style="background:#ef4444;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">Delete</button>
                </div>
            </div>
        `; }).join('');
    }

    /* ---------- حفظ ونشر المقال بمعايير عالمية الاحترافية ---------- */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = articleIdInput.value ? Number(articleIdInput.value) : undefined;
        const title = titleInput.value.trim();
        const excerpt = excerptInput.value.trim();
        const content = contentInput.value.trim();
        const category = categoryInput.value;
        const author = authorInput.value.trim() || 'TechPulse Global Team';
        const date = dateInput.value || new Date().toISOString().slice(0, 10);
        const readTime = readTimeInput.value.trim() || calcReadTime(content);
        const tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean);
        const featured = featuredInput.checked;
        const slug = slugInput.value.trim() || (window.TPCommon && window.TPCommon.slugify ? window.TPCommon.slugify(title) : '');

        if (!title || !excerpt || !content || !category) {
            toast('⚠️ Please fill all required global fields');
            return;
        }

        try {
            let imageUrl = currentImageData;

            // رفع الصورة الرئيسية إلى Supabase Storage بجودة احترافية
            if (imageInput && imageInput.files[0]) {
                const file = imageInput.files[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `global_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                const filePath = `articles/${fileName}`;

                toast('⏳ Uploading professional image to Supabase Storage...');
                const { error: uploadError } = await supabaseClient.storage
                    .from('images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabaseClient.storage
                    .from('images')
                    .getPublicUrl(filePath);

                imageUrl = publicUrlData.publicUrl;
            }

            // معالجة ورفع صور المعرض الاحترافية
            let processedGalleryImages = [...currentGalleryImages];
            if (galleryFileInput && galleryFileInput.files.length > 0) {
                const galleryFiles = Array.from(galleryFileInput.files);
                for (const file of galleryFiles) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `gal_global_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                    const filePath = `articles/gallery/${fileName}`;

                    const { error: gUploadError } = await supabaseClient.storage
                        .from('images')
                        .upload(filePath, file);

                    if (!gUploadError) {
                        const { data: gUrlData } = supabaseClient.storage
                            .from('images')
                            .getPublicUrl(filePath);
                        if (gUrlData && gUrlData.publicUrl) {
                            processedGalleryImages.push(gUrlData.publicUrl);
                        }
                    }
                }
            }

            const articlePayload = {
                title, 
                excerpt, 
                content, 
                category, 
                author, 
                date, 
                readTime, 
                tags,
                featured,
                image: imageUrl || '',
                images: processedGalleryImages,
                likes: 0,
                slug
            };

            if (id) {
                const { error } = await supabaseClient
                    .from('articles')
                    .update(articlePayload)
                    .eq('id', id);
                if (error) throw error;
                toast('✨ Professional Article updated successfully in Supabase');
            } else {
                const { error } = await supabaseClient
                    .from('articles')
                    .insert([articlePayload]);
                if (error) throw error;
                toast('🚀 Global Article published successfully to Supabase');
            }

            resetForm();
            await loadArticles();
            renderAdminList();
        } catch (err) {
            console.error('Error saving professional article:', err);
            toast('❌ Error saving article: ' + err.message);
        }
    });

    function calcReadTime(text) {
        const words = String(text || '').trim().split(/\s+/).length;
        return Math.max(1, Math.round(words / 200)) + ' min read';
    }

    /* ---------- التعديل والحذف الاحترافي ---------- */
    listContainer.addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-edit]');
        const delBtn = e.target.closest('[data-delete]');
        if (editBtn) editArticle(editBtn.dataset.edit);
        if (delBtn) deleteArticle(delBtn.dataset.delete);
    });

    function editArticle(id) {
        const art = getArticles().find(a => String(a.id) === String(id));
        if (!art) return;
        articleIdInput.value = art.id;

        titleInput.value = art.title || '';
        excerptInput.value = art.excerpt || '';
        contentInput.value = art.content || '';
        slugInput.value = art.slug || '';
        slugEdited = true;
        categoryInput.value = art.category || '';
        authorInput.value = art.author || '';
        dateInput.value = art.date || '';
        readTimeInput.value = art.readTime || '';
        tagsInput.value = Array.isArray(art.tags) ? art.tags.join(', ') : (art.tags || '');
        featuredInput.checked = !!art.featured;

        currentImageData = art.image || '';
        if (currentImageData) {
            imagePreview.innerHTML = `<img src="${currentImageData}" alt="Preview" style="width:150px;height:100px;object-fit:cover;border-radius:4px;">`;
            removeImageBtn.style.display = 'inline-block';
        } else {
            imagePreview.innerHTML = '<span class="image-hint">Click to upload professional hero image (max 3 MB)</span>';
            removeImageBtn.style.display = 'none';
        }

        currentGalleryImages = Array.isArray(art.images) ? art.images.slice() : [];
        renderGalleryStrip();

        formTitle.textContent = 'Edit Professional Article';
        resetBtn.style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function deleteArticle(id) {
        if (!confirm('Are you sure you want to delete this global article permanently?')) return;
        try {
            const { error } = await supabaseClient
                .from('articles')
                .delete()
                .eq('id', id);
            if (error) throw error;

            await loadArticles();
            renderAdminList();
            toast('🗑 Article deleted successfully');
        } catch (err) {
            console.error('Error deleting article:', err);
            toast('❌ Error deleting article');
        }
    }

    function resetForm() {
        form.reset();
        articleIdInput.value = '';
        slugEdited = false;
        currentImageData = '';
        imagePreview.innerHTML = '<span class="image-hint">Click to upload professional hero image (max 3 MB)</span>';
        removeImageBtn.style.display = 'none';
        currentGalleryImages = [];
        renderGalleryStrip();
        formTitle.textContent = 'Add New Professional Article';
        resetBtn.style.display = 'none';
        dateInput.value = new Date().toISOString().slice(0, 10);
    }

    if (resetBtn) resetBtn.addEventListener('click', resetForm);

    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
    loadArticles().then(renderAdminList);

    window.TPAdmin = {
        setFeaturedImage: function (dataUrl) {
            currentImageData = dataUrl || '';
            if (currentImageData) {
                imagePreview.innerHTML = `<img src="${currentImageData}" alt="Preview" style="width:150px;height:100px;object-fit:cover;border-radius:4px;">`;
                if (removeImageBtn) removeImageBtn.style.display = 'inline-block';
            } else {
                imagePreview.innerHTML = '<span class="image-hint">Click to upload professional hero image (max 3 MB)</span>';
                if (removeImageBtn) removeImageBtn.style.display = 'none';
            }
        },
        setGalleryImages: function (dataUrls) {
            currentGalleryImages = Array.isArray(dataUrls) ? dataUrls.slice() : [];
            renderGalleryStrip();
        },
        getFeaturedImage: function () { return currentImageData; },
        getGalleryImages: function () { return currentGalleryImages.slice(); }
    };
})();