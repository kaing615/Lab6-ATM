import React, { useState, useRef, useCallback } from "react";
import axios from "axios";

const letters = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(97 + i)
);
const api = "http://localhost:4000/mono";

function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const dictToArr = (dictMap) => {
  const arr = new Array(26).fill("");
  letters.forEach((char, idx) => {
    arr[idx] = dictMap[char] || char;
  });
  return arr;
};

const arrToDict = (arrMap) => {
  const dict = {};
  letters.forEach((char, idx) => {
    dict[char] = arrMap[idx] || char;
  });
  return dict;
};

function MappingGrid({ mapping, onSwap, onChange }) {
  if (!mapping) return <div className="placeholder">No mapping loaded</div>;

  return (
    <div className="mapping-grid-wrapper">
      <div className="mapping-table-horizontal">
        <table className="mapping-table">
          <thead>
            <tr>
              <th className="row-label">Cipher</th>
              {letters.map((c) => (
                <th key={c}>{c.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="row-label">Plain</td>
              {letters.map((c, i) => (
                <td key={c}>
                  <input
                    value={mapping[i] || ""}
                    onChange={(e) => onChange(i, e.target.value)}
                    maxLength={1}
                    className="mapping-input"
                    placeholder="?"
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="swap-controls">
        <label className="swap-label">Quick Swap: </label>
        <select id="swapA" className="swap-select">
          {letters.map((l, i) => (
            <option key={l} value={i}>
              {l.toUpperCase()} → {mapping[i] || "?"}
            </option>
          ))}
        </select>
        <span className="swap-arrow">⇄</span>
        <select id="swapB" className="swap-select">
          {letters.map((l, i) => (
            <option key={l} value={i}>
              {l.toUpperCase()} → {mapping[i] || "?"}
            </option>
          ))}
        </select>
        <button
          className="btn small"
          onClick={() => {
            const a = parseInt(document.getElementById("swapA").value);
            const b = parseInt(document.getElementById("swapB").value);
            onSwap(a, b);
          }}
        >
          Swap
        </button>
      </div>
    </div>
  );
}

function StatisticsGrid({ stats }) {
  if (!stats || !Array.isArray(stats) || stats.length === 0)
    return <div className="placeholder">No statistics yet</div>;

  const maxCount = Math.max(...stats.map((s) => s.count), 1);

  return (
    <div className="stats-grid-wrapper">
      <table className="stats-table">
        <thead>
          <tr>
            <th>Letter</th>
            <th>Count</th>
            <th>Freq</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((row) => {
            const intensity = (row.count / maxCount) * 100;
            return (
              <tr
                key={row.letter}
                style={{
                  background: `linear-gradient(90deg, rgba(33, 150, 243, 0.1) ${intensity}%, transparent ${intensity}%)`,
                }}
              >
                <td className="letter-cell">{row.letter.toUpperCase()}</td>
                <td className="count-cell">{row.count}</td>
                <td className="freq-cell">{row.frequency}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="stats-hint">
        Higher frequency = more common in ciphertext
      </div>
    </div>
  );
}

export default function MonoSubstTool() {
  const [ciphertext, setCiphertext] = useState("");
  const [mapping, setMapping] = useState(
    Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i))
  );
  const [plaintext, setPlaintext] = useState("");
  const [stats, setStats] = useState([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState(0);
  const fileInputRef = useRef(null);

  const applyMappingDebounced = useCallback(
    debounce(async (currentMappingArr, currentCipher) => {
      if (!currentCipher) return;
      try {
        const resp = await axios.post(`${api}/applyMapping`, {
          ciphertext: currentCipher,
          mapping: arrToDict(currentMappingArr),
        });
        setPlaintext(resp.data.plaintext);
        setScore(resp.data.score);
      } catch (e) {
        console.error(e);
      }
    }, 300),
    []
  );

  const handleSwap = (a, b) => {
    const next = [...mapping];
    [next[a], next[b]] = [next[b], next[a]];
    setMapping(next);
    applyMappingDebounced(next, ciphertext);
  };

  const handleMappingChange = (i, val) => {
    const next = [...mapping];
    next[i] = val.toLowerCase();
    setMapping(next);
    applyMappingDebounced(next, ciphertext);
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);

      const resp = await axios.post(`${api}/uploadCiphertext`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const text = resp.data.ciphertext;
      setCiphertext(text);

      const s = await axios.post(`${api}/stats`, { ciphertext: text });
      setStats(s.data);

      setMapping(
        Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i))
      );
      setPlaintext(text);
      setScore(0);
    } catch (e) {
      console.error(e);
      setMsg("Error uploading file. Check console.");
    } finally {
      setBusy(false);
    }
  };

  const initMapping = async () => {
    if (!ciphertext) return setMsg("Enter ciphertext first");
    setBusy(true);
    setMsg("");
    try {
      const resp = await axios.post(`${api}/initMapping`, { ciphertext });
      const newMapArr = dictToArr(resp.data.mapping);
      setMapping(newMapArr);
      setPlaintext(resp.data.plaintext);
      setScore(resp.data.score);
    } catch (e) {
      console.error(e);
      setMsg("Init failed. Check backend.");
    } finally {
      setBusy(false);
    }
  };

  const autoSolve = async () => {
    if (!ciphertext) return setMsg("Enter ciphertext first");
    setBusy(true);
    setMsg("");
    try {
      const resp = await axios.post(`${api}/autoSolve`, { ciphertext });
      const newMapArr = dictToArr(resp.data.mapping);
      setMapping(newMapArr);
      setPlaintext(resp.data.plaintext);
      setScore(resp.data.score);
    } catch (e) {
      console.error(e);
      setMsg("Solve failed. Check backend.");
    } finally {
      setBusy(false);
    }
  };

  const resetMono = () => {
    setCiphertext("");
    setMapping(
      Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i))
    );
    setPlaintext("");
    setStats([]);
    setMsg("");
    setScore(0);
  };

  const downloadPlaintext = () => {
    if (!plaintext.trim()) {
      return alert("No plaintext to download");
    }

    const mappingLines = letters
      .map((c, i) => {
        return `${c.toUpperCase()} → ${(mapping[i] || "?").toUpperCase()}`;
      })
      .join("  ");

    const content = `=== MONOALPHABETIC SUBSTITUTION RESULT ===

Score: ${score.toFixed(2)}

Mapping:
${mappingLines}

Plaintext:
${plaintext}
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mono_plaintext.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card mono-tool">
      <div className="card-head">
        <h3>Monoalphabetic — Frequency Analysis</h3>
        <div className="card-actions">
          <button
            className="icon-btn"
            onClick={handleUploadClick}
            title="Upload . txt"
            disabled={busy}
          >
            📁
          </button>
          <button
            className="btn btn-primary"
            onClick={initMapping}
            disabled={busy}
          >
            {busy ? <span className="spinner" /> : "Init Frequency"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={autoSolve}
            disabled={busy}
          >
            Auto-Solve
          </button>
          <button
            className="btn"
            onClick={downloadPlaintext}
            disabled={!plaintext.trim()}
          >
            Download
          </button>
          <button className="btn ghost" onClick={resetMono} disabled={busy}>
            Clear
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={busy}
      />

      <label className="label">Ciphertext</label>
      <textarea
        className="input-area"
        rows={5}
        value={ciphertext}
        readOnly
        placeholder="Uploaded ciphertext will appear here..."
      />

      <div className="three-cols" style={{ marginTop: "16px" }}>
        <div className="panel mapping-panel">
          <h4>Letter Mapping</h4>
          <MappingGrid
            mapping={mapping}
            onSwap={handleSwap}
            onChange={handleMappingChange}
          />
        </div>

        <div className="panel plain-col">
          <div className="section-header">
            <span>Plaintext Preview</span>
            <span className="score">Score: {score?.toFixed(2)}</span>
          </div>
          <div className="plaintext-box">
            <pre className="plaintext">{plaintext}</pre>
          </div>
        </div>

        <div className="panel stats-col">
          <h4>Letter Statistics</h4>
          <StatisticsGrid stats={stats} />
        </div>
      </div>

      {msg && <div className="msg error">{msg}</div>}
    </div>
  );
}
