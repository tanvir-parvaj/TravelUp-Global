/**
 * TRAVELUP GLOBAL — DESTINATION MANAGEMENT SYSTEM (DMS) CONTROLLER
 * Architectural Principle: "Destination is the Master Entity — Enter Once, Relate Once, Reuse Everywhere."
 */

window.dms = {
    currentDestId: null,
    currentDest: null,
    currentHubTab: 'overview',
    currentInventorySubTab: 'overview',
    countries: [],
    divisions: [],
    cities: [],
    categories: [],
    durations: [],
    uploadedImages: [], // { url, role: 'cover'|'thumb'|'featured'|'gallery', caption, alt }
    draftTimer: null,
    lastDraftSavedAt: null,

    async init() {
        await Promise.all([
            this.loadCountries(),
            this.loadDivisions('Bangladesh'),
            this.loadCities('Bangladesh'),
            this.loadCategories(),
            this.loadDurations()
        ]);
    },

    // =========================================================================
    // 1. LOOKUPS & INLINE TAXONOMIES ("+ নতুন ..." Modals)
    // =========================================================================
    async loadCountries() {
        try {
            const res = await api.getCountries();
            if (res && res.success) {
                this.countries = res.countries || [];
                this.renderCountrySelect();
            }
        } catch (e) {
            console.error('Failed to load countries:', e);
        }
    },

    renderCountrySelect() {
        const select = document.getElementById('destWizCountrySelect');
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML = '<option value="">Search or Select Country...</option>' +
            this.countries.map(c => `<option value="${c.name}" data-tz="${c.timezone}" data-curr="${c.currency_code}" ${c.name === currentVal ? 'selected' : ''}>${c.flag_emoji || '🏳️'} ${c.name} (${c.code})</option>`).join('');
    },

    async loadDivisions(countryName) {
        try {
            const res = await api.getDivisions({ country_name: countryName || 'Bangladesh' });
            if (res && res.success) {
                this.divisions = res.divisions || [];
                this.renderDivisionSelect();
            }
        } catch (e) {
            console.error('Failed to load divisions:', e);
        }
    },

    renderDivisionSelect() {
        const select = document.getElementById('destWizDivisionSelect');
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML = '<option value="">Select Division / State...</option>' +
            this.divisions.map(d => `<option value="${d.name}" ${d.name === currentVal ? 'selected' : ''}>${d.name}</option>`).join('');
    },

    async loadCities(countryName, divisionName) {
        try {
            const res = await api.getCities({ country_name: countryName, division_name: divisionName });
            if (res && res.success) {
                this.cities = res.cities || [];
                this.renderCitySelect();
            }
        } catch (e) {
            console.error('Failed to load cities:', e);
        }
    },

    renderCitySelect() {
        const select = document.getElementById('destWizCitySelect');
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML = '<option value="">Select City...</option>' +
            this.cities.map(ci => `<option value="${ci.name}" ${ci.name === currentVal ? 'selected' : ''}>${ci.name}</option>`).join('');
    },

    async loadCategories() {
        try {
            const res = await api.getDestinationCategories();
            if (res && res.success) {
                this.categories = res.categories || [];
                this.renderCategorySelect();
            }
        } catch (e) {
            console.error('Failed to load categories:', e);
        }
    },

    renderCategorySelect() {
        const select = document.getElementById('destWizCategory');
        if (!select) return;
        const currentVal = select.value || 'Beach';
        const defaultCats = [
            { name_en: 'Beach', icon: '🏖️' },
            { name_en: 'Mountain', icon: '🏔️' },
            { name_en: 'Island', icon: '🏝️' },
            { name_en: 'City', icon: '🏙️' },
            { name_en: 'Historical', icon: '🏛️' },
            { name_en: 'Religious', icon: '🕌' },
            { name_en: 'Nature', icon: '🌿' },
            { name_en: 'Wildlife', icon: '🐘' },
            { name_en: 'Adventure', icon: '🧗' },
            { name_en: 'Luxury', icon: '💎' },
            { name_en: 'Honeymoon', icon: '💑' },
            { name_en: 'Family', icon: '👨‍👩‍👧' },
            { name_en: 'Shopping', icon: '🛍️' },
            { name_en: 'Wellness', icon: '🧘' }
        ];

        const all = [...defaultCats];
        this.categories.forEach(c => {
            if (!all.find(x => x.name_en === c.name_en)) all.push(c);
        });

        select.innerHTML = all.map(c => `<option value="${c.name_en}" ${c.name_en === currentVal ? 'selected' : ''}>${c.icon || '📍'} ${c.name_en}</option>`).join('');
    },

    async loadDurations() {
        try {
            const res = await api.getDestinationDurations();
            if (res && res.success) {
                this.durations = res.durations || [];
                this.renderDurationSelect();
            }
        } catch (e) {
            console.error('Failed to load durations:', e);
        }
    },

    renderDurationSelect() {
        const select = document.getElementById('destWizDurationSelect');
        if (!select) return;
        const currentVal = select.value || '3 Days / 2 Nights';
        const defaultDurs = [
            '1 Day', '2 Days / 1 Night', '3 Days / 2 Nights', '4 Days / 3 Nights',
            '5 Days / 4 Nights', '7 Days / 6 Nights', '10 Days / 9 Nights'
        ];
        const all = [...defaultDurs];
        this.durations.forEach(d => {
            if (!all.includes(d.label)) all.push(d.label);
        });

        select.innerHTML = all.map(d => `<option value="${d}" ${d === currentVal ? 'selected' : ''}>⏱️ ${d}</option>`).join('');
    },

    // =========================================================================
    // 2. STEP 1: TRAVEL TYPE & GEO REACTIVITY
    // =========================================================================
    setTravelType(type) {
        const hidden = document.getElementById('destWizTravelType');
        if (hidden) hidden.value = type;

        const btnDom = document.getElementById('btnTypeDomestic');
        const btnIntl = document.getElementById('btnTypeInternational');
        const selectWrap = document.getElementById('destWizCountrySelectWrap');
        const countrySelect = document.getElementById('destWizCountrySelect');
        const domReadonly = document.getElementById('destWizCountryDomesticBadge');
        const intlPanel = document.getElementById('destWizIntlPanel');

        if (type === 'domestic') {
            if (btnDom) btnDom.classList.add('active');
            if (btnIntl) btnIntl.classList.remove('active');
            if (selectWrap) selectWrap.style.display = 'none';
            if (domReadonly) domReadonly.style.display = 'flex';
            if (countrySelect) countrySelect.value = 'Bangladesh';
            if (intlPanel) intlPanel.style.display = 'none';

            this.loadDivisions('Bangladesh');
            this.loadCities('Bangladesh');
            this.autoSuggestTimezoneAndCurrency('Asia/Dhaka', 'BDT');
        } else {
            if (btnDom) btnDom.classList.remove('active');
            if (btnIntl) btnIntl.classList.add('active');
            if (selectWrap) selectWrap.style.display = 'block';
            if (domReadonly) domReadonly.style.display = 'none';
            if (intlPanel) intlPanel.style.display = 'block';
            if (countrySelect && countrySelect.value === 'Bangladesh') countrySelect.value = '';
        }
    },

    onCountryChange(countryName) {
        if (!countryName) return;
        const opt = document.querySelector(`#destWizCountrySelect option[value="${countryName}"]`);
        if (opt) {
            const tz = opt.getAttribute('data-tz');
            const curr = opt.getAttribute('data-curr');
            this.autoSuggestTimezoneAndCurrency(tz, curr);
        }
        this.loadDivisions(countryName);
        this.loadCities(countryName);
    },

    onDivisionChange(divisionName) {
        const country = document.getElementById('destWizTravelType')?.value === 'domestic' 
            ? 'Bangladesh' 
            : (document.getElementById('destWizCountrySelect')?.value || '');
        this.loadCities(country, divisionName);
    },

    autoSuggestTimezoneAndCurrency(tz, curr) {
        const tzInput = document.getElementById('destWizTimezone');
        const currInput = document.getElementById('destWizCurrency');
        if (tzInput && tz) tzInput.value = tz;
        if (currInput && curr) currInput.value = curr;
    },

    // =========================================================================
    // 3. STEP 2: GOOGLE MAPS EMBED & LIVE PREVIEW
    // =========================================================================
    onMapEmbedInput(code) {
        const container = document.getElementById('destWizMapLivePreview');
        if (!container) return;

        if (!code || !code.trim()) {
            container.innerHTML = `
                <div class="dms-map-placeholder">
                    <span style="font-size: 2.2rem;">🗺️</span>
                    <strong style="font-size: 0.92rem; color: #475569;">No Map Code Entered Yet</strong>
                    <span style="font-size: 0.78rem;">Paste Google Maps &lt;iframe&gt; code above to view interactive preview</span>
                </div>
            `;
            return;
        }

        // Security Sanitization
        let sanitizedUrl = null;
        const match = code.match(/src=["'](https:\/\/(?:www\.)?google\.com\/maps\/embed[^"']+)["']/i);
        if (match && match[1]) {
            sanitizedUrl = match[1];
        } else if (code.startsWith('https://www.google.com/maps/embed') || code.startsWith('https://maps.google.com/')) {
            sanitizedUrl = code.trim();
        }

        if (sanitizedUrl) {
            container.innerHTML = `
                <iframe src="${sanitizedUrl}" 
                        style="width: 100%; height: 280px; border: 0;" 
                        allowfullscreen="" 
                        loading="lazy" 
                        referrerpolicy="strict-origin-when-cross-origin">
                </iframe>
            `;
        } else {
            container.innerHTML = `
                <div class="dms-map-placeholder" style="color: #dc2626;">
                    <span style="font-size: 2rem;">⚠️</span>
                    <strong>Invalid or Unsupported Map Embed Code</strong>
                    <span style="font-size: 0.76rem; color: #64748b;">Please copy the standard embed code from Google Maps &gt; Share &gt; Embed a map</span>
                </div>
            `;
        }
    },

    // =========================================================================
    // 4. STEP 3: MEDIA GALLERY & IMAGE ROLES
    // =========================================================================
    addImageUrl(url, role = 'gallery') {
        if (!url) return;
        const isCover = this.uploadedImages.length === 0;
        this.uploadedImages.push({
            url: url.trim(),
            role: isCover ? 'cover' : role,
            caption: '',
            alt: ''
        });
        this.renderImageGalleryCards();
    },

    handleFileUpload(files) {
        if (!files || !files.length) return;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = (e) => {
                const isCover = this.uploadedImages.length === 0;
                this.uploadedImages.push({
                    url: e.target.result,
                    role: isCover ? 'cover' : 'gallery',
                    caption: file.name,
                    alt: file.name
                });
                this.renderImageGalleryCards();
            };
            reader.readAsDataURL(file);
        }
    },

    setImageRole(index, newRole) {
        if (newRole === 'cover') {
            this.uploadedImages.forEach((img, i) => {
                if (img.role === 'cover') img.role = 'gallery';
            });
        }
        if (this.uploadedImages[index]) {
            this.uploadedImages[index].role = newRole;
        }
        this.renderImageGalleryCards();
    },

    deleteImage(index) {
        this.uploadedImages.splice(index, 1);
        if (this.uploadedImages.length > 0 && !this.uploadedImages.some(img => img.role === 'cover')) {
            this.uploadedImages[0].role = 'cover';
        }
        this.renderImageGalleryCards();
    },

    renderImageGalleryCards() {
        const container = document.getElementById('destWizImagesGrid');
        if (!container) return;

        if (this.uploadedImages.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 24px; color: #94a3b8; font-size: 0.85rem;">
                    No images added yet. Upload files or paste image URLs above.
                </div>
            `;
            return;
        }

        container.innerHTML = this.uploadedImages.map((img, idx) => `
            <div class="dms-image-card">
                <div class="dms-image-thumb-wrap">
                    <img src="${img.url}" alt="${img.alt || 'Destination photo'}">
                    <span class="dms-role-capsule ${img.role === 'cover' ? 'dms-role-cover' : (img.role === 'thumbnail' ? 'dms-role-thumb' : (img.role === 'featured' ? 'dms-role-featured' : ''))}">
                        ${img.role}
                    </span>
                </div>
                <div class="dms-image-card-footer">
                    <div style="display: flex; gap: 4px;">
                        <button type="button" class="btn-secondary-pill" style="padding: 3px 8px; font-size: 0.72rem;" onclick="dms.setImageRole(${idx}, 'cover')" title="Set as main Cover">Cover</button>
                        <button type="button" class="btn-secondary-pill" style="padding: 3px 8px; font-size: 0.72rem;" onclick="dms.setImageRole(${idx}, 'thumbnail')" title="Set as card Thumbnail">Thumb</button>
                        <button type="button" class="btn-secondary-pill" style="padding: 3px 8px; font-size: 0.72rem;" onclick="dms.setImageRole(${idx}, 'featured')" title="Featured in promo highlights">Featured</button>
                    </div>
                    <button type="button" class="action-icon-btn delete-btn" onclick="dms.deleteImage(${idx})" title="Remove image">🗑️</button>
                </div>
            </div>
        `).join('');

        // Sync primary cover to hidden/cover URL field
        const cover = this.uploadedImages.find(i => i.role === 'cover') || this.uploadedImages[0];
        if (cover) {
            const input = document.getElementById('destWizCoverUrl');
            if (input) input.value = cover.url;
            const preview = document.getElementById('destWizCoverPreviewImg');
            if (preview) preview.src = cover.url;
        }
    },

    // =========================================================================
    // 5. STEP 4: TAGS & ADDITIONAL PRACTICAL INFO
    // =========================================================================
    addTag(tagName) {
        if (!tagName) {
            const input = document.getElementById('destWizNewTagInput');
            tagName = input ? input.value.trim() : '';
            if (input) input.value = '';
        }
        if (!tagName) return;

        const container = document.getElementById('destWizTagsContainer');
        if (!container) return;

        const existing = Array.from(container.querySelectorAll('.dms-tag-badge')).map(el => el.dataset.tag);
        if (existing.includes(tagName)) return;

        const badge = document.createElement('span');
        badge.className = 'dms-tag-badge';
        badge.dataset.tag = tagName;
        badge.innerHTML = `${tagName} <span onclick="this.parentElement.remove()" style="cursor: pointer; margin-left: 4px; font-weight: bold;">×</span>`;
        container.appendChild(badge);
    },

    getTags() {
        const container = document.getElementById('destWizTagsContainer');
        if (!container) return [];
        return Array.from(container.querySelectorAll('.dms-tag-badge')).map(el => el.dataset.tag);
    },

    getRecommendedFor() {
        const checked = document.querySelectorAll('input[name="destWizRecFor"]:checked');
        return Array.from(checked).map(c => c.value);
    },

    switchAdditionalTab(tabId) {
        ['local', 'essentials', 'points'].forEach(t => {
            const content = document.getElementById(`addTabContent_${t}`);
            const btn = document.getElementById(`addTabBtn_${t}`);
            if (content) content.style.display = t === tabId ? 'block' : 'none';
            if (btn) btn.classList.toggle('active', t === tabId);
        });
    },

    // =========================================================================
    // 6. STEP 5: DESTINATION INVENTORY HUB (Matching Mockups)
    // =========================================================================
    async loadInventoryForWizard(destId) {
        if (!destId) return;
        try {
            const res = await api.getDestinationInventory(destId);
            if (res && res.success) {
                this.renderInventoryKPIs(res.counts, 'wiz');
                this.renderInventoryTable(res.inventory, this.currentInventorySubTab, 'destWizInventoryTableBody');
            }
        } catch (e) {
            console.error('Failed to load inventory for wizard:', e);
        }
    },

    renderInventoryKPIs(counts, prefix = 'wiz') {
        const keys = [
            { k: 'hotels', id: `${prefix}KpiHotels`, def: 0 },
            { k: 'restaurants', id: `${prefix}KpiRestaurants`, def: 0 },
            { k: 'foods', id: `${prefix}KpiFoods`, def: 0 },
            { k: 'transport', id: `${prefix}KpiTransport`, def: 0 },
            { k: 'local_transport', id: `${prefix}KpiLocalTransport`, def: 0 },
            { k: 'attractions', id: `${prefix}KpiAttractions`, def: 0 },
            { k: 'activities', id: `${prefix}KpiActivities`, def: 0 },
            { k: 'guides', id: `${prefix}KpiGuides`, def: 0 }
        ];

        keys.forEach(item => {
            const el = document.getElementById(item.id);
            if (el) el.innerText = counts[item.k] !== undefined ? counts[item.k] : item.def;
        });
    },

    switchInventorySubTab(type, targetTbodyId = 'destWizInventoryTableBody') {
        this.currentInventorySubTab = type;
        document.querySelectorAll('.dms-subnav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === type);
        });

        // Update "+ Add New" button label
        const addBtn = document.getElementById('dmsBtnAddNewInventory');
        if (addBtn) {
            const labels = {
                hotels: 'Hotel',
                restaurants: 'Restaurant',
                foods: 'Food',
                transport: 'Transportation',
                local_transport: 'Local Transport',
                attractions: 'Attraction',
                activities: 'Activity',
                guides: 'Tour Guide'
            };
            addBtn.innerHTML = `<span>+ Add New ${labels[type] || 'Item'}</span>`;
        }

        // Re-fetch or filter
        if (this.currentDestId) {
            this.loadInventoryData(this.currentDestId, type, targetTbodyId);
        }
    },

    async loadInventoryData(destId, type, targetTbodyId) {
        try {
            const res = await api.getDestinationInventory(destId, { type });
            if (res && res.success) {
                this.renderInventoryTable(res.inventory, type, targetTbodyId);
            }
        } catch (e) {
            console.error('Failed to load inventory items:', e);
        }
    },

    renderInventoryTable(inventory, activeType, tbodyId) {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;

        let items = [];
        if (activeType === 'overview' || activeType === 'all') {
            // Combine all items into recent activity list
            const h = (inventory.hotels || []).map(x => ({ ...x, _type: 'Hotel', _name: x.name_en, _img: x.cover_image, _cat: x.hotel_type || 'Resort', _status: x.status || 'active', _price: `৳${x.selling_price || 0}/night` }));
            const r = (inventory.restaurants || []).map(x => ({ ...x, _type: 'Restaurant', _name: x.name_en, _img: x.image_url, _cat: x.cuisine_type || 'Dining', _status: x.status || 'active', _price: x.price_level }));
            const f = (inventory.foods || []).map(x => ({ ...x, _type: 'Food', _name: x.name_en, _img: x.image_url, _cat: x.category || 'Local Food', _status: x.status || 'active', _price: x.price_range }));
            const t = (inventory.transport || []).map(x => ({ ...x, _type: 'Transport', _name: x.title_en || x.provider_name, _img: x.image_url, _cat: x.vehicle_type || 'Transit', _status: x.status || 'active', _price: `৳${x.selling_price || 0}` }));
            const lt = (inventory.local_transport || []).map(x => ({ ...x, _type: 'Local Transport', _name: x.vehicle_type, _img: x.image_url, _cat: x.provider_name, _status: x.status || 'active', _price: `৳${x.daily_rate || x.hourly_rate || 0}` }));
            const a = (inventory.attractions || []).map(x => ({ ...x, _type: 'Attraction', _name: x.name_en, _img: x.image_url, _cat: x.category, _status: x.status || 'active', _price: x.entry_fee_bdt ? `৳${x.entry_fee_bdt}` : 'Free' }));
            const act = (inventory.activities || []).map(x => ({ ...x, _type: 'Activity', _name: x.name_en, _img: x.image_url, _cat: x.category, _status: x.status || 'active', _price: `৳${x.price_bdt || 0}` }));
            const g = (inventory.guides || []).map(x => ({ ...x, _type: 'Tour Guide', _name: x.name, _img: x.profile_photo, _cat: x.specialization, _status: x.status || 'active', _price: `৳${x.daily_rate || 0}/day` }));
            items = [...h, ...r, ...f, ...t, ...lt, ...a, ...act, ...g];
        } else {
            const list = inventory[activeType] || [];
            items = list.map(x => ({
                ...x,
                _type: activeType.toUpperCase(),
                _name: x.name_en || x.name || x.title_en || x.vehicle_type,
                _img: x.cover_image || x.image_url || x.profile_photo,
                _cat: x.category || x.hotel_type || x.cuisine_type || x.vehicle_type || x.specialization || 'Service',
                _status: x.status || 'active',
                _price: x.selling_price ? `৳${x.selling_price}` : (x.price_range || x.daily_rate ? `৳${x.daily_rate}` : 'N/A')
            }));
        }

        if (items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 36px; color: #94a3b8;">
                        <span style="font-size: 2rem; display: block; margin-bottom: 6px;">📂</span>
                        No inventory services found in this category. Click <strong>+ Add New</strong> above to create one.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = items.map((it, idx) => `
            <tr>
                <td style="width: 40px; color: #94a3b8; font-weight: 700;">#${idx + 1}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${it._img || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=120&q=80'}" 
                             style="width: 44px; height: 44px; border-radius: 10px; object-fit: cover; border: 1px solid #e2e8f0;">
                        <div>
                            <div style="font-weight: 800; color: #0f172a; font-size: 0.9rem;">${(window.admin && admin.makeCopyable) ? admin.makeCopyable(it._name, 'Item Name') : it._name}</div>
                            <div style="font-size: 0.74rem; color: #64748b;">${(window.admin && admin.makeCopyable) ? admin.makeCopyable(it.code || it.hotel_code || it.restaurant_code || it.food_code || it.service_code || it.attraction_code || it.activity_code || it.guide_code || ('ID: ' + it.id), 'Item Code') : (it.code || it.hotel_code || it.restaurant_code || it.food_code || it.service_code || it.attraction_code || it.activity_code || it.guide_code || ('ID: ' + it.id))}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge-status-published" style="background: #eff6ff; color: #2563eb;">
                        ${it._type}
                    </span>
                </td>
                <td style="color: #475569; font-weight: 600;">${it._cat}</td>
                <td style="font-weight: 800; color: #0f172a;">${it._price}</td>
                <td>
                    <span class="${it._status === 'active' ? 'badge-status-published' : 'badge-status-draft'}">
                        ${it._status === 'active' ? 'Active' : 'Draft'}
                    </span>
                </td>
                <td style="text-align: right; min-width: 80px;">
                    <button type="button" class="action-icon-btn delete-btn" onclick="dms.deleteInventoryItem('${it._type.toLowerCase()}', ${it.id})" title="Delete item">🗑️</button>
                </td>
            </tr>
        `).join('');
        if (window.admin && admin.initDragToScroll) {
            setTimeout(() => admin.initDragToScroll(), 50);
        }
    },

    async deleteInventoryItem(type, itemId) {
        if (!confirm('Are you sure you want to delete this inventory item?')) return;
        try {
            const destId = this.currentDestId;
            const res = await api.deleteDestinationInventoryItem(destId, type, itemId);
            if (res && res.success) {
                alert('✅ Item deleted successfully!');
                this.loadInventoryForWizard(destId);
                if (this.currentHubTab) {
                    this.loadDestinationHub(destId);
                }
            } else {
                alert('❌ Failed to delete item.');
            }
        } catch (e) {
            console.error('Delete error:', e);
            alert('❌ Server error during delete.');
        }
    },

    // =========================================================================
    // 7. DEDICATED DESTINATION DETAILS & INVENTORY HUB (Matching Screen 2 Mockup)
    // =========================================================================
    async showDestinationHub(destId) {
        this.currentDestId = destId;
        admin.showView('destination-hub');

        await this.loadDestinationHub(destId);
    },

    async loadDestinationHub(destId) {
        try {
            const res = await api.getDestinationById(destId);
            if (!res || !res.success || !res.destination) {
                alert('Destination details not found.');
                return;
            }

            const d = res.destination;
            this.currentDest = d;

            // Render Hero Card
            document.getElementById('hubDestBreadcrumbName').innerText = d.name_en;
            document.getElementById('hubDestHeroTitle').innerText = d.name_en;
            document.getElementById('hubDestHeroCover').src = d.image_url || 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80';
            document.getElementById('hubDestHeroLoc').innerText = `${d.city || ''}, ${d.country || 'Bangladesh'}`;
            document.getElementById('hubDestHeroCode').innerText = d.destination_code || 'CBD001';
            document.getElementById('hubDestHeroDesc').innerText = d.short_desc_en || d.description_en || '';

            // Render Tags
            const tags = (d.tags ? (typeof d.tags === 'string' ? d.tags.split(',') : d.tags) : ['Beach', 'Nature', 'Family Friendly']);
            const tagsWrap = document.getElementById('hubDestHeroTags');
            if (tagsWrap) {
                tagsWrap.innerHTML = tags.map(t => `<span class="dms-tag-badge">${t.trim()}</span>`).join('');
            }

            // Render KPI Counters Row
            this.renderInventoryKPIs(d.inventoryCounts || {}, 'hub');

            // Render Overview Status Breakdown
            const total = d.inventoryCounts?.total || 0;
            const activeCount = total > 4 ? total - 3 : total;
            document.getElementById('hubStatusActive').innerText = activeCount;
            document.getElementById('hubStatusDraft').innerText = total > 4 ? 2 : 0;
            document.getElementById('hubStatusPending').innerText = total > 4 ? 1 : 0;

            // Render Recent Items Table in Overview
            this.renderInventoryTable(d.inventory, 'overview', 'hubRecentInventoryTableBody');

        } catch (e) {
            console.error('Failed to load destination hub:', e);
        }
    },

    switchHubTab(tabName) {
        this.currentHubTab = tabName;
        document.querySelectorAll('.hub-subnav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        const overviewSection = document.getElementById('hubOverviewSection');
        const categorySection = document.getElementById('hubCategorySection');

        if (tabName === 'overview') {
            if (overviewSection) overviewSection.style.display = 'block';
            if (categorySection) categorySection.style.display = 'none';
        } else {
            if (overviewSection) overviewSection.style.display = 'none';
            if (categorySection) categorySection.style.display = 'block';
            this.loadInventoryData(this.currentDestId, tabName, 'hubCategoryTableBody');
        }
    },

    // =========================================================================
    // 8. DRAFT SAVING & PRE-FLIGHT VALIDATION
    // =========================================================================
    async saveDraft() {
        const payload = this.collectFormData();
        payload.status = 'draft';

        try {
            const res = await api.saveDestinationDraft(payload);
            if (res && res.success) {
                this.lastDraftSavedAt = new Date();
                const notice = document.getElementById('destWizDraftNotice');
                if (notice) notice.innerText = 'Draft saved just now ✓';
                if (!payload.id && res.id) {
                    document.getElementById('destWizEditId').value = res.id;
                    this.currentDestId = res.id;
                }
            }
        } catch (e) {
            console.error('Draft save failed:', e);
        }
    },

    async validateBeforePublish() {
        const payload = this.collectFormData();
        const res = await api.validateDestination({
            slug: payload.slug,
            destination_code: payload.destination_code,
            name_en: payload.name_en,
            city: payload.city,
            current_id: payload.id
        });

        if (res && res.success && !res.isValid) {
            alert('⚠️ Validation Warning:\n• ' + res.warnings.join('\n• '));
            return false;
        }
        return true;
    },

    collectFormData() {
        const id = document.getElementById('destWizEditId')?.value;
        const travelType = document.getElementById('destWizTravelType')?.value || 'domestic';
        const country = travelType === 'domestic' ? 'Bangladesh' : (document.getElementById('destWizCountrySelect')?.value || 'Bangladesh');
        const division = document.getElementById('destWizDivisionSelect')?.value || '';
        const city = document.getElementById('destWizCitySelect')?.value || '';
        const name = document.getElementById('destWizName')?.value.trim() || '';
        const slug = document.getElementById('destWizSlug')?.value.trim() || '';
        const code = document.getElementById('destWizCode')?.value.trim() || '';
        const category = document.getElementById('destWizCategory')?.value || 'Beach';
        const duration = document.getElementById('destWizDurationSelect')?.value || '3 Days 2 Nights';
        const shortDesc = document.getElementById('destWizShortDesc')?.value.trim() || '';
        const fullDesc = document.getElementById('destWizFullDesc')?.value.trim() || '';
        const mapCode = document.getElementById('destWizMapEmbedCode')?.value.trim() || '';
        const timezone = document.getElementById('destWizTimezone')?.value || 'Asia/Dhaka';
        const currency = document.getElementById('destWizCurrency')?.value || 'BDT';

        // Step 6: Settings
        const status = document.getElementById('destWizStatusSelect')?.value || 'active';
        const visibility = document.getElementById('destWizVisibilitySelect')?.value || 'public';
        const isFeatured = document.getElementById('toggleDestFeatured')?.checked ? 1 : 0;
        const isHomepage = document.getElementById('toggleDestHomepage')?.checked ? 1 : 0;
        const isSearch = document.getElementById('toggleDestSearch')?.checked ? 1 : 0;
        const isBooking = document.getElementById('toggleDestBooking')?.checked ? 1 : 0;
        const isCustomTrip = document.getElementById('toggleDestCustomTrip')?.checked ? 1 : 0;
        const isRec = document.getElementById('toggleDestRec')?.checked ? 1 : 0;
        const isReview = document.getElementById('toggleDestReview')?.checked ? 1 : 0;

        // SEO
        const seoTitle = document.getElementById('destWizSeoTitle')?.value || '';
        const metaDesc = document.getElementById('destWizMetaDesc')?.value || '';
        const metaKeys = document.getElementById('destWizMetaKeywords')?.value || '';
        const canonical = document.getElementById('destWizCanonicalSlug')?.value || '';
        const shareImg = document.getElementById('destWizShareImage')?.value || '';

        // Media
        const coverImg = document.getElementById('destWizCoverUrl')?.value || '';

        // Additional practical info
        const additionalInfo = {
            local_language: document.getElementById('infoLocalLanguage')?.value || '',
            safety_info: document.getElementById('infoSafetyInfo')?.value || '',
            travel_tips: document.getElementById('infoTravelTips')?.value || '',
            local_customs: document.getElementById('infoLocalCustoms')?.value || '',
            dress_code: document.getElementById('infoDressCode')?.value || '',
            weather: document.getElementById('infoWeather')?.value || '',
            internet: document.getElementById('infoInternet')?.value || '',
            electricity: document.getElementById('infoElectricity')?.value || '',
            drinking_water: document.getElementById('infoDrinkingWater')?.value || '',
            shopping: document.getElementById('infoShopping')?.value || '',
            nightlife: document.getElementById('infoNightlife')?.value || '',
            emergency: document.getElementById('infoEmergency')?.value || ''
        };

        return {
            id,
            travel_type: travelType,
            country,
            division_state: division,
            city,
            name_en: name,
            slug,
            destination_code: code,
            category,
            average_duration: duration,
            short_desc_en: shortDesc,
            description_en: fullDesc,
            map_embed_code: mapCode,
            timezone,
            currency_code: currency,
            image_url: coverImg,
            gallery_images: this.uploadedImages.map(i => i.url),
            image_roles_json: this.uploadedImages,
            tags: this.getTags(),
            recommended_for: this.getRecommendedFor(),
            additional_info_json: additionalInfo,
            status,
            visibility,
            is_featured: isFeatured,
            is_homepage_show: isHomepage,
            is_search_show: isSearch,
            is_booking_enabled: isBooking,
            is_custom_trip_enabled: isCustomTrip,
            is_recommendation_enabled: isRec,
            is_review_enabled: isReview,
            seo_title: seoTitle,
            meta_description: metaDesc,
            meta_keywords: metaKeys,
            canonical_slug: canonical,
            social_share_image: shareImg
        };
    },

    // =========================================================================
    // 9. SUB-MODALS FOR INVENTORY CREATION (Matching Screen 3 Mockups)
    // =========================================================================
    openAddNewInventoryModal() {
        const type = this.currentInventorySubTab;
        if (type === 'hotels' || type === 'hotel') this.openAddHotelModal();
        else if (type === 'restaurants' || type === 'restaurant') this.openAddRestaurantModal();
        else if (type === 'foods' || type === 'food') this.openAddFoodModal();
        else if (type === 'transport') this.openAddTransportModal();
        else if (type === 'local_transport') this.openAddLocalTransportModal();
        else if (type === 'attractions' || type === 'attraction') this.openAddAttractionModal();
        else if (type === 'activities' || type === 'activity') this.openAddActivityModal();
        else if (type === 'guides' || type === 'guide') this.openAddGuideModal();
        else this.openAddHotelModal();
    },

    openAddHotelModal() {
        const modal = document.getElementById('dmsHotelModal');
        if (modal) modal.classList.add('active');
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    },

    async saveHotelForm(e) {
        if (e) e.preventDefault();
        const destId = this.currentDestId || 9;
        const data = {
            name_en: document.getElementById('dmsHotelName').value,
            hotel_code: document.getElementById('dmsHotelCode').value,
            hotel_type: document.getElementById('dmsHotelType').value,
            star_rating: parseInt(document.getElementById('dmsHotelStar').value),
            brand: document.getElementById('dmsHotelBrand').value,
            chain: document.getElementById('dmsHotelChain').value,
            short_desc_en: document.getElementById('dmsHotelShortDesc').value,
            description_en: document.getElementById('dmsHotelDesc').value,
            area_name: document.getElementById('dmsHotelArea').value,
            address: document.getElementById('dmsHotelAddress').value,
            map_embed_code: document.getElementById('dmsHotelMapEmbed').value,
            cover_image: document.getElementById('dmsHotelCoverImg').value,
            selling_price: parseFloat(document.getElementById('dmsHotelPrice').value) || 0,
            status: document.getElementById('dmsHotelStatus').value
        };

        try {
            const res = await api.createDestinationInventoryItem(destId, 'hotel', data);
            if (res && res.success) {
                alert('✅ Hotel added and linked to destination successfully!');
                this.closeModal('dmsHotelModal');
                this.loadInventoryForWizard(destId);
                if (this.currentHubTab) this.loadDestinationHub(destId);
            }
        } catch (err) {
            console.error('Save hotel error:', err);
            alert('❌ Failed to save hotel.');
        }
    },

    openAddRestaurantModal() {
        const modal = document.getElementById('dmsRestaurantModal');
        if (modal) modal.classList.add('active');
    },

    async saveRestaurantForm(e) {
        if (e) e.preventDefault();
        const destId = this.currentDestId || 9;
        const data = {
            name_en: document.getElementById('dmsRestName').value,
            restaurant_code: document.getElementById('dmsRestCode').value,
            restaurant_type: document.getElementById('dmsRestType').value,
            cuisine_type: document.getElementById('dmsRestCuisine').value,
            price_level: document.getElementById('dmsRestPriceLevel').value,
            is_halal: document.getElementById('dmsRestHalal').checked ? 1 : 0,
            is_vegetarian: document.getElementById('dmsRestVeg').checked ? 1 : 0,
            is_vegan: document.getElementById('dmsRestVegan').checked ? 1 : 0,
            is_family_friendly: document.getElementById('dmsRestFamily').checked ? 1 : 0,
            short_desc_en: document.getElementById('dmsRestShortDesc').value,
            description_en: document.getElementById('dmsRestDesc').value,
            address: document.getElementById('dmsRestAddress').value,
            map_embed_code: document.getElementById('dmsRestMapEmbed').value,
            image_url: document.getElementById('dmsRestImg').value,
            status: document.getElementById('dmsRestStatus').value
        };

        try {
            const res = await api.createDestinationInventoryItem(destId, 'restaurant', data);
            if (res && res.success) {
                alert('✅ Restaurant added and linked successfully!');
                this.closeModal('dmsRestaurantModal');
                this.loadInventoryForWizard(destId);
                if (this.currentHubTab) this.loadDestinationHub(destId);
            }
        } catch (err) {
            console.error('Save restaurant error:', err);
            alert('❌ Failed to save restaurant.');
        }
    },

    openAddFoodModal() {
        const modal = document.getElementById('dmsFoodModal');
        if (modal) modal.classList.add('active');
    },

    async saveFoodForm(e) {
        if (e) e.preventDefault();
        const destId = this.currentDestId || 9;
        const data = {
            name_en: document.getElementById('dmsFoodName').value,
            food_code: document.getElementById('dmsFoodCode').value,
            category: document.getElementById('dmsFoodCategory').value,
            local_name: document.getElementById('dmsFoodLocalName').value,
            cuisine: document.getElementById('dmsFoodCuisine').value,
            spicy_level: document.getElementById('dmsFoodSpicy').value,
            price_range: document.getElementById('dmsFoodPriceRange').value,
            is_halal: document.getElementById('dmsFoodHalal').checked ? 1 : 0,
            is_vegetarian: document.getElementById('dmsFoodVeg').checked ? 1 : 0,
            where_to_find: document.getElementById('dmsFoodWhere').value,
            description_en: document.getElementById('dmsFoodDesc').value,
            image_url: document.getElementById('dmsFoodImg').value,
            status: document.getElementById('dmsFoodStatus').value
        };

        try {
            const res = await api.createDestinationInventoryItem(destId, 'food', data);
            if (res && res.success) {
                alert('✅ Food added and linked successfully!');
                this.closeModal('dmsFoodModal');
                this.loadInventoryForWizard(destId);
                if (this.currentHubTab) this.loadDestinationHub(destId);
            }
        } catch (err) {
            console.error('Save food error:', err);
            alert('❌ Failed to save food.');
        }
    },

    openAddTransportModal() {
        const modal = document.getElementById('dmsTransportModal');
        if (modal) modal.classList.add('active');
    },

    async saveTransportForm(e) {
        if (e) e.preventDefault();
        const destId = this.currentDestId || 9;
        const data = {
            provider_name: document.getElementById('dmsTransProvider').value,
            vehicle_type: document.getElementById('dmsTransType').value,
            title_en: document.getElementById('dmsTransTitle').value,
            service_code: document.getElementById('dmsTransCode').value,
            route_name: document.getElementById('dmsTransRoute').value,
            origin: document.getElementById('dmsTransOrigin').value,
            destination: document.getElementById('dmsTransDest').value,
            duration: document.getElementById('dmsTransDuration').value,
            class_type: document.getElementById('dmsTransClass').value,
            capacity_passengers: parseInt(document.getElementById('dmsTransCapacity').value) || 40,
            selling_price: parseFloat(document.getElementById('dmsTransFare').value) || 0,
            baggage_allowance: document.getElementById('dmsTransBaggage').value,
            booking_requirement: document.getElementById('dmsTransReq').value,
            cancellation_policy: document.getElementById('dmsTransCancel').value,
            image_url: document.getElementById('dmsTransImg').value,
            contact_phone: document.getElementById('dmsTransPhone').value,
            description_en: document.getElementById('dmsTransDesc').value
        };

        try {
            const res = await api.createDestinationInventoryItem(destId, 'transport', data);
            if (res && res.success) {
                alert('✅ Transportation service linked successfully!');
                this.closeModal('dmsTransportModal');
                this.loadInventoryForWizard(destId);
                if (this.currentHubTab) this.loadDestinationHub(destId);
            }
        } catch (err) {
            console.error('Save transport error:', err);
            alert('❌ Failed to save transport.');
        }
    },

    openAddLocalTransportModal() {
        const modal = document.getElementById('dmsLocalTransportModal');
        if (modal) modal.classList.add('active');
    },

    async saveLocalTransportForm(e) {
        if (e) e.preventDefault();
        const destId = this.currentDestId || 9;
        const data = {
            provider_name: document.getElementById('dmsLtProvider').value,
            vehicle_type: document.getElementById('dmsLtVehicleType').value,
            vehicle_model: document.getElementById('dmsLtModel').value,
            service_code: document.getElementById('dmsLtCode').value,
            capacity: parseInt(document.getElementById('dmsLtCapacity').value) || 4,
            is_ac: document.getElementById('dmsLtAc').checked ? 1 : 0,
            driver_included: document.getElementById('dmsLtDriver').checked ? 1 : 0,
            fuel_included: document.getElementById('dmsLtFuel').checked ? 1 : 0,
            hourly_rate: parseFloat(document.getElementById('dmsLtHourlyRate').value) || 0,
            daily_rate: parseFloat(document.getElementById('dmsLtDailyRate').value) || 0,
            per_trip_rate: parseFloat(document.getElementById('dmsLtTripRate').value) || 0,
            airport_transfer_rate: parseFloat(document.getElementById('dmsLtAirportRate').value) || 0,
            service_area: document.getElementById('dmsLtArea').value,
            operating_hours: document.getElementById('dmsLtHours').value,
            contact_phone: document.getElementById('dmsLtPhone').value,
            image_url: document.getElementById('dmsLtImg').value
        };

        try {
            const res = await api.createDestinationInventoryItem(destId, 'local_transport', data);
            if (res && res.success) {
                alert('✅ Local transport added and linked successfully!');
                this.closeModal('dmsLocalTransportModal');
                this.loadInventoryForWizard(destId);
                if (this.currentHubTab) this.loadDestinationHub(destId);
            }
        } catch (err) {
            console.error('Save local transport error:', err);
            alert('❌ Failed to save local transport.');
        }
    },

    openAddAttractionModal() {
        const modal = document.getElementById('dmsAttractionModal');
        if (modal) modal.classList.add('active');
    },

    async saveAttractionForm(e) {
        if (e) e.preventDefault();
        const destId = this.currentDestId || 9;
        const data = {
            name_en: document.getElementById('dmsAttName').value,
            attraction_code: document.getElementById('dmsAttCode').value,
            category: document.getElementById('dmsAttCategory').value,
            opening_hours: document.getElementById('dmsAttHours').value,
            best_time: document.getElementById('dmsAttBestTime').value,
            recommended_duration: document.getElementById('dmsAttDuration').value,
            entry_fee_bdt: parseFloat(document.getElementById('dmsAttFee').value) || 0,
            is_family_friendly: document.getElementById('dmsAttFamily').checked ? 1 : 0,
            is_wheelchair_friendly: document.getElementById('dmsAttWheelchair').checked ? 1 : 0,
            is_photography_allowed: document.getElementById('dmsAttPhoto').checked ? 1 : 0,
            short_desc_en: document.getElementById('dmsAttShortDesc').value,
            description_en: document.getElementById('dmsAttDesc').value,
            address: document.getElementById('dmsAttAddress').value,
            map_embed_code: document.getElementById('dmsAttMapEmbed').value,
            image_url: document.getElementById('dmsAttImg').value,
            status: document.getElementById('dmsAttStatus').value
        };

        try {
            const res = await api.createDestinationInventoryItem(destId, 'attraction', data);
            if (res && res.success) {
                alert('✅ Tourist attraction linked successfully!');
                this.closeModal('dmsAttractionModal');
                this.loadInventoryForWizard(destId);
                if (this.currentHubTab) this.loadDestinationHub(destId);
            }
        } catch (err) {
            console.error('Save attraction error:', err);
            alert('❌ Failed to save attraction.');
        }
    },

    openAddActivityModal() {
        const modal = document.getElementById('dmsActivityModal');
        if (modal) modal.classList.add('active');
    },

    async saveActivityForm(e) {
        if (e) e.preventDefault();
        const destId = this.currentDestId || 9;
        const data = {
            name_en: document.getElementById('dmsActName').value,
            activity_code: document.getElementById('dmsActCode').value,
            category: document.getElementById('dmsActCategory').value,
            duration_hours: parseFloat(document.getElementById('dmsActDuration').value) || 2.0,
            price_bdt: parseFloat(document.getElementById('dmsActPrice').value) || 0,
            price_type: document.getElementById('dmsActPriceType').value,
            min_participants: parseInt(document.getElementById('dmsActMinPart').value) || 1,
            max_participants: parseInt(document.getElementById('dmsActMaxPart').value) || 10,
            difficulty_level: document.getElementById('dmsActSkill').value,
            is_guide_included: document.getElementById('dmsActGuide').checked ? 1 : 0,
            is_pickup_available: document.getElementById('dmsActPickup').checked ? 1 : 0,
            is_cancellation_allowed: document.getElementById('dmsActCancel').checked ? 1 : 0,
            short_desc_en: document.getElementById('dmsActShortDesc').value,
            description_en: document.getElementById('dmsActDesc').value,
            included_items: document.getElementById('dmsActIncluded').value,
            excluded_items: document.getElementById('dmsActExcluded').value,
            required_equipment: document.getElementById('dmsActEquipment').value,
            image_url: document.getElementById('dmsActImg').value,
            status: document.getElementById('dmsActStatus').value
        };

        try {
            const res = await api.createDestinationInventoryItem(destId, 'activity', data);
            if (res && res.success) {
                alert('✅ Activity & experience linked successfully!');
                this.closeModal('dmsActivityModal');
                this.loadInventoryForWizard(destId);
                if (this.currentHubTab) this.loadDestinationHub(destId);
            }
        } catch (err) {
            console.error('Save activity error:', err);
            alert('❌ Failed to save activity.');
        }
    },

    openAddGuideModal() {
        const modal = document.getElementById('dmsGuideModal');
        if (modal) modal.classList.add('active');
    },

    async saveGuideForm(e) {
        if (e) e.preventDefault();
        const destId = this.currentDestId || 9;
        const data = {
            name: document.getElementById('dmsGuideName').value,
            guide_code: document.getElementById('dmsGuideCode').value,
            languages: document.getElementById('dmsGuideLangs').value,
            specialization: document.getElementById('dmsGuideSpec').value,
            experience_years: parseInt(document.getElementById('dmsGuideExp').value) || 3,
            certification: document.getElementById('dmsGuideCert').value,
            daily_rate: parseFloat(document.getElementById('dmsGuideRate').value) || 2000,
            hourly_rate: parseFloat(document.getElementById('dmsGuideHourlyRate').value) || 300,
            price_type: document.getElementById('dmsGuidePriceType').value,
            availability_status: document.getElementById('dmsGuideAvail').value,
            contact_phone: document.getElementById('dmsGuidePhone').value,
            contact_email: document.getElementById('dmsGuideEmail').value,
            profile_photo: document.getElementById('dmsGuidePhoto').value,
            bio: document.getElementById('dmsGuideBio').value,
            rating: 4.9
        };

        try {
            const res = await api.createDestinationInventoryItem(destId, 'guide', data);
            if (res && res.success) {
                alert('✅ Tour guide linked successfully!');
                this.closeModal('dmsGuideModal');
                this.loadInventoryForWizard(destId);
                if (this.currentHubTab) this.loadDestinationHub(destId);
            }
        } catch (err) {
            console.error('Save guide error:', err);
            alert('❌ Failed to save guide.');
        }
    },

    // =========================================================================
    // 10. IN-PLACE TAXONOMY MODALS ("+ নতুন Country / City / Category / Duration")
    // =========================================================================
    openAddCountryModal() {
        const modal = document.getElementById('dmsAddCountryModal');
        if (modal) modal.classList.add('active');
    },

    async saveCountryForm(e) {
        if (e) e.preventDefault();
        const data = {
            name: document.getElementById('newCountryName').value.trim(),
            code: document.getElementById('newCountryCode').value.trim().toUpperCase(),
            currency_name: document.getElementById('newCountryCurrName').value.trim(),
            currency_code: document.getElementById('newCountryCurrCode').value.trim().toUpperCase(),
            timezone: document.getElementById('newCountryTimezone').value.trim(),
            flag_emoji: document.getElementById('newCountryFlag').value.trim() || '🏳️'
        };

        try {
            const res = await api.createCountry(data);
            if (res && res.success) {
                alert(`✅ Country "${data.name}" added successfully!`);
                this.closeModal('dmsAddCountryModal');
                await this.loadCountries();
                const sel = document.getElementById('destWizCountrySelect');
                if (sel) {
                    sel.value = data.name;
                    this.onCountryChange(data.name);
                }
            }
        } catch (err) {
            console.error('Create country error:', err);
            alert('❌ Failed to create country.');
        }
    },

    openAddDivisionModal() {
        const modal = document.getElementById('dmsAddDivisionModal');
        if (modal) modal.classList.add('active');
    },

    async saveDivisionForm(e) {
        if (e) e.preventDefault();
        const country = document.getElementById('destWizTravelType')?.value === 'domestic'
            ? 'Bangladesh'
            : (document.getElementById('destWizCountrySelect')?.value || 'Bangladesh');

        const data = {
            country_name: country,
            name: document.getElementById('newDivisionName').value.trim(),
            type: document.getElementById('newDivisionType').value || 'State'
        };

        try {
            const res = await api.createDivision(data);
            if (res && res.success) {
                alert(`✅ Division/State "${data.name}" created!`);
                this.closeModal('dmsAddDivisionModal');
                await this.loadDivisions(country);
                const sel = document.getElementById('destWizDivisionSelect');
                if (sel) {
                    sel.value = data.name;
                    this.onDivisionChange(data.name);
                }
            }
        } catch (err) {
            console.error('Create division error:', err);
            alert('❌ Failed to create division.');
        }
    },

    openAddCityModal() {
        const modal = document.getElementById('dmsAddCityModal');
        if (modal) modal.classList.add('active');
    },

    async saveCityForm(e) {
        if (e) e.preventDefault();
        const country = document.getElementById('destWizTravelType')?.value === 'domestic'
            ? 'Bangladesh'
            : (document.getElementById('destWizCountrySelect')?.value || 'Bangladesh');

        const data = {
            country_name: country,
            division_id: null,
            name: document.getElementById('newCityName').value.trim()
        };

        try {
            const res = await api.createCity(data);
            if (res && res.success) {
                alert(`✅ City "${data.name}" added!`);
                this.closeModal('dmsAddCityModal');
                await this.loadCities(country);
                const sel = document.getElementById('destWizCitySelect');
                if (sel) sel.value = data.name;
            }
        } catch (err) {
            console.error('Create city error:', err);
            alert('❌ Failed to create city.');
        }
    },

    openAddCategoryModal() {
        const modal = document.getElementById('dmsAddCategoryModal');
        if (modal) modal.classList.add('active');
    },

    async saveCategoryForm(e) {
        if (e) e.preventDefault();
        const data = {
            name_en: document.getElementById('newCatNameEn').value.trim(),
            icon: document.getElementById('newCatIcon').value.trim() || '📍'
        };

        try {
            const res = await api.createDestinationCategory(data);
            if (res && res.success) {
                alert(`✅ Category "${data.name_en}" created!`);
                this.closeModal('dmsAddCategoryModal');
                await this.loadCategories();
                const sel = document.getElementById('destWizCategory');
                if (sel) sel.value = data.name_en;
            }
        } catch (err) {
            console.error('Create category error:', err);
            alert('❌ Failed to create category.');
        }
    },

    openAddDurationModal() {
        const modal = document.getElementById('dmsAddDurationModal');
        if (modal) modal.classList.add('active');
    },

    async saveDurationForm(e) {
        if (e) e.preventDefault();
        const days = parseInt(document.getElementById('newDurationDays').value) || 1;
        const nights = parseInt(document.getElementById('newDurationNights').value) || 0;

        try {
            const res = await api.createDestinationDuration({ days, nights });
            if (res && res.success && res.duration) {
                alert(`✅ Custom duration "${res.duration.label}" saved!`);
                this.closeModal('dmsAddDurationModal');
                await this.loadDurations();
                const sel = document.getElementById('destWizDurationSelect');
                if (sel) sel.value = res.duration.label;
            }
        } catch (err) {
            console.error('Create duration error:', err);
            alert('❌ Failed to create duration.');
        }
    }
};

// Initialize DMS on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.dms) window.dms.init();
});
