import React, { useMemo } from "react";

const letters = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(97 + i)
);

export default function MappingGrid({
  mapping,
  setMapping,
  onSwap,
  onApply,
  onPushHistory,
}) {
  if (!mapping) return <div>Chưa có mapping</div>;

  const usedPlain = useMemo(() => {
    const s = new Set();
    mapping.forEach((p) => p && s.add(p));
    return s;
  }, [mapping]);

  const handleChange = (idx, val) => {
    const v = (val || "").toLowerCase();
    if (!/^[a-z]$/.test(v)) return;
    // prevent duplicate plain letters: allow but swap previous
    const prevIndex = mapping.findIndex((x, i) => x === v && i !== idx);
    const next = mapping.slice();
    if (prevIndex >= 0) {
      next[prevIndex] = next[idx];
    }
    next[idx] = v;
    if (onPushHistory) onPushHistory(next);
    else setMapping(next);
  };

  const handleSwapClick = (idx, other) => {
    if (!onSwap) {
      // local swap
      const next = mapping.slice();
      const tmp = next[idx];
      next[idx] = next[other];
      next[other] = tmp;
      if (onPushHistory) onPushHistory(next);
      else setMapping(next);
    } else {
      onSwap(idx, other);
    }
  };

  return (
    <div className="mapping-grid">
      <table>
        <thead>
          <tr>
            <th>Cipher</th>
            <th>Plain</th>
            <th>Swap</th>
          </tr>
        </thead>
        <tbody>
          {letters.map((c, idx) => (
            <tr key={c}>
              <td className="cipher-cell">{c}</td>
              <td>
                <input
                  value={mapping[idx] || ""}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  maxLength={1}
                />
              </td>
              <td>
                <select
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    const otherIdx = v.charCodeAt(0) - 97;
                    handleSwapClick(idx, otherIdx);
                    e.target.selectedIndex = 0;
                  }}
                >
                  <option value="">swap ▾</option>
                  {letters.map((l, j) => (
                    <option key={l} value={l}>
                      swap with {l} ({mapping[j]})
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 8 }}>
        <button
          onClick={() => {
            if (onApply) onApply();
          }}
        >
          Áp dụng mapping
        </button>
      </div>
    </div>
  );
}
