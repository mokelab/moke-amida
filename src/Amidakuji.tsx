import React, { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const Amidakuji: React.FC = () => {
  const [participants, setParticipants] = useState<string[]>([""]);
  const [results, setResults] = useState<string[]>([""]);
  const [amidaResult, setAmidaResult] = useState<string[] | null>(null);

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
    const shuffledResults = [...resultList].sort(() => Math.random() - 0.5);

    const finalResults = participantList.map(
      (participant, index) => `${participant} -> ${shuffledResults[index]}`
    );
    setAmidaResult(finalResults);
  };

  return (
    <Box sx={{ p: 2, border: "1px solid grey", borderRadius: "8px" }}>
      <Typography variant="h5" component="h2" gutterBottom>
        あみだくじ
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" component="h3" gutterBottom>
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
        <Typography variant="h6" component="h3" gutterBottom>
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

      {amidaResult && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">結果:</Typography>
          {amidaResult.map((res, index) => (
            <Typography key={index}>{res}</Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Amidakuji;
