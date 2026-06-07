/**
 * main.js - Shared functionality for the Ben Boyette website
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Theme
    initTheme();

    // 2. Load Navbar
    loadNavbar();

    // 3. Track Page Views (with daily granularity for heatmap)
    trackPageViews();

    // 4. Inject Command Palette
    injectCommandPalette();

    // 5. Inject Dark Mode Toggle
    injectDarkModeToggle();
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function injectDarkModeToggle() {
    const btn = document.createElement('button');
    btn.id = 'dark-mode-toggle';
    btn.title = 'Toggle dark mode';
    btn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
    btn.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 2000;
        background: var(--cream);
        border: 1px solid var(--rule);
        border-radius: 50%;
        width: 36px;
        height: 36px;
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: border-color 0.15s;
    `;

    btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        btn.textContent = next === 'dark' ? '☀️' : '🌙';
    });

    document.body.appendChild(btn);
}

async function loadNavbar() {
    const navbarContainer = document.getElementById('navbar');
    if (!navbarContainer) return;

    const isPersonal = window.location.pathname.includes('/personal/');
    const navbarPath = isPersonal ? '/assets/includes/navbar-personal.html' : '/assets/includes/navbar-professional.html';

    try {
        const response = await fetch(navbarPath);
        const html = await response.text();
        navbarContainer.innerHTML = html;
        highlightActiveLink();
    } catch (error) {
        console.error('Error loading navbar:', error);
    }
}

function highlightActiveLink() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.navbar a');

    links.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (currentPath === linkPath || (currentPath === '/' && linkPath === '/index.html')) {
            link.classList.add('active');
            link.style.color = 'var(--text-main)';
            link.style.fontWeight = '600';
        }
    });
}

function trackPageViews() {
    try {
        const page = window.location.pathname;
        const views = JSON.parse(localStorage.getItem("views") || "{}");
        views[page] = (views[page] || 0) + 1;
        localStorage.setItem("views", JSON.stringify(views));

        const today = new Date().toISOString().slice(0, 10);
        const daily = JSON.parse(localStorage.getItem("dailyViews") || "{}");
        daily[today] = (daily[today] || 0) + 1;
        localStorage.setItem("dailyViews", JSON.stringify(daily));
    } catch (e) {
        console.warn('LocalStorage not available for view tracking');
    }
}

// =============================================
//  COMMAND PALETTE  (Ctrl+K / Cmd+K)
// =============================================
function injectCommandPalette() {
    const pages = [
        { name: 'Home', url: '/index.html', desc: 'Main landing page' },
        { name: 'About', url: '/professional/about.html', desc: 'Background & timeline' },
        { name: 'Engineering', url: '/professional/engineering.html', desc: 'Projects & portfolio' },
        { name: 'Calculator', url: '/professional/calculator.html', desc: 'Scientific calculator & graphing' },
        { name: 'Code Comparer', url: '/professional/code-diff-tool.html', desc: 'File comparison utility' },
        { name: 'Notes', url: '/professional/notes.html', desc: 'Digital garden' },
        { name: 'Sports', url: '/personal/sports.html', desc: 'Teams & athletics' },
        { name: 'Training', url: '/personal/training.html', desc: 'Fitness & performance' },
        { name: 'Music', url: '/personal/music.html', desc: 'Personal playlist' },
        { name: 'Stats', url: '/personal/stats.html', desc: 'Analytics dashboard' },
        { name: 'Workout Builder', url: '/personal/workout-plan-builder.html', desc: 'Custom workout plans' },
    ];

    const overlay = document.createElement('div');
    overlay.id = 'cmd-palette';
    overlay.className = 'cmd-overlay';
    overlay.innerHTML = `
        <div class="cmd-box">
            <input type="text" id="cmd-input" placeholder="Search pages… (↑↓ to navigate, Enter to go)" autocomplete="off" />
            <div id="cmd-results" class="cmd-results"></div>
            <div class="cmd-footer">
                <span>↑↓ Navigate</span><span>↵ Open</span><span>Esc Close</span>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const input = document.getElementById('cmd-input');
    const results = document.getElementById('cmd-results');
    let selectedIdx = 0;
    let filtered = [...pages];

    function render() {
        results.innerHTML = filtered.map((p, i) =>
            `<div class="cmd-item ${i === selectedIdx ? 'selected' : ''}" data-url="${p.url}">
                <strong>${p.name}</strong><span>${p.desc}</span>
            </div>`
        ).join('');

        results.querySelectorAll('.cmd-item').forEach((el, i) => {
            el.addEventListener('click', () => { window.location.href = filtered[i].url; });
            el.addEventListener('mouseenter', () => { selectedIdx = i; render(); });
        });
    }

    function open() {
        overlay.classList.add('visible');
        input.value = '';
        filtered = [...pages];
        selectedIdx = 0;
        render();
        setTimeout(() => input.focus(), 50);
    }

    function close() {
        overlay.classList.remove('visible');
    }

    input.addEventListener('input', () => {
        const q = input.value.toLowerCase();
        filtered = pages.filter(p => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
        selectedIdx = 0;
        render();
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = Math.min(filtered.length - 1, selectedIdx + 1); render(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx = Math.max(0, selectedIdx - 1); render(); }
        else if (e.key === 'Enter' && filtered[selectedIdx]) { window.location.href = filtered[selectedIdx].url; }
        else if (e.key === 'Escape') { close(); }
    });

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            overlay.classList.contains('visible') ? close() : open();
        }
    });
}