import React, { useState, useRef } from "react";
import axios from "axios";

function caesarShiftChar(ch, k) {
  if (ch >= "A" && ch <= "Z") {
    const code = ((((ch.charCodeAt(0) - 65 + k) % 26) + 26) % 26) + 65;
    return String.fromCharCode(code);
  }
  if (ch >= "a" && ch <= "z") {
    const code = ((((ch.charCodeAt(0) - 97 + k) % 26) + 26) % 26) + 97;
    return String.fromCharCode(code);
  }
  return ch;
}
function caesarDecryptWithKey(ciphertext, k) {
  return ciphertext
    .split("")
    .map((ch) => caesarShiftChar(ch, -k))
    .join("");
}

export default function CaesarTool() {
  const [cipher, setCipher] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const fileInputRef = useRef(null);

  const callBruteApi = async (text) => {
    const resp = await axios.post(
      "http://localhost:4000/api/caesar/bruteforce",
      { ciphertext: text },
      { timeout: 60000 }
    );
    return resp.data;
  };

  const uploadFileToServer = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const resp = await axios.post(
      "http://localhost:4000/api/caesar/upload",
      fd,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      }
    );
    return resp.data;
  };

  const readFileLocally = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = (e) => reject(e);
      r.readAsText(file, "utf-8");
    });

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChosen = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const useServer = window.confirm(
      "Upload file to server and let server solve? (OK = upload, Cancel = read locally)"
    );
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      if (useServer) {
        const data = await uploadFileToServer(file);
        setResult(data);
        setShowAll(true);
      } else {
        const content = await readFileLocally(file);
        setCipher(content);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Upload/Read error");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleSolve = async () => {
    if (!cipher.trim()) {
      alert("Please input ciphertext first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await callBruteApi(cipher);
      let data = resp || {};

      if (!Array.isArray(data.allCandidates)) {
        const localCandidates = [];
        for (let k = 0; k < 26; k++)
          localCandidates.push({ k, pt: caesarDecryptWithKey(cipher, k) });
        data.allCandidates = localCandidates;
      }

      if (
        typeof data.key === "undefined" ||
        typeof data.plaintext === "undefined"
      ) {
        const words = new Set([
          "THE",
          "AND",
          "IS",
          "TO",
          "OF",
          "IN",
          "THAT",
          "IT",
          "FOR",
          "ARE",
        ]);
        let best = data.allCandidates[0],
          bestScore = -1;
        for (const c of data.allCandidates) {
          const wlist = (c.pt || "")
            .toUpperCase()
            .split(/[^A-Z]+/)
            .filter(Boolean);
          let s = 0;
          for (const w of wlist) if (words.has(w)) s++;
          if (s > bestScore) {
            bestScore = s;
            best = c;
          }
        }
        data.key = best.k;
        data.plaintext = best.pt;
      }

      setResult(data);
      setShowAll(true);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || e.message || "Backend error");
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return alert("No result to download");
    const all = (result.allCandidates || [])
      .map((c) => `k=${c.k}\n${c.pt}`)
      .join("\n\n---\n\n");
    const content = `Key: ${result.key}\n\nPlaintext:\n${result.plaintext}\n\nAll candidates:\n\n${all}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "caesar_result.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card">
      <div className="card-head">
        <h3>Caesar — Brute-force (Task 1)</h3>
        <div className="card-actions">
          <button
            className="icon-btn"
            title="Upload .txt"
            onClick={handleUploadClick}
            disabled={loading}
          >
            📁
          </button>
          <button className="btn" onClick={handleSolve} disabled={loading}>
            {loading ? <span className="spinner" /> : "Run"}
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              setCipher("");
              setResult(null);
              setError(null);
            }}
            disabled={loading}
          >
            Clear
          </button>
          <button className="btn" onClick={downloadResult} disabled={!result}>
            Download
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,text/*"
        style={{ display: "none" }}
        onChange={handleFileChosen}
      />

      <label className="label">Ciphertext</label>
      <textarea
        className="input-area"
        rows={8}
        placeholder="Paste ciphertext here (or upload .txt)..."
        value={cipher}
        onChange={(e) => setCipher(e.target.value)}
      />

      <div className="meta-row">
        <div className="note">
          Tip: if ciphertext is short or contains non-letters, use "Show all" to
          inspect candidates.
        </div>
        <button
          className="btn ghost small"
          onClick={() => setShowAll((s) => !s)}
          disabled={!result}
        >
          {showAll ? "Hide all" : "Show all"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="result-block">
          <div className="result-head">
            <div>
              <strong>Found Key:</strong> {result.key}
            </div>
            <div className="score">
              score:{" "}
              {typeof result.bestScore !== "undefined"
                ? result.bestScore.toFixed(4)
                : "-"}
            </div>
          </div>

          <label className="label">Plaintext (preview)</label>
          <pre className="plaintext">{result.plaintext}</pre>

          {showAll && (
            <details open className="candidates">
              <summary>All candidates (k = 0..25)</summary>
              <div className="candidates-list">
                {(result.allCandidates || []).map((c) => (
                  <div
                    key={c.k}
                    className={`candidate ${c.k === result.key ? "best" : ""}`}
                  >
                    <div className="cand-head">
                      <div className="cand-key">k = {c.k}</div>
                    </div>
                    <pre className="cand-pt">{c.pt}</pre>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
