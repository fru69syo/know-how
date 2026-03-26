# Space Shooter Game - 設計書

## 概要

アーチャー伝説ライクなローグライト宇宙シューター。
下から宇宙船を操作し、上から降りてくる隕石・モンスターを自動射撃で倒す。
レベルアップ時にスキルを選択してビルドを組み立てる。

---

## 1. テックスタック

| レイヤー | 技術 | 理由 |
|---|---|---|
| ゲームエンジン | **Phaser 3 + TypeScript** | 2Dゲーム向け最高の完成度、WebGL対応、豊富な実績 |
| ビルドツール | **Vite** | 高速HMR、TypeScript対応、最小設定 |
| モバイル化 | **Capacitor** | WebゲームをそのままiOS/Android化。ゲームコード変更ゼロ |
| 認証・DB | **Firebase Auth + Firestore** | リアルタイム同期、無料枠が十分、モバイルSDK完備 |
| 画像ストレージ | **Firebase Storage** | スキン画像のアップロード・配信 |
| サーバーレス処理 | **Firebase Functions** | 課金検証、スキン審査、収益分配 |
| 広告 | **AdMob（Capacitor plugin）** | iOS/Androidネイティブ広告。バナー＋リワード |
| 課金 | **RevenueCat** | iOS/AndroidのIAP統一管理。Firebase連携あり |

### 開発→リリースの流れ

```
Phaser 3 (TypeScript/Vite)
        ↓ ビルド
  静的ファイル (dist/)
        ↓ Capacitor
  iOS App / Android App
        ↓ ストア申請
  App Store / Google Play
```

---

## 2. ゲームコアシステム設計

### 2-1. シーン構成

```
BootScene         → アセット読み込み、バージョンチェック
PreloadScene      → ローディング画面
MainMenuScene     → タイトル画面（プレイ/格納庫/ショップ/ランキング）
HangarScene       → 宇宙船強化（メタ進行）
ShopScene         → スキンマーケットプレイス
GameScene         → メインゲームプレイ
  └ LevelUpScene  → レベルアップスキル選択（オーバーレイ）
  └ PauseScene    → ポーズメニュー
ResultScene       → ラン結果（スコア/獲得通貨/スタッツ）
LeaderboardScene  → ランキング
```

### 2-2. ゲームループ

```
GameScene.update(delta)
├── PlayerController   → 入力処理、自動射撃、無敵時間
├── EnemyManager       → 波管理、スポーン、下降移動
├── BulletManager      → 弾の移動・衝突判定
├── SkillSystem        → スキルのcooldown・効果適用
├── XPSystem           → 経験値蓄積→レベルアップ判定
├── WaveController     → 難易度カーブ管理
└── HUDController      → UI同期（HP/レベル/通貨）
```

### 2-3. データモデル（ランタイム）

```typescript
// ゲーム中のステート（メモリのみ）
interface GameState {
  wave: number;
  score: number;
  xp: number;
  level: number;
  sessionCurrency: number;
  player: {
    hp: number;
    maxHp: number;
    speed: number;
    fireRate: number;
    bulletDamage: number;
    bulletCount: number;
  };
  activeSkills: ActiveSkill[];
}

// 永続ステート（Firestore + ローカルキャッシュ）
interface PersistentState {
  userId: string;
  totalCurrency: number;
  highScore: number;
  shipUpgrades: UpgradeTree;
  equippedSkinId: string;
  ownedSkinIds: string[];
  achievements: Record<string, boolean>;
  dailyMissions: DailyMission[];
  adFree: boolean;  // IAP購入済みフラグ
}
```

---

## 3. ゲームメカニクス詳細

### 3-1. ブロック崩しスタイルの敵システム

```
画面上部 ─────────────────
[ 隕石 ][モンスターA][ 隕石 ]   ← 横に並んで配置
[モンスターB][  ボス  ][隕石 ]
         │ 全体がゆっくり下降
         ▼
画面下部 ─────────────────
[ 宇宙船 ]  ← プレイヤー
```

**波（Wave）の設計:**
- 各Waveは**グリッド状**に敵を配置（ブロック崩し的）
- 全体が一定速度で下降しながら左右に揺れる
- 端まで来ると方向転換（スペースインベーダー参考）
- 下まで到達したらゲームオーバー（ライフ制にするかは調整）
- Wave数が上がるごとに：数増加 → 移動速度UP → 耐久力UP → 特殊行動追加

**敵タイプ:**

