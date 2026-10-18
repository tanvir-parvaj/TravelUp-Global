/**
 * TravelUp Global - Centralized Authentication & Dual Portal Session Management
 * Enforces Strict Isolation between Traveler Portal and Admin/Staff Portal
 */
const auth = {
    user: null,
    STAFF_ROLES: ['admin', 'superadmin', 'manager', 'accountant', 'support', 'moderator'],

    init() {
        const savedUser = localStorage.getItem('travelup_user');
        if (savedUser) {
            try {
                this.user = JSON.parse(savedUser);
            } catch (e) {
                this.user = null;
            }
        }
        this.renderNav();
        this.renderPortalSidebar();
        this.bindEvents();
    },

    getCurrentUser() {
        if (!this.user) {
            const savedUser = localStorage.getItem('travelup_user');
            if (savedUser) {
                try { this.user = JSON.parse(savedUser); } catch(e) {}
            }
        }
        return this.user;
    },

    renderPortalSidebar() {
        const u = this.getCurrentUser();
        if (!u) {
            document.querySelectorAll('#dashSidebarName, #dashUserName, #bannerProfileName').forEach(el => {
                el.textContent = 'Traveler';
            });
            document.querySelectorAll('#dashSidebarRole, #dashUserRole').forEach(el => {
                el.textContent = 'Traveler';
                el.style.color = '#2563eb';
            });
            return;
        }

        const name = u.name || u.full_name || 'Traveler';
        const role = this.getRoleLabel(u.role);
        const avatar = u.avatar_url || u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
        const roleColor = this.getRoleColor(u.role);

        // Sidebar user name
        document.querySelectorAll('#dashSidebarName, #dashUserName, #bannerProfileName, #voucherCustomerName, #modalTravelerName').forEach(el => {
            el.textContent = name;
        });

        // Sidebar role
        document.querySelectorAll('#dashSidebarRole, #dashUserRole').forEach(el => {
            el.textContent = role;
            if (roleColor) el.style.color = roleColor;
        });

        // Avatars across sidebar, topbar, and profile
        document.querySelectorAll('#dashSidebarAvatar, #dashUserAvatar, #dashTopAvatar, #topbarAvatar, #mainProfileAvatar').forEach(el => {
            el.src = avatar;
        });

        // Greeting name
        const firstName = name.split(' ')[0];
        document.querySelectorAll('#dashGreetingName').forEach(el => {
            el.textContent = firstName;
        });
    },

    get token() {
        return localStorage.getItem('travelup_token');
    },

    isLoggedIn() {
        return !!localStorage.getItem('travelup_token') && !!this.user;
    },

    isStaff() {
        return this.isLoggedIn() && this.STAFF_ROLES.includes(this.user.role);
    },

    isTraveler() {
        return this.isLoggedIn() && (this.user.role === 'customer' || this.user.role === 'traveler');
    },

    getRoleLabel(role) {
        switch (role) {
            case 'superadmin':
            case 'admin': return '👑 Super Admin';
            case 'manager': return '💼 Operations Manager';
            case 'accountant': return '💳 Senior Accountant';
            case 'support': return '🎧 Support Specialist';
            case 'moderator': return '✍️ Content Moderator';
            default: return 'Traveler';
        }
    },

    getRoleColor(role) {
        switch (role) {
            case 'superadmin':
            case 'admin': return '#2563eb';
            case 'manager': return '#7c3aed';
            case 'accountant': return '#0891b2';
            case 'support': return '#ea580c';
            case 'moderator': return '#15803d';
            default: return '#2563eb';
        }
    },

    // Guard for Admin / Staff Portal pages (admin.html)
    requireStaff() {
        if (!this.isLoggedIn()) {
            const redirectUrl = encodeURIComponent(window.location.pathname.split('/').pop() || 'admin.html');
            window.location.href = `login.html?redirect=${redirectUrl}&required=staff`;
            return false;
        }

        if (!this.isStaff()) {
            alert('⛔ Access Denied:\nThe Admin & Staff Portal is restricted to authorized platform personnel (Super Admin, Operations Manager, Senior Accountant, Support Specialist, Content Moderator).\n\nYou will now be redirected to your Traveler Dashboard.');
            window.location.href = 'dashboard.html';
            return false;
        }

        return true;
    },

    // Guard for Traveler Portal pages (dashboard.html, bookings.html, my-trips.html, wishlist.html, profile.html)
    requireTraveler() {
        if (!this.isLoggedIn()) {
            const current = encodeURIComponent(window.location.pathname.split('/').pop() || 'dashboard.html');
            window.location.href = `login.html?redirect=${current}`;
            return false;
        }
        return true;
    },

    saveSession(token, user) {
        localStorage.setItem('travelup_token', token);
        localStorage.setItem('travelup_user', JSON.stringify(user));
        this.user = user;
        this.renderNav();
        this.renderPortalSidebar();
    },

    logout() {
        localStorage.removeItem('travelup_token');
        localStorage.removeItem('travelup_user');
        this.user = null;
        this.renderNav();
        
        if (typeof window.showCustomModal === 'function') {
            window.showCustomModal({
                title: 'Logged Out Successfully',
                message: 'You have been safely signed out of your TravelUp Global session.',
                icon: '🚪',
                confirmText: 'Return to Homepage',
                onConfirm: () => {
                    window.location.href = 'index.html';
                }
            });
        } else {
            window.location.href = 'index.html';
        }
    },

    toggleProfileDropdown(e) {
        if (e) e.stopPropagation();
        const menu = document.getElementById('userDropdownMenu');
        if (menu) {
            menu.classList.toggle('active');
        }
    },

    closeProfileDropdown() {
        const menu = document.getElementById('userDropdownMenu');
        if (menu) {
            menu.classList.remove('active');
        }
    },

    renderNav() {
        // Hide separate Log In / Sign Up buttons across all pages
        document.querySelectorAll('.auth-buttons-wrap').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.logged-out-only').forEach(el => el.style.display = 'none');

        // Always show the unified user profile / account wrap
        const userWraps = document.querySelectorAll('.user-profile-header-wrap');
        userWraps.forEach(el => el.style.display = 'flex');

        const triggers = document.querySelectorAll('.profile-header-dropdown-trigger');
        const menu = document.getElementById('userDropdownMenu');
        const isPortalPage = /dashboard\.html|my-trips\.html|bookings\.html|quotations\.html|portal-|support\.html|profile\.html|trip-builder\.html/.test(window.location.pathname);

        if (this.isLoggedIn()) {
            const avatarUrl = this.user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
            const roleTitle = this.getRoleLabel(this.user.role);
            const roleColor = this.getRoleColor(this.user.role);
            const isStaff = this.isStaff();

            triggers.forEach(trigger => {
                trigger.title = `${this.user.name || 'Account'} (${roleTitle}) — Click for account options`;
                trigger.innerHTML = `
                    <div class="nav-user-avatar-circle" style="width: 38px; height: 38px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                        <img src="${avatarUrl}" alt="${this.user.name || 'User'}" class="dash-top-avatar header-profile-avatar" id="dashTopAvatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                    </div>
                `;
            });

            if (menu) {
                const navLinksHtml = isPortalPage ? `
                    <div style="padding: 2px 0;">
                        <a href="profile.html" class="user-dropdown-item" style="padding: 8px 10px; border-radius: 10px;">
                            <span>👤</span> <span>Profile & Settings</span>
                        </a>
                        ${isStaff ? `
                        <a href="admin.html" class="user-dropdown-item" style="padding: 8px 10px; border-radius: 10px; color: #2563eb; font-weight: 700;">
                            <span>👑</span> <span>Admin & Staff Portal</span>
                        </a>` : ''}
                    </div>
                ` : `
                    <!-- Direct Portal Launcher -->
                    <div style="margin-bottom: 6px;">
                        ${isStaff ? `
                            <a href="admin.html" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; border-radius: 12px; font-weight: 700; font-size: 0.86rem; text-decoration: none; box-shadow: 0 4px 14px rgba(37,99,235,0.26); transition: all 0.2s;">
                                <span style="display: flex; align-items: center; gap: 8px;">
                                    <span>⚙️</span>
                                    <span style="color: #ffffff;">Admin Control Portal</span>
                                </span>
                                <span style="font-size: 0.95rem; color: #ffffff;">➔</span>
                            </a>
                            <a href="dashboard.html" class="user-dropdown-item" style="font-size: 0.82rem; margin-top: 6px; color: #475569; padding: 7px 10px;">
                                <span>🎒</span> <span>Traveler Portal Preview</span>
                            </a>
                        ` : `
                            <a href="dashboard.html" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; border-radius: 12px; font-weight: 700; font-size: 0.86rem; text-decoration: none; box-shadow: 0 4px 14px rgba(37,99,235,0.26); transition: all 0.2s;">
                                <span style="display: flex; align-items: center; gap: 8px;">
                                    <span>📊</span>
                                    <span style="color: #ffffff;">Enter My Dashboard</span>
                                </span>
                                <span style="font-size: 0.95rem; color: #ffffff;">➔</span>
                            </a>
                        `}
                    </div>

                    <div class="dropdown-divider" style="margin: 4px 0 6px 0;"></div>

                    <!-- Account Profile & Security -->
                    <div style="padding: 2px 0;">
                        <a href="profile.html" class="user-dropdown-item" style="padding: 8px 10px; border-radius: 10px;">
                            <span>👤</span> <span>Profile & Settings</span>
                        </a>
                    </div>
                `;

                menu.innerHTML = `
                    <!-- User Identity Badge -->
                    <div style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${avatarUrl}" alt="${this.user.name || 'User'}" 
                                 style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2.5px solid ${roleColor}; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                            <div style="min-width: 0; flex: 1;">
                                <div style="font-weight: 800; font-size: 0.92rem; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;">
                                    ${this.user.name || 'Traveler'}
                                </div>
                                <div style="font-size: 0.72rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">
                                    ${this.user.email || ''}
                                </div>
                                <div style="margin-top: 4px;">
                                    <span style="display: inline-block; font-weight: 700; font-size: 0.68rem; color: ${roleColor}; background: ${roleColor}16; padding: 2px 8px; border-radius: 6px; letter-spacing: 0.2px;">
                                        ${roleTitle}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    ${navLinksHtml}

                    <div class="dropdown-divider" style="margin: 4px 0 6px 0;"></div>

                    <!-- Sign Out -->
                    <div style="padding: 2px 0;">
                        <button class="user-dropdown-item logout-btn" onclick="auth.logout()" style="color: #e11d48; width: 100%; border: none; background: transparent; cursor: pointer; padding: 8px 10px; border-radius: 10px; display: flex; align-items: center; gap: 8px; font-weight: 700;">
                            <span>🚪</span> <span>Sign Out</span>
                        </button>
                    </div>
                `;
            }
        } else if (isPortalPage) {
            // Portal page demo / fallback user
            const fallbackAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
            triggers.forEach(trigger => {
                trigger.title = 'Traveler Account — Click for options';
                trigger.innerHTML = `
                    <div class="nav-user-avatar-circle" style="width: 38px; height: 38px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                        <img src="${fallbackAvatar}" alt="Traveler" class="dash-top-avatar header-profile-avatar" id="dashTopAvatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                    </div>
                `;
            });

            if (menu) {
                menu.innerHTML = `
                    <div style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${fallbackAvatar}" alt="Traveler" 
                                 style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2.5px solid #2563eb; flex-shrink: 0;">
                            <div style="min-width: 0; flex: 1;">
                                <div style="font-weight: 800; font-size: 0.92rem; color: #0f172a;">Traveler</div>
                                <div style="font-size: 0.72rem; color: #64748b;">traveler@travelup.com</div>
                                <span style="display: inline-block; font-weight: 700; font-size: 0.68rem; color: #2563eb; background: #eff6ff; padding: 2px 8px; border-radius: 6px; margin-top: 4px;">Traveler</span>
                            </div>
                        </div>
                    </div>
                    <div style="padding: 2px 0;">
                        <a href="profile.html" class="user-dropdown-item" style="padding: 8px 10px; border-radius: 10px;">
                            <span>👤</span> <span>Profile & Settings</span>
                        </a>
                    </div>
                    <div class="dropdown-divider" style="margin: 4px 0 6px 0;"></div>
                    <div style="padding: 2px 0;">
                        <button class="user-dropdown-item logout-btn" onclick="auth.logout()" style="color: #e11d48; width: 100%; border: none; background: transparent; cursor: pointer; padding: 8px 10px; border-radius: 10px; display: flex; align-items: center; gap: 8px; font-weight: 700;">
                            <span>🚪</span> <span>Sign Out</span>
                        </button>
                    </div>
                `;
            }
        } else {
            triggers.forEach(trigger => {
                trigger.title = 'Account & Sign In';
                trigger.innerHTML = `
                    <div class="nav-user-avatar-circle">
                        <span style="font-size: 1.15rem;">👤</span>
                    </div>
                `;
            });

            if (menu) {
                menu.innerHTML = `
                    <div style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 8px;">
                        <div style="font-weight: 800; font-size: 0.92rem; color: #0f172a;">Welcome to TravelUp</div>
                        <div style="font-size: 0.74rem; color: #64748b; margin-top: 2px;">Sign in to customize & book trips</div>
                    </div>
                    <div style="padding: 4px 0; display: flex; flex-direction: column; gap: 6px;">
                        <a href="login.html" class="user-dropdown-item" style="font-weight: 800; color: #2563eb; padding: 8px 10px; border-radius: 10px; background: #eff6ff;">
                            <span style="font-size: 1.1rem;">🔑</span> <span>Log In</span>
                        </a>
                        <a href="signup.html" class="user-dropdown-item" style="font-weight: 800; color: #ffffff !important; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 10px; padding: 8px 10px; box-shadow: 0 4px 12px rgba(37,99,235,0.22);">
                            <span style="font-size: 1.1rem;">📝</span> <span style="color: #ffffff;">Sign Up Free</span>
                        </a>
                    </div>
                    <div class="dropdown-divider" style="margin: 6px 0;"></div>
                    <div style="padding: 2px 0;">
                        <a href="dashboard.html" class="user-dropdown-item" style="font-size: 0.84rem; color: #334155; padding: 7px 10px;">
                            <span>🎒</span> <span>Traveler Portal</span>
                        </a>
                        <a href="admin.html" class="user-dropdown-item" style="font-size: 0.84rem; color: #334155; padding: 7px 10px;">
                            <span>💼</span> <span>Agency & Staff Portal</span>
                        </a>
                        <a href="javascript:void(0)" onclick="if(window.app) app.openContactModal(); auth.closeProfileDropdown();" class="user-dropdown-item" style="font-size: 0.84rem; color: #64748b; padding: 7px 10px;">
                            <span>💬</span> <span>Help Center & Inquiries</span>
                        </a>
                    </div>
                `;
            }
        }

        // Keep mobile drawer user state in sync with auth state
        if (typeof window !== 'undefined' && window.app && typeof window.app.updateMobileDrawerUser === 'function') {
            window.app.updateMobileDrawerUser();
        }
    },

    bindEvents() {
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const wraps = document.querySelectorAll('.user-profile-header-wrap');
            let clickedInside = false;
            wraps.forEach(wrap => {
                if (wrap.contains(e.target)) clickedInside = true;
            });
            if (!clickedInside) {
                this.closeProfileDropdown();
                const notif = document.getElementById('notificationsDropdown');
                if (notif) notif.classList.remove('active');
            }
        });

        // Close dropdown on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeProfileDropdown();
                const notif = document.getElementById('notificationsDropdown');
                if (notif) notif.classList.remove('active');
            }
        });
    }
};

