# featlis.github.io 作り直し（rebuild/portfolio-v2）ワークスルー

対象リポジトリ: `featlis/featlis.github.io` / ブランチ: `rebuild/portfolio-v2`
期間: 2026-11-18 〜 2026-11-19

## 1. ワークスルー（作業の流れ）

### Step 0: 現状診断（2026-11-18）
- Modern Web Guidance の `legacy-scan` を実行。検出は「Font Awesome CDN に SRI がない」8件のみ。
- 画像・コードの実測: `assets/clipflyout/preview.jpg` が約526KBでサイト全体（約704KB）の大半。`<img>` 48件に `loading` 属性なし。
- unslop 監査: 見出しの絵文字5件、ガラス風カード（backdrop-filter）、旧テーマの紫がかった影の残骸、線形グラデーション5件。
- コントラスト実測: アクセント色 `#ff6584` は白背景で 2.82:1（AA基準 4.5:1 未達）。

### Step 1〜2: v1 / v2（テーマ刷新〜大胆版）
- 新テーマ（パステル×控えめサイバー）で共通CSS/JSを全面刷新し、トップに適用（push: `005caede`）。
- 大胆版（ヒーロー2カラム化、キーワードマーキー、Projects の番号付き色バンド化）を追加。
- 本人指示で ClipFlyout 実演デモは撤去。入場時の演出（セッション1回・クリックでスキップ可）を追加。
- 下位7ページに基調色を付与し、Font Awesome へ SRI を付与（legacy-scan の指摘8件を解消）。一式を push（`51c24f0`）。

### 設計のやり直し（2026-11-19）
- 本人から「ガラッと変えたかったのにほぼ構造一緒」と指摘があり、「壊さない指示はこのブランチでは完全に無視して丸っと刷新」が指示された。ただし最終条件として **URL とフォルダ階層は今と同じに保つ** ことが確定。
- 調べ直し: 2026年の受賞系トレンド（ベントーは土台として定番だが、それ自体はアイデアにならない／平らな線形グラデは古く、淡いメッシュの気配が現在形／キネティックタイポは「1回動いて静止」／ダークモード標準化）、DesignBookmark 経由で Refero の UI パターン、MWG の各ガイドを確認。
- 設計案「パステル・コンソール」を提示し、変更したい点3件（タイピングとパーティクルの扱い、つぼみバッジ文言、フォント入れ替え）を本人が確認。
  - タイピングは **タイトルだけ** 残す形に修正決定。
  - タイトル以外の表示は、モックで示した「語ごとにポンッと出る出現＋淡メッシュと細グリッドの地、全部ページ内に表示」の形に確定。
  - コンテンツを **ポップアップで見せる方式は絶対ダメ** と明確に否定された。

### v3 実装（パステル・コンソール）
- トップをベントー型ダッシュボード（10タイル）に再構成。全8ページに共通シェル（トップバー、ダークモード、Ctrl+K パレット、入場演出）を適用。
- つぼみバッジを「Phase 3 進行中」に更新。
- 改善1〜5を実施: (1) Font Awesome を公式SVGのインライン埋め込みに置き換え CDN 読み込みを廃止、(2) GitHub Stats カードのダークモード連動、(3) OGP専用画像 `assets/ogp.png` を作成し全ページに設定、(4) 世界観に合わせた `404.html` を追加、(5) Google Fonts への preconnect を全ページに追加。
- `assets/clipflyout/preview.jpg` は実物ではなく仮のイメージ画像のため、本人の指示でトップと ClipFlyout ページから掲載を除去（画像ファイル自体は残置。公開中の main は本人の決定で一旦放置）。
- push: テキスト11ファイルを `92d14c6` で送信。`assets/ogp.png` は送信手段がテキスト専用のため送れず、本人が手動でアップロードして配置完了を確認済み。

## 2. 設計（パステル・コンソール）

コンセプト: 作ったもの全部を「かわいい計器盤（コンソール）」のモジュールとして並べる。

- **骨格**: トップはベントーグリッド（12カラム）。タイルの大きさ＝重要度。ヒーロー／ステータス／ClipFlyout／つぼみ／スキル／Bot／About／GitHub／配布／連絡の10タイル。
- **色**: パステル6色（ピンク #ffd6e7、ミント #c8f4de、ラベンダー #e3dcff、ブルー #cdeffd、イエロー #ffefc2、ピーチ #ffe0d1）＋濃紺インク #2b2440。背景は淡いメッシュ（radial-gradient の重なり）＋細グリッド。カードはベタ塗り＋太枠＋ハードシャドウ。
- **ダークモード**: 深紺地 #16121f にパステルが乗る配色へ CSS 変数で切替。初期値は OS 連動、選択は localStorage に記憶。テーマ初期化スクリプトを head に置いて描画前適用（FOUC防止）。
- **文字**: 見出し Zen Maru Gothic、本文 M PLUS Rounded 1c、英字 Space Grotesk、数字・ラベル JetBrains Mono。
- **動きの規則**: タイトルだけタイピング。その他は出現時に1回だけポンッと出て静止（スクロール連動の出現も同系）。常時アニメーションは波形・稼働ドット・時計など計器らしいものだけ。`prefers-reduced-motion` では対象ごとに止める（MWG motion ガイド準拠、一律 0.01ms 化はしない）。
- **機能**: ダークモード切替、Ctrl+K クイック移動パレット、JST ライブ時計、数値カウントアップ、スキルの絞り込みチップ、スクロール進捗バー、トップへ戻るボタン、PJAX＋View Transitions、入場演出（セッション1回・スキップ可）。
- **制約**: URL とフォルダ階層は現行のまま（8ページ＋404.html 追加のみ）。コンテンツはポップアップで見せない。

## 3. 使ったもの

### スキル・ツール
- **unslop**（カスタムスキル、heydamir/unslop、CC BY 4.0）: 監査→方向性→パスの順序で実施。
- **Modern Web Guidance**（GoogleChrome/modern-web-guidance、Apache-2.0）: `legacy-scan` で診断、`retrieve` で motion / secure-external-subresources ガイドを読み合わせて実装、`search` で dark-mode / dark-mode-toggle / css-layout / color ガイドを確認。
- **GitHub コネクタ（push-files）**: ブランチへの送信に使用（テキストファイル専用のためバイナリは対象外）。
- **Python + Pillow**: OGP画像（1200×630）の生成。

### 参考にした情報源
- **DesignBookmark**（https://designbookmark.com/）: 掲載されていた **Refero**（https://refero.design/）に辿り、ダッシュボード／カード＆タイル／ダークモードの実例パターンを確認。DesignBookmark の個別ツール自体は採用していない。
- **2026年 Web デザイントレンド調査**（Awwwards 系の受賞傾向まとめ、toimi.pro / inspirefusion などのトレンド記事）: ベントーの位置づけ、メッシュグラデーション、キネティックタイポの運用、ダークモード標準化の根拠として使用。

### 素材・ライブラリ
- **Font Awesome 6.4.0 公式 SVG**（アイコンは CC BY 4.0、コードは MIT）: 31種のアイコンをインライン SVG として埋め込み。
- **Google Fonts**（いずれも OFL）: Zen Maru Gothic / M PLUS Rounded 1c / Space Grotesk / JetBrains Mono。
- 既存素材のクレジットはサイト内フッターの表記どおり（SAWARATSUKI のロゴ、github-readme-stats 系カード、readme-typing-svg）。
