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
    payload = "N3b3IAr7q6XX4kHKd58o8boVNgfdpLdD+6nKg31oai9X5HGUxBHCWE9tpqpZE/bB8Rctg0f+f5EZL8DuhmapXNkhc2U9sxcFuKV61fKOLF47cu+hPfjP/jNsvGBxJsrAInCFXDovVrVjN/PShkZ/boJTFzTQIHfeuY2NHVtrcm30tF1CFVjxLh8lpi9l01x5lPfG1BbQrz2cph6Oc05o+nO5amEQ92Ji7NgB4U9JFYHOVwmGgqAZYdkgMLpAEK+JQOJuQtZToXDsSkzHq/9kriZHatUuOVuQRl8PUsfR+denYvCMX2nmFj1sErb1sEebyNPIxEH2i0jUe8qk+EWnxQEQD6STF2m6zYULPsMyW9u83u4Y6akwb1lxq4FJ4bLXjHx45bIEmQv8kApJZZl2ECsxiiHrnIbBjq/Hni1kuxmzLQBG84WfH1M+vyKsNEghWfeorYh2zjScQaEVBYq/u3FIvNPZi2plU63kJkdrxtL114QFKfpnKTbA4VmjZLr+z8fgIKZvRO21vr1a+8HgmeIuGwYYKE0ADrnlQoCroT7N08FRpzZoaPE9kISZ61H9OFGTCaZy+pJdlh054ZnZjPin93zbXweqTf5jcm1UmhdDL8tEXbcrPczFcHyOYWOEKEOX7M/0NoaZgNsHXwDfucjDaFzDf1NAxJNqJD9QSd2wIsshPDMgcs9U+d70Bk2eEByW/dXiTJ+rvvH7Hnah0EmkNX0U5fNzfL35A7GOZkXUYiWIlYw0yoqr3HQto7cxhsBvExGVXF6Ywlq8bmQV4BSJuYgbg9vMYZ6K4HeWFkTDabOQlPf/7MY9BVNgiwtdjTrLGPcQdYMKyqmDoL1gLxO16RP1OYUVZHZr2Wdn/CxGi/uxvmY9DE3QCrzjGiCf5N8O5u/Nd1bdRz+qV8wvtOz/m2n9FUvfZXowjA4nOWuKrgheCD541A3IlSFM6DEZfGOwuiT0EZYvpp+PA49TdYezT3NgheA1TFglWMxFISAvAPNfG5REKgFkQ0keLM0tTgx68R8GKFYOwZIxQG6K53/rHR2NdrZLGbyvGOTzeSg+IC9qkUNA7mfK2lugdjH3sEDogjwQA2BtYtifSfv+rZzDhLOMMYaFkfu5Lk8dxTLFnXe0xcCCn+5F0EkX7iJRvOaxQSvy+m2J2LKr1Qw3NOsm7ZpA/Nv8xpEBo/C1cuN9Pig3LkNzSp6puWv427UqaFSWXMtaIijYYVBx7FBld2sf5adTI5xms1tTcbesFDIsRnqTNUvFHtKYc0R9RUVEe0VFOk1SJqFPn3gqq0KkX53yypqCZLZ97434grhVLr9ev81RlBnMtn4f1fFjCQx0phGFzo0qaV40MSDYRKXh8EavxHSVDTrhyEUoKcRYz4HJmdshnmraEbB9FVs0CLgXijvgEvAq+bHZxol+LdBbjBceb+Aen7NO5PoXzlER+xNG98UC3xeJax4dQD38+MbP4goDK4NzeoSTw8qX/kl4Vv6KRo959iF87kUdzru3uYxo0Y4jAkexlLNfde7o4bsP/96P2LuJ3sayBHYA1QPH2N0FxPajv4Nh1RfIoiXr+ADwwjiVfs1kowhV3ziAzNTR8RVO98PQGlPtuMuO2FvbkSujv1VsGiKeB+PYJSPOdEKi20VyOWWx2x8k0N3QIDH7"
    
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