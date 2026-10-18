/**
 * ====================================================================
 * TravelUp Global — Public Site Shell Controller (shell.js)
 * Manages Unified Navigation, Dropdown Interactions, Mobile Drawer,
 * Language Switching (EN/BN), and Universal Footer Synchronization.
 * ====================================================================
 */

(function () {
    'use strict';

    const Shell = {
        currentLang: localStorage.getItem('travelup_lang') || 'en',

        translations: {
            en: {
                home: 'Home',
                destinations: 'Destinations',
                tours: 'Tours & Packages',
                buildTrip: 'Build My Trip',
                transport: 'Transport',
                stays: 'Stays',
                experiences: 'Experiences',
                safety: 'Safety & Help',
                login: 'Log In',
                signup: 'Get Started'
            },
            bn: {
                home: 'হোম',
                destinations: 'গন্তব্যসমূহ',
                tours: 'ট্যুর প্যাকেজ',
                buildTrip: 'ট্রিপ প্ল্যানার',
                transport: 'পরিবহন',
                stays: 'হোটেল ও রিসোর্ট',
                experiences: 'অভিজ্ঞতা',
                safety: 'নিরাপত্তা ও সহায়তা',
                login: 'লগইন',
                signup: 'শুরু করুন'
            }
        },

        init() {
            this.renderHeader();
            this.renderFooter();
            this.setupEventHandlers();
            this.highlightActivePage();
        },

        getHeaderHTML() {
            return `
            <div class="sys-alert-banner" id="global-sys-alert" style="display:none;">
                <span class="alert-tag">WEATHER ADVISORY</span>
                <span id="global-sys-alert-msg">Maritime Cautionary Signal No. 3 issued for Bay of Bengal. All trawlers suspended.</span>
            </div>
            <header class="site-header">
                <div class="container navbar-inner">
                    <div class="nav-left">
                        <a href="index.html" class="brand-logo-link">
                            <img src="images/logo.png" alt="TravelUp Global" class="brand-logo-img">
                        </a>
                        <ul class="nav-menu" id="primary-nav-menu">
                            <li class="nav-item">
                                <a href="index.html" class="nav-link" data-nav="home">Home</a>
                            </li>
                            <li class="nav-item">
                                <a href="tour-packages.html" class="nav-link" data-nav="destinations">
                                    <span>Destinations</span>
                                    <i class="material-icons arrow-icon">expand_more</i>
                                </a>
                                <ul class="dropdown-menu">
                                    <li><a href="tour-packages.html?cat=beach" class="dropdown-item"><i class="material-icons">beach_access</i> Cox's Bazar & Saint Martin</a></li>
                                    <li><a href="tour-packages.html?cat=hills" class="dropdown-item"><i class="material-icons">terrain</i> Sajek Valley & Bandarban</a></li>
                                    <li><a href="tour-packages.html?cat=tea" class="dropdown-item"><i class="material-icons">eco</i> Sreemangal Tea Trails</a></li>
                                    <li><a href="tour-packages.html?cat=border" class="dropdown-item"><i class="material-icons">flag</i> Tetulia & Jaflong Borders</a></li>
                                    <li class="dropdown-divider"></li>
                                    <li><a href="tour-packages.html" class="dropdown-item"><i class="material-icons">explore</i> All Destinations</a></li>
                                </ul>
                            </li>
                            <li class="nav-item">
                                <a href="tour-packages.html" class="nav-link" data-nav="packages">Tours & Packages</a>
                            </li>
                            <li class="nav-item">
                                <a href="travel-planner.html" class="nav-link" data-nav="transport">
                                    <span>Transport</span>
                                    <i class="material-icons arrow-icon">expand_more</i>
                                </a>
                                <ul class="dropdown-menu">
                                    <li><a href="travel-planner.html#transit-section" class="dropdown-item"><i class="material-icons">directions_bus</i> Bus Coaches & Live Seats</a></li>
                                    <li><a href="travel-planner.html#transit-section" class="dropdown-item"><i class="material-icons">train</i> Train Bogie & 2x2 Matrix</a></li>
                                    <li><a href="travel-planner.html#transit-section" class="dropdown-item"><i class="material-icons">flight</i> Domestic Air Routes</a></li>
                                    <li><a href="travel-planner.html#transit-section" class="dropdown-item"><i class="material-icons">directions_car</i> Chander Gari & Private Rentals</a></li>
                                </ul>
                            </li>
                            <li class="nav-item">
                                <a href="travel-planner.html#hotel-section" class="nav-link" data-nav="stays">Stays</a>
                            </li>
                            <li class="nav-item">
                                <a href="travel-planner.html" class="nav-link" data-nav="experiences">
                                    <span>Experiences</span>
                                    <i class="material-icons arrow-icon">expand_more</i>
                                </a>
                                <ul class="dropdown-menu">
                                    <li><a href="travel-planner.html#dining-section" class="dropdown-item"><i class="material-icons">restaurant</i> Inani Live Seafood BBQ</a></li>
                                    <li><a href="travel-planner.html#activity-section" class="dropdown-item"><i class="material-icons">paragliding</i> Parasailing & Scuba Diving</a></li>
                                    <li><a href="travel-planner.html#activity-section" class="dropdown-item"><i class="material-icons">hiking</i> Eco-Trails & Boat Permits</a></li>
                                </ul>
                            </li>
                            <li class="nav-item">
                                <a href="tour-packages.html" class="nav-link" data-nav="safety">
                                    <span>Safety & Help</span>
                                    <i class="material-icons arrow-icon">expand_more</i>
                                </a>
                                <ul class="dropdown-menu">
                                    <li><a href="index.html#scenario-audit" class="dropdown-item"><i class="material-icons">warning</i> Meteorological Signal No. 3 Alert</a></li>
                                    <li><a href="index.html" class="dropdown-item"><i class="material-icons">accessible</i> Wheelchair Accessible Travel</a></li>
                                    <li><a href="travel-planner.html" class="dropdown-item"><i class="material-icons">published_with_changes</i> Automated Refund Matrix</a></li>
                                    <li class="dropdown-divider"></li>
                                    <li><a href="index.html" class="dropdown-item"><i class="material-icons">help_outline</i> FAQ & Support</a></li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    <div class="nav-right">
                        <button type="button" class="lang-toggle" id="shell-lang-btn" title="Switch Language">
                            <i class="material-icons" style="font-size: 14px;">language</i>
                            <span id="shell-lang-label">${this.currentLang === 'en' ? 'বাংলা' : 'EN'}</span>
                        </button>
                        <a href="travel-planner.html" class="btn btn-primary btn-sm" style="display: flex; align-items: center; gap: 6px;">
                            <i class="material-icons" style="font-size: 16px;">tune</i>
                            <span>Build My Trip</span>
                        </a>
                        <div id="nav-auth-slot" style="display: flex; align-items: center; gap: 0.5rem;">
                            <!-- Injected by Auth.updateNavUI() -->
                            <a href="login.html" class="btn btn-outline btn-sm">Log In</a>
                        </div>
                        <button type="button" class="mobile-nav-toggle" id="mobile-nav-toggle-btn" aria-label="Toggle navigation menu">
                            <i class="material-icons">menu</i>
                        </button>
                    </div>
                </div>
            </header>
            `;
        },

        getFooterHTML() {
            return `
            <footer class="site-footer">
                <div class="container">
                    <div class="footer-top">
                        <div class="footer-brand">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                                <img src="images/logo.png" alt="TravelUp Global" style="height: 38px; width: auto; filter: brightness(0) invert(1);">
                            </div>
                            <p>
                                TravelUp Global is a next-generation dynamic tourism platform solving intermodal transit, component-based travel planning, and group fintech split-payments.
                            </p>
                            <div class="academic-badge">
                                <i class="material-icons" style="font-size: 14px;">school</i>
                                <span>DIU CSE Lab Project • Roll 39, 34, 36</span>
                            </div>
                        </div>

                        <div>
                            <h4 class="footer-heading">Destinations</h4>
                            <ul class="footer-links">
                                <li><a href="tour-packages.html?cat=beach">Cox's Bazar Sea Beach</a></li>
                                <li><a href="tour-packages.html?cat=hills">Sajek Valley Cloud Peaks</a></li>
                                <li><a href="tour-packages.html?cat=beach">Saint Martin Coral Island</a></li>
                                <li><a href="tour-packages.html?cat=tea">Sreemangal Tea Gardens</a></li>
                                <li><a href="tour-packages.html?cat=border">Tetulia Himalayan Views</a></li>
                                <li><a href="tour-packages.html?cat=border">Jaflong Zero Point</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 class="footer-heading">Trip Planner</h4>
                            <ul class="footer-links">
                                <li><a href="travel-planner.html">Component PCB Builder</a></li>
                                <li><a href="travel-planner.html#transit-section">Bus Operator & Seats</a></li>
                                <li><a href="travel-planner.html#transit-section">Train Bogie Matrix</a></li>
                                <li><a href="travel-planner.html#hotel-section">Resorts & Bedding</a></li>
                                <li><a href="travel-planner.html">Skip Transport (Self-Drive)</a></li>
                                <li><a href="travel-planner.html">Fintech Group Split-Bill</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 class="footer-heading">Corporate & Policies</h4>
                            <ul class="footer-links">
                                <li><a href="tour-packages.html">Curated Tour Packages</a></li>
                                <li><a href="travel-planner.html">B2B NBR VAT/AIT Quotation</a></li>
                                <li><a href="index.html">Accessible Travel (Ground/Lift)</a></li>
                                <li><a href="index.html">Meteorological Storm Signal 3</a></li>
                                <li><a href="travel-planner.html">Cancellation & Refund Policy</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 class="footer-heading">Academic Defense</h4>
                            <p style="font-size: 0.8rem; color: #94a3b8; line-height: 1.5; margin-bottom: 0.75rem;">
                                Supervised by <strong>Lecturer Sajib Bhattacharjee</strong>, Department of CSE, Dhaka International University.
                            </p>
                            <div style="font-size: 0.75rem; color: #64748b;">
                                Engineering Lead: <strong>Md. Tanvir Parvaj (Roll 39)</strong><br>
                                Co-Authors: <strong>Md. Toufick Hasan (Roll 34)</strong> & <strong>Fahima Suborna (Roll 36)</strong>
                            </div>
                        </div>
                    </div>

                    <div class="footer-bottom">
                        <div>
                            &copy; 2026 TravelUp Global Inc. All rights reserved. Engineering verification of 12 Real-World Scenarios.
                        </div>
                        <div style="display: flex; gap: 1.25rem;">
                            <a href="index.html" style="color: #64748b; font-size: 0.8rem;">Terms of Service</a>
                            <a href="index.html" style="color: #64748b; font-size: 0.8rem;">Privacy Policy</a>
                            <a href="index.html" style="color: #64748b; font-size: 0.8rem;">Hostinger MySQL Sync</a>
                        </div>
                    </div>
                </div>
            </footer>
            `;
        },

        renderHeader() {
            const slot = document.getElementById('site-header-slot');
            if (slot) {
                slot.innerHTML = this.getHeaderHTML();
            }
        },

        renderFooter() {
            const slot = document.getElementById('site-footer-slot');
            if (slot) {
                slot.innerHTML = this.getFooterHTML();
            }
        },

        setupEventHandlers() {
            // Mobile Menu Toggle
            const toggleBtn = document.getElementById('mobile-nav-toggle-btn');
            const menu = document.getElementById('primary-nav-menu');
            if (toggleBtn && menu) {
                toggleBtn.addEventListener('click', () => {
                    menu.classList.toggle('open');
                });
            }

            // Mobile Dropdown Click Expansion
            document.querySelectorAll('.nav-item').forEach(item => {
                const link = item.querySelector('.nav-link');
                const dropdown = item.querySelector('.dropdown-menu');
                if (dropdown && link) {
                    link.addEventListener('click', (e) => {
                        if (window.innerWidth <= 768) {
                            e.preventDefault();
                            item.classList.toggle('open');
                        }
                    });
                }
            });

            // Language Toggle
            const langBtn = document.getElementById('shell-lang-btn');
            if (langBtn) {
                langBtn.addEventListener('click', () => {
                    this.currentLang = this.currentLang === 'en' ? 'bn' : 'en';
                    localStorage.setItem('travelup_lang', this.currentLang);
                    const label = document.getElementById('shell-lang-label');
                    if (label) label.textContent = this.currentLang === 'en' ? 'বাংলা' : 'EN';
                });
            }

            // Sync with Auth.js if available
            if (window.Auth && typeof window.Auth.updateNavUI === 'function') {
                window.Auth.updateNavUI();
            }
        },

        highlightActivePage() {
            const path = window.location.pathname;
            const links = document.querySelectorAll('.nav-link');
            links.forEach(l => {
                const href = l.getAttribute('href');
                if (href && path.includes(href) && href !== 'index.html') {
                    l.classList.add('active');
                } else if ((path.endsWith('/') || path.endsWith('index.html')) && href === 'index.html') {
                    l.classList.add('active');
                }
            });
        }
    };

    window.Shell = Shell;
    document.addEventListener('DOMContentLoaded', () => {
        Shell.init();
    });
})();
