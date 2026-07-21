import React, { useState, useRef, useEffect } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";

const Amidakuji: React.FC = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const initialParticipants = queryParams.get("p")?.split(",") || [""];
  const initialResults = queryParams.get("r")?.split(",") || [""];

  const [participants, setParticipants] =
    useState<string[]>(initialParticipants);
  const [results, setResults] = useState<string[]>(initialResults);
  const [amidaResult, setAmidaResult] = useState<string[] | null>(null);
  const [shuffleParticipants, setShuffleParticipants] = useState<boolean>(true);
  // 片方を削除して数が余ったとき、どちら側から 1 つ削除するかを選ばせるダイアログの状態。
  // null ならダイアログ非表示。
  const [pendingDeletion, setPendingDeletion] = useState<DeletionSide | null>(
    null
  );
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [amidaData, setAmidaData] = useState<{
    lines: AmidakujiLine[];
    finalMapping: AmidakujiResultMapping[];
    height: number;
    participants: string[]; // 実際に計算・描画に使った順序
    results: string[];
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleParticipantChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newParticipants = [...participants];
    newParticipants[index] = event.target.value;
    setParticipants(newParticipants);
  };

  const handleResultChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newResults = [...results];
    newResults[index] = event.target.value;
    setResults(newResults);
  };

  const addParticipantField = () => {
    setParticipants([...participants, ""]);
  };

  const addResultField = () => {
    setResults([...results, ""]);
  };

  // 実際に 1 件消すだけの処理。ダイアログの判定は行わない（ダイアログ経由の削除で
  // 再びダイアログが開くのを防ぐため、判定と分離している）。
  // setState は非同期なので、判定に使えるよう削除後の配列を返す。
  const applyDeletion = (
    items: string[],
    setItems: (next: string[]) => void,
    index: number
  ): string[] => {
    const next = items.filter((_, i) => i !== index);
    setItems(next.length > 0 ? next : [""]);
    return next;
  };

  const openDeletionPicker = (side: DeletionSide) => {
    setPendingIndex(null);
    setPendingDeletion(side);
  };

  const removeParticipantField = (index: number) => {
    const next = applyDeletion(participants, setParticipants, index);
    // 結果が余るなら、どれを消すかを選ばせる（同じ index を自動で消すと当たりが
    // 黙って消えてしまうため）
    if (countFilled(next) < countFilled(results)) {
      openDeletionPicker("result");
    }
  };

  const removeResultField = (index: number) => {
    const next = applyDeletion(results, setResults, index);
    if (countFilled(next) < countFilled(participants)) {
      openDeletionPicker("participant");
    }
  };

  const confirmPendingDeletion = () => {
    if (pendingDeletion !== null && pendingIndex !== null) {
      if (pendingDeletion === "result") {
        applyDeletion(results, setResults, pendingIndex);
      } else {
        applyDeletion(participants, setParticipants, pendingIndex);
      }
    }
    setPendingDeletion(null);
  };

  const runAmidakuji = () => {
    const participantList = participants.filter((p) => p.trim() !== "");
    const resultList = results.filter((r) => r.trim() !== "");

    if (participantList.length === 0 || resultList.length === 0) {
      alert("参加者と結果を入力してください。");
      return;
    }
    if (participantList.length !== resultList.length) {
      alert("参加者の数と結果の数を一致させてください。");
      return;
    }

    // あみだくじは横線が少ないと開始位置に留まりやすいので、
    // 参加者の並び自体をシャッフルして「真下が当たり」の偏りを減らす
    const orderedParticipants = shuffleParticipants
      ? shuffleArray(participantList)
      : participantList;

    const r = generateAmidakujiData(orderedParticipants, resultList);
    // 描画で参照するラベルは、生 state ではなく実際に計算に使った配列を保持する
    setAmidaData({
      ...r,
      participants: orderedParticipants,
      results: resultList,
    });
    setAmidaResult(
      r.finalMapping.map(
        (mapping) => `${mapping.participant} -> ${mapping.result}`
      )
    );
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !amidaData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const padding = 30; // Padding from edges for drawing
    const textHeight = 20; // Space for participant/result names

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const numParticipants = amidaData.participants.length;
    if (numParticipants === 0) return;

    // 参加者が1人のときは間隔が定義できない（0除算）ので、中央に1本だけ描く
    const verticalLineSpacing =
      numParticipants === 1
        ? 0
        : (canvasWidth - 2 * padding) / (numParticipants - 1);
    const originX = numParticipants === 1 ? canvasWidth / 2 : padding;
    const horizontalLineHeight =
      (canvasHeight - 2 * padding - 2 * textHeight) / amidaData.height;

    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw vertical lines and participant/result names
    for (let i = 0; i < numParticipants; i++) {
      const x = originX + i * verticalLineSpacing;

      // Draw vertical line
      ctx.beginPath();
      ctx.moveTo(x, padding + textHeight);
      ctx.lineTo(x, canvasHeight - padding - textHeight);
      ctx.stroke();

      // Draw participant name at top
      ctx.fillStyle = "blue";
      ctx.fillText(
        amidaData.participants[i] || `参加者${i + 1}`,
        x,
        padding + textHeight / 2
      );

      // Draw result name at bottom
      ctx.fillStyle = "green";
      ctx.fillText(
        amidaData.results[i] || `結果${i + 1}`,
        x,
        canvasHeight - padding - textHeight / 2
      );
    }

    // Draw horizontal lines
    ctx.strokeStyle = "red";
    amidaData.lines.forEach((line) => {
      const x1 = originX + line.columnIndex * verticalLineSpacing;
      const x2 = originX + (line.columnIndex + 1) * verticalLineSpacing;
      const y =
        padding +
        textHeight +
        line.level * horizontalLineHeight +
        horizontalLineHeight / 2; // Center of the level

      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    });
  }, [amidaData]); // 描画に必要な情報はすべて amidaData に入っている

  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid grey",
        borderRadius: "8px",
        backgroundColor: "white",
      }}
    >
      <Typography
        variant="h5"
        component="h2"
        gutterBottom
        sx={{ color: "black" }}
      >
        あみだくじ
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          sx={{ color: "black" }}
        >
          参加者
        </Typography>
        {participants.map((participant, index) => (
          <Box
            key={index}
            sx={{ display: "flex", alignItems: "center", mb: 1 }}
          >
            <TextField
              label={`参加者 ${index + 1}`}
              variant="outlined"
              fullWidth
              value={participant}
              onChange={(e) => handleParticipantChange(index, e)}
              sx={{ mr: 1 }}
            />
            {participants.length > 1 && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => removeParticipantField(index)}
              >
                削除
              </Button>
            )}
          </Box>
        ))}
        <Button variant="outlined" onClick={addParticipantField}>
          参加者を追加
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          sx={{ color: "black" }}
        >
          結果
        </Typography>
        {results.map((result, index) => (
          <Box
            key={index}
            sx={{ display: "flex", alignItems: "center", mb: 1 }}
          >
            <TextField
              label={`結果 ${index + 1}`}
              variant="outlined"
              fullWidth
              value={result}
              onChange={(e) => handleResultChange(index, e)}
              sx={{ mr: 1 }}
            />
            {results.length > 1 && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => removeResultField(index)}
              >
                削除
              </Button>
            )}
          </Box>
        ))}
        <Button variant="outlined" onClick={addResultField}>
          結果を追加
        </Button>
      </Box>

      <Box sx={{ mb: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={shuffleParticipants}
              onChange={(e) => setShuffleParticipants(e.target.checked)}
            />
          }
          label="参加者の並びをシャッフルする"
          sx={{ color: "black" }}
        />
      </Box>

      <Button variant="contained" onClick={runAmidakuji} sx={{ mb: 2 }}>
        あみだくじを実行
      </Button>

      {amidaData && (
        <Box
          sx={{
            mt: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" sx={{ color: "black", mb: 1 }}>
            あみだくじ図
          </Typography>
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            style={{ border: "1px solid #ccc", backgroundColor: "#f9f9f9" }}
          />
        </Box>
      )}

      {amidaResult && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ color: "black" }}>
            結果:
          </Typography>
          {amidaResult.map((res, index) => (
            <Typography key={index} sx={{ color: "black" }}>
              {res}
            </Typography>
          ))}
        </Box>
      )}

      <DeletionPickerDialog
        side={pendingDeletion}
        items={pendingDeletion === "participant" ? participants : results}
        selectedIndex={pendingIndex}
        onSelect={setPendingIndex}
        onCancel={() => setPendingDeletion(null)}
        onConfirm={confirmPendingDeletion}
      />
    </Box>
  );
};

