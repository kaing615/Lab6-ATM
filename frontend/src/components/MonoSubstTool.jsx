import React, { useState, useMemo, useCallback } from "react";
import axios from "axios";
import MappingGrid from "./MappingGrid";
import StatisticsGrid from "./StatisticsGrid";

const api = "http://localhost:4000";
axios.defaults.baseURL = api;
axios.defaults.timeout = 600000;

// ✅ DEBOUNCE UTILITY
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function MonoSubstTool() {
  const [ciphertext, setCiphertext] = useState("");
  const [mapping, setMapping] = useState(null);
  const [plaintext, setPlaintext] = useState("");
  const [score, setScore] = useState(null);
  const [stats, setStats] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // ✅ NEW: Solver configuration
  const [solverConfig, setSolverConfig] = useState({
    algorithm: "simulated-annealing",
    restarts: 20,
    iterations: 3000,
    initialTemp: 10.0,
    coolingRate: 0.95,
  });

  // ✅ NEW: Progress tracking
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    bestScore: 0,
  });

  // ✅ MEMOIZE: Character frequencies
  const characterFrequencies = useMemo(() => {
    if (!ciphertext) return {};
    const freq = {};
    for (let c = 97; c <= 122; c++) freq[String.fromCharCode(c)] = 0;
    for (const ch of ciphertext) {
      if (/[a-zA-Z]/.test(ch)) {
        freq[ch.toLowerCase()]++;
      }
    }
    return freq;
  }, [ciphertext]);

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    setMsg("");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const resp = await axios.post(`${api}/api/uploadCiphertext`, fd);
      const text = resp.data.ciphertext;

      setCiphertext(text);
      setMapping(null);
      setPlaintext("");
      setScore(null);
      setProgress({ current: 0, total: 0, bestScore: 0 });

      const s = await axios.post(`${api}/api/stats`, { ciphertext: text });
      setStats(s.data.freq);
    } catch (e) {
      console.error(e);
      setMsg("❌ Không thể upload file.");
    } finally {
      setBusy(false);
    }
  };

  const initMapping = async () => {
    if (!ciphertext) return setMsg("⚠️ Hãy nhập ciphertext.");
    setBusy(true);
    setMsg("⏳ Khởi tạo mapping...");

    try {
      const resp = await axios.post(`${api}/api/initMapping`, { ciphertext });
      setMapping(resp.data.mapping);
      setPlaintext(resp.data.plaintext);
      setScore(resp.data.score);
      setMsg("✔️ Khởi tạo xong!");
    } catch (e) {
      console.error(e);
      setMsg("❌ Lỗi server khi tạo mapping.");
    } finally {
      setBusy(false);
    }
  };

  // ✅ IMPROVED: Auto solve with config
  const autoSolve = async () => {
    if (!ciphertext) {
      setMsg("⚠️ Không có ciphertext.");
      return;
    }

    setBusy(true);
    setMsg(
      `⏳ Chạy ${
        solverConfig.algorithm === "simulated-annealing"
          ? "Simulated Annealing"
          : "Hill Climbing"
      }...`
    );
    setProgress({ current: 0, total: solverConfig.restarts, bestScore: 0 });

    try {
      const resp = await axios.post("/api/autoSolve", {
        ciphertext,
        algorithm: solverConfig.algorithm,
        restarts: solverConfig.restarts,
        iterations: solverConfig.iterations,
        initialTemp: solverConfig.initialTemp,
        coolingRate: solverConfig.coolingRate,
      });

      const mappingFromServer = resp.data?.mapping ?? resp.data?.key ?? null;
      const scoreFromServer = resp.data?.score ?? resp.data?.logScore ?? null;
      const plaintextFromServer =
        resp.data?.plaintext ?? resp.data?.plain ?? null;

      if (Array.isArray(mappingFromServer) && mappingFromServer.length === 26) {
        setMapping(mappingFromServer.slice());
      }

      if (typeof plaintextFromServer === "string") {
        setPlaintext(plaintextFromServer);
      }

      if (typeof scoreFromServer === "number") {
        setScore(scoreFromServer);
        setProgress((p) => ({ ...p, bestScore: scoreFromServer }));
        setMsg(
          `✅ Completed — Score: ${scoreFromServer.toFixed(4)} — Algorithm: ${
            solverConfig.algorithm
          }`
        );
      } else {
        setMsg("⚠️ Completed nhưng score không hợp lệ.");
      }
    } catch (err) {
      console.error("autoSolve error:", err);
      if (err?.code === "ECONNABORTED") {
        setMsg(
          "❌ Timeout — Hãy thử giảm iterations hoặc tăng timeout server."
        );
      } else {
        setMsg("❌ Không chạy được Auto-Solve.");
      }
    } finally {
      setBusy(false);
    }
  };

  // ✅ DEBOUNCED: Apply mapping
  const applyMappingDebounced = useCallback(
    debounce(async (m) => {
      if (!m) return;
      setMapping(m);
      try {
        const resp = await axios.post(`${api}/api/applyMapping`, {
          ciphertext,
          mapping: m,
        });
        setPlaintext(resp.data.plaintext);
        setScore(resp.data.score);
      } catch {
        setMsg("❌ Không áp dụng được mapping.");
      }
    }, 300),
    [ciphertext]
  );

  const handleSwap = (a, b) => {
    const next = [...mapping];
    [next[a], next[b]] = [next[b], next[a]];
    applyMappingDebounced(next);
  };

  /* ======================== RENDER ======================== */
  return (
    <div className="tool-container">
      <h2 className="tool-title">🔐 Mono-alphabetic Cipher Solver</h2>

      {/* ==== TOP TOOLBAR ==== */}
      <div className="toolbar">
        <input
          type="file"
          accept=".txt"
          onChange={(e) => handleFile(e.target.files?.[0])}
          disabled={busy}
          className="file-input"
        />
        <button
          className="btn btn-secondary"
          onClick={initMapping}
          disabled={!ciphertext || busy}
        >
          🎯 Init Mapping
        </button>
        <button
          className="btn btn-primary"
          onClick={autoSolve}
          disabled={!ciphertext || busy}
        >
          {busy ? "⏳ Solving..." : "🚀 Auto-Solve"}
        </button>
      </div>

      {/* ==== SOLVER CONFIGURATION PANEL ==== */}
      <div className="config-panel">
        <h3>⚙️ Solver Configuration</h3>
        <div className="config-grid">
          <label>
            Algorithm:
            <select
              value={solverConfig.algorithm}
              onChange={(e) =>
                setSolverConfig({
                  ...solverConfig,
                  algorithm: e.target.value,
                })
              }
              disabled={busy}
            >
              <option value="simulated-annealing">
                ⭐ Simulated Annealing (Recommended)
              </option>
              <option value="hill-climbing">Hill Climbing</option>
            </select>
          </label>

          <label>
            Restarts:
            <input
              type="number"
              value={solverConfig.restarts}
              onChange={(e) =>
                setSolverConfig({
                  ...solverConfig,
                  restarts: Math.max(1, +e.target.value),
                })
              }
              disabled={busy}
              min="1"
              max="100"
            />
          </label>

          <label>
            Iterations:
            <input
              type="number"
              value={solverConfig.iterations}
              onChange={(e) =>
                setSolverConfig({
                  ...solverConfig,
                  iterations: Math.max(100, +e.target.value),
                })
              }
              disabled={busy}
              min="100"
              max="10000"
            />
          </label>

          <label>
            Initial Temp:
            <input
              type="number"
              value={solverConfig.initialTemp}
              onChange={(e) =>
                setSolverConfig({
                  ...solverConfig,
                  initialTemp: parseFloat(e.target.value) || 1.0,
                })
              }
              disabled={busy}
              min="0.1"
              max="100"
              step="0.1"
            />
          </label>

          <label>
            Cooling Rate:
            <input
              type="number"
              value={solverConfig.coolingRate}
              onChange={(e) =>
                setSolverConfig({
                  ...solverConfig,
                  coolingRate: parseFloat(e.target.value) || 0.95,
                })
              }
              disabled={busy}
              min="0.5"
              max="0.99"
              step="0.01"
            />
          </label>
        </div>
      </div>

      {/* ==== PROGRESS BAR ==== */}
      {busy && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${
                  progress.total > 0
                    ? (progress.current / progress.total) * 100
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="progress-text">
            {`${
              solverConfig.algorithm === "simulated-annealing"
                ? "Simulated Annealing"
                : "Hill Climbing"
            } — Best Score: ${progress.bestScore.toFixed(3)}`}
          </div>
        </div>
      )}

      {/* ==== CIPHERTEXT INPUT ==== */}
      <div className="section">
        <div className="section-header">
          <span>📝 Ciphertext</span>
          {score !== null && (
            <span className="score">Score: {score.toFixed(3)}</span>
          )}
        </div>
        <textarea
          className="cipher-box"
          rows={4}
          value={ciphertext}
          onChange={(e) => setCiphertext(e.target.value)}
          placeholder="Nhập ciphertext hoặc upload file..."
          disabled={busy}
        />
      </div>

      {/* ==== MAIN LAYOUT 3 CỘT ==== */}
      <div className="three-cols">
        {/* LEFT: MAPPING */}
        <div className="panel">
          <h3>🔑 Mapping</h3>
          {mapping ? (
            <MappingGrid
              mapping={mapping}
              setMapping={applyMappingDebounced}
              onSwap={handleSwap}
              disabled={busy}
            />
          ) : (
            <div className="placeholder">Chưa có mapping</div>
          )}
        </div>

        {/* MID: PLAINTEXT */}
        <div className="panel">
          <h3>📄 Plaintext</h3>
          <div className="plaintext-box">
            {busy ? (
              <div className="loading">⏳ Đang xử lý...</div>
            ) : plaintext ? (
              <pre>{plaintext}</pre>
            ) : (
              <div className="placeholder">Kết quả sẽ hiển thị ở đây</div>
            )}
          </div>
        </div>

        {/* RIGHT: STATISTICS */}
        <div className="panel">
          <h3>📊 Statistics</h3>
          {Object.keys(stats).length > 0 ? (
            <StatisticsGrid stats={stats} freqs={characterFrequencies} />
          ) : (
            <div className="placeholder">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* ==== FOOTER MESSAGE ==== */}
      {msg && (
        <div className={`footer-msg ${busy ? "loading" : "done"}`}>{msg}</div>
      )}
    </div>
  );
}
