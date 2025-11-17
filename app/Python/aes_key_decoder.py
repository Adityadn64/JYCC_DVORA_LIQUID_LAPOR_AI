import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad

def decrypt_payload(encrypted_base64: str, key: str) -> str:
    try:
        key_bytes = key.encode('utf-8')
        if len(key_bytes) < 32:
            key_bytes = key_bytes.ljust(32, b' ')
        elif len(key_bytes) > 32:
            key_bytes = key_bytes[:32]
            
        encrypted_data = base64.b64decode(encrypted_base64)

        iv = encrypted_data[:16]

        ciphertext = encrypted_data[16:]

        cipher = AES.new(key_bytes, AES.MODE_CBC, iv)

        decrypted_padded = cipher.decrypt(ciphertext)
        decrypted = unpad(decrypted_padded, AES.block_size)

        return decrypted.decode('utf-8')
    except (ValueError, KeyError) as e:
        print(f"Error: Dekripsi gagal. Kemungkinan kunci salah atau data korup.")
        print(f"Detail Error: {e}")
        return None
    except Exception as e:
        print(f"Terjadi kesalahan yang tidak terduga: {e}")
        return None

def main():
    print("=" * 45)
    
    key = "Kg6$F5ptNZ2%qcRGav!QhZr*LXLpO6Zr"
    payload = "tTwT03b71foKOItb3DMfhu9qpTzlmApj7aMzSCFetVxBCJV7wMKz7o6/Y5HJX9P2z8vgEmhoZ6K5YHG5tXCrrQ=="
    
    key = input("Masukkan Kunci AES-256 (32 karakter): ").strip() or key
    payload = input("Masukkan Data Terenkripsi (Base64): ").strip() or payload

    print(f"🔑 Kunci yang Digunakan (panjang: {len(key)}): {key[:4]}...{key[-4:]}")
    print(f"🔒 Data Terenkripsi: {payload[:30]}...")
    print("-" * 45)

    data = decrypt_payload(payload, key)

    if data:
        print("\n✅ Hasil Dekripsi Berhasil:")
        print(data)

if __name__ == "__main__":
    main()