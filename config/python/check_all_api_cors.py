import os
import re
import requests
from tqdm import tqdm

os.system("cls")

BASE_URL = "https://lalim.vercel.app" # "http://localhost:8000"
ALLOWED_TEST_ORIGIN = "http://localhost:3001"
DISALLOWED_ORIGIN = "https://lalex.vercel.app"

API_ROUTE_LIST_OUTPUT = """
  GET|HEAD   / ........................................................................... generated::gMGpca29kV6QTaIr
  POST       api/admin/analytics ......................... admin.analytics.analytics › Admin\AnalyticsController@index
  POST       api/admin/analytics/export-reports admin.analytics.analytics.export-reports › Admin\AnalyticsController@…
  POST       api/admin/dashboard ......................... admin.dashboard.dashboard › Admin\DashboardController@index
  POST       api/admin/manage ............................. admin.manage.index › Admin\AdminManagementController@index
  POST       api/admin/manage/{admin}/accept ............ admin.manage.accept › Admin\AdminManagementController@accept
  POST       api/admin/manage/{admin}/activity .. admin.manage.activity › Admin\AdminManagementController@showActivity
  POST       api/admin/manage/{admin}/reject ............ admin.manage.reject › Admin\AdminManagementController@reject
  POST       api/admin/manage/{admin}/send-reset admin.manage.sendReset › Admin\AdminManagementController@sendPasswor…
  POST       api/admin/manage/{admin}/toggle-status admin.manage.toggleStatus › Admin\AdminManagementController@toggl…
  POST       api/admin/performance ....................... admin.performance.index › Admin\PerformanceController@index
  POST       api/admin/profile ..................................... admin.profile.show › Admin\ProfileController@show
  POST       api/admin/profile/deactivate-self . admin.profile.deactivateSelf › Admin\ProfileController@deactivateSelf
  POST       api/admin/profile/export-profile admin.profile.profile.export-profile › Admin\ProfileController@exportPr…
  POST       api/admin/profile/request-email-change admin.profile.requestEmailChange › Admin\ProfileController@reques…
  POST       api/admin/profile/request-phone-change admin.profile.requestPhoneChange › Admin\ProfileController@reques…
  POST       api/admin/profile/update-full-name admin.profile.updateFullName › Admin\ProfileController@updateFullName
  POST       api/admin/profile/update-info ............. admin.profile.updateInfo › Admin\ProfileController@updateInfo
  POST       api/admin/profile/update-kta ............ admin.profile.updateKta › Admin\ProfileController@updateKtaScan
  POST       api/admin/profile/update-nip ................ admin.profile.updateNip › Admin\ProfileController@updateNip
  POST       api/admin/profile/update-password . admin.profile.updatePassword › Admin\ProfileController@updatePassword
  POST       api/admin/profile/update-picture admin.profile.updatePicture › Admin\ProfileController@updateProfilePict…
  POST       api/admin/profile/verify-email-change admin.profile.verifyEmailChange › Admin\ProfileController@verifyEm…
  POST       api/admin/profile/verify-phone-change admin.profile.verifyPhoneChange › Admin\ProfileController@verifyPh…
  POST       api/auth/forgot-password ......... auth.password.email › Auth\ForgotPasswordController@sendResetLinkEmail
  POST       api/auth/login .......................................... auth.login.attempt › Auth\LoginController@login
  POST       api/auth/logout ............................................... auth.logout › Auth\LoginController@logout
  POST       api/auth/register .......................... auth.register › Auth\RegisterController@showRegistrationForm
  POST       api/auth/register/send ................... auth.register.send › Auth\RegisterController@startRegistration
  POST       api/auth/register/verify ....... auth.register.verify.form › Auth\RegisterController@showVerificationForm
  POST       api/auth/register/verify/send ..... auth.register.complete › Auth\RegisterController@completeRegistration
  POST       api/auth/reset-password ...................... auth.password.update › Auth\ForgotPasswordController@reset
  POST       api/auth/reset-password/{token} ....... auth.password.reset › Auth\ForgotPasswordController@verifyOTP
  POST       api/home .................................................................... home › HomeController@index
  POST       api/regencies ............................. regions.formatted › Data\RegionController@getFormattedRegions
  POST       api/report/create ................................................. report.store › ReportController@store
  POST       api/report/{report}/track ................................ report.track.show › ReportController@trackShow
  POST       api/reports/track ...................................... report.track.index › ReportController@trackIndex
  GET|HEAD   sanctum/csrf-cookie ................... sanctum.csrf-cookie › Laravel\Sanctum › CsrfCookieController@show
  GET|HEAD   up .......................................................................... generated::bJsIyDtQuU4iAesH
"""

API_ROUTE_LIST_CLEANED = re.sub(r'\s+', ' ', API_ROUTE_LIST_OUTPUT).strip()
API_PATHS = re.findall(r'\b(?:GET\|HEAD|POST|PUT|DELETE|PATCH)\s+([^\s]+)', API_ROUTE_LIST_CLEANED)