| タイプ | HP | 行動 | 報酬 |
|---|---|---|---|
| 小隕石 | 1 | 直線下降 | XP小 |
| 大隕石 | 5 | 直線下降 | XP中 |
| ドローン | 3 | 左右移動しながら下降 | XP中 |
| エイリアン | 8 | プレイヤーに向かって移動 | XP大 |
| 砲台型 | 10 | 停止して射撃 | XP大 |
| ミニボス | 50 | 複合行動 | XP×5＋ドロップ |
| Waveボス | 200+ | フェーズ制行動パターン | XP×20 |

### 3-2. スキル選択システム（ローグライト）

レベルアップ時に3択（または4択）でスキルを選択。

**スキルカテゴリ:**

```
[攻撃系]
・マルチショット    → 弾数+1（最大5発）
・スプレッド弾      → 散弾に変化
・貫通弾           → 敵を貫通
・爆発弾           → 着弾時に範囲ダメージ
・レーザービーム    → 前方に持続ダメージ
・ホーミング弾      → 近敵に自動追尾
・クリティカル      → 確率でダメージ2倍

[防御系]
・シールド          → 1回ダメージ無効
・HP回復            → 即時HP+20%
・最大HP増加        → MaxHP+30%
・無敵時間延長      → ダメージ後の無敵+0.5秒

[サポート系]
・磁力フィールド    → XP・アイテム吸引範囲拡大
・コイン増加        → 通貨ドロップ+50%
・攻撃速度UP        → 発射間隔-20%
・移動速度UP        → 移動速度+15%
・ドローン召喚      → 随伴ドローンが自動射撃

[特殊/究極]
・オーバードライブ  → 10秒間全ステータス2倍（60秒CD）
・ブラックホール    → 敵を引き寄せてまとめてダメージ
・時間停止          → 3秒間敵の動きを止める
```

**スキルのレベルアップ:**
- 同じスキルを再選択するとLv2→Lv3に強化
- Lv3で「進化」が解放される（さらに強力な上位版）

### 3-3. メタ進行（格納庫アップグレード）

ランをまたいで永続するアップグレードツリー。

```
[攻撃力]──[攻撃力2]──[攻撃力3]
              └──[クリティカル率]──[クリダメージ]

[HP]──[HP2]──[回復力]
         └──[シールド]──[シールド強化]

[速度]──[速度2]
   └──[発射速度]──[マルチショット解放]

[通貨]──[通貨2]──[ボーナス通貨]
           └──[スキルコスト割引]
```

---

## 4. 収益化設計

### 4-1. 広告収益（メイン）

| 広告種類 | タイミング | 詳細 |
|---|---|---|
| バナー広告 | メインメニュー・結果画面 | 画面下部に常時表示 |
| リワード広告 | プレイヤーが任意で視聴 | 以下の報酬と交換 |
| インタースティシャル | ラン終了後（間隔制限あり） | 全画面広告。頻度は慎重に |

**リワード広告の報酬:**
- コンティニュー（1回のみ、HP50%で復活）
- 通貨×2（獲得通貨が2倍になる）
- スキル選択肢+1（3択→4択）
- スキル再選択（引き直し）

### 4-2. IAP（アプリ内課金）

| 商品 | 価格（想定） | 内容 |
|---|---|---|
| 広告削除 | ¥600〜¥1,200 | バナー・インタースティシャル非表示。リワードは任意で視聴可 |
| スターターパック | ¥120〜¥480 | 通貨×5,000＋限定スキン1つ |
| 通貨パック S/M/L | ¥120/¥480/¥960 | ゲーム内通貨の直接購入 |
| 月額サブスク | ¥360〜¥600/月 | 毎日通貨ボーナス＋広告削除 |

### 4-3. カスタムスキン（UGC）マーケットプレイス

**フロー:**

```
[クリエイター]
  画像アップロード（PNG, 512×512px推奨）
       ↓
  Firebase Storage に保存
       ↓
  Firebase Functions で自動審査（不適切画像フィルタ）
       ↓
  審査通過 → Firestoreに登録 → マーケットで公開
       ↓
[購入者]
  スキンを閲覧→ゲーム内通貨で購入（¥120〜¥600相当）
       ↓
  Firebase Functions で取引処理
       ↓
[クリエイターへ還元]
  購入金額の 70% をゲーム内通貨として付与
  （例：100コインの商品 → 70コイン獲得）
```

