import Phaser from 'phaser';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

function tex(scene: Phaser.Scene, key: string, w: number, h: number, fn: DrawFn) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  fn(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

// ── Procedural audio ─────────────────────────────────────────────────────────

function genAudio(
  scene: Phaser.Scene, key: string, duration: number,
  fill: (L: Float32Array, R: Float32Array, sr: number) => void,
) {
  if (scene.cache.audio.has(key)) return;
  try {
    const ctx: AudioContext = (scene.sound as any).context;
    if (!ctx) return;
    const sr = ctx.sampleRate;
    const buf = ctx.createBuffer(2, Math.ceil(sr * duration), sr);
    fill(buf.getChannelData(0), buf.getChannelData(1), sr);
    scene.cache.audio.add(key, buf);
  } catch (_) {
    // fallback: silent
    try {
      const ctx: AudioContext = (scene.sound as any).context;
      if (ctx) scene.cache.audio.add(key, ctx.createBuffer(1, 100, 44100));
    } catch (__) {}
  }
}

function generateSounds(scene: Phaser.Scene) {
  // sfx_shoot: rising laser chirp
  genAudio(scene, 'sfx_shoot', 0.13, (L, R, sr) => {
    let ph = 0;
    for (let i = 0; i < L.length; i++) {
      const t = i / sr;
      ph += (2 * Math.PI * (440 + 1320 * (t / 0.13))) / sr;
      const env = Math.pow(1 - t / 0.13, 1.5) * 0.35;
      L[i] = R[i] = Math.sin(ph) * env;
    }
  });

  // sfx_explode: noise burst + low thump
  genAudio(scene, 'sfx_explode', 0.5, (L, R, sr) => {
    let ph = 0;
    for (let i = 0; i < L.length; i++) {
      const t = i / sr;
      ph += (2 * Math.PI * 70) / sr;
      const sample = Math.max(-1, Math.min(1,
        (Math.random() * 2 - 1) * Math.exp(-t * 10) * 0.4 +
        Math.sin(ph) * Math.exp(-t * 7) * 0.3,
      ));
      L[i] = R[i] = sample;
    }
  });

  // sfx_hit: impact thump
  genAudio(scene, 'sfx_hit', 0.18, (L, R, sr) => {
    let ph = 0;
    for (let i = 0; i < L.length; i++) {
      const t = i / sr;
      ph += (2 * Math.PI * (320 * Math.exp(-t * 18))) / sr;
      const sample = Math.sin(ph) * Math.exp(-t * 18) * 0.5
        + (Math.random() * 2 - 1) * Math.exp(-t * 35) * 0.2;
      L[i] = R[i] = Math.max(-1, Math.min(1, sample));
    }
  });

  // sfx_levelup: C-E-G-C arpeggio fanfare
  genAudio(scene, 'sfx_levelup', 0.72, (L, R, sr) => {
    const notes = [261.63, 329.63, 392.00, 523.25];
    const noteLen = 0.18;
    let ph = 0;
    for (let i = 0; i < L.length; i++) {
      const t = i / sr;
      const ni = Math.min(3, Math.floor(t / noteLen));
      const nt = t - ni * noteLen;
      ph += (2 * Math.PI * notes[ni]) / sr;
      const env = Math.exp(-nt * 5) * Math.min(1, nt * 80) * 0.4;
      L[i] = R[i] = Math.sin(ph) * env;
    }
  });

  // sfx_coin: bright ping
  genAudio(scene, 'sfx_coin', 0.15, (L, R, sr) => {
    let ph = 0;
    for (let i = 0; i < L.length; i++) {
      const t = i / sr;
      ph += (2 * Math.PI * (880 + 880 * (t / 0.15))) / sr;
      L[i] = R[i] = Math.sin(ph) * Math.exp(-t * 18) * 0.35;
    }
  });

  // sfx_select: short click
  genAudio(scene, 'sfx_select', 0.08, (L, R, sr) => {
    let ph = 0;
    for (let i = 0; i < L.length; i++) {
      const t = i / sr;
      ph += (2 * Math.PI * 660) / sr;
      L[i] = R[i] = Math.sin(ph) * Math.exp(-t * 45) * 0.3;
    }
  });

  // bgm_game: 8-beat loop at 130 BPM (~3.69s), A minor
  genAudio(scene, 'bgm_game', (60 / 130) * 8, (L, R, sr) => {
    const beatLen = 60 / 130;
    // Bass note per beat (Am Am Dm Dm Am Am E E)
    const bassF = [110, 110, 73.42, 73.42, 110, 110, 82.41, 82.41];
    // Arpeggio: 4 16th notes per beat
    const arpC = [
      [220, 261.63, 329.63, 440],
      [440, 329.63, 261.63, 220],
      [146.83, 174.61, 220, 293.66],
      [293.66, 220, 174.61, 146.83],
      [220, 261.63, 329.63, 440],
      [440, 329.63, 261.63, 220],
      [164.81, 207.65, 246.94, 329.63],
      [329.63, 261.63, 220, 164.81],
    ];
    let bph = 0, aph = 0;
    for (let i = 0; i < L.length; i++) {
      const t = i / sr;
      const beat = Math.floor(t / beatLen) % 8;
      const bt = t % beatLen;
      const sixteenth = Math.floor((bt / beatLen) * 4);
      const st = (bt / beatLen * 4) % 1;

      // Bass: square wave with decay
      bph += (2 * Math.PI * bassF[beat]) / sr;
      const bassVal = Math.sign(Math.sin(bph)) * Math.exp(-bt * 4) * 0.11;

      // Arpeggio: sine with short envelope
      aph += (2 * Math.PI * arpC[beat][sixteenth]) / sr;
      const arpVal = Math.sin(aph) * Math.exp(-st * 7) * 0.09;

      // Kick: on beats 0, 2, 4, 6
      const kick = (beat % 2 === 0 && bt < 0.07)
        ? (Math.random() * 2 - 1) * Math.exp(-bt * 55) * 0.14 : 0;

      // Hi-hat: every 16th note
      const hihat = st < 0.04
        ? (Math.random() * 2 - 1) * Math.exp(-st * 120) * 0.035 : 0;

      const s = Math.max(-1, Math.min(1, bassVal + arpVal + kick + hihat));
      // Fade last 60ms to avoid loop click
      const fadeOut = Math.min(1, (L.length - i) / (sr * 0.06));
      L[i] = s * fadeOut;
      R[i] = (s * 0.95 + arpVal * 0.05) * fadeOut;
    }
  });

  // bgm_menu: 4s ambient pad in A minor
  genAudio(scene, 'bgm_menu', 4.0, (L, R, sr) => {
    // Three slowly evolving chords
    const padFreqs = [
      [110, 130.81, 164.81, 220],  // Am
      [110, 130.81, 164.81, 220],
      [109.5, 130.3, 164.5, 219],  // slight detune for shimmer
      [110.5, 131.3, 165.2, 221],
    ];
    const phArr = [0, 0, 0, 0];
    for (let i = 0; i < L.length; i++) {
      const t = i / sr;
      const ci = Math.min(3, Math.floor(t));
      const ct = t % 1;
      const fadeEnv = Math.min(ct / 0.15, 1) * Math.min((1 - ct) / 0.15, 1);
      let pad = 0;
      for (let j = 0; j < 4; j++) {
        phArr[j] += (2 * Math.PI * padFreqs[ci][j]) / sr;
        pad += Math.sin(phArr[j]) * 0.07;
      }
      const sample = Math.max(-1, Math.min(1, pad * fadeEnv));
      L[i] = sample;
      R[i] = sample * 0.98 + Math.sin(phArr[2]) * 0.005;
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────

export function generatePlaceholderAssets(scene: Phaser.Scene) {
  // ── Ships ────────────────────────────────────────────────────────────────
  tex(scene, 'ship_default', 32, 40, g => {
    g.fillStyle(0x6699ff).fillTriangle(16, 0, 0, 36, 32, 36);
    g.fillStyle(0x334488).fillRect(10, 22, 12, 14);
    g.fillStyle(0xff8800).fillRect(7, 33, 7, 7).fillRect(18, 33, 7, 7);
    g.fillStyle(0x99ccff).fillTriangle(16, 6, 10, 22, 22, 22);
  });
  tex(scene, 'ship_blue', 32, 40, g => {
    g.fillStyle(0x00ddff).fillTriangle(16, 0, 0, 36, 32, 36);
    g.fillStyle(0x006688).fillRect(10, 22, 12, 14);
    g.fillStyle(0x00ffff).fillRect(7, 33, 7, 7).fillRect(18, 33, 7, 7);
    g.fillStyle(0xaaffff).fillTriangle(16, 6, 10, 22, 22, 22);
  });
  tex(scene, 'ship_red', 32, 40, g => {
    g.fillStyle(0xff4444).fillTriangle(16, 0, 0, 36, 32, 36);
    g.fillStyle(0x881111).fillRect(10, 22, 12, 14);
    g.fillStyle(0xff8800).fillRect(7, 33, 7, 7).fillRect(18, 33, 7, 7);
    g.fillStyle(0xff9999).fillTriangle(16, 6, 10, 22, 22, 22);
  });

  // ── Enemies ──────────────────────────────────────────────────────────────
  tex(scene, 'enemy_meteor_s', 24, 24, g => {
    g.fillStyle(0x887766).fillCircle(12, 12, 11);
    g.fillStyle(0x665544).fillCircle(7, 9, 3).fillCircle(14, 15, 2).fillCircle(16, 7, 2);
  });
  tex(scene, 'enemy_meteor_l', 40, 40, g => {
    g.fillStyle(0x998877).fillCircle(20, 20, 19);
    g.fillStyle(0x776655).fillCircle(10, 14, 5).fillCircle(26, 10, 3).fillCircle(28, 26, 4).fillCircle(12, 28, 3);
    g.fillStyle(0xbbaa99).fillCircle(14, 10, 3);
  });
  tex(scene, 'enemy_drone', 32, 24, g => {
    g.fillStyle(0x44dd66).fillRect(8, 8, 16, 8);
    g.fillStyle(0x228844).fillTriangle(0, 12, 8, 6, 8, 18).fillTriangle(32, 12, 24, 6, 24, 18);
    g.fillStyle(0x00ff88, 0.8).fillRect(13, 10, 6, 4);
  });
  tex(scene, 'enemy_alien', 36, 36, g => {
    g.fillStyle(0x44aa44).fillEllipse(18, 20, 30, 28);
    g.fillStyle(0x336633).fillEllipse(18, 15, 20, 16);
    g.fillStyle(0xffffff).fillCircle(12, 16, 5).fillCircle(24, 16, 5);
    g.fillStyle(0xff0000).fillCircle(12, 16, 2).fillCircle(24, 16, 2);
    g.lineStyle(2, 0x33cc33).strokeCircle(18, 20, 14);
  });
  tex(scene, 'enemy_turret', 28, 28, g => {
    g.fillStyle(0xaa6622).fillRect(4, 8, 20, 16);
    g.fillStyle(0x884400).fillRect(2, 6, 24, 16);
    g.fillStyle(0x666666).fillRect(12, 0, 4, 12);
    g.fillStyle(0xcc8800).fillCircle(14, 14, 7);
  });
  tex(scene, 'enemy_boss', 64, 64, g => {
    g.fillStyle(0x9922cc).fillEllipse(32, 32, 56, 48);
    g.fillStyle(0x6600aa).fillRect(0, 24, 10, 16).fillRect(54, 24, 10, 16);
    g.fillStyle(0xcc44ff).fillTriangle(32, 4, 16, 28, 48, 28);
    g.fillStyle(0xff0000).fillCircle(20, 28, 6).fillCircle(44, 28, 6);
    g.fillStyle(0xff6600).fillCircle(20, 28, 3).fillCircle(44, 28, 3);
    g.lineStyle(2, 0xee88ff).strokeEllipse(32, 32, 56, 48);
  });

  // ── Bullets ───────────────────────────────────────────────────────────────
  tex(scene, 'bullet_player', 6, 16, g => {
    g.fillStyle(0x00ffff).fillRect(1, 0, 4, 16);
    g.fillStyle(0xffffff).fillRect(2, 0, 2, 6);
  });
  tex(scene, 'bullet_enemy', 6, 12, g => {
    g.fillStyle(0xff4444).fillRect(1, 0, 4, 12);
    g.fillStyle(0xff8888).fillRect(2, 0, 2, 4);
  });

  // ── UI Icons ──────────────────────────────────────────────────────────────
  tex(scene, 'icon_coin', 16, 16, g => {
    g.fillStyle(0xffcc00).fillCircle(8, 8, 7);
    g.fillStyle(0xffee88).fillCircle(6, 6, 3);
    g.lineStyle(1, 0xaa8800).strokeCircle(8, 8, 7);
  });
  tex(scene, 'icon_heart', 16, 16, g => {
    g.fillStyle(0xff3355);
    g.fillCircle(5, 5, 4).fillCircle(11, 5, 4);
    g.fillTriangle(1, 6, 15, 6, 8, 15);
  });
  tex(scene, 'icon_star', 16, 16, g => {
    g.fillStyle(0xffdd00);
    const cx = 8, cy = 8, or = 7, ir = 3;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const r = i % 2 === 0 ? or : ir;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    g.fillPoints(pts, true);
  });

  // ── Particle ──────────────────────────────────────────────────────────────
  tex(scene, 'particle', 8, 8, g => {
    g.fillStyle(0xffffff).fillCircle(4, 4, 4);
    g.fillStyle(0xffffaa, 0.5).fillCircle(3, 3, 2);
  });

  // ── Logo ──────────────────────────────────────────────────────────────────
  tex(scene, 'logo', 280, 80, g => {
    g.fillStyle(0xffffff);
    for (let i = 0; i < 30; i++) {
      const sx = (i * 37 + 13) % 280, sy = (i * 23 + 7) % 80;
      g.fillRect(sx, sy, 1, 1);
    }
    g.fillStyle(0x6699ff).fillTriangle(20, 12, 10, 36, 30, 36);
    g.fillStyle(0xff8800).fillRect(13, 33, 5, 5).fillRect(22, 33, 5, 5);
  });

  // ── Audio (procedurally generated) ───────────────────────────────────────
  generateSounds(scene);
}
