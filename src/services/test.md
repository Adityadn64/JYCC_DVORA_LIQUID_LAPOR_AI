// helper
const toHex = (b) => Array.from(b).map(x => x.toString(16).padStart(2,'0')).join('');
const assert = (cond, msg) => { if (!cond) console.warn("ASSERT FAIL:", msg); else console.log("OK:", msg); };

// 1. base64 cleaning — in case payload got url-safe or whitespace
const cleanBase64 = (s) => {
  if (!s) return s;
  s = s.replace(/\s+/g, '');           // remove whitespace/newlines
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4 !== 0) s += '=';
  return s;
};

// Replace these with your runtime values
const keyString = "Kg6$F5ptNZ2%qcRGav!QhZr*LXLpO6Zr";               // key you pass to aesDecrypt
const cipherBase64Raw = "CcnndhupOtrXqWdbANFjRhDcPp/kdIL9+kojnhpJvAa1vMWvkk+X7V2x4vH3Er5e4TT2LyKcPwEW5h4Txu3/3pJYrPNLr09YrrWs/Esn8rx++Srx+RVkpzDFWjs++isvqK+FmfqOTiVKMDScGxD9JHRQl5UIVK/lmnPcZC1cn7Ossy+Jb8EkF080qVYxpNQiWMwynCkchQxBLN5VTr3tvJPgOQ4PipsnHupAiShargH5SpZfGrwB506epIWD39xurz89rU3jZPcl9y11qdU5nUxUr0zWjILgxR2AgJjDQvlB5Mqk7Lzd8vpaCnyE2+U0jYFjGdYCrmqkZ2VjoWzPSkp0u8wlzclBAExyyQCdqqpw3+sjEjpUPIrQdqtStMlcMGz06p0n+Hm52+ykXzWj9qHqEZ7nlo8hczq06N82OQMse1yhOnH2z+4oF501/LGD28MkQ3e8Ec6Vktt7VxsBJ+zoPKNlDuzMhkG1bYbz5yC58yiFwwp7WSDPZzYveazGQB0csZHca08s/yP/khi3u0VRTYzsf4bdHan97yIpqcv23LveMoFrIyuDj4NZdPyh1Fs+TwJx4Ecskmjou1kl8hbYwloOTPXfDw5J9lrm5JySyZKc4Mlr/BtrYZ7nkAs0YqTsY/xG6TKgY92oZZsOTK1KGHq4C9UxkMTlGsmolK7cWBbzQz3OF3jQQaYlAqBG/y2QxF9HoSjuq9F0tBWMLFA5vVC3hS2PjSzIPdYPJBIAky6bsFSPxy6fvu6yWRnZwbfkrAad5ZhH1+ARcnVcVbtNxQRIF24vLGRWO7G2J5KjeJmGxeuwaYyEwqLAcy99UPV/SFBEI3J25tFiWPgjCXMBMNmmZSoXyfT+dq7k2qFS0A87uzxoOxNEvgOUAy1BK2bPlP4IJ/sU8JxFAgMDVeQ+2K7PCaVvNCVlnDmH+p8WW/l8DlWOaz0yDt2pEv1MZDi+weUn+vR4nAG+UxX8i6dFVJTtgKJaS5hyYuTZafU6MYjWnzGc/5MkGSlxQG5cKbp5zDB/IQXdvRqfgZdgwiPcpsMc8OEXLa7z1G2qKiZ4BOqpIkab7degurwwaH4rnAUN1TVCiVCtwx2+Gkk9PZuOxZSv6XNhI3Yh+XWk61/uj3M/l83oANqL9WmZ3MwiQYbEN2tP6CRyTs1wGULpFY2G5cWyv2oERfVGMwXojCUJcVbQjeroKaLzd21vjyg1RtJhaTc5bK6jeTqWpv5D1dl9BJEGMoxhzCi4HuzY+qyOBQHMSFDQhVnz3Wo8PbVhYhmmNVuM7WHUWE1VBF8nzSZIlIu4TFElULhOtXSHgiWtwFCCjdhIg/6+QxbQ1DgnL/LAJU9YJhoQO8V66h9lUA03IsNneXfBIiYhI05wzyGhh3SAv1mHpaeGG/DX/DLffudmQOLkX/Vrni8poCgt2zYrlIYm696B6QfMrTyK8K1XR5T/3sRjzFbDtmdYdYxT51AegAr7tl8hSNN3p5Z6dJQaNRxHBPT4ekEM3qg+xjVtWUZc5c8iFJLPyagLAvOmr47eoWMg8JLIUnCBzuRYSKOL2BMobUmB1xt4DzIXo9b4dKsL+s3+LnRDfx5OESX8Q79DCkowECjhWy5WIn7u63v9ROfhZxalL27Up6zvrl8SWlTdNh89/zGpmVnpm39e"; // the base64 string you received 

