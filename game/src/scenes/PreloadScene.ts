import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Rectangle;

  constructor() { super({ key: 'PreloadScene' }); }

  preload() {
    const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
    this.add.text(cx, cy - 80, 'SPACE SHOOTER', { fontSize:'28px', color:'#ffffff', fontFamily:'monospace' }).setOrigin(0.5);
    this.add.text(cx, cy - 30, 'Loading...', { fontSize:'14px', color:'#8888ff', fontFamily:'monospace' }).setOrigin(0.5);
    this.add.rectangle(cx, cy + 20, GAME_WIDTH - 80, 12, 0x333355);
    this.progressBar = this.add.rectangle(cx - (GAME_WIDTH-80)/2, cy + 20, 0, 12, COLORS.XP_BAR_FILL).setOrigin(0, 0.5);
    this.load.on('progress', (v: number) => { this.progressBar.width = (GAME_WIDTH - 80) * v; });
    this.load.on('complete', () => { this.scene.start('MainMenuScene'); });
    // Ships
    this.load.image('ship_default', 'assets/images/ships/default.png');
    this.load.image('ship_blue',    'assets/images/ships/blue.png');
    this.load.image('ship_red',     'assets/images/ships/red.png');
    // Enemies
    this.load.image('enemy_meteor_s', 'assets/images/enemies/meteor_small.png');
    this.load.image('enemy_meteor_l', 'assets/images/enemies/meteor_large.png');
    this.load.image('enemy_drone',    'assets/images/enemies/drone.png');
    this.load.image('enemy_alien',    'assets/images/enemies/alien.png');
    this.load.image('enemy_turret',   'assets/images/enemies/turret.png');
    this.load.image('enemy_boss',     'assets/images/enemies/boss.png');
    // Bullets
    this.load.image('bullet_player', 'assets/images/bullets/player.png');
    this.load.image('bullet_enemy',  'assets/images/bullets/enemy.png');
    // UI
    this.load.image('icon_coin',  'assets/images/ui/coin.png');
    this.load.image('icon_heart', 'assets/images/ui/heart.png');
    this.load.image('icon_star',  'assets/images/ui/star.png');
    this.load.image('particle',   'assets/images/particles/spark.png');
    // Audio
    this.load.audio('bgm_game',    'assets/audio/bgm/game.ogg');
    this.load.audio('bgm_menu',    'assets/audio/bgm/menu.ogg');
    this.load.audio('sfx_shoot',   'assets/audio/sfx/shoot.ogg');
    this.load.audio('sfx_hit',     'assets/audio/sfx/hit.ogg');
    this.load.audio('sfx_explode', 'assets/audio/sfx/explode.ogg');
    this.load.audio('sfx_levelup', 'assets/audio/sfx/levelup.ogg');
    this.load.audio('sfx_coin',    'assets/audio/sfx/coin.ogg');
    this.load.audio('sfx_select',  'assets/audio/sfx/select.ogg');
  }
}
