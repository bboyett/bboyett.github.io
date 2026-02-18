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

    // 4. Inject Pomodoro Timer
    injectPomodoro();

    // 5. Inject Command Palette
    injectCommandPalette();
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
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

        // Daily tracking for heatmap
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const daily = JSON.parse(localStorage.getItem("dailyViews") || "{}");
        daily[today] = (daily[today] || 0) + 1;
        localStorage.setItem("dailyViews", JSON.stringify(daily));
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

// =============================================
//  POMODORO TIMER WIDGET
// =============================================
function injectPomodoro() {
    // Restore state from localStorage
    const state = JSON.parse(localStorage.getItem('pomodoroState') || '{}');
    const remaining = state.remaining ?? 25 * 60;
    const running = false; // never auto-resume on page load
    const sessions = state.sessions ?? 0;

    const widget = document.createElement('div');
    widget.id = 'pomodoro-widget';
    widget.innerHTML = `
        <div class="pomo-ring">
            <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="var(--card-border)" stroke-width="4"/>
                <circle id="pomo-progress" cx="50" cy="50" r="44" fill="none" stroke="var(--accent)" stroke-width="4"
                    stroke-dasharray="276.46" stroke-dashoffset="0" stroke-linecap="round"
                    transform="rotate(-90 50 50)" style="transition: stroke-dashoffset 0.5s ease;"/>
            </svg>
            <span id="pomo-time" class="pomo-time">${formatTime(remaining)}</span>
        </div>
        <div class="pomo-controls">
            <button id="pomo-start" title="Start / Pause">▶</button>
            <button id="pomo-reset" title="Reset">↺</button>
        </div>
        <div class="pomo-sessions">${sessions} sessions</div>
        <button id="pomo-collapse" class="pomo-collapse" title="Toggle Timer">⏱</button>
    `;
    document.body.appendChild(widget);

    let timeLeft = remaining;
    let isRunning = running;
    let interval = null;
    let sessionCount = sessions;
    const TOTAL = 25 * 60;

    const timeEl = document.getElementById('pomo-time');
    const progressEl = document.getElementById('pomo-progress');
    const startBtn = document.getElementById('pomo-start');
    const resetBtn = document.getElementById('pomo-reset');
    const collapseBtn = document.getElementById('pomo-collapse');
    const sessionsEl = widget.querySelector('.pomo-sessions');

    function updateDisplay() {
        timeEl.textContent = formatTime(timeLeft);
        const offset = 276.46 * (1 - timeLeft / TOTAL);
        progressEl.setAttribute('stroke-dashoffset', offset);
        sessionsEl.textContent = `${sessionCount} session${sessionCount !== 1 ? 's' : ''}`;
    }

    function saveState() {
        localStorage.setItem('pomodoroState', JSON.stringify({
            remaining: timeLeft, sessions: sessionCount
        }));
    }

    function tick() {
        if (timeLeft <= 0) {
            clearInterval(interval);
            isRunning = false;
            startBtn.textContent = '▶';
            sessionCount++;
            timeLeft = TOTAL;
            updateDisplay();
            saveState();
            // Notification sound via Web Audio API
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const o = ctx.createOscillator(); const g = ctx.createGain();
                o.connect(g); g.connect(ctx.destination);
                o.frequency.value = 880; g.gain.value = 0.3;
                o.start(); o.stop(ctx.currentTime + 0.3);
            } catch (e) { }
            return;
        }
        timeLeft--;
        updateDisplay();
        saveState();
    }

    startBtn.addEventListener('click', () => {
        if (isRunning) {
            clearInterval(interval);
            isRunning = false;
            startBtn.textContent = '▶';
        } else {
            interval = setInterval(tick, 1000);
            isRunning = true;
            startBtn.textContent = '❚❚';
        }
        saveState();
    });

    resetBtn.addEventListener('click', () => {
        clearInterval(interval);
        isRunning = false;
        timeLeft = TOTAL;
        startBtn.textContent = '▶';
        updateDisplay();
        saveState();
    });

    // Collapse / expand
    const isCollapsed = localStorage.getItem('pomoCollapsed') === 'true';
    if (isCollapsed) widget.classList.add('collapsed');

    collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        widget.classList.toggle('collapsed');
        localStorage.setItem('pomoCollapsed', widget.classList.contains('collapsed'));
    });

    updateDisplay();
}

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
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