**スキンの料金設定:**
- クリエイターが50〜500コインの範囲で自由設定
- コインはIAPで購入可能（または広告・ゲームプレイで獲得）

**スキン審査フロー（Firebase Functions）:**

```typescript
// functions/src/reviewSkin.ts
export const onSkinUploaded = functions.storage
  .object()
  .onFinalize(async (object) => {
    // 1. Cloud Vision API で不適切コンテンツチェック
    // 2. 解像度・ファイルサイズバリデーション
    // 3. 通過 → Firestore status: "approved"
    // 4. 不通過 → status: "rejected" + 通知
  });
```

---

## 5. Firestore データ設計

```
users/{userId}
  ├── profile: { displayName, avatarUrl, createdAt }
  ├── game: { totalCurrency, highScore, level, adFree }
  ├── upgrades: { attackLevel, hpLevel, speedLevel, ... }
  ├── skins: { equipped: skinId, owned: [skinId, ...] }
  ├── missions: { daily: [...], weekly: [...] }
  └── purchases: [{ productId, purchasedAt, platform }]

skins/{skinId}
  ├── creatorId: userId
  ├── name: string
  ├── imageUrl: string (Firebase Storage URL)
  ├── price: number (コイン)
  ├── status: "pending" | "approved" | "rejected"
  ├── salesCount: number
  └── createdAt: timestamp

leaderboard/{seasonId}/scores/{userId}
  ├── score: number
  ├── wave: number
  ├── displayName: string
  └── shipSkinUrl: string

transactions/{txId}
  ├── buyerId: userId
  ├── sellerId: userId
  ├── skinId: string
  ├── amount: number
  ├── sellerCut: number (amount * 0.7)
  └── createdAt: timestamp
```

---

## 6. ファイル構成

```
know-how/
├── docs/
│   └── game-design.md          ← この設計書
├── game/                        ← ゲーム本体
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── capacitor.config.ts
│   ├── index.html
│   ├── src/
│   │   ├── main.ts              ← Phaser.Game 初期化
│   │   ├── config.ts            ← ゲーム設定定数
│   │   ├── scenes/
│   │   │   ├── BootScene.ts
│   │   │   ├── PreloadScene.ts
│   │   │   ├── MainMenuScene.ts
│   │   │   ├── HangarScene.ts
│   │   │   ├── ShopScene.ts
│   │   │   ├── GameScene.ts
│   │   │   ├── LevelUpScene.ts
│   │   │   ├── PauseScene.ts
│   │   │   ├── ResultScene.ts
│   │   │   └── LeaderboardScene.ts
│   │   ├── entities/
│   │   │   ├── Player.ts
│   │   │   ├── Enemy.ts
│   │   │   ├── Bullet.ts
│   │   │   ├── Boss.ts
│   │   │   └── Drone.ts
│   │   ├── systems/
│   │   │   ├── EnemyManager.ts
│   │   │   ├── BulletManager.ts
│   │   │   ├── WaveController.ts
│   │   │   ├── SkillSystem.ts
│   │   │   ├── XPSystem.ts
│   │   │   └── HUDController.ts
│   │   ├── skills/
│   │   │   ├── SkillDefinitions.ts   ← 全スキルのデータ定義
│   │   │   └── SkillEffects.ts       ← スキル効果の実装
│   │   ├── data/
│   │   │   ├── EnemyData.ts          ← 敵のステータス定義
│   │   │   ├── WaveData.ts           ← Wave構成データ
│   │   │   └── UpgradeData.ts        ← アップグレードツリー定義
│   │   ├── services/
│   │   │   ├── FirebaseService.ts    ← Firebase初期化・共通処理
│   │   │   ├── AuthService.ts
│   │   │   ├── PlayerDataService.ts
│   │   │   ├── LeaderboardService.ts
│   │   │   ├── SkinService.ts        ← スキンのCRUD
│   │   │   └── AdService.ts          ← AdMob管理
│   │   ├── store/
│   │   │   ├── GameState.ts          ← ランタイムステート
│   │   │   └── PersistentState.ts    ← 永続ステート（Firebase同期）
│   │   └── ui/
│   │       ├── components/           ← 再利用可能UIパーツ
│   │       └── HUD.ts
│   ├── assets/
│   │   ├── images/
│   │   │   ├── ships/               ← デフォルトスキン
│   │   │   ├── enemies/
│   │   │   ├── bullets/
│   │   │   └── ui/
│   │   ├── audio/
│   │   │   ├── bgm/
│   │   │   └── sfx/
│   │   └── particles/
│   └── firebase/
│       ├── functions/
│       │   ├── src/
│       │   │   ├── index.ts
│       │   │   ├── reviewSkin.ts
│       │   │   ├── processPurchase.ts
│       │   │   └── distributeRevenue.ts
│       │   └── package.json
│       ├── firestore.rules
│       ├── storage.rules
│       └── firebase.json
└── .github/
    └── workflows/
        └── deploy.yml              ← GitHub Actions（ビルド＋デプロイ）
```

