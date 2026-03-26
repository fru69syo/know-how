import Phaser from 'phaser';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

function tex(scene: Phaser.Scene, key: string, w: number, h: number, fn: DrawFn) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  fn(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

function silentAudio(scene: Phaser.Scene, key: string) {
  if (scene.cache.audio.has(key)) return;
  try {
    const ctx: AudioContext = (scene.sound as any).context;
    if (ctx) scene.cache.audio.add(key, ctx.createBuffer(1, 100, 44100));
  } catch (_) {}
}

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
    g.fillStyle(0x000000, 0);
    // Stars background
    g.fillStyle(0xffffff);
    for (let i = 0; i < 30; i++) {
      const sx = (i * 37 + 13) % 280, sy = (i * 23 + 7) % 80;
      g.fillRect(sx, sy, 1, 1);
    }
    // Ship icon
    g.fillStyle(0x6699ff).fillTriangle(20, 12, 10, 36, 30, 36);
    g.fillStyle(0xff8800).fillRect(13, 33, 5, 5).fillRect(22, 33, 5, 5);
  });

  // ── Audio ─────────────────────────────────────────────────────────────────
  const audioKeys = ['bgm_game','bgm_menu','sfx_shoot','sfx_hit','sfx_explode','sfx_levelup','sfx_coin','sfx_select'];
  audioKeys.forEach(k => silentAudio(scene, k));
}
