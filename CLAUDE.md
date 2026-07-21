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
  - 中盤: 削除ダイアログのプレゼンテーションコンポーネント `DeletionPickerDialog` と、その文言テーブル `DELETION_LABELS`
  - 後半: 純粋関数 `countFilled` / `shuffleArray` / `generateAmidakujiData(participants, results, height, lineDensity=0.3)` とその型定義（`AmidakujiLine` / `AmidakujiResultMapping`）。横線の生成と最終マッピングの計算はすべてここに閉じている。
- 横線生成のルール: 同じ段で左隣に線が引かれている場合はその位置に線を引かない（`|--|--|` のような連結を防ぐため）。この不変条件を壊すと結果の追跡ロジックが破綻する。

### 参加者・結果の削除（数を揃えるためのダイアログ）

`runAmidakuji` は空欄を除いた参加者数と結果数が一致しないと実行できない。そのため、片方を削除して数が余ったときに、余っている側から 1 つ選んで削除させるダイアログを出す。

- 発火条件は `countFilled`（`trim()` が空でない要素数）での比較。`runAmidakuji` のバリデーションと同じ基準にそろえること。参加者を削除して `countFilled(参加者) < countFilled(結果)` なら結果を選ばせ、結果を削除した場合はその逆。同じ index の項目を自動で消す実装にはしない（当たりが黙って消えるため）。
- `applyDeletion`（実際に消すだけ）と `removeParticipantField` / `removeResultField`（消した後にダイアログ発火を判定する）は意図的に分けてある。ダイアログ経由の削除は `applyDeletion` を直接呼ぶので、ダイアログが連鎖して開くことはない。
- ダイアログの候補は空欄を除外して表示するが、選択値は **元の配列でのインデックス** を保持する。`filter` 後のインデックスで削除すると別の項目が消える。

### 偏り対策（真下に当たりやすい問題への対応）

段数が参加者数に対して少ないと、各参加者が開始位置に留まる確率が上がる。対策が 2 つ入っている:

- `height` のデフォルトは `Math.max(10, participants.length * 4)`。参加者数に応じて自動で段数が増える。
- 「参加者の並びをシャッフルする」チェックボックス（`shuffleParticipants` state、デフォルト ON）。ON のとき `shuffleArray`（Fisher-Yates）で参加者の順序を入れ替えてから `generateAmidakujiData` に渡す。結果側の順序は入力順のまま。

`sort(() => Math.random() - 0.5)` は分布が偏るのでシャッフルには使わないこと。

### 描画データの受け渡し

Canvas 描画は生 state の `participants` / `results` を一切参照せず、`amidaData` に入っている情報だけで完結している（`useEffect` の依存配列も `[amidaData]` のみ）。`amidaData` は `generateAmidakujiData` の戻り値（`lines` / `finalMapping` / `height`）に加えて、**実際に計算に使った** `participants`（シャッフル後・空欄除外済み）と `results` を保持する。

描画に必要な情報を増やす場合は、生 state を直接読まずに `amidaData` に載せること。シャッフルや空欄除外があるため、生 state のインデックスは図の縦線の並びと一致しない。

### URL クエリパラメータ

初期値をクエリから読み込む: `?p=A,B,C&r=賞1,賞2,賞3`（`p`=参加者、`r`=結果、カンマ区切り）。マウント時に一度読むだけで、state 変更時に URL へ書き戻す処理はない。

## デプロイ

GitHub Pages 想定。`vite.config.ts` で `base: '/moke-amida/'`、`build.outDir: 'docs'` を設定しており、**`docs/` はビルド成果物だがリポジトリにコミットされている**（`.gitignore` 対象外）。デプロイ用の変更をする際は `npm run build` の結果を含めてコミットする。`base` はリポジトリ名（`mokeamida`）と一致していないので、パスを触る際は注意。

## その他

`README.md` は Vite の React テンプレートのままで、このプロジェクト固有の情報は含まれていない。
