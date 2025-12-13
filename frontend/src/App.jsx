import React, { useState } from "react";
import CaesarTool from "./components/CaesarTool";
import MonoSubstTool from "./components/MonoSubstTool";
import VigenereTool from "./components/VigenereTool";
import DES_Tool from "./components/DES_Tool";
import AES_Tool from "./components/AES_Tool";
import "./styles.css";

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
        <h2>Lab6 - Crypto Tools</h2>

        <ul>
          <li
            className={active === "caesar" ? "active" : ""}
            onClick={() => setActive("caesar")}
          >
            Caesar
          </li>
          <li
            className={active === "vigenere" ? "active" : ""}
            onClick={() => setActive("vigenere")}
          >
            Vigenère
          </li>
          <li
            className={active === "mono" ? "active" : ""}
            onClick={() => setActive("mono")}
          >
            Monoalphabetic
          </li>
          <li
            className={active === "des" ? "active" : ""}
            onClick={() => setActive("des")}
          >
            DES
          </li>
          <li
            className={active === "aes" ? "active" : ""}
            onClick={() => setActive("aes")}
          >
            AES
          </li>
        </ul>
      </nav>

      <main className="content">{tools[active]}</main>
    </div>
  );
}
