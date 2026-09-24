import { pbkdf2 } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

self.onmessage = (event: MessageEvent<{ password: string; salt: string }>) => {
  try {
    const { password, salt } = event.data;
    const hash = bytesToHex(pbkdf2(sha256, password, salt, { c: 100_000, dkLen: 32 }));
    self.postMessage({ hash });
  } catch {
    self.postMessage({ error: "Não foi possível processar a senha. Tente novamente." });
  }
};
