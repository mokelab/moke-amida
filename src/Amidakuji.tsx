import React, { useState, useRef, useEffect } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const Amidakuji: React.FC = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const initialParticipants = queryParams.get("p")?.split(",") || [""];
  const initialResults = queryParams.get("r")?.split(",") || [""];

  const [participants, setParticipants] =
    useState<string[]>(initialParticipants);
  const [results, setResults] = useState<string[]>(initialResults);
  const [amidaResult, setAmidaResult] = useState<string[] | null>(null);
  const [amidaData, setAmidaData] = useState<{
    lines: AmidakujiLine[];
    finalMapping: AmidakujiResultMapping[];
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

  const removeParticipantField = (index: number) => {
    const newParticipants = participants.filter((_, i) => i !== index);
    setParticipants(newParticipants.length > 0 ? newParticipants : [""]);
  };

  const removeResultField = (index: number) => {
    const newResults = results.filter((_, i) => i !== index);
    setResults(newResults.length > 0 ? newResults : [""]);
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

    // あみだくじのロジック（今回は簡易的にシャッフル）
    //const shuffledResults = [...resultList].sort(() => Math.random() - 0.5);

    //const finalResults = participantList.map(
    //      (participant, index) => `${participant} -> ${shuffledResults[index]}`
    //  );

    const r = generateAmidakujiData(participantList, resultList);
    setAmidaData(r); // Store the full data including lines
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

    const numParticipants = participants.filter((p) => p.trim() !== "").length;
    if (numParticipants === 0) return;

    const verticalLineSpacing =
      (canvasWidth - 2 * padding) / (numParticipants - 1);
    const horizontalLineHeight =
      (canvasHeight - 2 * padding - 2 * textHeight) / 10; // 10 is default height from generateAmidakujiData

    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw vertical lines and participant/result names
    for (let i = 0; i < numParticipants; i++) {
      const x = padding + i * verticalLineSpacing;

      // Draw vertical line
      ctx.beginPath();
      ctx.moveTo(x, padding + textHeight);
      ctx.lineTo(x, canvasHeight - padding - textHeight);
      ctx.stroke();

      // Draw participant name at top
      ctx.fillStyle = "blue";
      ctx.fillText(
        participants[i] || `参加者${i + 1}`,
        x,
        padding + textHeight / 2
      );

      // Draw result name at bottom
      ctx.fillStyle = "green";
      ctx.fillText(
        results[i] || `結果${i + 1}`,
        x,
        canvasHeight - padding - textHeight / 2
      );
    }

    // Draw horizontal lines
    ctx.strokeStyle = "red";
    amidaData.lines.forEach((line) => {
      const x1 = padding + line.columnIndex * verticalLineSpacing;
      const x2 = padding + (line.columnIndex + 1) * verticalLineSpacing;
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
  }, [amidaData, participants, results]); // Redraw when amidaData, participants, or results change

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
    </Box>
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
 * あみだくじの線と最終結果を生成する関数
 *
 * @param participants 参加者名の配列 (例: ["A", "B", "C"])
 * @param results 結果名の配列 (例: ["賞品1", "賞品2", "賞品3"])
 * participants と同じ長さであることを期待します。
 * @param height あみだくじの高さ（横線を引くことができる階層の数）。デフォルトは10。
 * @param lineDensity 横線が引かれるおおよその確率（0から1）。数値が高いほど線が多くなります。デフォルトは0.3。
 * @returns 生成された横線のリストと、各参加者の最終的な結果のマッピング
 */
function generateAmidakujiData(
  participants: string[],
  results: string[],
  height: number = 10,
  lineDensity: number = 0.3
): { lines: AmidakujiLine[]; finalMapping: AmidakujiResultMapping[] } {
  const numParticipants = participants.length;

  // 入力値のバリデーション
  if (numParticipants === 0) {
    return { lines: [], finalMapping: [] };
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

  return { lines: generatedLines, finalMapping };
}

export default Amidakuji;
