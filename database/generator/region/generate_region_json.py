import requests
import os
import json
import time

# --- Konfigurasi ---
BASE_URL = "https://wilayah.id/api"
PROVINCE_CODE = "35"  # Kode untuk Jawa Timur
OUTPUT_DIR = "database/generator/region/output"
OUTPUT_FILENAME = "region.json"
OUTPUT_PATH = os.path.join(OUTPUT_DIR, OUTPUT_FILENAME)
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_province_name(province_code):
    """Mengambil nama provinsi berdasarkan kodenya."""
    try:
        response = requests.get(f"{BASE_URL}/provinces.json")
        response.raise_for_status()
        provinces = response.json().get('data', [])
        for province in provinces:
            if province.get('code') == province_code:
                return province.get('name', 'Unknown Province')
        return 'Unknown Province'
    except requests.RequestException as e:
        print(f"Error fetching province name: {e}")
        return "Error: Could not fetch province name"

def main():
    """
    Fungsi utama untuk mengambil data wilayah dan menyimpannya ke file JSON.
    """
    print("Memulai proses pengambilan data wilayah untuk Jawa Timur...")

    # Dapatkan nama provinsi untuk data yang lebih deskriptif
    province_name = get_province_name(PROVINCE_CODE)

    # Struktur data akhir yang akan disimpan
    region_data = {
        "province_code": PROVINCE_CODE,
        "province_name": province_name,
        "regencies": []
    }

    # 1. Ambil semua data Kabupaten/Kota dari Jawa Timur
    regencies_url = f"{BASE_URL}/regencies/{PROVINCE_CODE}.json"
    print(f"Mengambil data kabupaten/kota dari: {regencies_url}")

    try:
        regencies_response = requests.get(regencies_url)
        # Lemparkan error jika status code bukan 2xx
        regencies_response.raise_for_status()
        regencies = regencies_response.json().get('data', [])

        if not regencies:
            print("Tidak ada data kabupaten/kota yang ditemukan.")
            return

        print(f"Ditemukan {len(regencies)} kabupaten/kota. Mengambil data kecamatan untuk masing-masing...")

        # 2. Untuk setiap Kabupaten/Kota, ambil semua data Kecamatannya
        for regency in regencies:
            regency_code = regency.get('code')
            regency_name = regency.get('name')
            
            if not regency_code:
                continue

            print(f"  -> Mengambil kecamatan untuk {regency_name} ({regency_code})...")
            districts_url = f"{BASE_URL}/districts/{regency_code}.json"
            
            try:
                districts_response = requests.get(districts_url)
                districts_response.raise_for_status()
                districts = districts_response.json().get('data', [])
                
                # Tambahkan data kecamatan ke data kabupaten/kota
                regency_with_districts = {
                    "code": regency_code,
                    "name": regency_name,
                    "districts": districts
                }
                
                region_data["regencies"].append(regency_with_districts)
                
                # Beri jeda sedikit agar tidak membebani API server
                time.sleep(0.1)

            except requests.RequestException as e:
                print(f"    ERROR: Gagal mengambil kecamatan untuk {regency_name}. Kesalahan: {e}")
                # Tetap tambahkan data kabupaten/kota meskipun kecamatannya gagal diambil
                regency_without_districts = {
                    "code": regency_code,
                    "name": regency_name,
                    "districts": []
                }
                region_data["regencies"].append(regency_without_districts)


        # 3. Simpan semua data yang terkumpul ke dalam file JSON
        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            # indent=2 membuat file JSON lebih mudah dibaca manusia
            json.dump(region_data, f, ensure_ascii=False, indent=2)

        print(f"\nProses selesai! Data telah berhasil disimpan di file '{OUTPUT_PATH}'")

    except requests.RequestException as e:
        print(f"FATAL ERROR: Gagal mengambil data kabupaten/kota. Kesalahan: {e}")
    except json.JSONDecodeError:
        print("FATAL ERROR: Gagal mem-parsing respons JSON dari server.")

if __name__ == "__main__":
    main()