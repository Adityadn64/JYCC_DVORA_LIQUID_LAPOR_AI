```
import { AuthUser, ResponseData } from '@/types';
import axios from 'axios';
import type { AxiosResponse, AxiosInstance, AxiosError } from 'axios';

// ================================
// ENCRYPTION KEYS
// ================================

const K1 = process.env.K1 || '^UAFU!Tce1$P^jX$2xdfF6s6t0x7Wtlv'; // K1: React->Express (encrypt)
const K4 = process.env.K4 || 'Kg6$F5ptNZ2%qcRGav!QhZr*LXLpO6Zr'; // K4: Express->React (decrypt)

// ================================
// AXIOS INSTANCE CONFIGURATION
// ================================

const DEFAULT_SERVER_API_URL: string = process.env.NEXT_PUBLIC_DEFAULT_SERVER_API_URL || "http://localhost:3001";
const SERVER_API_URLS: string[] = JSON.parse(
  process.env.NEXT_PUBLIC_SERVER_API_URLS || `["${DEFAULT_SERVER_API_URL}"]`
);

const searchBaseURL = async () => {
  for (const url of SERVER_API_URLS) {
    try {
      const response = await axios.get(url);
      if (response.status === 200) {
        return url;
      }
    } catch (error) {
      continue;
    }
  }

  return DEFAULT_SERVER_API_URL;
}

// ================================
// CSRF TOKEN UTILITIES
// ================================

const getCsrfTokenFromCookie = (): string | null => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: `${DEFAULT_SERVER_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''}`,
  },
  withCredentials: true
});

// ================================
// ENCRYPTION/DECRYPTION UTILITIES
// ================================

const toHex = (b) => {
  let hex = '';
  for (const byte of b) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
};

const assert = (cond, msg) => { if (!cond) console.warn("ASSERT FAIL:", msg); else console.log("OK:", msg); };

const normalizeKey = (key: string): Uint8Array => {
  const encoder = new TextEncoder();
  let keyBytes = encoder.encode(key);
  console.log("key bytes len (chars->bytes):", keyBytes.length, "hex sample:", toHex(keyBytes.slice(0, Math.min(8, keyBytes.length))));

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

  return keyBytes;
};

const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

const base64ToBuffer = (cleaned: string): ArrayBuffer => {
  const binary_string = atob(cleaned);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary_string.charCodeAt(i);
  return bytes.buffer;
};

const cleanBase64 = (s: string): string => {
  if (!s) return s;
  s = s.replace(/\s+/g, '');
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4 !== 0) s += '=';
  return s;
};

export const aesEncrypt = async (text: string, key: string): Promise<string> => {
  const data = new TextEncoder().encode(text);
  const keyBytes = normalizeKey(key);

  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, 'AES-CBC', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptoKey, data);

  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);

  return bufferToBase64(result.buffer);
};

export const aesDecrypt = async (encrypted: string, key: string): Promise<string> => {
  try {
    console.log("raw key length (chars):", key.length, "sample:", key.slice(0,4)+"..."+key.slice(-4));

    const keyBytes = normalizeKey(key);

    const cleaned = cleanBase64(encrypted);
    console.log("cleaned base64 (first50):", cleaned?.slice(0,50)+"...");

    const combined = new Uint8Array(base64ToBuffer(cleaned));

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

    const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, 'AES-CBC', false, ['decrypt']);
    console.log("importKey OK. attempting decrypt...");
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, ciphertext);
    console.log("DECRYPT SUCCESS! plaintext len:", decrypted.byteLength);
    const result = new TextDecoder().decode(decrypted).slice(0,200)
    console.log("plaintext (utf8, first200):", result);
    return result;
  } catch (err: any) {
    console.error('AES Decrypt error:', err.name ?? err, err.message ?? err);
    throw err;
  }
};

const encodePayloadToExpress = async (data: any): Promise<string> => {
  try {
    const jsonString = JSON.stringify(data);
    return await aesEncrypt(jsonString, K1);
  } catch (error) {
    console.error("Gagal men-encode payload ke Express:", error);
    throw error;
  }
};

const decodePayloadFromExpress = async <T>(encodedPayload: string): Promise<T | null> => {
  try {
    const decrypted = await aesDecrypt(encodedPayload, K4);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error("Gagal men-decode payload dari Express:", error);
    return null;
  }
};

export const decodeErrorResponse = async (error: any): Promise<string> => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const encodedData = error.response.data as { d: string };
    if (encodedData.d) {
      try {
        const decodedPayload = await decodePayloadFromExpress<{ message: string; errors?: any }>(
          encodedData.d
        );

        if (decodedPayload?.errors) {
          const firstErrorKey = Object.keys(decodedPayload.errors)[0];
          const firstErrorMessage = decodedPayload.errors[firstErrorKey][0];
          return firstErrorMessage;
        }

        if (decodedPayload?.message) {
          return decodedPayload.message;
        }
      } catch (decodeError) {
        console.error("Gagal decode error response:", decodeError);
      }
    }
  }

  return "Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.";
};

// ================================
// REQUEST INTERCEPTOR
// ================================

apiClient.interceptors.request.use(
  async (config) => {
    // Get Bearer token from localStorage
    if (typeof window !== 'undefined') {
      const authToken = localStorage.getItem('auth_token');
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
    }

    // Attach CSRF token from cookies
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }

    // Encrypt request data if it's a POST/PUT/PATCH request with data
    if (config.data && ['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '')) {
      const encrypted = await encodePayloadToExpress(config.data);
      config.data = { d: encrypted };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ================================
// RESPONSE INTERCEPTOR
// ================================

apiClient.interceptors.response.use(
  async (response) => {
    console.log({apiClientResponse: response});
    if (response.data && response.data.d) {
      try {
        const data = response.data.d;

        console.log("Data Length:", data.length);

        const decrypted = await decodePayloadFromExpress<any>(data);
        
        // Store auth token if provided
        if (decrypted?.data?.token && typeof window !== 'undefined') {
          localStorage.setItem('auth_token', decrypted.data.token);
        }

        // Store user data if provided
        if (decrypted?.data?.user && typeof window !== 'undefined') {
          localStorage.setItem('user_data', JSON.stringify(decrypted.data.user));
        }

        // Replace response data with decrypted data
        response.data = decrypted || response.data;
      } catch (error) {
        console.error('Failed to decrypt response:', error);
      }
    }

    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access Forbidden:', error.response.data);
    }

    return Promise.reject(error);
  }
);
```