---

## 7. 開発フェーズ

### Phase 1 - コアゲームプレイ（MVP）
- [ ] Phaser 3 + Vite + TypeScript セットアップ
- [ ] プレイヤー（宇宙船）の移動・自動射撃
- [ ] 敵のグリッド配置・下降移動
- [ ] 衝突判定・ダメージシステム
- [ ] XP・レベルアップシステム
- [ ] スキル選択UI（3択）
- [ ] Wave管理・難易度カーブ
- [ ] 結果画面
- [ ] ローカルストレージでのデータ保存

### Phase 2 - 収益化・バックエンド
- [ ] Firebase セットアップ（Auth/Firestore/Functions）
- [ ] ユーザー認証（匿名認証→Google/Apple連携）
- [ ] Firestore データ同期
- [ ] Capacitor でiOS/Android化
- [ ] AdMob 統合（バナー＋リワード）
- [ ] RevenueCat 統合（IAP）
- [ ] 広告削除購入フロー
- [ ] メタ進行（格納庫アップグレード）

### Phase 3 - UGC・ソーシャル
- [ ] カスタムスキン アップロードUI
- [ ] Firebase Storage + Cloud Vision 審査
- [ ] スキンマーケットプレイス
- [ ] 収益分配システム（Firebase Functions）
- [ ] グローバルランキング（リーダーボード）
- [ ] デイリーミッション・実績システム

### Phase 4 - コンテンツ拡充
- [ ] 新敵タイプ追加
- [ ] ボスバトル強化
- [ ] シーズン制（定期コンテンツ更新）
- [ ] フレンドとのスコア比較
- [ ] ギルド/コープ機能

---

## 8. 流行り要素チェックリスト

| 要素 | 参考ゲーム | 採用 |
|---|---|---|
| ローグライトスキル選択 | Vampire Survivors / アーチャー伝説 | ✅ Phase 1 |
| 自動射撃（片手操作） | アーチャー伝説 / Brotato | ✅ Phase 1 |
| ブロック崩し的な敵配置 | Space Invaders 進化系 | ✅ Phase 1 |
| メタ進行・永続強化 | Dead Cells / Hades | ✅ Phase 2 |
| UGCマーケット | Roblox / Fortnite | ✅ Phase 3 |
| リワード広告（任意視聴） | ほぼ全モバイルゲーム | ✅ Phase 2 |
| デイリーミッション | Clash Royale / 原神 | ✅ Phase 3 |
| シーズン制 | フォートナイト / PUBG Mobile | Phase 4 |
| ハプティクスフィードバック | モバイルゲーム全般 | ✅ Phase 2（Capacitor） |
| パーティクル爆発エフェクト | 全シューター | ✅ Phase 1 |
| BGM/SEのフィードバック | 全ゲーム | ✅ Phase 1 |

---

## 9. セキュリティ・不正防止

```
Firestore Rules:
  - スコアの書き込みはFirebase Functionsのみ許可
  - ユーザーは自分のデータのみ読み書き可能
  - スキンのステータス変更はFunctionsのみ

Functions:
  - IAP購入はRevenueCatのWebhookで検証してから通貨付与
  - スコアはサーバー側で検証（wave数と整合性チェック）
  - 取引履歴を全件Firestoreに保存
```

---

## 10. 技術的な注意点

1. **AdMob とCapacitorの組み合わせ**: `@capacitor-community/admob` を使用。テスト中はテスト広告IDを使うこと
2. **Phaser の画面サイズ**: 縦型スマホ（9:16）に最適化。`scale: { mode: Phaser.Scale.FIT }` で対応
3. **Firebase の匿名認証**: ゲスト状態でも進行データを保存し、Google/Apple連携時にデータ引き継ぎ
4. **スキン画像の最適化**: アップロード時にCloud FunctionsでWebPに変換してStorage保存
5. **オフライン対応**: Firestoreのオフラインキャッシュを有効化し、通信不安定でもプレイ可能に
