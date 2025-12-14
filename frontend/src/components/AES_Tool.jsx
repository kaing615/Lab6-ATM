import React, { useState, useRef } from "react";
import axios from "axios";

const randomHex = (bytes) =>
  [...crypto.getRandomValues(new Uint8Array(bytes))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export default function AES_Tool() {
  const [plaintext, setPlaintext] = useState("");
  const [ciphertext, setCiphertext] = useState("");
  const [keyHex, setKeyHex] = useState("");
  const [ivHex, setIvHex] = useState("");
  const [mode, setMode] = useState("CBC");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const fileEncryptRef = useRef(null);
  const fileDecryptRef = useRef(null);

  const needsIV = mode === "CBC";
  const keyValid = [32, 48, 64].includes(keyHex.length);

  const handleEncrypt = async () => {
    if (!keyValid) return alert("Key must be 32/48/64 hex chars");
    if (!plaintext.trim()) return alert("Enter plaintext");
    if (needsIV && !ivHex) return alert("IV required for CBC");

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:4000/api/aes/encrypt", {
        plaintext,
        keyHex,
        mode,
        ivHex: needsIV ? ivHex : null,
      });
      setCiphertext(res.data.ciphertextHex || "");
      if (res.data.ivHex) setIvHex(res.data.ivHex);
      setResult({ type: "encrypt", data: res.data });
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  const handleDecrypt = async () => {
    if (!keyValid) return alert("⚠️ Key must be 32/48/64 hex chars");
    if (!ciphertext.trim()) return alert("⚠️ Enter ciphertext");
    if (needsIV && !ivHex) return alert("⚠️ IV required for CBC");

    setLoading(true);
    try {
      console.log("Sending decrypt request:", {
        ciphertextHex: ciphertext.trim(),
        keyHex,
        mode,
        ivHex: needsIV ? ivHex : null,
      });

      const res = await axios.post("http://localhost:4000/api/aes/decrypt", {
        ciphertextHex: ciphertext.trim(),
        keyHex: keyHex.trim(),
        mode,
        ivHex: needsIV ? ivHex.trim() : null,
      });

      console.log("Decrypt response:", res.data);

      setPlaintext(res.data.plaintextUtf8 || res.data.plaintext || "");
      setResult({ type: "decrypt", data: res.data });
    } catch (err) {
      console.error("Decrypt error:", err);
      const errorMsg =
        err.response?.data?.detail || err.response?.data?.error || err.message;
      alert("Decryption failed: " + errorMsg);
    }
    setLoading(false);
  };

  const handleFileDecrypt = async (file) => {
    if (!file) return;
    if (!keyValid) return alert("Key must be 32/48/64 hex chars");
    if (needsIV && !ivHex) return alert("IV required for CBC");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("keyHex", keyHex);
      fd.append("mode", mode);
      if (needsIV && ivHex) fd.append("ivHex", ivHex);
      fd.append("inputEnc", "hex");

      const res = await axios.post(
        "http://localhost:4000/api/aes/upload-decrypt",
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setPlaintext(res.data.plaintext || "");
      setResult({ type: "decrypt", data: res.data });
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  const downloadResult = () => {
    if (!result) return alert("No result to download");

    const content = result.type === "encrypt" ? ciphertext : plaintext;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      result.type === "encrypt"
        ? "aes_ciphertext.hex. txt"
        : "aes_plaintext.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setPlaintext("");
    setCiphertext("");
    setResult(null);
  };

  return (
    <div className="card">
      <div className="card-head">
        <h3>AES Encryption</h3>
        <span className="score">128/192/256-bit</span>
      </div>

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

      <div style={{ marginBottom: 16 }}>
        <label className="label">Secret Key (HEX)</label>
        <div className="row">
          <input
            className="input"
            placeholder="32/48/64 hex chars"
            value={keyHex}
            onChange={(e) => setKeyHex(e.target.value)}
            style={{ fontFamily: "monospace", flex: 1 }}
          />
          <button
            className="btn ghost small"
            onClick={() => setKeyHex(randomHex(16))}
          >
            128
          </button>
          <button
            className="btn ghost small"
            onClick={() => setKeyHex(randomHex(24))}
          >
            192
          </button>
          <button
            className="btn ghost small"
            onClick={() => setKeyHex(randomHex(32))}
          >
            256
          </button>
        </div>
      </div>

      {needsIV && (
        <div style={{ marginBottom: 16 }}>
          <label className="label">IV (HEX)</label>
          <div className="row">
            <input
              className="input"
              placeholder="32 hex chars (16 bytes)"
              value={ivHex}
              onChange={(e) => setIvHex(e.target.value)}
              style={{ fontFamily: "monospace", flex: 1 }}
            />
            <button
              className="btn ghost small"
              onClick={() => setIvHex(randomHex(16))}
            >
              Generate
            </button>
          </div>
        </div>
      )}

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
        <button
          className="btn"
          onClick={() => fileDecryptRef.current?.click()}
          disabled={loading}
        >
          Decrypt File
        </button>
        <button className="btn" onClick={downloadResult} disabled={!result}>
          Download
        </button>
        <button className="btn ghost" onClick={handleReset}>
          Clear
        </button>
      </div>

      <input
        ref={fileDecryptRef}
        type="file"
        accept=".txt,. hex"
        style={{ display: "none" }}
        onChange={(e) => handleFileDecrypt(e.target.files?.[0])}
      />

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
