/**
 * TravelUp Global - Master Application Script
 * Precision-Mapped to UI Mockup & Style.css Classes
 */
const app = {
    destinations: [],
    packages: [],
    currentLang: ['en', 'bn'].includes(localStorage.getItem('travelup_lang')) ? localStorage.getItem('travelup_lang') : 'en',
    currentCurrency: localStorage.getItem('travelup_curr') || 'USD',
    activeDestinationForBooking: null,

    async init() {
        this.updateLangLabels();
        this.updateCurrLabels();
        await this.loadDestinations();
        await this.loadPackages();
        this.bindEvents();
        this.initMobileNav();
    },

    GLOBAL_LANGUAGES: [
        { code: 'en', flag: '🇬🇧', name: 'English', native: 'English', short: 'EN' },
        { code: 'bn', flag: '🇧🇩', name: 'Bengali', native: 'বাংলা', short: 'বাং' }
    ],

    // 1. Language Toggle & Modal (English ⇄ বাংলা)
    toggleLanguage() {
        const nextLang = this.currentLang === 'en' ? 'bn' : 'en';
        this.setLanguage(nextLang);
    },

    openLanguageModal() {
        let modal = document.getElementById('languageModal');
        if (!modal) {
            const div = document.createElement('div');
            div.id = 'languageModal';
            div.className = 'modal-overlay';
            div.innerHTML = `
                <div class="modal-box-card" style="max-width: 440px; padding: 24px; border-radius: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1.5rem;">🌐</span>
                            <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0;">Select Language / ভাষা নির্বাচন</h3>
                        </div>
                        <button class="modal-close-cross" onclick="app.closeLanguageModal()">&times;</button>
                    </div>
                    <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">
                        Choose your language for website navigation, packages, and destinations.
                    </p>
                    <div class="language-selection-grid" id="langSelectionGrid" style="grid-template-columns: repeat(2, 1fr); max-height: none;"></div>
                </div>
            `;
            document.body.appendChild(div);
            modal = div;
        }

        const grid = document.getElementById('langSelectionGrid');
        if (grid) {
            grid.innerHTML = this.GLOBAL_LANGUAGES.map(l => {
                const isActive = l.code === this.currentLang;
                return `
                    <div class="lang-card-item ${isActive ? 'active' : ''}" onclick="app.setLanguage('${l.code}')">
                        <div class="lang-flag-box">${l.flag}</div>
                        <div>
                            <div class="lang-title-text">${l.native}</div>
                            <div class="lang-sub-text">${l.name} (${l.short})</div>
                        </div>
                        ${isActive ? '<span class="lang-active-check">✓</span>' : ''}
                    </div>
                `;
            }).join('');
        }

        modal.classList.add('active');
    },

    closeLanguageModal() {
        const modal = document.getElementById('languageModal');
        if (modal) modal.classList.remove('active');
    },

    // Traveler Interactive Toast Notification
    showToast(message, type = 'info') {
        let container = document.getElementById('travelToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'travelToastContainer';
            container.className = 'travel-toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `travel-toast toast-${type}`;
        const icons = {
            success: '✅',
            info: '✈️',
            warning: '⚠️',
            error: '⛔'
        };
        const icon = icons[type] || '✈️';
        toast.innerHTML = `<span style="font-size:1.1rem;">${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(12px)';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    // Floating Traveler Concierge Menu
    toggleConciergeMenu(e) {
        if (e) e.stopPropagation();
        const menu = document.getElementById('conciergePopover');
        if (menu) {
            menu.classList.toggle('active');
        }
    },

    setLanguage(code) {
        this.currentLang = (code === 'bn') ? 'bn' : 'en';
        localStorage.setItem('travelup_lang', this.currentLang);
        this.updateLangLabels();
        if (typeof this.renderDestinations === 'function') this.renderDestinations();
        if (typeof this.renderPackages === 'function') this.renderPackages();
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: this.currentLang } }));
        this.closeLanguageModal();
    },

    // Currency Toggle (USD $ ⇄ BDT ৳)
    toggleCurrency() {
        this.currentCurrency = this.currentCurrency === 'USD' ? 'BDT' : 'USD';
        localStorage.setItem('travelup_curr', this.currentCurrency);
        this.updateCurrLabels();
        this.renderDestinations();
        this.renderPackages();
        window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency: this.currentCurrency } }));
    },

    updateCurrLabels() {
        document.querySelectorAll('#currentCurrLabel').forEach(currLabel => {
            currLabel.innerText = this.currentCurrency === 'USD' ? 'USD ($)' : 'BDT (৳)';
        });
    },

    formatPrice(usd, bdt) {
        if (this.currentCurrency === 'BDT') {
            const amount = bdt || (usd * 120);
            return `৳${Math.round(amount).toLocaleString()}`;
        }
        return `$${Math.round(usd).toLocaleString()}`;
    },

    updateLangLabels() {
        const langObj = this.GLOBAL_LANGUAGES.find(l => l.code === this.currentLang) || this.GLOBAL_LANGUAGES[0];
        document.querySelectorAll('#currentLangLabel').forEach(el => {
            el.innerText = `${langObj.short}`;
        });

        const i18n = {
            'Home': { bn: 'হোম' },
            'Destinations': { bn: 'ডেস্টিনেশন' },
            'Packages': { bn: 'প্যাকেজ' },
            'Plan & Build': { bn: 'প্ল্যান ও বিল্ড' },
            'Community': { bn: 'কমিউনিটি' },
            'Traveler Reviews': { bn: 'ভ্রমণকারীদের রিভিউ' },
            'Custom Trip Builder': { bn: 'কাস্টম ট্রিপ বিল্ডার' },
            'Day-wise Itinerary': { bn: 'দিনভিত্তিক ভ্রমণসূচি' },
            'AI Trip Planner': { bn: 'এআই ট্রিপ প্ল্যানার' },
            'Budget Planner': { bn: 'বাজেট প্ল্যানার' },
            'Group Travel': { bn: 'গ্রুপ ট্রাভেল' },
            'Travel Stories': { bn: 'ভ্রমণ গল্প' },
            'Travel Personality Quiz': { bn: 'ট্রাভেল কুইজ' },
            'Quick Links': { bn: 'কুইক লিংক' },
            'Support & Help': { bn: 'সহায়তা ও সাপোর্ট' },
            'Download Our App': { bn: 'মোবাইল অ্যাপ' },
            'Explore Destinations': { bn: 'গন্তব্য অন্বেষণ' },
            'Featured Packages': { bn: 'জনপ্রিয় প্যাকেজ' },
            'Community & Stories': { bn: 'কমিউনিটি ও গল্প' },
            'About Us': { bn: 'আমাদের সম্পর্কে' },
            'Help Center': { bn: 'হেল্প সেন্টার' },
            'Contact Specialists': { bn: 'বিশেষজ্ঞ পরামর্শ' },
            'Terms & Conditions': { bn: 'শর্তাবলী ও নিয়ম' },
            'Privacy Policy': { bn: 'প্রাইভেসি পলিসি' }
        };

        document.querySelectorAll('[data-en]').forEach(el => {
            const enText = el.getAttribute('data-en');
            const bnText = el.getAttribute('data-bn');
            if (this.currentLang === 'bn') {
                el.innerText = bnText || (i18n[enText] && i18n[enText].bn) || enText;
            } else {
                el.innerText = enText;
            }
        });

        // Dynamic footer auto-translation
        document.querySelectorAll('.footer-dark-section .footer-nav-col h5').forEach(h5 => {
            const orig = h5.getAttribute('data-orig-text') || h5.innerText.trim();
            if (!h5.getAttribute('data-orig-text')) h5.setAttribute('data-orig-text', orig);
            if (this.currentLang === 'bn' && i18n[orig]) {
                h5.innerText = i18n[orig].bn;
            } else {
                h5.innerText = orig;
            }
        });

        document.querySelectorAll('.footer-dark-section .footer-nav-col ul li a').forEach(a => {
            const iconSpan = a.querySelector('span');
            const icon = iconSpan ? iconSpan.outerHTML : '';
            const plainText = a.textContent.replace(/[\u{1F300}-\u{1F9FF}|🗺️|✈️|🛠️|👥|ℹ️|💬|📬|📜|🛡️|➔|→]/gu, '').trim();
            const orig = a.getAttribute('data-orig-text') || plainText;
            if (!a.getAttribute('data-orig-text')) a.setAttribute('data-orig-text', orig);
            if (this.currentLang === 'bn' && i18n[orig]) {
                a.innerHTML = `${icon} ${i18n[orig].bn}`;
            } else {
                a.innerHTML = `${icon} ${orig}`;
            }
        });
    },

    // 2. Load Destinations
    async loadDestinations(filterParams = {}) {
        const res = await api.getDestinations(filterParams);
        if (res.success && res.destinations.length > 0) {
            this.destinations = res.destinations;
        } else {
            // High-grade fallback matching mockup perfectly
            this.destinations = [
                {
                    id: 1,
                    name_en: 'Bali, Indonesia',
                    name_bn: 'বালি, ইন্দোনেশিয়া',
                    rating: '4.8',
                    reviews: '2.4k',
                    price_usd: 599,
                    badge: 'Best Price',
                    badge_class: 'badge-bg-green',
                    image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=700&q=80'
                },
                {
                    id: 2,
                    name_en: 'Santorini, Greece',
                    name_bn: 'সান্তোরিনি, গ্রিস',
                    rating: '4.9',
                    reviews: '3.1k',
                    price_usd: 899,
                    badge: 'Trending',
                    badge_class: 'badge-bg-purple',
                    image_url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=700&q=80'
                },
                {
                    id: 3,
                    name_en: 'Tokyo, Japan',
                    name_bn: 'টোকিও, জাপান',
                    rating: '4.8',
                    reviews: '2.1k',
                    price_usd: 1099,
                    badge: '',
                    image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=700&q=80'
                },
                {
                    id: 4,
                    name_en: 'Maldives',
                    name_bn: 'মালদ্বীপ',
                    rating: '4.9',
                    reviews: '2.8k',
                    price_usd: 1299,
                    badge: '',
                    image_url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=700&q=80'
                },
                {
                    id: 5,
                    name_en: 'Bangkok, Thailand',
                    name_bn: 'ব্যাংকক, থাইল্যান্ড',
                    rating: '4.7',
                    reviews: '1.6k',
                    price_usd: 499,
                    badge: '',
                    image_url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=700&q=80'
                }
            ];
        }
        this.renderDestinations();
    },

    renderDestinations() {
        const container = document.getElementById('destinationsContainer');
        if (!container) return;

        // Take all destinations for full carousel sliding
        const topDests = this.destinations;
        const mockReviews = ['2.4k', '3.1k', '2.1k', '2.8k', '1.6k', '3.8k', '2.9k', '4.5k'];

        container.innerHTML = topDests.map((d, index) => {
            const rawTitle = this.currentLang === 'bn' ? (d.name_bn || d.name_en) : d.name_en;
            const title = rawTitle.replace(' Paradise', '').replace(' স্বর্গ', '');
            const priceStr = this.formatPrice(d.price_usd || 599, d.price_bdt);
            const reviewCount = d.reviews || mockReviews[index] || '2.0k';

            let badgeHtml = '';
            if (index === 0) {
                badgeHtml = `<span class="badge-capsule badge-bg-green">Best Price</span>`;
            } else if (index === 1) {
                badgeHtml = `<span class="badge-capsule badge-bg-purple">Trending</span>`;
            }

            return `
                <div class="destination-tall-card" onclick="window.location.href='destination-details.html?id=${d.id}'" title="Explore ${title}">
                    <img src="${d.image_url}" alt="${title}" class="dest-img-bg" loading="lazy">
                    <div class="dark-bottom-gradient"></div>

                    <div class="dest-card-header">
                        <div>${badgeHtml}</div>
                        <button class="heart-button-circle" title="Save to Wishlist" onclick="event.stopPropagation(); api.addToWishlist({ destination_id: ${d.id} }).then(() => app.showToast('❤️ Added ${title} to Wishlist!', 'success'))">♥</button>
                    </div>

                    <div class="dest-card-footer-info">
                        <h3>📍 ${title}</h3>
                        <div class="rating-meta-row">
                            <span style="color:#eab308;">★</span> ${d.rating || '4.8'} (${reviewCount} reviews)
                        </div>
                        <div class="price-tag-row" style="display:flex; justify-content:space-between; align-items:center;">
                            <div><span>From</span> ${priceStr}</div>
                            <button class="btn-search-blue-pill" style="padding:5px 14px; font-size:0.75rem; border-radius:20px; box-shadow:none;" onclick="event.stopPropagation(); app.openBookingModal(${d.id})">
                                ${this.currentLang === 'bn' ? 'বুক করুন' : 'Book'} ➔
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // 3. Load Featured Packages (Hostinger MySQL)
    async loadPackages() {
        try {
            const res = await api.getPackages();
            if (res && res.success && res.data && res.data.length > 0) {
                this.packages = res.data;
                this.renderPackages();
                return;
            }
        } catch (e) {
            console.error('Error fetching live packages:', e);
        }

        // High quality fallback
        this.packages = [
            {
                id: 1,
                destination_id: 1,
                title_en: 'Bali Adventure',
                title_bn: 'বালি অ্যাডভেঞ্চার',
                duration_days: 5,
                included_services: 'Flight + Hotel + Tour',
                price_usd: 699,
                destination_image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=700&q=80'
            },
            {
                id: 2,
                destination_id: 6,
                title_en: 'Dubai Luxury',
                title_bn: 'দুবাই লাক্সারি',
                duration_days: 6,
                included_services: 'Flight + Hotel + Tour',
                price_usd: 999,
                destination_image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=700&q=80'
            },
            {
                id: 3,
                destination_id: 5,
                title_en: 'Thailand Getaway',
                title_bn: 'থাইল্যান্ড গেটওয়ে',
                duration_days: 5,
                included_services: 'Flight + Hotel + Tour',
                price_usd: 599,
                destination_image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=700&q=80'
            },
            {
                id: 4,
                destination_id: 7,
                title_en: 'Europe Discovery',
                title_bn: 'ইউরোপ ডিসকভারি',
                duration_days: 10,
                included_services: 'Flight + Hotel + Tour',
                price_usd: 1499,
                destination_image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=700&q=80'
            }
        ];
        this.renderPackages();
    },

    renderPackages() {
        const container = document.getElementById('packagesContainer');
        if (!container) return;

        container.innerHTML = this.packages.map(p => {
            const title = this.currentLang === 'bn' ? (p.title_bn || p.title_en) : p.title_en;
            const priceStr = this.formatPrice(p.price_usd || 699, p.price_bdt);
            const duration = p.duration_days ? `${p.duration_days} Days` : (p.duration || '5 Days');
            const img = p.destination_image || p.image || 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=700&q=80';
            const tags = p.included_services || p.tags || 'Flight + Hotel + Tour';
            const destId = p.destination_id || 1;

            let topBadges = '';
            if (p.id === 1) {
                topBadges = `
                    <span class="badge-package-top badge-package-blue" style="left:12px;">Popular</span>
                    <span class="badge-package-top badge-bg-green" style="left:76px;">Best Price</span>
                `;
            } else if (p.id === 2) {
                topBadges = `<span class="badge-package-top badge-bg-green" style="left:12px;">Luxury</span>`;
            } else if (p.id === 3) {
                topBadges = `<span class="badge-package-top badge-bg-green" style="left:12px;">Best Value</span>`;
            } else {
                topBadges = `<span class="badge-package-top badge-package-blue" style="left:12px;">Exclusive</span>`;
            }

            return `
                <div class="single-package-card">
                    <div class="package-thumb-wrap">
                        <img src="${img}" alt="${title}" loading="lazy">
                        ${topBadges}
                        <button class="heart-package-top" title="Save to Wishlist" onclick="event.stopPropagation(); api.addToWishlist({ package_id: ${p.id} }).then(() => app.showToast('❤️ Saved ' + '${title}' + ' to Wishlist!', 'success'))">♥</button>
                    </div>
                    <div class="package-body-content">
                        <h3>${title}</h3>
                        <div class="package-meta-item">
                            <span>⏱️ ${duration}</span>
                        </div>
                        <div class="package-meta-item">
                            <span>✈️ ${tags}</span>
                        </div>
                        <div class="package-card-bottom">
                            <div class="package-price-bold">${priceStr}</div>
                            <button class="btn-view-details-outline" onclick="location.href='booking.html?pkgId=${p.id}&destId=${destId}&dest=${encodeURIComponent(title)}&total=${p.price_usd || 699}'">
                                Book Now ➔
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // 4. Hero Search
    handleHeroSearch() {
        const input = document.getElementById('heroDestinationInput');
        const query = input ? input.value.trim() : '';
        if (query) {
            this.loadDestinations({ search: query });
        } else {
            this.loadDestinations();
        }
        const target = document.getElementById('destinations');
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    },

    slidePrev() {
        const el = document.getElementById('destinationsContainer');
        if (el) el.scrollBy({ left: -320, behavior: 'smooth' });
    },
    slideNext() {
        const el = document.getElementById('destinationsContainer');
        if (el) el.scrollBy({ left: 320, behavior: 'smooth' });
    },
    slidePackagesPrev() {
        const el = document.getElementById('packagesContainer');
        if (el) el.scrollBy({ left: -320, behavior: 'smooth' });
    },
    slidePackagesNext() {
        const el = document.getElementById('packagesContainer');
        if (el) el.scrollBy({ left: 320, behavior: 'smooth' });
    },
    slideReviewsPrev() {
        const el = document.getElementById('reviewsContainer') || document.querySelector('.testimonials-three-grid');
        if (el) el.scrollBy({ left: -320, behavior: 'smooth' });
    },
    slideReviewsNext() {
        const el = document.getElementById('reviewsContainer') || document.querySelector('.testimonials-three-grid');
        if (el) el.scrollBy({ left: 320, behavior: 'smooth' });
    },

    toggleNotifications(e) {
        if (e) e.stopPropagation();
        const dd = document.getElementById('notificationsDropdown');
        if (dd) dd.classList.toggle('active');
        const userDd = document.getElementById('userDropdownMenu');
        if (userDd) userDd.classList.remove('active');
    },

    openStoryVideoModal() {
        const m = document.getElementById('storyVideoModal');
        if (m) m.classList.add('active');
    },
    closeStoryVideoModal() {
        const m = document.getElementById('storyVideoModal');
        if (m) m.classList.remove('active');
    },

    openTermsModal() {
        let m = document.getElementById('termsModal');
        if (!m) {
            const div = document.createElement('div');
            div.id = 'termsModal';
            div.className = 'modal-overlay';
            div.innerHTML = `
                <div class="modal-box-card" style="max-width: 600px; padding: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0;">📜 Terms & Conditions</h3>
                        <button class="modal-close-cross" onclick="app.closeTermsModal()">&times;</button>
                    </div>
                    <div style="max-height: 340px; overflow-y: auto; font-size: 0.85rem; color: #475569; line-height: 1.7; padding-right: 8px;">
                        <h4 style="color: #0f172a; margin: 8px 0 4px;">1. Booking & Reservation Policy</h4>
                        <p>All package and custom trip reservations made through TravelUp Global are subject to real-time confirmation. Rates include applicable taxes and designated included services.</p>
                        <h4 style="color: #0f172a; margin: 12px 0 4px;">2. Cancellation & Refund Policy</h4>
                        <p>Travelers may request cancellation through their Traveler Portal up to 7 days prior to departure for eligible refunds according to vendor partner terms.</p>
                        <h4 style="color: #0f172a; margin: 12px 0 4px;">3. Identity & Travel Documentation</h4>
                        <p>Travelers are responsible for holding valid passports (minimum 6 months validity) and required visas for destination countries.</p>
                    </div>
                    <div style="margin-top: 16px; text-align: right;">
                        <button class="btn-login-signup-pill" onclick="app.closeTermsModal()">I Understand</button>
                    </div>
                </div>
            `;
            document.body.appendChild(div);
            m = div;
        }
        m.classList.add('active');
    },
    closeTermsModal() {
        const m = document.getElementById('termsModal');
        if (m) m.classList.remove('active');
    },

    openPrivacyModal() {
        let m = document.getElementById('privacyModal');
        if (!m) {
            const div = document.createElement('div');
            div.id = 'privacyModal';
            div.className = 'modal-overlay';
            div.innerHTML = `
                <div class="modal-box-card" style="max-width: 600px; padding: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0;">🛡️ Privacy & Data Security</h3>
                        <button class="modal-close-cross" onclick="app.closePrivacyModal()">&times;</button>
                    </div>
                    <div style="max-height: 340px; overflow-y: auto; font-size: 0.85rem; color: #475569; line-height: 1.7; padding-right: 8px;">
                        <h4 style="color: #0f172a; margin: 8px 0 4px;">1. Information Collection & Usage</h4>
                        <p>TravelUp Global collects user information strictly for account authentication, itinerary generation, reservation processing, and personalized travel recommendations.</p>
                        <h4 style="color: #0f172a; margin: 12px 0 4px;">2. Encryption & Financial Security</h4>
                        <p>All transactions processed via Stripe, PayPal, and SSLCommerz use bank-grade 256-bit SSL encryption. We never store raw payment card credentials on our servers.</p>
                        <h4 style="color: #0f172a; margin: 12px 0 4px;">3. Third-Party Sharing</h4>
                        <p>Personal data is strictly never sold or leased to third parties. Only essential reservation details are communicated to verified airlines and hotel partners.</p>
                    </div>
                    <div style="margin-top: 16px; text-align: right;">
                        <button class="btn-login-signup-pill" onclick="app.closePrivacyModal()">Accept & Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(div);
            m = div;
        }
        m.classList.add('active');
    },
    closePrivacyModal() {
        const m = document.getElementById('privacyModal');
        if (m) m.classList.remove('active');
    },

    // 5. Booking Modal
    openBookingModal(destId) {
        if (!auth.isLoggedIn()) {
            alert(this.currentLang === 'bn' ? 'বুকিং করতে প্রথমে লগইন করুন।' : 'Please login first to reserve a trip.');
            auth.openModal('login');
            return;
        }

        const dest = this.destinations.find(d => d.id === destId) || this.destinations[0];
        this.activeDestinationForBooking = dest;

        const modal = document.getElementById('bookingModal');
        const modalDestName = document.getElementById('bookingDestName');
        const priceDisplay = document.getElementById('bookingPriceDisplay');

        const title = this.currentLang === 'bn' ? (dest.name_bn || dest.name_en) : dest.name_en;
        modalDestName.innerText = `Book: ${title}`;
        priceDisplay.innerText = `$${Math.round(dest.price_usd)} per traveler`;

        modal.classList.add('active');
    },

    closeBookingModal() {
        const modal = document.getElementById('bookingModal');
        if (modal) modal.classList.remove('active');
    },

    // 6. Smart Budget Modal
    openBudgetModal() {
        document.getElementById('budgetModal').classList.add('active');
    },

    async handleBudgetCalculation() {
        const budget = document.getElementById('modalBudgetAmount').value;
        const days = document.getElementById('modalBudgetDays').value;

        const res = await api.calculateBudget({ budget_bdt: budget, days, travelers: 2 });
        const resultArea = document.getElementById('modalBudgetResult');

        if (res.success) {
            const b = res.summary.breakdown;
            resultArea.style.display = 'block';
            resultArea.innerHTML = `
                <h4 style="font-size:0.95rem; font-weight:800; color:#0f172a; margin-bottom:10px;">
                    💰 Budget Allocation Plan (BDT ৳${parseInt(budget).toLocaleString()}):
                </h4>
                <div style="font-size:0.85rem; line-height:1.8;">
                    🏨 <strong>Stay & Hotel (35%):</strong> ৳${b.accommodation.amount.toLocaleString()}<br>
                    🍽️ <strong>Food & Dining (25%):</strong> ৳${b.food.amount.toLocaleString()}<br>
                    🚗 <strong>Transport & Tours (25%):</strong> ৳${b.activities.amount.toLocaleString()}<br>
                    🛡️ <strong>Buffer & Shopping (15%):</strong> ৳${b.emergency.amount.toLocaleString()}
                </div>
            `;
        }
    },

    // 7. Travel Quiz
    openQuizModal() {
        const vibe = prompt('What is your ideal travel vibe?\n1. Beach (Bali / Santorini)\n2. Mountain (Swiss Alps / Sajek)\n3. City (Tokyo / Dubai)', 'Beach');
        if (vibe) {
            const match = vibe.toLowerCase().includes('mountain') ? 'Sajek Valley or Swiss Alps' :
                          vibe.toLowerCase().includes('city') ? 'Tokyo or Dubai' : 'Bali or Santorini';
            alert(`🎮 Quiz Result:\nYour travel personality matches best with: ${match}! 🏖️`);
        }
    },

    // 8. Nearby Attractions / Interactive Map Modal
    openMapModal() {
        const mapModal = document.getElementById('mapModal');
        mapModal.classList.add('active');
        setTimeout(() => {
            if (typeof initLeafletMap === 'function') {
                initLeafletMap(this.destinations);
            }
        }, 200);
    },

    // 9. AI Assistant
    openAiModal() {
        document.getElementById('aiModal').classList.add('active');
    },

    async handleAiPrompt() {
        const input = document.getElementById('aiPromptInput');
        const chatBox = document.getElementById('aiChatBox');
        const text = input.value.trim();
        if (!text) return;

        chatBox.innerHTML += `
            <div style="background:#f1f5f9; padding:8px 12px; border-radius:10px; margin-bottom:8px; text-align:right;">
                <strong>You:</strong> ${text}
            </div>
        `;
        input.value = '';

        const res = await api.askAssistant({ prompt: text });
        if (res.success) {
            const reply = this.currentLang === 'bn' ? res.reply_bn : res.reply_en;
            chatBox.innerHTML += `
                <div style="background:#eff6ff; color:#1e40af; padding:10px 12px; border-radius:10px; margin-bottom:8px;">
                    <strong>TravelUp AI:</strong><br>${reply.replace(/\n/g, '<br>')}
                </div>
            `;
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    },

    bindEvents() {
        const bookingForm = document.getElementById('bookingFormSubmit');
        if (bookingForm) {
            bookingForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const startDate = document.getElementById('bookingStartDate').value;
                const count = document.getElementById('bookingTravelersCount').value;
                const isGroup = document.getElementById('bookingIsGroup').checked;

                const res = await api.createBooking({
                    destination_id: this.activeDestinationForBooking ? this.activeDestinationForBooking.id : 1,
                    start_date: startDate,
                    travelers_count: count,
                    currency: 'USD',
                    is_group: isGroup
                });

                if (res.success) {
                    this.closeBookingModal();
                    alert(`🎉 Booking Confirmed!\nBooking Code: ${res.booking.booking_ref}\nTotal: $${res.booking.total_price}`);
                } else {
                    alert(res.message || 'Booking failed.');
                }
            });
        }
    },

    // 10. Contact & Lead Modal
    openContactModal() {
        let modal = document.getElementById('contactModal');
        if (!modal) {
            const div = document.createElement('div');
            div.id = 'contactModal';
            div.className = 'modal-overlay';
            div.innerHTML = `
                <div class="modal-box-card" style="max-width: 500px;">
                    <button class="modal-close-cross" onclick="app.closeContactModal()">&times;</button>
                    <h3 style="font-size:1.3rem; font-weight:800; color:#0f172a; margin-bottom:6px;">📬 Contact Us & Trip Inquiries</h3>
                    <p style="font-size:0.85rem; color:#64748b; margin-bottom:16px;">Have questions or want custom travel consulting? Send us a message and our specialists will respond promptly.</p>
                    <form onsubmit="app.handleContactSubmit(event)">
                        <div style="margin-bottom:12px;">
                            <label style="display:block; font-size:0.75rem; font-weight:700; margin-bottom:4px;">Full Name *</label>
                            <input type="text" id="contactModalName" required placeholder="Your Name" style="width:100%; padding:9px 12px; border:1px solid #cbd5e1; border-radius:10px;">
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
                            <div>
                                <label style="display:block; font-size:0.75rem; font-weight:700; margin-bottom:4px;">Email *</label>
                                <input type="email" id="contactModalEmail" required placeholder="you@example.com" style="width:100%; padding:9px 12px; border:1px solid #cbd5e1; border-radius:10px;">
                            </div>
                            <div>
                                <label style="display:block; font-size:0.75rem; font-weight:700; margin-bottom:4px;">Phone / WhatsApp</label>
                                <input type="tel" id="contactModalPhone" placeholder="+8801700000000" style="width:100%; padding:9px 12px; border:1px solid #cbd5e1; border-radius:10px;">
                            </div>
                        </div>
                        <div style="margin-bottom:12px;">
                            <label style="display:block; font-size:0.75rem; font-weight:700; margin-bottom:4px;">Destination of Interest</label>
                            <input type="text" id="contactModalDest" placeholder="e.g. Bali, Tokyo, Santorini..." style="width:100%; padding:9px 12px; border:1px solid #cbd5e1; border-radius:10px;">
                        </div>
                        <div style="margin-bottom:16px;">
                            <label style="display:block; font-size:0.75rem; font-weight:700; margin-bottom:4px;">Message / Inquiry *</label>
                            <textarea id="contactModalMsg" required rows="3" placeholder="Tell us how we can help you..." style="width:100%; padding:9px 12px; border:1px solid #cbd5e1; border-radius:10px; resize:vertical;"></textarea>
                        </div>
                        <button type="submit" id="contactModalSubmitBtn" class="btn-login-signup-pill" style="width:100%;">Send Message ➔</button>
                        <div id="contactModalStatus" style="margin-top:10px; text-align:center; font-size:0.85rem; font-weight:600;"></div>
                    </form>
                </div>
            `;
            document.body.appendChild(div);
            modal = div;
        }

        if (window.auth && auth.user) {
            const nameEl = document.getElementById('contactModalName');
            const emailEl = document.getElementById('contactModalEmail');
            const phoneEl = document.getElementById('contactModalPhone');
            if (nameEl && !nameEl.value) nameEl.value = auth.user.name || '';
            if (emailEl && !emailEl.value) emailEl.value = auth.user.email || '';
            if (phoneEl && !phoneEl.value) phoneEl.value = auth.user.phone || '';
        }

        modal.classList.add('active');
    },

    closeContactModal() {
        const modal = document.getElementById('contactModal');
        if (modal) modal.classList.remove('active');
    },

    async handleContactSubmit(e) {
        e.preventDefault();
        const btn = document.getElementById('contactModalSubmitBtn');
        const statusEl = document.getElementById('contactModalStatus');
        btn.disabled = true;
        btn.innerText = 'Sending to database...';

        const payload = {
            name: document.getElementById('contactModalName').value,
            email: document.getElementById('contactModalEmail').value,
            phone: document.getElementById('contactModalPhone').value,
            destination_interest: document.getElementById('contactModalDest').value,
            notes: document.getElementById('contactModalMsg').value,
            source: 'contact_form'
        };

        try {
            const res = await api.createLead(payload);
            if (res && res.success) {
                statusEl.style.color = '#16a34a';
                statusEl.innerText = '✅ ' + res.message;
                setTimeout(() => {
                    app.closeContactModal();
                    btn.disabled = false;
                    btn.innerText = 'Send Message ➔';
                    statusEl.innerText = '';
                }, 2000);
            } else {
                statusEl.style.color = '#dc2626';
                statusEl.innerText = '❌ ' + (res.message || 'Failed to send.');
                btn.disabled = false;
                btn.innerText = 'Send Message ➔';
            }
        } catch (err) {
            statusEl.style.color = '#dc2626';
            statusEl.innerText = '❌ Network error.';
            btn.disabled = false;
            btn.innerText = 'Send Message ➔';
        }
    },

    // 12. Universal Mobile Navigation System (Public Site & Traveler Portal)
    initMobileNav() {
        // A. Setup Public Header Mobile Menu Button & Drawer
        const nav = document.querySelector('.top-navbar');
        if (nav) {
            const cluster = nav.querySelector('.nav-right-cluster');
            if (cluster && !document.getElementById('publicMobileMenuBtn')) {
                const btn = document.createElement('button');
                btn.id = 'publicMobileMenuBtn';
                btn.className = 'public-mobile-menu-btn';
                btn.title = 'Open Menu';
                btn.setAttribute('aria-label', 'Open Navigation Menu');
                btn.innerHTML = `
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                `;
                btn.onclick = (e) => {
                    e.stopPropagation();
                    this.togglePublicMobileDrawer();
                };
                cluster.appendChild(btn);
            }

            // Create Drawer and Overlay if not already existing
            if (!document.getElementById('publicMobileDrawer')) {
                const backdrop = document.createElement('div');
                backdrop.id = 'publicMobileDrawerOverlay';
                backdrop.className = 'public-drawer-overlay';
                backdrop.onclick = () => this.closePublicMobileDrawer();

                const drawer = document.createElement('div');
                drawer.id = 'publicMobileDrawer';
                drawer.className = 'public-mobile-drawer';

                const isLogged = typeof auth !== 'undefined' && auth.isLoggedIn && auth.isLoggedIn();
                const user = (typeof auth !== 'undefined' && auth.user) ? auth.user : null;
                const userName = user ? (user.name || 'Traveler') : '';
                const userRole = user ? (user.role || 'user') : '';
                const roleBadge = userRole === 'superadmin' ? '🛡️ Super Admin' : (userRole === 'admin' ? '⭐ Admin' : '✈️ Traveler');

                drawer.innerHTML = `
                    <div class="mobile-drawer-header">
                        <a href="index.html" class="nav-brand-logo" style="text-decoration: none;">
                            <div class="brand-icon-box" style="width: 32px; height: 32px; font-size: 1.1rem;">✈️</div>
                            <div class="brand-title-wrap">
                                <h1 style="font-size: 1.05rem;">TravelUp Global</h1>
                                <p style="font-size: 0.58rem;">Explore • Plan • Travel</p>
                            </div>
                        </a>
                        <button class="mobile-drawer-close" onclick="app.closePublicMobileDrawer()" title="Close Menu">&times;</button>
                    </div>

                    <div class="mobile-drawer-user-box" id="mobileDrawerUserBox">
                        ${isLogged ? `
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 42px; height: 42px; border-radius: 50%; background: #eff6ff; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; border: 2px solid #2563eb;">👤</div>
                                <div>
                                    <h4 style="margin: 0; font-size: 0.95rem; font-weight: 800; color: #0f172a;">${userName}</h4>
                                    <span style="font-size: 0.72rem; color: #2563eb; font-weight: 700;">${roleBadge}</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
                                <a href="dashboard.html" class="mobile-drawer-user-action">Dashboard</a>
                                <a href="my-trips.html" class="mobile-drawer-user-action">My Trips</a>
                                ${['superadmin', 'admin', 'manager', 'accountant', 'support'].includes(userRole) ? `<a href="admin.html" class="mobile-drawer-user-action" style="background:#eff6ff; color:#2563eb; border-color:#93c5fd;">Admin SaaS</a>` : ''}
                            </div>
                        ` : `
                            <p style="margin: 0 0 10px 0; font-size: 0.82rem; color: #64748b;">Sign in to view your trips, vouchers, and personalized bookings.</p>
                            <div style="display: flex; gap: 10px;">
                                <button class="btn-login-signup-pill" style="flex: 1; text-align: center; padding: 9px;" onclick="app.closePublicMobileDrawer(); if(typeof auth !== 'undefined') auth.openModal('login');">Log In</button>
                                <button class="btn-login-signup-pill" style="flex: 1; text-align: center; padding: 9px; background: #ffffff; color: #2563eb; border: 1.5px solid #2563eb;" onclick="app.closePublicMobileDrawer(); if(typeof auth !== 'undefined') auth.openModal('signup');">Sign Up</button>
                            </div>
                        `}
                    </div>

                    <div class="mobile-drawer-nav-list">
                        <a href="index.html" class="drawer-nav-item"><span>🏠</span> Home</a>
                        <a href="destinations.html" class="drawer-nav-item"><span>📍</span> Destinations</a>
                        <a href="packages.html" class="drawer-nav-item"><span>✈️</span> Packages</a>
                        <div class="drawer-section-label">Plan & AI Tools</div>
                        <a href="trip-builder.html" class="drawer-nav-item"><span>🛠️</span> Custom Trip Builder</a>
                        <a href="itinerary.html" class="drawer-nav-item"><span>🗺️</span> Day-wise Itinerary</a>
                        <a href="ai-planner.html" class="drawer-nav-item"><span>🤖</span> AI Trip Planner</a>
                        <a href="budget-planner.html" class="drawer-nav-item"><span>📊</span> Budget Planner</a>
                        <a href="group-travel.html" class="drawer-nav-item"><span>👥</span> Group Travel Savings</a>
                        <div class="drawer-section-label">Community & Insights</div>
                        <a href="reviews.html" class="drawer-nav-item"><span>⭐</span> Traveler Reviews</a>
                        <a href="community.html" class="drawer-nav-item"><span>💬</span> Travel Stories</a>
                        <a href="quiz.html" class="drawer-nav-item"><span>🎮</span> Travel Quiz</a>
                        <a href="support.html" class="drawer-nav-item"><span>🎧</span> 24/7 Support</a>
                    </div>

                    <div class="mobile-drawer-footer">
                        <div style="display: flex; gap: 8px; justify-content: space-between; margin-bottom: 12px;">
                            <button class="mobile-drawer-pill-btn" onclick="app.toggleLanguage()">🌐 <span id="mobileDrawerLang">${this.currentLang === 'en' ? 'English (EN)' : 'বাংলা (বাং)'}</span></button>
                            <button class="mobile-drawer-pill-btn" onclick="app.toggleCurrency()">💵 <span id="mobileDrawerCurr">${this.currentCurrency}</span></button>
                        </div>
                        <a href="wishlist.html" class="drawer-nav-item" style="border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0;">
                            <span>❤️</span> View Wishlist
                        </a>
                        ${isLogged ? `
                            <button onclick="app.closePublicMobileDrawer(); if(typeof auth !== 'undefined') auth.logout();" style="width: 100%; margin-top: 10px; padding: 10px; background: #fee2e2; color: #dc2626; border: none; border-radius: 12px; font-weight: 700; font-size: 0.85rem; cursor: pointer;">
                                🚪 Sign Out
                            </button>
                        ` : ''}
                    </div>
                `;

                document.body.appendChild(backdrop);
                document.body.appendChild(drawer);
            }
        }

        // B. Setup Portal Sidebar Backdrop Overlay
        if (document.querySelector('.dash-sidebar') && !document.getElementById('portalSidebarOverlay')) {
            const ov = document.createElement('div');
            ov.id = 'portalSidebarOverlay';
            ov.className = 'portal-sidebar-overlay';
            ov.onclick = () => this.closePortalSidebar();
            document.body.appendChild(ov);
        }
    },

    togglePublicMobileDrawer() {
        const d = document.getElementById('publicMobileDrawer');
        const ov = document.getElementById('publicMobileDrawerOverlay');
        if (d && ov) {
            d.classList.toggle('active');
            ov.classList.toggle('active');
            document.body.style.overflow = d.classList.contains('active') ? 'hidden' : '';
        }
    },

    closePublicMobileDrawer() {
        const d = document.getElementById('publicMobileDrawer');
        const ov = document.getElementById('publicMobileDrawerOverlay');
        if (d) d.classList.remove('active');
        if (ov) ov.classList.remove('active');
        document.body.style.overflow = '';
    },

    togglePortalSidebar() {
        const sb = document.querySelector('.dash-sidebar');
        const ov = document.getElementById('portalSidebarOverlay');
        if (sb) {
            sb.classList.toggle('mobile-open');
            if (ov) {
                ov.classList.toggle('active', sb.classList.contains('mobile-open'));
            }
            document.body.style.overflow = sb.classList.contains('mobile-open') ? 'hidden' : '';
        }
    },

    closePortalSidebar() {
        const sb = document.querySelector('.dash-sidebar');
        const ov = document.getElementById('portalSidebarOverlay');
        if (sb) sb.classList.remove('mobile-open');
        if (ov) ov.classList.remove('active');
        document.body.style.overflow = '';
    },

    updateMobileDrawerUser() {
        const box = document.getElementById('mobileDrawerUserBox');
        if (!box) return;
        const isLogged = typeof auth !== 'undefined' && auth.isLoggedIn && auth.isLoggedIn();
        const user = (typeof auth !== 'undefined' && auth.user) ? auth.user : null;
        const userName = user ? (user.name || 'Traveler') : '';
        const userRole = user ? (user.role || 'user') : '';
        const roleBadge = userRole === 'superadmin' ? '🛡️ Super Admin' : (userRole === 'admin' ? '⭐ Admin' : '✈️ Traveler');

        if (isLogged) {
            box.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 42px; height: 42px; border-radius: 50%; background: #eff6ff; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; border: 2px solid #2563eb;">👤</div>
                    <div>
                        <h4 style="margin: 0; font-size: 0.95rem; font-weight: 800; color: #0f172a;">${userName}</h4>
                        <span style="font-size: 0.72rem; color: #2563eb; font-weight: 700;">${roleBadge}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
                    <a href="dashboard.html" class="mobile-drawer-user-action">Dashboard</a>
                    <a href="my-trips.html" class="mobile-drawer-user-action">My Trips</a>
                    ${['superadmin', 'admin', 'manager', 'accountant', 'support'].includes(userRole) ? `<a href="admin.html" class="mobile-drawer-user-action" style="background:#eff6ff; color:#2563eb; border-color:#93c5fd;">Admin SaaS</a>` : ''}
                </div>
            `;
        } else {
            box.innerHTML = `
                <p style="margin: 0 0 10px 0; font-size: 0.82rem; color: #64748b;">Sign in to view your trips, vouchers, and personalized bookings.</p>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-login-signup-pill" style="flex: 1; text-align: center; padding: 9px;" onclick="app.closePublicMobileDrawer(); if(typeof auth !== 'undefined') auth.openModal('login');">Log In</button>
                    <button class="btn-login-signup-pill" style="flex: 1; text-align: center; padding: 9px; background: #ffffff; color: #2563eb; border: 1.5px solid #2563eb;" onclick="app.closePublicMobileDrawer(); if(typeof auth !== 'undefined') auth.openModal('signup');">Sign Up</button>
                </div>
            `;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
    // Auto-close portal and mobile drawer when clicking outside
    document.addEventListener('click', (e) => {
        const sb = document.querySelector('.dash-sidebar');
        if (sb && sb.classList.contains('mobile-open')) {
            if (!sb.contains(e.target) && !e.target.closest('.mobile-menu-toggle-btn') && !e.target.closest('.portal-menu-btn')) {
                app.closePortalSidebar();
            }
        }
    });
});

