import React, { useState } from "react";
import axios from "axios";

export default function DES_Tool() {
  const [plain, setPlain] = useState("");
  const [keyHex, setKeyHex] = useState("");
  const [mode, setMode] = useState("CBC");
  const [ivHex, setIvHex] = useState("");
  const [ciphertextHex, setCiphertextHex] = useState("");
  const [decryptedText, setDecryptedText] = useState("");
  const [loading, setLoading] = useState(false);

  const [fileToEncrypt, setFileToEncrypt] = useState(null);
  const [fileEncResult, setFileEncResult] = useState(null);

  const [fileToDecrypt, setFileToDecrypt] = useState(null);
  const [fileDecResult, setFileDecResult] = useState(null);

  const modeNeedsIV = (m) => {
    const up = (m || "").toUpperCase();
    return up === "CBC";
  };

  const encrypt = async () => {
    if (!keyHex || keyHex.length !== 16)
      return alert("Key must be exactly 16 hex chars (8 bytes)");

    setLoading(true);
    try {
      const payload = {
        plaintext: plain,
        keyHex,
        mode,
        ...(modeNeedsIV(mode) && ivHex ? { ivHex } : {}),
      };

      const r = await axios.post(
        "http://localhost:4000/api/des/encrypt",
        payload
      );

      const ct =
        r.data.ciphertext || r.data.ciphertextOut || r.data.ciphertextHex;
      const ivOut = r.data.iv || r.data.ivHex || r.data.ivHexOut || null;

      setCiphertextHex(ct || "");
      if (ivOut) setIvHex(ivOut);
      setDecryptedText("");
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  const decrypt = async () => {
    if (!keyHex || keyHex.length !== 16)
      return alert("Key must be exactly 16 hex chars");
    if (!plain) return alert("Enter ciphertext HEX into textarea to decrypt");
    if (modeNeedsIV(mode) && !ivHex)
      return alert(`IV (16 hex chars) is required for mode ${mode}`);

    setLoading(true);
    try {
      const payload = {
        ciphertextHex: plain.trim(),
        keyHex,
        mode,
        ...(modeNeedsIV(mode) ? { ivHex } : {}),
      };

      const r = await axios.post(
        "http://localhost:4000/api/des/decrypt",
        payload
      );
      setDecryptedText(r.data.plaintext || "");
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  const onFileEncryptChange = (e) => {
    setFileToEncrypt(e.target.files?.[0] || null);
    setFileEncResult(null);
  };

  const uploadAndEncryptFile = async () => {
    if (!fileToEncrypt) return alert("Choose a file to upload");
    if (!keyHex || keyHex.length !== 16)
      return alert("Key must be exactly 16 hex chars (8 bytes)");
    if (modeNeedsIV(mode) && ivHex && ivHex.length !== 16)
      return alert("IV must be 16 hex chars if provided");

    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", fileToEncrypt);
      form.append("keyHex", keyHex);
      form.append("mode", mode);
      if (modeNeedsIV(mode) && ivHex) form.append("ivHex", ivHex);
      form.append("output", "hex");

      const r = await axios.post("http://localhost:4000/api/des/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // response: { filename, ciphertext, iv, outputEncoding }
      setFileEncResult(r.data);
      setCiphertextHex(r.data.ciphertext || "");
      if (r.data.iv) setIvHex(r.data.iv);

      // --- SHOW ciphertext IMMEDIATELY in UI (no download needed) ---
      if (r.data.ciphertext) {
        setPlain(r.data.ciphertext);
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  // --- Upload & Decrypt file (NEW) ---
  const onFileDecryptChange = (e) => {
    setFileToDecrypt(e.target.files?.[0] || null);
    setFileDecResult(null);
  };

  const uploadAndDecryptFile = async () => {
    if (!fileToDecrypt) return alert("Choose a file to upload for decrypt");
    if (!keyHex || keyHex.length !== 16)
      return alert("Key must be exactly 16 hex chars (8 bytes)");
    if (modeNeedsIV(mode) && ivHex && ivHex.length !== 16)
      return alert("IV must be 16 hex chars if provided");

    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", fileToDecrypt);
      form.append("keyHex", keyHex);
      form.append("mode", mode);
      if (modeNeedsIV(mode) && ivHex) form.append("ivHex", ivHex);
      form.append("inputEnc", "hex");

      const r = await axios.post(
        "http://localhost:4000/api/des/upload-decrypt",
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setFileDecResult(r.data);
      setDecryptedText(r.data.plaintext || "");

      if (r.data.plaintext) {
        setPlain(r.data.plaintext);
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  // download helper (kept if needed)
  const downloadTextAsFile = (text, filename) => {
    if (!text) return alert("No content to download");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card">
      <h3>DES — Encrypt / Decrypt (bit-level)</h3>

      <div className="row" style={{ marginBottom: 10 }}>
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

      <label className="label">
        Plaintext (for encrypt) OR Ciphertext hex (for decrypt)
      </label>
      <textarea
        className="input-area"
        rows={5}
        placeholder="Enter plaintext OR ciphertext hex"
        value={plain}
        onChange={(e) => setPlain(e.target.value)}
      />

      <div className="row" style={{ marginTop: 10 }}>
        <input
          className="input"
          placeholder="Key (16 hex chars = 8 bytes)"
          value={keyHex}
          onChange={(e) => setKeyHex(e.target.value)}
        />

        {modeNeedsIV(mode) ? (
          <input
            className="input"
            placeholder="IV (16 hex chars, required for CBC if decrypt)"
            value={ivHex}
            onChange={(e) => setIvHex(e.target.value)}
          />
        ) : (
          <input
            className="input"
            placeholder="IV not required for ECB"
            value=""
            disabled
            style={{ opacity: 0.6 }}
          />
        )}
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <button disabled={loading} onClick={encrypt} className="btn">
          {loading ? "Processing…" : "Encrypt"}
        </button>

        <button disabled={loading} onClick={decrypt} className="btn">
          Decrypt
        </button>

        <button
          className="btn ghost"
          onClick={() => {
            setPlain("");
            setCiphertextHex("");
            setDecryptedText("");
            setFileToEncrypt(null);
            setFileEncResult(null);
            setFileToDecrypt(null);
            setFileDecResult(null);
          }}
        >
          Clear
        </button>
      </div>

      <div
        style={{ marginTop: 12, borderTop: "1px solid #eee", paddingTop: 12 }}
      >
        <strong>Upload file to encrypt</strong>
        <div style={{ marginTop: 8 }}>
          <input type="file" onChange={onFileEncryptChange} />
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={uploadAndEncryptFile}
            disabled={loading}
          >
            {loading ? "Processing…" : "Upload & Encrypt"}
          </button>
          <button
            className="btn ghost"
            style={{ marginLeft: 8 }}
            onClick={() => {
              const txt = fileEncResult?.ciphertext || ciphertextHex || "";
              downloadTextAsFile(
                txt,
                `${fileEncResult?.filename || "ciphertext"}.hex.txt`
              );
            }}
          >
            Download ciphertext
          </button>
        </div>

        {fileEncResult && (
          <div style={{ marginTop: 8 }}>
            <div>
              <strong>File:</strong> {fileEncResult.filename}
            </div>
            <div>
              <strong>Ciphertext (hex):</strong>
            </div>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {fileEncResult.ciphertext}
            </pre>
            {fileEncResult.iv && (
              <div>
                <strong>IV (hex):</strong> {fileEncResult.iv}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FILE UPLOAD - DECRYPT */}
      <div
        style={{ marginTop: 12, borderTop: "1px solid #eee", paddingTop: 12 }}
      >
        <strong>
          Upload file to decrypt (file must contain ciphertext hex)
        </strong>
        <div style={{ marginTop: 8 }}>
          <input type="file" onChange={onFileDecryptChange} />
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={uploadAndDecryptFile}
            disabled={loading}
          >
            {loading ? "Processing…" : "Upload & Decrypt"}
          </button>
          <button
            className="btn ghost"
            style={{ marginLeft: 8 }}
            onClick={() => {
              const txt = fileDecResult?.plaintext || decryptedText || "";
              downloadTextAsFile(
                txt,
                `${fileDecResult?.filename || "plaintext"}.txt`
              );
            }}
          >
            Download plaintext
          </button>
        </div>

        {fileDecResult && (
          <div style={{ marginTop: 8 }}>
            <div>
              <strong>File:</strong> {fileDecResult.filename}
            </div>
            <div>
              <strong>Plaintext:</strong>
            </div>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {fileDecResult.plaintext}
            </pre>
          </div>
        )}
      </div>

      <div className="output" style={{ marginTop: 12 }}>
        {ciphertextHex && (
          <div>
            <strong>Ciphertext (hex):</strong>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {ciphertextHex}
            </pre>
          </div>
        )}

        {ivHex && modeNeedsIV(mode) && (
          <div style={{ marginTop: 8 }}>
            <strong>IV used:</strong> {ivHex}
          </div>
        )}

        {decryptedText && (
          <div style={{ marginTop: 8 }}>
            <strong>Decrypted plaintext:</strong>
            <pre>{decryptedText}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
