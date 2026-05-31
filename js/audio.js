const audioCache = {};
const AUDIO_PATH = 'sounds/';

function preloadAudio(name) {
  if (audioCache[name]) return audioCache[name];
  const audio = new Audio(AUDIO_PATH + name + '.mp3');
  audio.preload = 'auto';
  audioCache[name] = audio;
  return audio;
}

function playSound(name) {
  try {
    const audio = preloadAudio(name);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {}
}

function playClick() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  } catch (e) {}
}

const Sound = {
  correct() { playSound('correct'); },
  wrong() { playSound('incorrect'); },
  click() { playClick(); },
  gameover() { playSound('gameover'); },
  warning() { playSound('warning'); },
};
