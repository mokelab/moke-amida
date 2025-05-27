import "./App.css";
import Amidakuji from "./Amidakuji"; // Amidakujiコンポーネントをインポート

function App() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>あみだくじ機能</h1>
      <Amidakuji /> {/* Amidakujiコンポーネントを配置 */}
    </div>
  );
}

export default App;
