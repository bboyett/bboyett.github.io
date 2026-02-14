document.addEventListener('DOMContentLoaded', () => {
    const timeDisplay = document.getElementById('time-display');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const customMinutesInput = document.getElementById('custom-minutes');

    let timeLeft = 25 * 60; // Default 25 minutes
    let timerId = null;
    let isRunning = false;

    // Audio Context Setup
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function updateDisplay() {
        timeDisplay.textContent = formatTime(timeLeft);
        document.title = `${formatTime(timeLeft)} - Focus`;
    }

    // Custom Time Logic
    customMinutesInput.addEventListener('change', () => {
        let minutes = parseInt(customMinutesInput.value);
        if (isNaN(minutes) || minutes < 1) minutes = 1;
        if (minutes > 180) minutes = 180;

        customMinutesInput.value = minutes;

        if (!isRunning) {
            timeLeft = minutes * 60;
            updateDisplay();
        }
    });

    function playNote(frequency, startTime, duration = 0.3) {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }

    function playNotification() {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const now = audioCtx.currentTime;
        // Play a major triad arpeggio (C Major: C4, E4, G4, C5)
        playNote(261.63, now, 0.4);       // C4
        playNote(329.63, now + 0.2, 0.4); // E4
        playNote(392.00, now + 0.4, 0.4); // G4
        playNote(523.25, now + 0.6, 0.8); // C5
    }

    function toggleTimer() {
        if (isRunning) {
            clearInterval(timerId);
            startBtn.textContent = 'Start';
            startBtn.classList.remove('active');
            isRunning = false;
        } else {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            // If timer was finished (0), reset to input value before starting
            if (timeLeft === 0) {
                let minutes = parseInt(customMinutesInput.value) || 25;
                timeLeft = minutes * 60;
                updateDisplay();
            }

            startBtn.textContent = 'Pause';
            startBtn.classList.add('active');
            isRunning = true;

            timerId = setInterval(() => {
                if (timeLeft > 0) {
                    timeLeft--;
                    updateDisplay();
                } else {
                    clearInterval(timerId);
                    isRunning = false;
                    startBtn.textContent = 'Start';
                    startBtn.classList.remove('active');
                    playNotification();
                }
            }, 1000);
        }
    }

    function resetTimer() {
        clearInterval(timerId);
        isRunning = false;

        let minutes = parseInt(customMinutesInput.value) || 25;
        timeLeft = minutes * 60;

        startBtn.textContent = 'Start';
        startBtn.classList.remove('active');

        updateDisplay();
        document.title = 'Modern Pomodoro Timer';
    }

    startBtn.addEventListener('click', toggleTimer);
    resetBtn.addEventListener('click', resetTimer);

    // Initial display update
    updateDisplay();
});
