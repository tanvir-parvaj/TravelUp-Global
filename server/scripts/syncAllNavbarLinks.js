const fs = require('fs');
const path = require('path');

function updateFile(relPath, replacerFn) {
    const fullPath = path.join(__dirname, '../../', relPath);
    if (!fs.existsSync(fullPath)) return;
    const content = fs.readFileSync(fullPath, 'utf8');
    const updated = replacerFn(content);
    if (content !== updated) {
        fs.writeFileSync(fullPath, updated, 'utf8');
        console.log(`✓ Updated navigation links in ${relPath}`);
    } else {
        console.log(`- No changes needed in ${relPath}`);
    }
}

// 1. Update index.html
updateFile('client/index.html', content => {
    // Replace nav links & actions
    let res = content.replace(
        /<ul class="nav-links">[\s\S]*?<\/ul>\s*<div class="nav-actions" id="nav-auth-slot">[\s\S]*?<\/div>/i,
        `<ul class="nav-links">
                <li><a href="index.html" class="active">Home</a></li>
                <li><a href="travel-planner.html">Travel (যাতায়াত)</a></li>
                <li><a href="trip-planner.html">Tour Planner (ট্যুর)</a></li>
                <li><a href="tour-packages.html">Tour Packages</a></li>
            </ul>
            <div class="nav-actions" id="nav-auth-slot" style="display: flex; align-items: center; gap: 0.75rem;">
                <a href="admin.html" class="btn-nav-outline" style="border-color: #0284c7; color: #0284c7; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.85rem; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 0.85rem;">
                    <i class="material-icons" style="font-size: 16px;">admin_panel_settings</i>
                    <span>Admin Portal</span>
                </a>
                <a href="login.html" class="btn-nav-outline" style="text-decoration: none; padding: 0.4rem 0.85rem; border-radius: 9999px; font-weight: 700; font-size: 0.85rem;">Log In</a>
            </div>`
    );

    // Update search tabs to clearly highlight Travel and Tour
    res = res.replace(
        /<div class="search-tabs-row">[\s\S]*?<\/div>/i,
        `<div class="search-tabs-row">
                    <button type="button" class="tab-btn active" id="tab-custom" onclick="selectSearchTab('custom')">
                        <i class="material-icons" style="font-size: 16px;">tune</i> Tour Planner (ট্যুর)
                    </button>
                    <button type="button" class="tab-btn" id="tab-flight" onclick="selectSearchTab('flight')">
                        <i class="material-icons" style="font-size: 16px;">directions_bus</i> Travel & Transit (যাতায়াত)
                    </button>
                    <button type="button" class="tab-btn" id="tab-packages" onclick="selectSearchTab('packages')">
                        <i class="material-icons" style="font-size: 16px;">luggage</i> Tour Packages (প্যাকেজ)
                    </button>
                </div>`
    );

    return res;
});

// 2. Update travel-planner.html
updateFile('client/travel-planner.html', content => {
    return content.replace(
        /<ul class="nav-links">[\s\S]*?<\/ul>\s*<div class="nav-actions" id="nav-auth-slot">[\s\S]*?<\/div>/i,
        `<ul class="nav-links">
                <li><a href="index.html">Home</a></li>
                <li><a href="travel-planner.html" class="active">Travel (যাতায়াত)</a></li>
                <li><a href="trip-planner.html">Tour Planner (ট্যুর)</a></li>
                <li><a href="tour-packages.html">Tour Packages</a></li>
            </ul>
            <div class="nav-actions" id="nav-auth-slot" style="display: flex; align-items: center; gap: 0.75rem;">
                <a href="admin.html" class="btn-nav-outline" style="border-color: #0284c7; color: #0284c7; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.85rem; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 0.85rem;">
                    <i class="material-icons" style="font-size: 16px;">admin_panel_settings</i>
                    <span>Admin Portal</span>
                </a>
                <a href="login.html" class="btn-nav-outline" style="text-decoration: none; padding: 0.4rem 0.85rem; border-radius: 9999px; font-weight: 700; font-size: 0.85rem;">Log In</a>
            </div>`
    );
});