console.log("Data Length:", cipherBase64Raw.length);

console.log("=== DEBUG START ===");
console.log("raw key length (chars):", keyString.length, "sample:", keyString.slice(0,4)+"..."+keyString.slice(-4));

const encoder = new TextEncoder();
let keyBytes = encoder.encode(keyString);
console.log("key bytes len (chars->bytes):", keyBytes.length, "hex sample:", toHex(keyBytes.slice(0, Math.min(8, keyBytes.length))));

/* Normalize like Python: pad/truncate by BYTES */
if (keyBytes.length < 32) {
  const padded = new Uint8Array(32);
  padded.set(keyBytes);
  padded.fill(0x20, keyBytes.length);
  keyBytes = padded;
  console.log("key padded to 32 bytes (python-style).");
} else if (keyBytes.length > 32) {
  keyBytes = keyBytes.slice(0,32);
  console.log("key truncated to 32 bytes (python-style).");
}
console.log("normalized KEY len:", keyBytes.length, "hex:", toHex(keyBytes));

const cleaned = cleanBase64(cipherBase64Raw);
console.log("cleaned base64 (first50):", cleaned?.slice(0,50)+"...");

try {
  const combined = new Uint8Array((() => {
    // base64ToBuffer function used in your code
    const binary_string = atob(cleaned);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary_string.charCodeAt(i);
    return bytes.buffer;
  })());

  console.log("combined len:", combined.byteLength);
  const combinedU8 = new Uint8Array(combined);
  console.log("first 32 bytes hex:", toHex(combinedU8.slice(0,32)));
  const iv = combinedU8.slice(0,16);
  const ciphertext = combinedU8.slice(16);
  console.log("IV hex:", toHex(iv));
  console.log("ciphertext len:", ciphertext.length);
  console.log("ciphertext first 32 hex:", toHex(ciphertext.slice(0,32)));
  assert(ciphertext.length > 0, "ciphertext nonzero");
  assert(ciphertext.length % 16 === 0, "ciphertext length % 16 == 0 (AES block size)");

  // show types used by importKey / decrypt
  console.log("About to importKey (raw) with normalized key (len):", keyBytes.length);

	console.log("keyBytes type:", typeof keyBytes);

	for (const keyByte of keyBytes) {
		console.log("keyByte type:", typeof keyByte);
	}

  // optional quick test: derive CryptoKey and attempt decrypt but capture error details
  (async () => {
    try {
      const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, 'AES-CBC', false, ['decrypt']);
      console.log("importKey OK. attempting decrypt...");
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, ciphertext);
      console.log("DECRYPT SUCCESS! plaintext len:", decrypted.byteLength);
      console.log("plaintext (utf8, first200):", new TextDecoder().decode(decrypted).slice(0,200));
    } catch (e) {
      console.error("DECRYPT FAILED. error.name:", e.name, "message:", e.message);
      console.error(e);
    }
  })();

} catch (err) {
  console.error("Failed while decoding base64 or inspecting buffer:", err);
}
console.log("=== DEBUG END ===");