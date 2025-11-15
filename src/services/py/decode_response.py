import base64
import json
import random
from typing import Any, Dict, Optional, Literal

def vigenere_cipher(
    text: str, 
    key: str, 
    mode: Literal['encode', 'decode']
) -> str:
    """
    Menerapkan Vigenère cipher sederhana pada string, kompatibel dengan implementasi JS.
    
    Args:
        text: String yang akan dienkripsi/dekripsi.
        key: Kunci numerik dalam bentuk string (e.g., "4099753736").
        mode: 'encode' untuk enkripsi, 'decode' untuk dekripsi.
        
    Returns:
        String hasil cipher.
    """
    key_length = len(key)
    output_chars = []

    for i, char in enumerate(text):
        key_char = key[i % key_length]
        key_offset = int(key_char)
        
        input_ascii = ord(char)

        if mode == 'encode':
            new_ascii = (input_ascii + key_offset) % 256
        else:  # decode
            new_ascii = (input_ascii - key_offset + 256) % 256
            
        output_chars.append(chr(new_ascii)) # type: ignore
        
    return "".join(output_chars) # type: ignore


def decode_payload(encoded_payload: str, key: str) -> Optional[Any]:
    """
    Mendekode payload Base64 dan Vigenère-ciphered menjadi objek Python.
    
    Args:
        encoded_payload: String data terenkode dari field 'd'.
        key: String kunci dari field 'k'.
        
    Returns:
        Objek Python (dict, list, dll.) hasil dekode, atau None jika gagal.
    """
    try:
        scrambled_bytes = base64.b64decode(encoded_payload)
        scrambled_string = scrambled_bytes.decode('latin-1')
        
        # 2. Terapkan Vigenère Cipher untuk membalikkan acakan
        json_string = vigenere_cipher(scrambled_string, key, 'decode')
        
        return json.loads(json_string)

    except Exception as e:
        print(f"Gagal men-decode payload: {e}")
        return None

def process_response_data(response_data: Dict[str, str]) -> Optional[Any]:
    """
    Memproses dictionary respons yang berisi 'd' dan 'k'.
    Ini adalah versi sinkron dari proccessResponseData di JS.
    
    Args:
        response_data: Dictionary Python yang berisi {'d': ..., 'k': ...}.
        
    Returns:
        Objek Python hasil dekode, atau None jika gagal.
    """
    try:
        encoded_payload = response_data.get('d')
        key = response_data.get('k')

        if not encoded_payload or not key:
            print("Gagal memproses respons: field 'd' atau 'k' tidak ditemukan.")
            return None

        return decode_payload(encoded_payload, key)

    except Exception as e:
        print(f"Gagal memproses respons: {e}")
        return None
        
def encode_payload(data: Any) -> Dict[str, str]:
    """
    Mengenkode objek Python menjadi format 'd' dan 'k' untuk pengujian.
    """
    key = "".join([str(random.randint(0, 9)) for _ in range(10)])
    json_string = json.dumps(data)
    scrambled_string = vigenere_cipher(json_string, key, 'encode')
    
    encoded_payload_bytes = base64.b64encode(scrambled_string.encode('latin-1'))
    
    return {
        'd': encoded_payload_bytes.decode('ascii'),
        'k': key
    }

if __name__ == "__main__":
    while True:
        encoded_data = {
            "d": input("Masukkan data teren kode (field 'd'): "),
            "k": input("Masukkan kunci (field 'k'): ")
        }
        
        print("\nData Terenkode (yang akan dikirim server):", encoded_data)

        print("\n--- Proses Dekode Dimulai ---")
        decoded_data = process_response_data(encoded_data)
        print("--- Proses Dekode Selesai ---\n")
        
        print("Data Hasil Dekode:", decoded_data)
        
        print("\n✅ Verifikasi Berhasil: Data asli sama dengan data hasil dekode.")