Hasilnya:

```
Data Length: 1664
api.ts:136 raw key length (chars): 24 sample: Kg6%...O6Zr
api.ts:79 key bytes len (chars->bytes): 24 hex sample: 4b67362571635247
api.ts:86 key padded to 32 bytes (python-style).
api.ts:91 normalized KEY len: 32 hex: 4b6736257163524761762151685a722a4c584c704f365a722020202020202020
api.ts:141 cleaned base64 (first50): CcnndhupOtrXqWdbANFjRhDcPp/kdIL9+kojnhpJvAa1vMWvkk...
api.ts:145 combined len: 1248
api.ts:147 first 32 bytes hex: 09c9e7761ba93adad7a9675b00d1634610dc3e9fe47482fdfa4a239e1a49bc06
api.ts:150 IV hex: 09c9e7761ba93adad7a9675b00d16346
api.ts:151 ciphertext len: 1232
api.ts:152 ciphertext first 32 hex: 10dc3e9fe47482fdfa4a239e1a49bc06b5bcc5af924f97ed5db1e2f1f712be5e
api.ts:74 OK: ciphertext nonzero
api.ts:74 OK: ciphertext length % 16 == 0 (AES block size)
api.ts:157 About to importKey (raw) with normalized key (len): 32
api.ts:159 keyBytes type: object
32api.ts:162 keyByte type: number
api.ts:166 importKey OK. attempting decrypt...
api.ts:173 AES Decrypt error: OperationError 
aesDecrypt @ api.ts:173
await in aesDecrypt
decodePayloadFromExpress @ api.ts:190
(anonymous) @ api.ts:271
Promise.then
_request @ axios.js?v=3c66e696:2310
request @ axios.js?v=3c66e696:2219
httpMethod @ axios.js?v=3c66e696:2356
wrap @ axios.js?v=3c66e696:8
getHome @ api.ts:315
fetchData @ HomePage.tsx:46
(anonymous) @ HomePage.tsx:83
react_stack_bottom_frame @ react-dom_client.js?v=c67d0e60:18567
runWithFiberInDEV @ react-dom_client.js?v=c67d0e60:997
commitHookEffectListMount @ react-dom_client.js?v=c67d0e60:9411
commitHookPassiveMountEffects @ react-dom_client.js?v=c67d0e60:9465
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11040
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11066
flushPassiveEffects @ react-dom_client.js?v=c67d0e60:13150
(anonymous) @ react-dom_client.js?v=c67d0e60:12776
performWorkUntilDeadline @ react-dom_client.js?v=c67d0e60:36
<HomePage>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=e1807398:247
App @ App.tsx:70
react_stack_bottom_frame @ react-dom_client.js?v=c67d0e60:18509
renderWithHooksAgain @ react-dom_client.js?v=c67d0e60:5729
renderWithHooks @ react-dom_client.js?v=c67d0e60:5665
updateFunctionComponent @ react-dom_client.js?v=c67d0e60:7475
beginWork @ react-dom_client.js?v=c67d0e60:8525
runWithFiberInDEV @ react-dom_client.js?v=c67d0e60:997
performUnitOfWork @ react-dom_client.js?v=c67d0e60:12561
workLoopSync @ react-dom_client.js?v=c67d0e60:12424
renderRootSync @ react-dom_client.js?v=c67d0e60:12408
performWorkOnRoot @ react-dom_client.js?v=c67d0e60:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=c67d0e60:13505
performWorkUntilDeadline @ react-dom_client.js?v=c67d0e60:36
<App>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=e1807398:247
(anonymous) @ index.tsx:14Understand this error
api.ts:193 Gagal men-decode payload dari Express: OperationError
    at aesDecrypt (api.ts:167:43)
    at async decodePayloadFromExpress (api.ts:190:23)
    at async api.ts:271:27
decodePayloadFromExpress @ api.ts:193
await in decodePayloadFromExpress
(anonymous) @ api.ts:271
Promise.then
_request @ axios.js?v=3c66e696:2310
request @ axios.js?v=3c66e696:2219
httpMethod @ axios.js?v=3c66e696:2356
wrap @ axios.js?v=3c66e696:8
getHome @ api.ts:315
fetchData @ HomePage.tsx:46
(anonymous) @ HomePage.tsx:83
react_stack_bottom_frame @ react-dom_client.js?v=c67d0e60:18567
runWithFiberInDEV @ react-dom_client.js?v=c67d0e60:997
commitHookEffectListMount @ react-dom_client.js?v=c67d0e60:9411
commitHookPassiveMountEffects @ react-dom_client.js?v=c67d0e60:9465
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11040
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11033
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11201
recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=c67d0e60:11010
commitPassiveMountOnFiber @ react-dom_client.js?v=c67d0e60:11066
flushPassiveEffects @ react-dom_client.js?v=c67d0e60:13150
(anonymous) @ react-dom_client.js?v=c67d0e60:12776
performWorkUntilDeadline @ react-dom_client.js?v=c67d0e60:36
<HomePage>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=e1807398:247
App @ App.tsx:70
react_stack_bottom_frame @ react-dom_client.js?v=c67d0e60:18509
renderWithHooksAgain @ react-dom_client.js?v=c67d0e60:5729
renderWithHooks @ react-dom_client.js?v=c67d0e60:5665
updateFunctionComponent @ react-dom_client.js?v=c67d0e60:7475
beginWork @ react-dom_client.js?v=c67d0e60:8525
runWithFiberInDEV @ react-dom_client.js?v=c67d0e60:997
performUnitOfWork @ react-dom_client.js?v=c67d0e60:12561
workLoopSync @ react-dom_client.js?v=c67d0e60:12424
renderRootSync @ react-dom_client.js?v=c67d0e60:12408
performWorkOnRoot @ react-dom_client.js?v=c67d0e60:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=c67d0e60:13505
performWorkUntilDeadline @ react-dom_client.js?v=c67d0e60:36
<App>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=e1807398:247
(anonymous) @ index.tsx:14Understand this error
HomePage.tsx:77 Error fetching home data: TypeError: Cannot read properties of undefined (reading 'pendingReports')
    at fetchData (HomePage.tsx:51:29)
```

