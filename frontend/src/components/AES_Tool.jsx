import React, { useState } from "react";
import axios from "axios";
import "./aes.css";

function randomHex(bytes) {
  return [...crypto.getRandomValues(new Uint8Array(bytes))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function AES_Tool() {
  const [plainText, setPlainText] = useState("");
  const [cipherText, setCipherText] = useState("");
  const [decryptedText, setDecryptedText] = useState("");

  const [keyHex, setKeyHex] = useState("");
  const [ivHex, setIvHex] = useState("");
  const [mode, setMode] = useState("CBC");
  const [viewEnc, setViewEnc] = useState("hex");

  // ⭐ encoding thực sự của ciphertext
  const [cipherEncoding, setCipherEncoding] = useState(null);

  const [loading, setLoading] = useState(false);

  const needsIV = mode === "CBC";
  const keyValid = [32, 48, 64].includes(keyHex.length);

  const generateKey = (bits) => {
    setKeyHex(randomHex(bits / 8));
  };

  const generateIV = () => {
    setIvHex(randomHex(16));
  };

  // ================= ENCRYPT =================
  const encrypt = async () => {
    if (!keyValid) return alert("Key must be 32 / 48 / 64 hex chars");
    if (!plainText) return alert("Enter plaintext");

    setLoading(true);
    try {
      const r = await axios.post("http://localhost:4000/api/aes/encrypt", {
        plaintext: plainText,
        keyHex,
        mode,
        ivHex: needsIV ? ivHex || null : null,
      });

      const ct =
        viewEnc === "hex" ? r.data.ciphertextHex : r.data.ciphertextBase64;

      setCipherText(ct);
      setCipherEncoding(viewEnc); // ⭐ rất quan trọng
      setDecryptedText("");

      if (r.data.ivHex) setIvHex(r.data.ivHex);
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  // ================= DECRYPT =================
  const decrypt = async () => {
    if (!keyValid) return alert("Key invalid");
    if (!cipherText) return alert("Enter ciphertext");
    if (needsIV && !ivHex) return alert("IV required");

    setLoading(true);
    try {
      const payload =
        cipherEncoding === "hex"
          ? { ciphertextHex: cipherText.trim() }
          : { ciphertextBase64: cipherText.trim() };

      const r = await axios.post("http://localhost:4000/api/aes/decrypt", {
        ...payload,
        keyHex,
        mode,
        ivHex: needsIV ? ivHex : null,
      });

      setDecryptedText(r.data.plaintextUtf8);
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  return (
    <div className="aes-card">
      <h2 className="aes-title">🔐 AES Encrypt / Decrypt</h2>

      {/* MODE */}
      <div className="aes-row">
        <div className="aes-field">
          <label>Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="CBC">CBC</option>
            <option value="ECB">ECB</option>
          </select>
        </div>

        <div className="aes-field">
          <label>Encoding</label>
          <select
            value={viewEnc}
            disabled={!!cipherText} // ⭐ khóa encoding khi đã có ciphertext
            onChange={(e) => setViewEnc(e.target.value)}
          >
            <option value="hex">HEX</option>
            <option value="base64">Base64</option>
          </select>
        </div>
      </div>

      {/* PLAINTEXT */}
      <label className="aes-label">Plaintext</label>
      <textarea
        rows={4}
        className="aes-textarea"
        placeholder="Enter plaintext here..."
        value={plainText}
        onChange={(e) => setPlainText(e.target.value)}
      />

      {/* CIPHERTEXT */}
      <label className="aes-label">
        Ciphertext ({cipherEncoding?.toUpperCase() || viewEnc.toUpperCase()})
      </label>
      <textarea
        rows={4}
        className="aes-textarea mono"
        placeholder="Ciphertext"
        value={cipherText}
        onChange={(e) => setCipherText(e.target.value)}
      />

      {/* KEY */}
      <label className="aes-label">Secret Key</label>
      <div className="aes-row">
        <input
          className="aes-input mono"
          placeholder="Key HEX (32 / 48 / 64 chars)"
          value={keyHex}
          onChange={(e) => setKeyHex(e.target.value)}
        />
        <button onClick={() => generateKey(128)}>128</button>
        <button onClick={() => generateKey(192)}>192</button>
        <button onClick={() => generateKey(256)}>256</button>
      </div>

      {/* IV */}
      {needsIV && (
        <>
          <label className="aes-label">Initialization Vector (IV)</label>
          <div className="aes-row">
            <input
              className="aes-input mono"
              placeholder="IV HEX (32 chars)"
              value={ivHex}
              onChange={(e) => setIvHex(e.target.value)}
            />
            <button onClick={generateIV}>Gen IV</button>
          </div>
        </>
      )}

      {/* ACTIONS */}
      <div className="aes-actions">
        <button className="btn encrypt" onClick={encrypt} disabled={loading}>
          Encrypt
        </button>
        <button className="btn decrypt" onClick={decrypt} disabled={loading}>
          Decrypt
        </button>
        <button
          className="btn clear"
          onClick={() => {
            setPlainText("");
            setCipherText("");
            setDecryptedText("");
            setIvHex("");
            setCipherEncoding(null);
          }}
        >
          Clear
        </button>
      </div>

      {/* OUTPUT */}
      {decryptedText && (
        <div className="aes-output">
          <strong>Decrypted plaintext</strong>
          <pre>{decryptedText}</pre>
        </div>
      )}

      {needsIV && ivHex && (
        <div className="aes-iv">
          <strong>IV used:</strong> {ivHex}
        </div>
      )}
    </div>
  );
}
