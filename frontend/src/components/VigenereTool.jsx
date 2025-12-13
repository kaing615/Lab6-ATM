import React, { useState, useRef } from "react";
import axios from "axios";

export default function VigenereTool() {
  const [cipher, setCipher] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCandidates, setShowCandidates] = useState(false);
  const fileRef = useRef(null);

  const callApi = async (text) => {
    const r = await axios.post(
      "http://localhost:4000/api/vigenere/solve",
      { ciphertext: text },
      { timeout: 120000 }
    );
    return r.data;
  };

  const uploadToServer = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const r = await axios.post(
      "http://localhost:4000/api/vigenere/upload",
      fd,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      }
    );
    return r.data;
  };

  const readLocalFile = (file) =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsText(file, "utf-8");
    });

  const handleUploadClick = () => fileRef.current?.click();

  const handleFileChosen = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const useServer = window.confirm(
      "Upload to server and solve? (OK = upload, Cancel = read locally)"
    );
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      if (useServer) {
        const data = await uploadToServer(f);
        setResult(data);
        setShowCandidates(true);
      } else {
        const content = await readLocalFile(f);
        setCipher(content);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Error");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleSolve = async () => {
    if (!cipher.trim()) return alert("Paste or upload ciphertext first.");
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let data = null;
      try {
        data = await callApi(cipher);
      } catch (e) {
        console.warn("server solve failed, using local solve", e.message);
        data = localSolve(cipher, { maxKeyLen: 50 });
        data.candidates = data.candidates || [];
      }
      setResult(data);
      setShowCandidates(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Solve failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return alert("No result to download");
    const cands = (result.candidates || [])
      .map(
        (c) =>
          `key: ${c.key} (len=${c.keyLen || c.key.length}) score:${
            c.score || c.score === 0 ? c.score : 0
          }\n${c.plaintext}`
      )
      .join("\n\n---\n\n");
    const content = `Key: ${result.key}\nKeyLen (est): ${
      result.keyLen || ""
    }\n\nPlaintext:\n${result.plaintext}\n\nCandidates:\n\n${cands}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vigenere_result.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card">
      <div className="card-head">
        <h3>Vigenère — Task 3</h3>
        <div className="card-actions">
          <button
            className="icon-btn"
            onClick={handleUploadClick}
            title="Upload .txt"
          >
            📁
          </button>
          <button className="btn" onClick={handleSolve} disabled={loading}>
            {loading ? "Running…" : "Run"}
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
        ref={fileRef}
        type="file"
        accept=".txt,text/*"
        style={{ display: "none" }}
        onChange={handleFileChosen}
      />

      <label className="label">Ciphertext</label>
      <textarea
        className="input-area"
        rows={8}
        placeholder="Paste ciphertext here..."
        value={cipher}
        onChange={(e) => setCipher(e.target.value)}
      />

      <div className="meta-row">
        <div className="note">
          Algorithm: IC → chi-squared per column → reconstruct key → decrypt
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="result-block">
          <div className="result-head">
            <div>
              <strong>Key:</strong>{" "}
              {result.displayKey || (result.key || "").toLowerCase()}
            </div>
          </div>

          <label className="label">Plaintext (preview)</label>
          <pre className="plaintext">{result.plaintext}</pre>
        </div>
      )}
    </div>
  );
}