Sementara:

```
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
```

Hasilnya:

```
Data Length: 1664
VM245:20 === DEBUG START ===
VM245:21 raw key length (chars): 32 sample: Kg6$...O6Zr
VM245:25 key bytes len (chars->bytes): 32 hex sample: 4b67362446357074
VM245:38 normalized KEY len: 32 hex: 4b673624463570744e5a32257163524761762151685a722a4c584c704f365a72
VM245:41 cleaned base64 (first50): CcnndhupOtrXqWdbANFjRhDcPp/kdIL9+kojnhpJvAa1vMWvkk...
VM245:53 combined len: 1248
VM245:55 first 32 bytes hex: 09c9e7761ba93adad7a9675b00d1634610dc3e9fe47482fdfa4a239e1a49bc06
VM245:58 IV hex: 09c9e7761ba93adad7a9675b00d16346
VM245:59 ciphertext len: 1232
VM245:60 ciphertext first 32 hex: 10dc3e9fe47482fdfa4a239e1a49bc06b5bcc5af924f97ed5db1e2f1f712be5e
VM245:3 OK: ciphertext nonzero
VM245:3 OK: ciphertext length % 16 == 0 (AES block size)
VM245:65 About to importKey (raw) with normalized key (len): 32
VM245:67 keyBytes type: object
32VM245:70 keyByte type: number
VM245:90 === DEBUG END ===
VM245:77 importKey OK. attempting decrypt...
VM245:79 DECRYPT SUCCESS! plaintext len: 1230
VM245:80 plaintext (utf8, first200): {"success":true,"message":"","data":{"viewData":{"totalReports":51,"pendingReports":9,"processReports":11,"finishedReports":19,"rejectedReports":12,"topCities":[{"city":"35.12","city_name":"Kabupaten 
undefined
```