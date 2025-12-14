import React, { useState } from "react";
import CaesarTool from "./components/CaesarTool";
import MonoSubstTool from "./components/MonoSubstTool";
import VigenereTool from "./components/VigenereTool";
import DES_Tool from "./components/DES_Tool";
import AES_Tool from "./components/AES_Tool";
import "./styles.css";

const menuItems = [
  { key: "caesar", label: "Caesar" },
  { key: "vigenere", label: "Vigenère" },
  { key: "mono", label: "Monoalphabetic" },
  { key: "des", label: "DES" },
  { key: "aes", label: "AES" },
];

export default function App() {
  const [active, setActive] = useState("caesar");

  const tools = {
    caesar: <CaesarTool />,
    vigenere: <VigenereTool />,
    mono: <MonoSubstTool />,
    des: <DES_Tool />,
    aes: <AES_Tool />,
  };

  return (
    <div className="layout">
      <nav className="sidebar">
        <h2> Lab 6</h2>
        <ul>
          {menuItems.map((item) => (
            <li
              key={item.key}
              className={active === item.key ? "active" : ""}
              onClick={() => setActive(item.key)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </nav>
      <main className="content">{tools[active]}</main>
    </div>
  );
}
