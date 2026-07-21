# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## コマンド

```bash
npm run dev      # 開発サーバー (Vite HMR)
npm run build    # tsc -b で型チェック → vite build (出力先: docs/)
npm run lint     # ESLint
npm run preview  # ビルド成果物のプレビュー
```

テストフレームワークは未導入（テストスクリプト・テストファイルともに存在しない）。

## アーキテクチャ

React 19 + TypeScript + Vite (SWC) + MUI v7 (Emotion) の SPA。あみだくじ 1 機能のみ。

- `src/main.tsx` → `src/App.tsx` → `src/Amidakuji.tsx` という単純な 3 階層。実質すべてのコードが `Amidakuji.tsx` にある。
- `Amidakuji.tsx` は 2 部構成:
  - 前半: `Amidakuji` コンポーネント（入力フォーム、state、Canvas 描画の `useEffect`）
  - 後半: 純粋関数 `generateAmidakujiData(participants, results, height=10, lineDensity=0.3)` とその型定義（`AmidakujiLine` / `AmidakujiResultMapping`）。横線の生成と最終マッピングの計算はすべてここに閉じている。
- 横線生成のルール: 同じ段で左隣に線が引かれている場合はその位置に線を引かない（`|--|--|` のような連結を防ぐため）。この不変条件を壊すと結果の追跡ロジックが破綻する。

### 注意すべき暗黙の結合

- Canvas 描画側 (`useEffect` 内の `horizontalLineHeight` 計算) が `generateAmidakujiData` の `height` デフォルト値 **10** をハードコードで前提にしている。`height` を変更する場合は両方を直す必要がある。
- 描画時の参加者名・結果名は `participants` / `results` の生 state をインデックス参照しているが、`generateAmidakujiData` には空文字を除外した配列を渡している。空欄が混ざるとラベルと縦線の対応がずれる。

### URL クエリパラメータ

初期値をクエリから読み込む: `?p=A,B,C&r=賞1,賞2,賞3`（`p`=参加者、`r`=結果、カンマ区切り）。マウント時に一度読むだけで、state 変更時に URL へ書き戻す処理はない。

## デプロイ

GitHub Pages 想定。`vite.config.ts` で `base: '/moke-amida/'`、`build.outDir: 'docs'` を設定しており、**`docs/` はビルド成果物だがリポジトリにコミットされている**（`.gitignore` 対象外）。デプロイ用の変更をする際は `npm run build` の結果を含めてコミットする。`base` はリポジトリ名（`mokeamida`）と一致していないので、パスを触る際は注意。

## その他

`README.md` は Vite の React テンプレートのままで、このプロジェクト固有の情報は含まれていない。
