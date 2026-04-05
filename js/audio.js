/**
 * Simple Synth BGM
 */

let audioCtx;
let isPlaying = false;
let oscillators = [];
let sequencerInterval;
let noteIndex = 0;

// Simple techno/battle melody
const notes = [
    220, 0, 220, 261, 220, 0, 196, 0,
    220, 0, 261, 293, 261, 220, 196, 196
];

const bassNotes = [
    55, 55, 55, 55, 55, 55, 55, 55,
    65, 65, 65, 65, 49, 49, 49, 49
];

function toggleBGM() {
    if (isPlaying) {
        stopBGM();
    } else {
        startBGM();
    }
}

function startBGM() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    isPlaying = true;
    document.getElementById('btn-toggle-bgm').innerText = '♪ BGM ON';

    const tempo = 150; // ms per step
    sequencerInterval = setInterval(playStep, tempo);
}

function stopBGM() {
    isPlaying = false;
    document.getElementById('btn-toggle-bgm').innerText = '♪ BGM OFF';
    clearInterval(sequencerInterval);
}

function playStep() {
    const t = audioCtx.currentTime;

    // Lead
    const freq = notes[noteIndex % notes.length];
    if (freq > 0) {
        playTone(freq, 'square', 0.1, 0.1);
    }

    // Bass
    const bass = bassNotes[noteIndex % bassNotes.length];
    if (noteIndex % 2 === 0) { // Every other step
        playTone(bass, 'sawtooth', 0.1, 0.2);
    }

    // Hi-hat (noise-ish)
    if (noteIndex % 4 === 2) {
        playNoise(0.05);
    }

    noteIndex++;
}

function playTone(freq, type, vol, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + dur);
}

function playNoise(vol) {
    const bufferSize = audioCtx.sampleRate * 0.1; // 0.1 sec
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    noise.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
}


document.getElementById('btn-toggle-bgm').addEventListener('click', () => {
    // Resume context if suspended (browser policy)
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    toggleBGM();
});
