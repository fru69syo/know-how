/**
 * AdService — Rewarded Ad abstraction
 *
 * 現在はモック実装（5秒カウントダウン）です。
 * 本番でリワード広告を組み込む場合:
 *
 * ■ iOS / Android ネイティブアプリの場合:
 *   Capacitor + @capacitor-community/admob を使用
 *   https://github.com/capacitor-community/admob
 *   → showRewardVideoAd() の完了コールバックで onRewarded() を呼ぶよう置き換える
 *
 * ■ Web の場合:
 *   Google AdSense はリワード広告非対応。
 *   代替: Unity Ads SDK / IronSource / AppLovin MAX (Web SDK) を利用
 *   → 各 SDK の rewarded ad 完了コールバックで onRewarded() を呼ぶよう置き換える
 *
 * ■ このファイルの差し替え方:
 *   showRewardedAd(scene, onRewarded) の実装を SDK 呼び出しに変更するだけ。
 *   UI 部分（Phaser overlay）は削除し、SDK 側のネイティブ UI を使用すること。
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, DEPTHS } from '../config';

const AD_DURATION_MS = 5000;

export const AdService = {
  /**
   * リワード広告を表示し、完了後に onRewarded() を呼ぶ。
   * モック実装: 5 秒カウントダウン後に報酬付与。
   */
  showRewardedAd(scene: Phaser.Scene, onRewarded: () => void) {
    const d = DEPTHS.OVERLAY + 10;
    const overlay = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.92).setDepth(d).setInteractive();
    const adBg = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 40, 180, 0x111122).setStrokeStyle(2, 0x4444aa).setDepth(d + 1);
    const adLabel = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, '📺  広告を視聴中...', { fontSize: '18px', color: '#ffffff', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(d + 2);
    const timerText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '5', { fontSize: '36px', color: '#ffdd00', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(d + 2);
    const skipText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 55, 'しばらくお待ちください', { fontSize: '12px', color: '#888888', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(d + 2);

    const started = scene.time.now;
    let remaining = Math.ceil(AD_DURATION_MS / 1000);

    const ticker = scene.time.addEvent({
      delay: 1000,
      repeat: Math.ceil(AD_DURATION_MS / 1000) - 1,
      callback: () => {
        remaining--;
        timerText.setText(String(Math.max(0, remaining)));
        if (remaining <= 0) {
          // Skip button available at 0
          skipText.setText('タップしてスキップ').setColor('#aaaaff');
        }
      },
    });

    const finish = () => {
      if (scene.time.now - started < AD_DURATION_MS) return; // not ready yet
      ticker.remove();
      [overlay, adBg, adLabel, timerText, skipText].forEach(o => o.destroy());
      onRewarded();
    };

    overlay.on('pointerdown', finish);
  },
};