type DeletionSide = "participant" | "result";

const DELETION_LABELS: Record<
  DeletionSide,
  { title: string; description: string }
> = {
  result: {
    title: "削除する結果を選んでください",
    description:
      "参加者を削除したため、結果の数が多くなっています。当たりが消えないよう、削除する結果を選んでください。",
  },
  participant: {
    title: "削除する参加者を選んでください",
    description:
      "結果を削除したため、参加者の数が多くなっています。削除する参加者を選んでください。",
  },
};

/**
 * 余っている側の項目を 1 つ選んで削除させるダイアログ。
 *
 * `items` は生の配列を受け取り、空欄を除外した候補だけを表示する。
 * 除外後も **元の配列でのインデックス** を選択値として保持すること
 * （filter 後のインデックスで削除すると別の項目が消える）。
 */
const DeletionPickerDialog: React.FC<{
  side: DeletionSide | null;
  items: string[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ side, items, selectedIndex, onSelect, onCancel, onConfirm }) => {
  if (side === null) return null;

  const candidates = items
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => value.trim() !== "");
  const labels = DELETION_LABELS[side];

  return (
    <Dialog open onClose={onCancel}>
      <DialogTitle>{labels.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{labels.description}</DialogContentText>
        <RadioGroup
          value={selectedIndex === null ? "" : String(selectedIndex)}
          onChange={(e) => onSelect(Number(e.target.value))}
          sx={{ mt: 1 }}
        >
          {candidates.map(({ value, index }) => (
            <FormControlLabel
              key={index}
              value={String(index)}
              control={<Radio />}
              label={value}
            />
          ))}
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>削除しない</Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={selectedIndex === null}
        >
          削除
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * あみだくじの横線の情報を表すインターフェース
 */
interface AmidakujiLine {
  level: number; // 線が存在する階層（0から始まる）
  columnIndex: number; // 線が引かれる左側の縦線のインデックス（0から始まる）
  // columnIndex と columnIndex + 1 の間に線があることを示す
}

/**
 * あみだくじの最終結果のマッピングを表すインターフェース
 */
interface AmidakujiResultMapping {
  participant: string; // 参加者名
  result: string; // 対応する結果名
}

/**
 * 空欄を除いた実質の入力数。
 *
 * 削除ダイアログの発火判定は、runAmidakuji が空欄を除外してから数を比較するのと
 * 同じ基準にそろえる必要がある。
 */
function countFilled(items: string[]): number {
  return items.filter((v) => v.trim() !== "").length;
}

/**
 * 配列をシャッフルした新しい配列を返す（Fisher-Yates）
 *
 * `sort(() => Math.random() - 0.5)` は分布が偏るため使わない。
 */
function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * あみだくじの線と最終結果を生成する関数
 *
 * @param participants 参加者名の配列 (例: ["A", "B", "C"])
 * @param results 結果名の配列 (例: ["賞品1", "賞品2", "賞品3"])
 * participants と同じ長さであることを期待します。
 * @param height あみだくじの高さ（横線を引くことができる階層の数）。
 * デフォルトは参加者数に応じて増える（最低10）。段数が参加者数に対して少ないと
 * 開始位置に留まりやすくなるため。
 * @param lineDensity 横線が引かれるおおよその確率（0から1）。数値が高いほど線が多くなります。デフォルトは0.3。
 * @returns 生成された横線のリスト、各参加者の最終的な結果のマッピング、実際に使った段数
 */
function generateAmidakujiData(
  participants: string[],
  results: string[],
  height: number = Math.max(10, participants.length * 4),
  lineDensity: number = 0.3
): {
  lines: AmidakujiLine[];
  finalMapping: AmidakujiResultMapping[];
  height: number;
} {
  const numParticipants = participants.length;

  // 入力値のバリデーション
  if (numParticipants === 0) {
    return { lines: [], finalMapping: [], height };
  }
  if (participants.length !== results.length) {
    console.warn(
      "警告: 参加者の数 (" +
        participants.length +
        ") と結果の数 (" +
        results.length +
        ") が一致しません。" +
        "結果の割り当てが不正確になる可能性があります。"
    );
    // 必要であればエラーをスローする:
    // throw new Error("参加者の数と結果の数が一致しません。");
  }

  if (numParticipants === 1) {
    return {
      lines: [],
      finalMapping: [
        {
          participant: participants[0],
          result: results[0] || "結果未定義", // resultsが空配列の場合も考慮
        },
      ],
      height,
    };
  }

  // horizontalLines[level][columnIndex] が true なら、level段目の columnIndex と columnIndex+1 の間に線がある
  const horizontalLines: boolean[][] = Array(height)
    .fill(null)
    .map(() => Array(numParticipants - 1).fill(false));

  const generatedLines: AmidakujiLine[] = [];

  // 横線をランダムに生成
  for (let level = 0; level < height; level++) {
    for (let col = 0; col < numParticipants - 1; col++) {
      // 左隣 (col-1) に既に線が引かれていなければ、現在の場所 (col) に線を引くチャンスがある
      // これにより、同じ段で `|--|--|` のような実質的に一本に見える線を避ける
      if (
        (col === 0 || !horizontalLines[level][col - 1]) &&
        Math.random() < lineDensity
      ) {
        horizontalLines[level][col] = true;
        generatedLines.push({ level, columnIndex: col });
      }
    }
  }

  // 各参加者の最終的な到達地点を計算
  const finalMapping: AmidakujiResultMapping[] = [];
  for (let startIdx = 0; startIdx < numParticipants; startIdx++) {
    let currentTrack = startIdx; // 現在追跡中の縦線のインデックス

    for (let level = 0; level < height; level++) {
      if (currentTrack > 0 && horizontalLines[level][currentTrack - 1]) {
        // 現在地の左側に線があれば、左に移動
        currentTrack--;
      } else if (
        currentTrack < numParticipants - 1 &&
        horizontalLines[level][currentTrack]
      ) {
        // 現在地の右側に線があれば（つまり、現在の縦線と右隣の縦線の間に線があれば）、右に移動
        currentTrack++;
      }
      // どちらにも線がなければ、そのまま直進
    }
    finalMapping.push({
      participant: participants[startIdx],
      // results 配列の長さが不足する場合も考慮し、安全にアクセス
      result:
        results[currentTrack] !== undefined
          ? results[currentTrack]
          : `結果${currentTrack + 1}(インデックス外)`,
    });
  }

  return { lines: generatedLines, finalMapping, height };
}

export default Amidakuji;