// 3. Update trip-planner.html
updateFile('client/trip-planner.html', content => {
    let res = content.replace(
        /<ul class="nav-main-menu">[\s\S]*?<\/ul>/i,
        `<ul class="nav-main-menu">
                <li><a href="index.html">Home</a></li>
                <li><a href="travel-planner.html">Travel (যাতায়াত)</a></li>
                <li><a href="trip-planner.html" class="active">Tour Planner (ট্যুর)</a></li>
                <li><a href="tour-packages.html">Tour Packages</a></li>
            </ul>`
    );

    // Add Admin Portal link beside user profile pill if not already present
    if (!res.includes('href="admin.html"')) {
        res = res.replace(
            /<div class="nav-profile-pill"/i,
            `<a href="admin.html" style="text-decoration: none; padding: 0.4rem 0.85rem; border: 1px solid #0284c7; color: #0284c7; border-radius: 9999px; font-size: 0.825rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.35rem; margin-right: 0.25rem;">
                    <i class="material-icons" style="font-size: 16px;">admin_panel_settings</i>
                    <span>Admin Portal</span>
                </a>
                <div class="nav-profile-pill"`
        );
    }
    return res;
});

// 4. Update tour-packages.html
updateFile('client/tour-packages.html', content => {
    return content.replace(
        /<ul class="nav-links">[\s\S]*?<\/ul>\s*<div class="nav-actions" id="nav-auth-slot">[\s\S]*?<\/div>/i,
        `<ul class="nav-links">
                <li><a href="index.html">Home</a></li>
                <li><a href="travel-planner.html">Travel (যাতায়াত)</a></li>
                <li><a href="trip-planner.html">Tour Planner (ট্যুর)</a></li>
                <li><a href="tour-packages.html" class="active">Tour Packages</a></li>
            </ul>
            <div class="nav-actions" id="nav-auth-slot" style="display: flex; align-items: center; gap: 0.75rem;">
                <a href="admin.html" class="btn-nav-outline" style="border-color: #0284c7; color: #0284c7; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.85rem; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 0.85rem;">
                    <i class="material-icons" style="font-size: 16px;">admin_panel_settings</i>
                    <span>Admin Portal</span>
                </a>
                <a href="login.html" class="btn-nav-outline" style="text-decoration: none; padding: 0.4rem 0.85rem; border-radius: 9999px; font-weight: 700; font-size: 0.85rem;">Log In</a>
            </div>`
    );
});

// 5. Update tour-package.html
updateFile('client/tour-package.html', content => {
    return content.replace(
        /<ul class="nav-links">[\s\S]*?<\/ul>\s*<div class="nav-actions" id="nav-auth-slot">[\s\S]*?<\/div>/i,
        `<ul class="nav-links">
                <li><a href="index.html">Home</a></li>
                <li><a href="travel-planner.html">Travel (যাতায়াত)</a></li>
                <li><a href="trip-planner.html">Tour Planner (ট্যুর)</a></li>
                <li><a href="tour-packages.html">Tour Packages</a></li>
            </ul>
            <div class="nav-actions" id="nav-auth-slot" style="display: flex; align-items: center; gap: 0.75rem;">
                <a href="admin.html" class="btn-nav-outline" style="border-color: #0284c7; color: #0284c7; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.85rem; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 0.85rem;">
                    <i class="material-icons" style="font-size: 16px;">admin_panel_settings</i>
                    <span>Admin Portal</span>
                </a>
                <a href="login.html" class="btn-nav-outline" style="text-decoration: none; padding: 0.4rem 0.85rem; border-radius: 9999px; font-weight: 700; font-size: 0.85rem;">Log In</a>
            </div>`
    );
});
