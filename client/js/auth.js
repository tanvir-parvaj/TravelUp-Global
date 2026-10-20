/**
 * TravelUp Global - Unified Authentication & Navigation State Manager
 */
const Auth = {
    getUser() {
        try {
            const adminUser = localStorage.getItem('travelup_admin_user');
            if (adminUser) return JSON.parse(adminUser);
            const user = localStorage.getItem('travelup_user');
            return user ? JSON.parse(user) : null;
        } catch {
            return null;
        }
    },

    setUser(user, token) {
        if (user) {
            localStorage.setItem('travelup_user', JSON.stringify(user));
            if (['admin', 'manager', 'accountant', 'support', 'moderator', 'uploader'].includes(user.role)) {
                localStorage.setItem('travelup_admin_user', JSON.stringify(user));
            }
        }
        if (token) {
            localStorage.setItem('travelup_token', token);
            if (['admin', 'manager', 'accountant', 'support', 'moderator', 'uploader'].includes(user?.role)) {
                localStorage.setItem('travelup_admin_token', token);
            }
        }
        this.updateNavUI();
    },

    logout() {
        localStorage.removeItem('travelup_user');
        localStorage.removeItem('travelup_token');
        localStorage.removeItem('travelup_admin_token');
        localStorage.removeItem('travelup_admin_user');
        window.location.href = 'index.html';
    },

    isLoggedIn() {
        return !!(localStorage.getItem('travelup_token') || localStorage.getItem('travelup_admin_token'));
    },

    isAdmin() {
        const user = this.getUser();
        if (!user) return false;
        const emailLower = (user.email || '').toLowerCase();
        if (emailLower.includes('admin') || emailLower.includes('tanvir') || emailLower === 'papelali809@gmail.com') return true;
        const roleLower = (user.role || '').toLowerCase();
        return roleLower === 'admin' || roleLower === 'superadmin';
    },

    isStaff() {
        const user = this.getUser();
        if (!user) return false;
        const emailLower = (user.email || '').toLowerCase();
        if (emailLower.includes('admin') || emailLower.includes('tanvir') || emailLower === 'papelali809@gmail.com') return true;
        const roleLower = (user.role || '').toLowerCase();
        return ['admin', 'superadmin', 'manager', 'accountant', 'support', 'moderator', 'uploader'].includes(roleLower);
    },

    toggleDropdown(e) {
        if (e) e.stopPropagation();
        const menu = document.getElementById('nav-user-dropdown-menu');
        if (menu) {
            menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
        }
    },

    updateNavUI() {
        const authContainer = document.getElementById('nav-auth-slot');
        if (!authContainer) return;

        // Ensure dropdown CSS styles exist in document
        if (!document.getElementById('travelup-nav-auth-styles')) {
            const style = document.createElement('style');
            style.id = 'travelup-nav-auth-styles';
            style.textContent = `
                .nav-login-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.45rem 1.15rem;
                    border: 1px solid #0284c7;
                    color: #0284c7;
                    background: transparent;
                    border-radius: 9999px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                .nav-login-btn:hover {
                    background: #f0f9ff;
                    border-color: #0369a1;
                    color: #0369a1;
                }
                .nav-profile-pill-wrap {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .nav-profile-trigger {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2px;
                    border: 2px solid #e2e8f0;
                    background: #ffffff;
                    border-radius: 50%;
                    cursor: pointer;
                    user-select: none;
                    transition: all 0.2s ease;
                    outline: none;
                }
                .nav-profile-trigger:hover {
                    border-color: #0284c7;
                    box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
                    transform: scale(1.04);
                }
                .nav-user-avatar {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    object-fit: cover;
                    display: block;
                }
                .nav-user-dropdown {
                    display: none;
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    width: 230px;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
                    padding: 0.6rem 0;
                    z-index: 99999;
                    animation: navDropFade 0.15s ease-out;
                }
                @keyframes navDropFade {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .nav-dropdown-header {
                    padding: 0.5rem 1rem 0.75rem;
                    border-bottom: 1px solid #f1f5f9;
                }
                .nav-dropdown-title {
                    font-size: 0.875rem;
                    font-weight: 800;
                    color: #0f172a;
                }
                .nav-dropdown-role {
                    display: inline-block;
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    padding: 0.15rem 0.5rem;
                    border-radius: 9999px;
                    background: #e0f2fe;
                    color: #0369a1;
                    margin-top: 0.25rem;
                }
                .nav-dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 0.65rem;
                    padding: 0.65rem 1rem;
                    color: #334155;
                    font-size: 0.85rem;
                    font-weight: 600;
                    text-decoration: none;
                    cursor: pointer;
                    transition: all 0.15s;
                    border: none;
                    background: transparent;
                    width: 100%;
                    text-align: left;
                }
                .nav-dropdown-item:hover {
                    background: #f8fafc;
                    color: #0284c7;
                }
                .nav-dropdown-item.danger:hover {
                    background: #fee2e2;
                    color: #dc2626;
                }
                .nav-dropdown-item i {
                    font-size: 1.15rem;
                    color: #64748b;
                }
                .nav-dropdown-item.danger i {
                    color: #ef4444;
                }
            `;
            document.head.appendChild(style);

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                const menu = document.getElementById('nav-user-dropdown-menu');
                if (menu) menu.style.display = 'none';
            });
        }

        const user = this.getUser();

        if (user) {
            const avatarUrl = user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
            const isStaffUser = this.isStaff();
            const roleTitle = (user.role || 'traveler').replace('_', ' ').toUpperCase();

            authContainer.innerHTML = `
                <div class="nav-profile-pill-wrap">
                    <button type="button" class="nav-profile-trigger" onclick="Auth.toggleDropdown(event)" title="${user.name} (${roleTitle})">
                        <img src="${avatarUrl}" alt="${user.name}" class="nav-user-avatar" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'">
                    </button>

                    <div class="nav-user-dropdown" id="nav-user-dropdown-menu" onclick="event.stopPropagation()">
                        <div class="nav-dropdown-header">
                            <div class="nav-dropdown-title">${user.name}</div>
                            <span class="nav-dropdown-role">${roleTitle}</span>
                        </div>
                        <a href="profile.html" class="nav-dropdown-item">
                            <i class="material-icons">person</i>
                            <span>My Profile</span>
                        </a>
                        ${isStaffUser ? `
                            <a href="admin.html" class="nav-dropdown-item" style="color: #0284c7;">
                                <i class="material-icons" style="color: #0284c7;">admin_panel_settings</i>
                                <span>Operations Portal</span>
                            </a>
                        ` : ''}
                        <div style="border-top: 1px solid #f1f5f9; margin: 0.35rem 0;"></div>
                        <button type="button" class="nav-dropdown-item danger" onclick="Auth.logout()">
                            <i class="material-icons">logout</i>
                            <span>Log Out</span>
                        </button>
                    </div>
                </div>
            `;
        } else {
            // When logged out, show ONLY the clean profile/login icon button (NO Admin Portal button!)
            authContainer.innerHTML = `
                <a href="login.html" class="nav-login-btn">
                    <i class="material-icons" style="font-size: 18px;">account_circle</i>
                    <span>Log In</span>
                </a>
            `;
        }
    }
};

window.Auth = Auth;
document.addEventListener('DOMContentLoaded', () => {
    Auth.updateNavUI();
});