/**
 * Global Designed Popup & Modal System (Replaces native browser alert())
 */
window.showCustomModal = function(options) {
    if (typeof options === 'string') {
        options = { message: options };
    }
    const {
        title = '',
        message = '',
        icon = '',
        confirmText = 'OK',
        cancelText = '',
        onConfirm = null,
        onCancel = null
    } = options || {};

    let backdrop = document.getElementById('globalCustomModalBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'globalCustomModalBackdrop';
        backdrop.className = 'custom-modal-backdrop';
        backdrop.innerHTML = `
            <div class="custom-modal-card">
                <div class="custom-modal-icon-wrap" id="customModalIcon">🔔</div>
                <h3 class="custom-modal-title" id="customModalTitle">Notification</h3>
                <div class="custom-modal-body" id="customModalBody"></div>
                <div class="custom-modal-actions" id="customModalActions">
                    <button class="custom-modal-btn-primary" id="customModalConfirmBtn">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(backdrop);
    }

    const iconEl = document.getElementById('customModalIcon');
    const titleEl = document.getElementById('customModalTitle');
    const bodyEl = document.getElementById('customModalBody');
    const actionsEl = document.getElementById('customModalActions');

    // Auto-detect icon & title if not provided
    let finalIcon = icon;
    let finalTitle = title;
    const lowerMsg = (message + ' ' + title).toLowerCase();

    if (!finalIcon) {
        if (lowerMsg.includes('logged out') || lowerMsg.includes('sign out')) finalIcon = '🚪';
        else if (lowerMsg.includes('success') || lowerMsg.includes('confirmed') || lowerMsg.includes('saved')) finalIcon = '✅';
        else if (lowerMsg.includes('error') || lowerMsg.includes('failed') || lowerMsg.includes('denied')) finalIcon = '⛔';
        else if (lowerMsg.includes('discount') || lowerMsg.includes('deal') || lowerMsg.includes('offer')) finalIcon = '🎉';
        else if (lowerMsg.includes('ticket') || lowerMsg.includes('support')) finalIcon = '💬';
        else if (lowerMsg.includes('quiz')) finalIcon = '🧭';
        else finalIcon = '🔔';
    }

    if (!finalTitle) {
        if (lowerMsg.includes('logged out') || lowerMsg.includes('sign out')) finalTitle = 'Signed Out';
        else if (lowerMsg.includes('success') || lowerMsg.includes('confirmed') || lowerMsg.includes('saved')) finalTitle = 'Success';
        else if (lowerMsg.includes('error') || lowerMsg.includes('failed')) finalTitle = 'Notice';
        else if (lowerMsg.includes('access denied')) finalTitle = 'Access Denied';
        else finalTitle = 'TravelUp Global';
    }

    iconEl.textContent = finalIcon;
    titleEl.textContent = finalTitle;
    bodyEl.innerHTML = message.replace(/\n/g, '<br>');

    // Build action buttons
    actionsEl.innerHTML = '';
    if (cancelText) {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'custom-modal-btn-secondary';
        cancelBtn.textContent = cancelText;
        cancelBtn.onclick = () => {
            closeModal();
            if (onCancel) onCancel();
        };
        actionsEl.appendChild(cancelBtn);
    }

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'custom-modal-btn-primary';
    confirmBtn.textContent = confirmText;
    confirmBtn.onclick = () => {
        closeModal();
        if (onConfirm) onConfirm();
    };
    actionsEl.appendChild(confirmBtn);

    function closeModal() {
        backdrop.classList.remove('active');
        document.removeEventListener('keydown', keyHandler);
    }

    function keyHandler(e) {
        if (e.key === 'Escape' || e.key === 'Enter') {
            closeModal();
            if (onConfirm) onConfirm();
        }
    }

    backdrop.onclick = (e) => {
        if (e.target === backdrop) {
            closeModal();
            if (onConfirm) onConfirm();
        }
    };

    document.addEventListener('keydown', keyHandler);
    setTimeout(() => {
        backdrop.classList.add('active');
        confirmBtn.focus();
    }, 10);
};

window.showToast = function(message, type = 'info', icon = '') {
    let container = document.getElementById('customToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'customToastContainer';
        document.body.appendChild(container);
    }

    let finalIcon = icon;
    if (!finalIcon) {
        if (type === 'success') finalIcon = '✅';
        else if (type === 'error') finalIcon = '⚠️';
        else if (type === 'logout') finalIcon = '🚪';
        else finalIcon = '🔔';
    }

    const toast = document.createElement('div');
    toast.className = 'custom-toast-item';
    toast.innerHTML = `
        <div class="custom-toast-icon">${finalIcon}</div>
        <div class="custom-toast-text">${message}</div>
        <button class="custom-toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3800);
};

// Global interceptor for alert()
window.alert = function(msg) {
    window.showCustomModal(msg);
};

if (!window.app) window.app = {};
if (!window.app.toggleNotifications) {
    window.app.toggleNotifications = function(e) {
        if (e) e.stopPropagation();
        const dd = document.getElementById('notificationsDropdown');
        if (dd) dd.classList.toggle('active');
        const userDd = document.getElementById('userDropdownMenu');
        if (userDd) userDd.classList.remove('active');
    };
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => auth.init());
} else {
    auth.init();
}

