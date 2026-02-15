import CryptoJS from "crypto-js";

const SECRET_KEY = "mvhmdle-secure-key-2026";

// Helper: Hashes the key so it's consistent but unreadable
// e.g. "wordle-currency" -> "a4f89c..."
const hashKey = (key) => {
  return CryptoJS.HmacSHA256(key, SECRET_KEY).toString();
};

export const secureStorage = {
  getItem: (key, initialValue) => {
    // 1. Hash the readable key to find the storage slot
    const hashedKey = hashKey(key);

    // 2. Get the encrypted value
    const encryptedItem = localStorage.getItem(hashedKey);

    if (!encryptedItem) return initialValue;

    try {
      // 3. Decrypt the value
      const bytes = CryptoJS.AES.decrypt(encryptedItem, SECRET_KEY);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.log(error);
      console.warn("Tampering detected for key:", key);
      return initialValue;
    }
  },

  setItem: (key, value) => {
    const hashedKey = hashKey(key);
    const stringified = JSON.stringify(value);
    const encrypted = CryptoJS.AES.encrypt(stringified, SECRET_KEY).toString();

    localStorage.setItem(hashedKey, encrypted);
  },

  removeItem: (key) => {
    const hashedKey = hashKey(key);
    localStorage.removeItem(hashedKey);
  },

  // Optional: clear only your app's items (if you needed to implement a full wipe)
  clear: () => {
    localStorage.clear();
  },
};
