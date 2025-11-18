import requests
import re

BASE_URL = "https://lalim.vercel.app" # "http://localhost:8000"
ALLOWED_TEST_ORIGIN = "http://localhost:3001"
DISALLOWED_ORIGIN = "https://lalex.vercel.app"

API_PATHS = [
    "/",
    "/api/admin/analytics",
    "/api/admin/analytics/export-reports",
    "/api/admin/dashboard",
    "/api/admin/manage",
    "/api/admin/manage/{admin}",
    "/api/admin/manage/{admin}/accept",
    "/api/admin/manage/{admin}/activity",
    "/api/admin/manage/{admin}/reject",
    "/api/admin/manage/{admin}/send-reset",
    "/api/admin/manage/{admin}/toggle-status",
    "/api/admin/performance",
    "/api/admin/profile",
    "/api/admin/profile/deactivate-self",
    "/api/admin/profile/export-profile",
    "/api/admin/profile/request-email-change",
    "/api/admin/profile/request-phone-change",
    "/api/admin/profile/update-full-name",
    "/api/admin/profile/update-info",
    "/api/admin/profile/update-kta",
    "/api/admin/profile/update-nip",
    "/api/admin/profile/update-password",
    "/api/admin/profile/update-picture",
    "/api/admin/profile/verify-email-change",
    "/api/admin/profile/verify-phone-change",
    "/api/auth/forgot-password",
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/register",
    "/api/auth/register/send",
    "/api/auth/register/verify",
    "/api/auth/register/verify/send",
    "/api/auth/reset-password",
    "/api/auth/reset-password/{token}",
    "/api/home",
    "/api/regencies",
    "/api/report/create",
    "/api/report/{report}/track",
    "/api/reports/track",
    "/sanctum/csrf-cookie",
    "/up"
]
# --- AKHIR KONFIGURASI ---


# ANSI color codes for better readability in terminal
class colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    GREY = '\033[90m'
    ENDC = '\033[0m'

def check_cors(url, origin):
    """
    Sends a pre-flight OPTIONS request and returns True if CORS headers are correct, False otherwise.
    """
    method = 'POST' if 'api' in url else 'GET'
    headers = {
        'Origin': origin,
        'Access-Control-Request-Method': method,
        'Access-Control-Request-Headers': 'content-type,x-xsrf-token',
    }
    
    try:
        response = requests.options(url, headers=headers, timeout=15, allow_redirects=False)
        allow_origin = response.headers.get('Access-Control-Allow-Origin')
        
        # Log detail
        print(f"{colors.GREY}  -> Origin Sent: {origin}{colors.ENDC}")
        print(f"{colors.GREY}  -> Method: {method}{colors.ENDC}")
        print(f"{colors.GREY}  -> ACAO Received: {allow_origin}{colors.ENDC}")

        # Jika ini adalah origin yang diizinkan, header ACAO harus sama persis
        if origin == ALLOWED_TEST_ORIGIN:
            return allow_origin == origin
        
        # Jika ini adalah origin yang ditolak, header ACAO TIDAK BOLEH ada atau tidak sama
        if origin == DISALLOWED_ORIGIN:
            return allow_origin != DISALLOWED_ORIGIN and allow_origin is not None

    except requests.exceptions.RequestException as e:
        print(f"{colors.RED}  -> ERROR: Gagal terhubung ke server. Pesan: {e}{colors.ENDC}")
        return False
    return False

# Main script execution
if __name__ == "__main__":
    success_count = 0
    failure_count = 0
    total_paths = len(API_PATHS)

    print(f"{colors.YELLOW}Memulai Pengecekan CORS Menyeluruh untuk {BASE_URL}{colors.ENDC}\n")

    for i, path in enumerate(API_PATHS):
        # Ganti parameter rute seperti {admin} atau {token} dengan nilai sampel '1'
        processed_path = re.sub(r'\{.*?\}', '1', path)
        full_url = f"{BASE_URL.rstrip('/')}/{processed_path.lstrip('/')}"
        
        print(f"{colors.BLUE}--- ({i+1}/{total_paths}) Menguji Path: {processed_path} ---{colors.ENDC}")

        # 1. Uji dengan origin yang diizinkan
        allowed_ok = check_cors(full_url, ALLOWED_TEST_ORIGIN)
        if allowed_ok:
            print(f"{colors.GREEN}  [✓] Tes Penerimaan SUKSES{colors.ENDC}")
        else:
            print(f"{colors.RED}  [X] Tes Penerimaan GAGAL{colors.ENDC}")

        # 2. Uji dengan origin yang ditolak
        # Kita berharap hasilnya GAGAL (header ACAO tidak ada/salah), yang berarti penolakan berhasil
        disallowed_rejected = not check_cors(full_url, DISALLOWED_ORIGIN)
        if disallowed_rejected:
            print(f"{colors.GREEN}  [✓] Tes Penolakan SUKSES{colors.ENDC}")
        else:
            print(f"{colors.RED}  [X] Tes Penolakan GAGAL (Seharusnya menolak!){colors.ENDC}")

        if allowed_ok and disallowed_rejected:
            success_count += 1
            print(f"{colors.GREEN}[✓✓] STATUS PATH: LULUS{colors.ENDC}\n")
        else:
            failure_count += 1
            print(f"{colors.RED}[XX] STATUS PATH: GAGAL{colors.ENDC}\n")

    # --- Laporan Ringkasan ---
    print("\n\n" + "="*35)
    print(f"{colors.YELLOW}      LAPORAN AKHIR TES CORS")
    print("="*35)
    print(f"Total Path Diuji: {total_paths}")
    print(f"{colors.GREEN}Path Lulus      : {success_count}{colors.ENDC}")
    print(f"{colors.RED}Path Gagal      : {failure_count}{colors.ENDC}")
    print("="*35)

    if failure_count == 0:
        print(f"\n{colors.GREEN}LUAR BIASA! Semua path API Anda memiliki konfigurasi CORS yang benar dan konsisten.{colors.ENDC}")
    else:
        print(f"\n{colors.YELLOW}PERINGATAN: Ditemukan {failure_count} path dengan konfigurasi CORS yang salah. Silakan periksa log di atas.{colors.ENDC}")