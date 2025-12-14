import React, { useState } from "react";
import axios from "axios";

const randomHex = (bytes) =>
  [...crypto.getRandomValues(new Uint8Array(bytes))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export default function DES_Tool() {
  const [plaintext, setPlaintext] = useState("");
  const [ciphertext, setCiphertext] = useState("");
  const [keyHex, setKeyHex] = useState("");
  const [ivHex, setIvHex] = useState("");
  const [mode, setMode] = useState("CBC");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const needsIV = mode === "CBC";

  const handleEncrypt = async () => {
    if (keyHex.length !== 16) return alert("Key must be 16 hex chars");
    if (!plaintext.trim()) return alert("Enter plaintext");

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:4000/api/des/encrypt", {
        plaintext,
        keyHex,
        mode,
        ...(needsIV && ivHex ? { ivHex } : {}),
      });
      setCiphertext(res.data.ciphertext || res.data.ciphertextHex || "");
      if (res.data.iv) setIvHex(res.data.iv);
      setResult({ type: "encrypt" });
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  const handleDecrypt = async () => {
    if (keyHex.length !== 16) return alert("Key must be 16 hex chars");
    if (!ciphertext.trim()) return alert("Enter ciphertext");
    if (needsIV && !ivHex) return alert("IV required for CBC");

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:4000/api/des/decrypt", {
        ciphertextHex: ciphertext.trim(),
        keyHex,
        mode,
        ...(needsIV ? { ivHex } : {}),
      });
      setPlaintext(res.data.plaintext || "");
      setResult({ type: "decrypt" });
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setPlaintext("");
    setCiphertext("");
    setResult(null);
  };

  return (
    <div className="card">
      <div className="card-head">
        <h3> DES Encryption</h3>
        <span className="score">64-bit</span>
      </div>

      {/* Mode Selection */}
      <div className="row" style={{ marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label className="label">Mode</label>
          <select
            className="input"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="CBC">CBC</option>
            <option value="ECB">ECB</option>
          </select>
        </div>
      </div>

      {/* Key & IV */}
      <div className="row" style={{ marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label className="label">Secret Key (HEX)</label>
          <div className="row">
            <input
              className="input"
              placeholder="16 hex chars (8 bytes)"
              value={keyHex}
              onChange={(e) => setKeyHex(e.target.value)}
              style={{ fontFamily: "monospace" }}
            />
            <button
              className="btn ghost small"
              onClick={() => setKeyHex(randomHex(8))}
            >
              Generate
            </button>
          </div>
        </div>

        {needsIV && (
          <div style={{ flex: 1 }}>
            <label className="label">IV (HEX)</label>
            <div className="row">
              <input
                className="input"
                placeholder="16 hex chars (8 bytes)"
                value={ivHex}
                onChange={(e) => setIvHex(e.target.value)}
                style={{ fontFamily: "monospace" }}
              />
              <button
                className="btn ghost small"
                onClick={() => setIvHex(randomHex(8))}
              >
                Generate
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Plaintext */}
      <div style={{ marginBottom: 16 }}>
        <label className="label">Plaintext</label>
        <textarea
          className="input-area"
          rows={4}
          placeholder="Enter plaintext here..."
          value={plaintext}
          onChange={(e) => setPlaintext(e.target.value)}
        />
      </div>

      {/* Ciphertext */}
      <div style={{ marginBottom: 16 }}>
        <label className="label">Ciphertext (HEX)</label>
        <textarea
          className="input-area"
          rows={4}
          placeholder="Ciphertext in HEX format"
          value={ciphertext}
          onChange={(e) => setCiphertext(e.target.value)}
          style={{ fontFamily: "monospace" }}
        />
      </div>

      {/* Actions */}
      <div className="row">
        <button
          className="btn btn-primary"
          onClick={handleEncrypt}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : "Encrypt"}
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleDecrypt}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : "Decrypt"}
        </button>
        <button className="btn ghost" onClick={handleReset}>
          Clear
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="result-block" style={{ marginTop: 20 }}>
          <strong>
            {result.type === "encrypt" ? "Encrypted" : "Decrypted"} successfully
          </strong>
          {ivHex && needsIV && (
            <div style={{ marginTop: 10, fontSize: 13 }}>
              <strong>IV:</strong> <code>{ivHex}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
