// --- Web Audio API Generator ---
let audioCtx;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playMatchSound() {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
}

function playLevelUpSound() {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + (index * 0.08);
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.2);
    });
}

function playWinSound() {
    const ctx = getAudioContext();
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];

    notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + (index * 0.12);
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
    });
}

// --- State Management ---
const TOTAL_LEVELS = 10;
const POINTS_PER_LEVEL = 10;
let maxUnlockedLevel = parseInt(localStorage.getItem('maxLevel')) || 1;
let totalScore = parseInt(localStorage.getItem('totalScore')) || 0;
let currentLevel = 1;

let levelPairs = [];
let selectedEquation = null;
let matchesFound = 0;

document.addEventListener('DOMContentLoaded', () => {
    updateScoreDisplay();
    renderLevels();
});

function updateScoreDisplay() {
    document.getElementById('score-display').innerText = `النقاط: ${totalScore}`;
}

function renderLevels() {
    const container = document.getElementById('levels-container');
    container.innerHTML = '';
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
        const isLocked = i > maxUnlockedLevel;
        const btnClass = isLocked ? 'btn-secondary locked' : 'btn-primary shadow-sm';
        const icon = isLocked ? '<i class="fa-solid fa-lock fs-5"></i>' : i;
        
        container.innerHTML += `
            <button class="btn ${btnClass} level-btn" ${isLocked ? 'disabled' : ''} onclick="startLevel(${i})">
                ${icon}
            </button>
        `;
    }
}

function startLevel(levelNum) {
    getAudioContext();
    currentLevel = levelNum;
    matchesFound = 0;
    document.getElementById('levels-screen').style.display = 'none';
    document.getElementById('win-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    document.getElementById('current-level-display').innerText = levelNum;
    
    generateEquations(levelNum);
}

function showLevelsScreen() {
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('win-screen').style.display = 'none';
    document.getElementById('levels-screen').style.display = 'block';
    renderLevels();
}

function generateEquations(level) {
    const eqContainer = document.getElementById('equations-container');
    const ansContainer = document.getElementById('answers-container');
    eqContainer.innerHTML = '';
    ansContainer.innerHTML = '';
    levelPairs = [];

    for (let i = 0; i < 5; i++) {
        const maxNum = level * 5; 
        let num1 = Math.floor(Math.random() * maxNum) + 1;
        let num2 = Math.floor(Math.random() * maxNum) + 1;
        
        let op = level < 4 ? '+' : (level < 8 ? ['+','-'][Math.floor(Math.random()*2)] : ['+','-','*'][Math.floor(Math.random()*3)]);
        
        if(op === '-' && num1 < num2) { [num1, num2] = [num2, num1]; }
        
        let answer;
        if(op === '+') answer = num1 + num2;
        if(op === '-') answer = num1 - num2;
        if(op === '*') answer = num1 * num2;

        const equationId = `eq-${i}`;
        levelPairs.push({ id: equationId, eqStr: `${num1} ${op} ${num2}`, answer: answer });
    }

    let shuffledAnswers = [...levelPairs].sort(() => Math.random() - 0.5);

    levelPairs.forEach(pair => {
        eqContainer.innerHTML += `<div class="game-card" id="${pair.id}" onclick="selectEquation('${pair.id}')">${pair.eqStr}</div>`;
    });

    shuffledAnswers.forEach(pair => {
        ansContainer.innerHTML += `<div class="game-card ans-card" data-ans="${pair.answer}" onclick="selectAnswer(this, ${pair.answer})">${pair.answer}</div>`;
    });
}

function selectEquation(id) {
    document.querySelectorAll('#equations-container .game-card').forEach(el => el.classList.remove('selected'));
    selectedEquation = id;
    document.getElementById(id).classList.add('selected');
}

function selectAnswer(el, answer) {
    if (!selectedEquation) return;

    const pair = levelPairs.find(p => p.id === selectedEquation);
    
    if (pair.answer === answer) {
        playMatchSound();
        
        document.getElementById(selectedEquation).classList.add('matched');
        el.classList.add('matched');
        selectedEquation = null;
        matchesFound++;
        
        if (matchesFound === 5) {
            handleLevelComplete();
        }
    } else {
        el.classList.add('bg-danger', 'text-white', 'border-danger');
        setTimeout(() => el.classList.remove('bg-danger', 'text-white', 'border-danger'), 500);
    }
}

function handleLevelComplete() {
    totalScore += POINTS_PER_LEVEL;
    localStorage.setItem('totalScore', totalScore);
    updateScoreDisplay();

    if (currentLevel === TOTAL_LEVELS) {
        playWinSound();
        fireConfetti();
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('win-screen').style.display = 'block';
    } else {
        playLevelUpSound();
        if (currentLevel === maxUnlockedLevel) {
            maxUnlockedLevel++;
            localStorage.setItem('maxLevel', maxUnlockedLevel);
        }
        
        Swal.fire({
            title: 'عمل رائع!',
            text: `لقد فزت بالمرحلة ${currentLevel} وحصلت على 10 نقاط!`,
            icon: 'success',
            confirmButtonText: 'التالي',
            confirmButtonColor: '#0d6efd'
        }).then(() => {
            showLevelsScreen();
        });
    }
}

function resetGame() {
    localStorage.clear();
    maxUnlockedLevel = 1;
    totalScore = 0;
    currentLevel = 1;
    updateScoreDisplay();
    showLevelsScreen();
}

function fireConfetti() {
    var duration = 3 * 1000;
    var end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#0d6efd', '#198754', '#ffc107']
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#0d6efd', '#198754', '#ffc107']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

function shareGame() {
    if (navigator.share) {
        navigator.share({
            title: 'لعبة مطابقة الأرقام',
            text: 'تحدى قدراتك في الرياضيات معي! جرب هذه اللعبة التعليمية الممتعة الآن.',
            url: window.location.href
        }).catch(console.error);
    } else {
        Swal.fire('عذراً', 'ميزة المشاركة غير مدعومة في متصفحك الحالي.', 'info');
    }
}

let deferredPrompt;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'inline-block';
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installBtn.style.display = 'none';
        }
        deferredPrompt = null;
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW Reg Failed:', err));
    });
}