OUTPUT = """"""
def makeOutput(line):
    global OUTPUT
    OUTPUT += line + "\n"

makeOutput("--- Daftar Path API yang Diuji untuk CORS ---")
makeOutput("\n".join(API_PATHS))
makeOutput("\n--- Memulai Tes CORS Menyeluruh ---\n")

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
        makeOutput(f"{colors.GREY}  -> Origin Sent: {origin}{colors.ENDC}")
        makeOutput(f"{colors.GREY}  -> URL: {url}{colors.ENDC}")
        makeOutput(f"{colors.GREY}  -> Method: {method}{colors.ENDC}")
        makeOutput(f"{colors.GREY}  -> ACAO Received: {allow_origin}{colors.ENDC}")

        # Jika ini adalah origin yang diizinkan, header ACAO harus sama persis
        if origin == ALLOWED_TEST_ORIGIN:
            return allow_origin == origin
        
        # Jika ini adalah origin yang ditolak, header ACAO TIDAK BOLEH ada atau tidak sama
        if origin == DISALLOWED_ORIGIN:
            return allow_origin != DISALLOWED_ORIGIN and allow_origin is not None

    except requests.exceptions.RequestException as e:
        makeOutput(f"{colors.RED}  -> ERROR: Gagal terhubung ke server. Pesan: {e}{colors.ENDC}")
        return False
    return False

# Main script execution
if __name__ == "__main__":
    success_count = 0
    failure_count = 0
    total_paths = len(API_PATHS)

    makeOutput(f"{colors.YELLOW}Memulai Pengecekan CORS Menyeluruh untuk {BASE_URL}{colors.ENDC}\n")

    for i, path in enumerate(tqdm(API_PATHS, desc="Menguji Path API", unit="path")):
        # Ganti parameter rute seperti {admin} atau {token} dengan nilai sampel '1'
        processed_path = re.sub(r'\{.*?\}', '1', path)
        full_url = f"{BASE_URL.rstrip('/')}/{processed_path.lstrip('/')}"
        
        makeOutput(f"{colors.BLUE}--- ({i+1}/{total_paths}) Menguji Path: {processed_path} ---{colors.ENDC}")

        # 1. Uji dengan origin yang diizinkan
        allowed_ok = check_cors(full_url, ALLOWED_TEST_ORIGIN)
        if allowed_ok:
            makeOutput(f"{colors.GREEN}  [✓] Tes Penerimaan SUKSES{colors.ENDC}")
        else:
            makeOutput(f"{colors.RED}  [X] Tes Penerimaan GAGAL{colors.ENDC}")

        # 2. Uji dengan origin yang ditolak
        # Kita berharap hasilnya GAGAL (header ACAO tidak ada/salah), yang berarti penolakan berhasil
        disallowed_rejected = not check_cors(full_url, DISALLOWED_ORIGIN)
        if disallowed_rejected:
            makeOutput(f"{colors.GREEN}  [✓] Tes Penolakan SUKSES{colors.ENDC}")
        else:
            makeOutput(f"{colors.RED}  [X] Tes Penolakan GAGAL (Seharusnya menolak!){colors.ENDC}")

        if allowed_ok and disallowed_rejected:
            success_count += 1
            makeOutput(f"{colors.GREEN}[✓✓] STATUS PATH: LULUS{colors.ENDC}\n")
        else:
            failure_count += 1
            makeOutput(f"{colors.RED}[XX] STATUS PATH: GAGAL{colors.ENDC}\n")

    # --- Laporan Ringkasan ---
    makeOutput("\n\n" + "="*35)
    makeOutput(f"{colors.YELLOW}      LAPORAN AKHIR TES CORS")
    makeOutput("="*35)
    makeOutput(f"Total Path Diuji: {total_paths}")
    makeOutput(f"{colors.GREEN}Path Lulus      : {success_count}{colors.ENDC}")
    makeOutput(f"{colors.RED}Path Gagal      : {failure_count}{colors.ENDC}")
    makeOutput("="*35)

    if failure_count == 0:
        makeOutput(f"\n{colors.GREEN}LUAR BIASA! Semua path API Anda memiliki konfigurasi CORS yang benar dan konsisten.{colors.ENDC}")
    else:
        makeOutput(f"\n{colors.YELLOW}PERINGATAN: Ditemukan {failure_count} path dengan konfigurasi CORS yang salah. Silakan periksa log di atas.{colors.ENDC}")

result_file = "cors_test_result.txt"
with open(result_file, "w", encoding="utf-8") as f:
    RAW_OUTPUT = OUTPUT.replace('\033[92m', '').replace('\033[91m', '').replace('\033[93m', '').replace('\033[94m', '').replace('\033[90m', '').replace('\033[0m', '')
    
    f.write(RAW_OUTPUT)

    print(f"\nHasil tes CORS telah disimpan di '{result_file}'.")

isDisplay = input("Tampilkan hasil [Y/N]? ")

if isDisplay.lower() == 'y':
    print("\n" + OUTPUT)

input("\nTekan Enter untuk keluar...")