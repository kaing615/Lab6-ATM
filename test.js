// tools/test_des_compare.js (chạy bằng node)
import crypto from "crypto";
import { desEncryptHex } from "./backend/src/utils/des_modes.js"; // file wrapper anh đang dùng

function crypto_des_cbc_hex(plain, keyHex, ivHex) {
  const key = Buffer.from(keyHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const c = crypto.createCipheriv("des-cbc", key, iv);
  // mặc định padding PKCS#7
  const out = Buffer.concat([c.update(Buffer.from(plain, "utf8")), c.final()]);
  return out.toString("hex");
}

const key = "0123456789abcdef"; // hex
const ivHex = "1111111111111111"; // hex (-> 0x11..)
const pt = "Hello Des Test";

console.log("Node crypto (des-cbc):", crypto_des_cbc_hex(pt, key, ivHex));
const our = desEncryptHex(pt, key, "CBC", ivHex);
console.log("our wrapper:", our.ciphertextHex);
