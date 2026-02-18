/**
 * main.js - Shared functionality for the Ben Boyette website
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Theme
    initTheme();

    // 2. Load Navbar
    loadNavbar();

    // 3. Track Page Views
    trackPageViews();
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
}

async function loadNavbar() {
    const navbarContainer = document.getElementById('navbar');
    if (!navbarContainer) return;

    // Determine which navbar to load based on path
    const isPersonal = window.location.pathname.includes('/personal/');
    const navbarPath = isPersonal ? '/assets/includes/navbar-personal.html' : '/assets/includes/navbar-professional.html';

    try {
        const response = await fetch(navbarPath);
        const html = await response.text();
        navbarContainer.innerHTML = html;

        // Highlight active link
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
    } catch (e) {
        console.warn('LocalStorage not available for view tracking');
    }
}

// Inject Dark Mode Toggle if not present
if (!document.getElementById('dark-mode-toggle')) {
    fetch('/assets/includes/darkmode.html')
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML('afterbegin', html);
        })
        .catch(err => console.error('Error loading dark mode toggle:', err));
}
