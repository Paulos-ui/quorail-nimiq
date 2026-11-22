// Passwords and decrypted contents remain in the browser.
const encoder = new TextEncoder();
const encode = (bytes: Uint8Array) =>
  btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
const decode = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function key(password: string, salt: Uint8Array<ArrayBuffer>) {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function encryptBackup(data: unknown, password: string) {
  if (password.length < 12)
    throw new Error("Use a backup password with at least 12 characters.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = encoder.encode(JSON.stringify(data));
  if (payload.length > 500000) throw new Error("Backup is too large.");
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await key(password, salt),
    payload,
  );
  return {
    format: "quorail-encrypted",
    version: 1,
    salt: encode(salt),
    iv: encode(iv),
    ciphertext: encode(new Uint8Array(ciphertext)),
  };
}
export async function decryptBackup(
  data: unknown,
  password: string,
): Promise<unknown> {
  const d = data as Record<string, unknown>;
  if (
    !d ||
    d.format !== "quorail-encrypted" ||
    d.version !== 1 ||
    typeof d.salt !== "string" ||
    typeof d.iv !== "string" ||
    typeof d.ciphertext !== "string" ||
    d.ciphertext.length > 700000
  )
    throw new Error("Unsupported encrypted backup.");
  try {
    const salt = decode(d.salt),
      iv = decode(d.iv);
    if (salt.length !== 16 || iv.length !== 12) throw new Error();
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      await key(password, salt),
      decode(d.ciphertext),
    );
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    throw new Error(
      "Could not unlock this backup. Check the password and file.",
    );
  }
}
