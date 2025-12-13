import React, { useMemo } from "react";

export default function StatisticsGrid({ stats = {}, onClickLetter }) {
  if (!stats || Object.keys(stats).length === 0)
    return <div>Chưa có thống kê.</div>;

  const entries = Object.entries(stats).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...(entries.map((e) => e[1]) || [1]));

  return (
    <div>
      <table className="stats-table">
        <thead>
          <tr>
            <th>Letter</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([ch, cnt]) => {
            const intensity = Math.round((cnt / maxCount) * 100);
            const bg = `linear-gradient(90deg, rgba(200,80,80,${
              0.12 + intensity / 400
            }) ${intensity}%, transparent ${intensity}%)`;
            return (
              <tr
                key={ch}
                style={{
                  background: bg,
                  cursor: onClickLetter ? "pointer" : "default",
                }}
                onClick={() => onClickLetter && onClickLetter(ch)}
              >
                <td style={{ textAlign: "center" }}>{ch}</td>
                <td style={{ textAlign: "center" }}>{cnt}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
        Click chữ để highlight/scroll.
      </div>
    </div>
  );
}
