import React, { useState, useEffect } from "react";
import {
  adminProfileService,
  authService,
  decodeErrorResponse,
} from "../../services/api";
// [PERBAIKAN] Import componentized skeletons instead of a generic one
import {
  SkeletonProfileHeader,
  SkeletonActionCard,
} from "../../components/SkeletonLoading/Admin/SkeletonLoadingAdminPage";
import { CsrfLoadingProps, processFiles } from "../../types";
import { useNavigate } from "react-router-dom";

// [PERBAIKAN] Interface for the nested service profile object
interface ServiceProfile {
  id: number;
  full_name: string;
  code: string;
}

// [PERBAIKAN] Updated interface to match the actual API response
interface AdminProfile {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  nip: string;
  role: string;
  profile_picture_path?: string;
  kta_scan_path?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  service_profile: ServiceProfile | null; // Added service profile
  activity?: {
    total_assigned: number;
    total_finished: number;
    avg_resolution_time: string;
    recent_reports: any[];
  };
}

interface EditFormData {
  full_name: string;
  nip: string;
  profile_picture?: File;
}

interface PasswordFormData {
  current_password: string;
  password: string;
  password_confirmation: string;
  logout_other_devices: boolean;
}

interface ContactFormData {
  email?: string;
  phone?: string;
  password: string;
}

interface EmailChangeFormData {
  new_email: string;
  password: string;
}

interface PhoneChangeFormData {
  new_phone: string;
  password: string;
}

interface tokenFormData {
  token: string;
}

interface KtaFormData {
  kta_scan: File;
  password: string;
}

interface ProfilePictureData {
  profile_picture: File;
}

export default function AdminProfilePage({ csrfLoading }: CsrfLoadingProps) {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState<Boolean | null>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [resultKTA, setResultKTA] = useState<{ type: string; img: string }>({
    type: "",
    img: "",
  });
  const [formLoading, setFormLoading] = useState<Boolean | null>(false);

  const [displayFormData, setDisplayFormData] = useState<EditFormData>({
    full_name: "",
    nip: "",
  });
  const [editFormData, setEditFormData] = useState<EditFormData>({
    full_name: "",
    nip: "",
  });
  const [passwordFormData, setPasswordFormData] = useState<PasswordFormData>({
    current_password: "",
    password: "",
    password_confirmation: "",
    logout_other_devices: false,
  });
  const [contactFormData, setContactFormData] = useState<ContactFormData>({
    email: "",
    phone: "",
    password: "",
  });
  const [emailChangeFormData, setEmailChangeFormData] =
    useState<EmailChangeFormData>({ new_email: "", password: "" });
  const [phoneChangeFormData, setPhoneChangeFormData] =
    useState<PhoneChangeFormData>({ new_phone: "", password: "" });
  const [tokenFormData, settokenFormData] = useState<tokenFormData>({
    token: "",
  });
  const [profilePictureFormData, setProfilePictureFormData] =
    useState<ProfilePictureData>({
      profile_picture: null as any,
    });
  const [ktaFormData, setKtaFormData] = useState<KtaFormData>({
    kta_scan: null as any,
    password: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (csrfLoading) fetchProfile();
  }, [csrfLoading]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await adminProfileService.getProfile();
      // [PERBAIKAN] Data is nested under response.data.admin
      const adminData: AdminProfile = response.data.admin;

      const adminPicture = await processFiles([
        adminData.profile_picture_path || "",
        adminData.kta_scan_path || "",
      ]);

      const adminPictureURL = adminPicture.files_url[0];
      const adminKTAURL = adminPicture.files_url[1];

      const formData = {
        full_name: adminData.full_name,
        nip: adminData.nip,
      };

      setProfile({
        ...adminData,
        profile_picture_path: adminPictureURL,
        kta_scan_path: adminKTAURL,
      });

      setEditFormData(formData);
      setDisplayFormData(formData);

      setContactFormData({
        email: adminData.email,
        phone: adminData.phone,
        password: "",
      });
    } catch (err: any) {
      setError((await decodeErrorResponse(err)) || "Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setEditFormData((prev) => ({ ...prev, profile_picture: files[0] }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;

    const newValue = type === "checkbox" ? checked : value;

    console.log({ name, value, checked, type });

    setPasswordFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleUpdateProfilePicture = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const response = await adminProfileService.updateProfilePicture({
        profile_picture: profilePictureFormData.profile_picture,
        password: passwordFormData.current_password,
      });

      setProfile(response.data.admin);
      setSuccess(
        "info: " + (response.message || "Informasi akun berhasil diperbarui")
      );
      setActiveModal(null);
    } catch (err: any) {
      setError((await decodeErrorResponse(err)) || "Gagal memperbarui profil");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordFormData.password !== passwordFormData.password_confirmation) {
      setError("Password baru dan konfirmasi password tidak cocok.");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      const response = await adminProfileService.changePassword(
        passwordFormData
      );
      setSuccess(response.message || "Password berhasil diubah");
      setPasswordFormData({
        current_password: "",
        password: "",
        password_confirmation: "",
        logout_other_devices: false,
      });
      setActiveModal(null);
      setTimeout(() => {
        window.location.reload();
        setSuccess(null);
      }, 1000);
    } catch (err: any) {
      setError((await decodeErrorResponse(err)) || "Gagal mengubah password");
    }
  };

  const handleChangeContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      const response = await adminProfileService.changeContact(contactFormData);

      // [PERBAIKAN] Update local profile state to reflect changes immediately
      if (response.data && response.data.admin) {
        setProfile(response.data.admin);
      }

      setSuccess(response.message || "Informasi kontak berhasil diubah");
      setActiveModal(null);
      setTimeout(() => {
        window.location.reload();
        setSuccess(null);
      }, 1000);
    } catch (err: any) {
      setError(
        (await decodeErrorResponse(err)) || "Gagal mengubah informasi kontak"
      );
    }
  };

  const handleUpdatePhotoProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    try {
      const response = await adminProfileService.updateProfilePicture({
        profile_picture: profilePictureFormData.profile_picture,
        password: passwordFormData.current_password,
      });
      setProfile(response.data.admin);
      setSuccess("Foto profil berhasil diperbarui.");
      setActiveModal(null);
      setPasswordFormData((prev) => ({ ...prev, current_password: "" }));
      setTimeout(() => {
        window.location.reload();
        setSuccess(null);
      }, 1000);
    } catch (err: any) {
      setError(
        (await decodeErrorResponse(err)) ||
          "Gagal memperbarui foto profil. Cek password Anda."
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenKTA = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    try {
      // Asumsi: Anda memiliki endpoint verifyPassword di authService atau adminProfileService
      // Jika belum ada, Anda perlu membuatnya untuk memverifikasi password saja
      await adminProfileService.checkPassword({
        password: passwordFormData.current_password,
      });

      // Jika password benar:
      if (profile?.kta_scan_path) {
        // window.open(profile.kta_scan_path, "_blank");
        setResultKTA({ type: "resultScanKTA", img: profile.kta_scan_path });
        setActiveModal(null);
        setPasswordFormData((prev) => ({ ...prev, current_password: "" }));
      } else {
        setError("File KTA tidak ditemukan.");
      }
    } catch (err: any) {
      setError(
        (await decodeErrorResponse(err)) || "Password salah, akses ditolak."
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateKTA = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    try {
      // Mengirim file KTA beserta password
      console.log(ktaFormData);
      const response = await adminProfileService.updateKta({
        kta_scan: ktaFormData.kta_scan,
        password: passwordFormData.current_password, // Kirim password ke API
      });

      setSuccess("File KTA berhasil diperbarui.");
      setActiveModal(null);
      setPasswordFormData((prev) => ({ ...prev, current_password: "" }));

      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(
        (await decodeErrorResponse(err)) ||
          "Gagal mengunggah KTA. Cek password Anda."
      );
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    // [PERBAIKAN] Use the new componentized skeletons
    return (
      <div className="max-w-4xl mx-auto space-y-8 p-4">
        <h1 className="text-3xl font-bold text-gray-900">Profil Saya</h1>
        <SkeletonProfileHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonActionCard
            title="Keamanan"
            description="Ubah password Anda secara berkala untuk menjaga keamanan akun."
          />
          <SkeletonActionCard
            title="Informasi Kontak"
            description="Perbarui email dan nomor telepon Anda."
          />
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto space-y-8 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0 p-4">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Section */}
          <div className="bg-white shadow-lg rounded-xl p-8 border">
            {success && success.includes("header") && (
              <div
                className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md"
                role="alert"
              >
                <p>{success}</p>
              </div>
            )}
            {profile && (
              <form
                onSubmit={handleUpdateProfilePicture}
                encType="multipart/form-data"
              >
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <img
                    className="h-24 w-24 rounded-full object-cover sm:h-32 sm:w-32"
                    src={
                      profile.profile_picture_path ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        profile.full_name
                      )}`
                    }
                    alt="Foto Profil"
                    id="profilePicPreview"
                  />
                  <div className="text-center sm:text-left">
                    <h1 className="font-bold text-gray-900 sm:text-2xl md:text-3xl">
                      {profile.full_name}
                    </h1>
                    <p className="text-gray-500">
                      <span className="font-medium text-blue-600">
                        {profile.role
                          .replace(/_/, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                      <span className="mx-2 text-gray-300">|</span>
                      Status:{" "}
                      <span className="font-medium text-green-600">Aktif</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <label
                    htmlFor="profile_picture"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Ubah Foto Profil
                  </label>
                  <input
                    type="file"
                    id="profile_picture"
                    name="profile_picture"
                    accept="image/jpeg,image/png,image/jpg"
                    className="block w-full max-w-sm text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={(e) => {
                      handleFileChange(e);
                      if (e.target.files && e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const img = document.getElementById(
                            "profilePicPreview"
                          ) as HTMLImageElement;
                          if (img && e.target?.result)
                            img.src = e.target.result as string;
                        };
                        reader.readAsDataURL(e.target.files[0]);
                        setProfilePictureFormData({
                          profile_picture: e.target.files[0],
                        });
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal("changePhotoProfile");
                    }}
                    className="mt-3 w-full sm:w-auto rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    Simpan Foto
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Info & Contact Section */}
          <div className="bg-white shadow-lg rounded-xl p-8 border">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Informasi Akun & Identitas
            </h2>

            {success && success.includes("info") && (
              <div
                className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md"
                role="alert"
              >
                <p>{success}</p>
              </div>
            )}
            {success && success.includes("docs") && (
              <div
                className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md"
                role="alert"
              >
                <p>{success}</p>
              </div>
            )}

            {/* Info Form */}
            <div className="space-y-6 border-b pb-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="full_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={displayFormData.full_name}
                    disabled
                    className="text-gray-400 mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal("fullName");
                      setSuccess(null);
                    }}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                  >
                    Ubah Nama Lengkap
                  </button>
                </div>
                <div>
                  <label
                    htmlFor="nip"
                    className="block text-sm font-medium text-gray-700"
                  >
                    NIP
                  </label>
                  <input
                    type="text"
                    id="nip"
                    name="nip"
                    value={displayFormData.nip}
                    disabled
                    className="text-gray-400 mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal("nip");
                      setSuccess(null);
                    }}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                  >
                    Ubah NIP
                  </button>
                </div>
              </div>
            </div>

            {/* Readonly Info & Change Buttons */}
            <div className="space-y-4 border-b pb-6 mb-6">
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900 md:col-span-2 flex justify-between items-center">
                  <span>
                    {profile?.email
                      ? profile.email.replace(/(.{3}).*(@.*)/, "$1***$2")
                      : ""}
                  </span>
                  <button
                    onClick={() => {
                      setActiveModal("emailChange");
                      setSuccess(null);
                    }}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Ubah
                  </button>
                </dd>
              </dl>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">
                  No. Telepon
                </dt>
                <dd className="text-sm text-gray-900 md:col-span-2 flex justify-between items-center">
                  <span>
                    {profile?.phone
                      ? profile.phone.replace(/(.{3}).*(.{4})/, "$1***$2")
                      : ""}
                  </span>
                  <button
                    onClick={() => {
                      setActiveModal("phoneChange");
                      setSuccess(null);
                    }}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Ubah
                  </button>
                </dd>
              </dl>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">
                  Dinas / Instansi
                </dt>
                <dd className="text-sm text-gray-900 md:col-span-2 font-medium">
                  {profile?.service_profile?.full_name ?? "N/A"}
                </dd>
              </dl>
            </div>

            {/* KTA Upload */}
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setError(null);
                  const response = await adminProfileService.updateKta({
                    kta_scan: ktaFormData.kta_scan,
                    password: ktaFormData.password,
                  });
                  setSuccess(response.message || "Scan KTA berhasil diunggah");
                  setActiveModal(null);
                } catch (err: any) {
                  setError(
                    (await decodeErrorResponse(err)) || "Gagal mengunggah KTA"
                  );
                }
              }}
            >
              <label
                htmlFor="kta_scan"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Scan KTA/Kartu Pegawai
              </label>

              {
                /*profile?.kta_scan_path*/ true && (
                  <div className="relative">
                    <img
                      className="w-full h-[300px] rounded-xl"
                      src="https://community.softr.io/uploads/db9110/original/2X/7/74e6e7e382d0ff5d7773ca9a87e6f6f8817a68a6.jpeg"
                      alt="kta-placeholder"
                    />
                    <button
                      className="absolute top-0 z-10 w-full h-full flex justify-center items-center text-xl font-bold bg-[rgba(333,333,333,0.1)] rounded-xl md:text-2xl"
                      onClick={() => {
                        setActiveModal("openKta");
                        setSuccess(null);
                      }}
                      type="button"
                    >
                      Lihat KTA
                    </button>
                  </div>
                )
              }
              <input
                type="file"
                id="kta_scan"
                name="kta_scan"
                accept=".pdf,.jpg,.png"
                required
                onChange={(e) => {
                  handleFileChange(e);
                  if (e.target.files && e.target.files[0]) {
                    setKtaFormData((prev) => {
                      return {
                        ...prev,
                        kta_scan: e.target.files[0],
                      };
                    });
                  }
                }}
                className="block w-full max-w-sm text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                type="button"
                onClick={() => {
                  setActiveModal("changeKta");
                }}
                className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Unggah KTA
              </button>
            </form>
          </div>

          {/* Security Section */}
          <div className="bg-white shadow-lg rounded-xl p-8 border">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Keamanan Akun
            </h2>
            {success && success.includes("password") && (
              <div
                className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md"
                role="alert"
              >
                <p>{success}</p>
              </div>
            )}
            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => {
                  setActiveModal("password");
                  setSuccess(null);
                }}
                className="w-full sm:w-auto rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Ganti Password
              </button>
              {profile?.role !== "system_admin" && (
                <button
                  onClick={() => setActiveModal("nonActive")}
                  className="w-full sm:w-auto rounded-md bg-red-600 px-4 py-2 text-sm font-semibold shadow-sm text-white hover:bg-red-700"
                >
                  Nonaktifkan Akun Saya
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-8">
          {profile?.role === "base_admin" && profile.activity && (
            <div className="bg-white shadow-lg rounded-xl p-6 border">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Aktivitas Saya
              </h3>
              <div className="flex justify-between p-2 bg-gray-50 rounded-md">
                <span className="text-sm font-medium text-gray-600">
                  Total Laporan Ditugaskan
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {profile.activity.total_assigned}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded-md">
                <span className="text-sm font-medium text-gray-600">
                  Total Laporan Selesai
                </span>
                <span className="text-lg font-bold text-green-600">
                  {profile.activity.total_finished}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded-md">
                <span className="text-sm font-medium text-gray-600">
                  Waktu Penyelesaian Rata-rata
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {profile.activity.avg_resolution_time}
                </span>
              </div>

              <h4 className="text-md font-semibold text-gray-800 mt-8 mb-3">
                5 Laporan Terakhir Ditangani
              </h4>
              <ul className="divide-y divide-gray-200">
                {profile.activity.recent_reports?.map((report: any) => (
                  <li
                    key={report.id}
                    className="py-3 flex grid-cols-2 justify-between"
                  >
                    <div className="block hover:bg-gray-50 p-2 rounded-md">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {report.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        ID: #{report.id} - Diperbarui:{" "}
                        {new Date(report.updated_at).toLocaleDateString(
                          "id-ID"
                        )}
                      </p>
                    </div>
                    <div className="block hover:bg-gray-50 p-2 rounded-md">
                      <a
                        href={`/report/${report.id}/track`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Lihat Detail
                      </a>
                    </div>
                  </li>
                )) || (
                  <li className="py-3 text-sm text-gray-500 text-center">
                    Belum ada laporan yang ditangani.
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="bg-white shadow-lg rounded-xl p-6 border">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Metadata Akun
            </h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Dibuat Pada</dt>
                <dd className="text-sm font-medium text-gray-700">
                  {profile
                    ? new Date(profile.created_at).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Terakhir Diperbarui</dt>
                <dd className="text-sm font-medium text-gray-700">
                  {profile
                    ? new Date(profile.updated_at).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </dd>
              </div>
              {profile?.deleted_at && (
                <div className="flex justify-between">
                  <dt className="text-sm text-red-500">Dihapus Pada</dt>
                  <dd className="text-sm font-medium text-red-700">
                    {new Date(profile.deleted_at).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 1: EMAIL CHANGE                                                  */}
      {/* ---------------------------------------------------------------------- */}
      {activeModal === "emailChange" && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Ubah Alamat Email</h3>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setError(null);
                    setSuccess(null);
                    setEmailChangeFormData({ new_email: "", password: "" });
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  &times;
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (formLoading) return;
                  try {
                    setFormLoading(true);
                    setError(null);
                    await adminProfileService.changeContact({
                      new_email: emailChangeFormData.new_email,
                      password: emailChangeFormData.password,
                    });
                    setSuccess(
                      "Token telah dikirim ke alamat email baru Anda."
                    );
                    // Pindah ke modal token, jangan reset success message agar user baca
                    setActiveModal("emailtoken");
                  } catch (err: any) {
                    setError(
                      (await decodeErrorResponse(err)) || "Gagal mengirim token"
                    );
                  } finally {
                    setFormLoading(false);
                  }
                }}
              >
                <p className="text-sm text-gray-600 mb-4">
                  Kami akan mengirimkan token 6 digit ke alamat email **baru**
                  Anda untuk verifikasi.
                </p>
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{error}</p>
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="new_email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Alamat Email Baru
                    </label>
                    <input
                      type="email"
                      id="new_email"
                      name="new_email"
                      required
                      value={emailChangeFormData.new_email}
                      onChange={(e) =>
                        setEmailChangeFormData((prev) => ({
                          ...prev,
                          new_email: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="password_for_email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Konfirmasi Password Anda
                    </label>
                    <input
                      type="password"
                      id="password_for_email"
                      name="password"
                      required
                      value={emailChangeFormData.password}
                      onChange={(e) =>
                        setEmailChangeFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setError(null);
                        setSuccess(null);
                        setEmailChangeFormData({ new_email: "", password: "" });
                      }}
                      className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading ? true : false}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                      {formLoading ? "Mengirim..." : "Kirim Token"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 2: EMAIL TOKEN                                                   */}
      {/* ---------------------------------------------------------------------- */}
      {activeModal === "emailtoken" && (
        <div
          className="fixed inset-0 z-50 top-auto"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Verifikasi Email</h3>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setError(null);
                    setSuccess(null); // Reset success dari modal sebelumnya saat diclose
                    settokenFormData({ token: "" });
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  &times;
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (formLoading) return;
                  try {
                    setFormLoading(true);
                    setError(null);
                    console.log({ tokenFormData });
                    const response =
                      await adminProfileService.verifyEmailChange({
                        token: tokenFormData.token,
                        new_email: emailChangeFormData.new_email,
                      });
                    setProfile(response.data.admin);
                    setProfile((prev) => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        email:
                          response.data?.admin?.email ||
                          emailChangeFormData.new_email,
                      };
                    });
                    setSuccess("Alamat email Anda berhasil diperbarui.");
                    setActiveModal(null);
                    setTimeout(() => {
                      window.location.reload();
                      setSuccess(null);
                    }, 1000);
                  } catch (err: any) {
                    setError(
                      (await decodeErrorResponse(err)) || "Token tidak valid"
                    );
                  } finally {
                    setFormLoading(false);
                  }
                }}
              >
                <p className="text-sm text-gray-600 mb-4">
                  Masukkan token 6 digit yang kami kirim ke **
                  {emailChangeFormData.new_email}**.
                </p>
                <div className="space-y-4">
                  {/* Tampilkan Error */}
                  {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{error}</p>
                    </div>
                  )}
                  {/* Tampilkan Success (misal: Token Terkirim) dari step sebelumnya */}
                  {success && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{success}</p>
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="token_email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Token
                    </label>
                    <input
                      type="text"
                      id="token_email"
                      name="token_email"
                      required
                      // pattern="\d{6}"
                      maxLength={10}
                      value={tokenFormData.token}
                      onChange={(e) =>
                        settokenFormData({ token: e.target.value })
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 text-center tracking-[.5em]"
                    />
                  </div>
                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setError(null);
                        setSuccess(null);
                        settokenFormData({ token: "" });
                      }}
                      className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading ? true : false}
                      className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:bg-green-400"
                    >
                      {formLoading
                        ? "Memproses..."
                        : "Verifikasi & Ganti Email"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 3: PHONE CHANGE                                                  */}
      {/* ---------------------------------------------------------------------- */}
      {activeModal === "phoneChange" && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Ubah Nomor Telepon</h3>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setError(null);
                    setSuccess(null);
                    setPhoneChangeFormData({ new_phone: "", password: "" });
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  &times;
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (formLoading) return;
                  try {
                    setFormLoading(true);
                    setError(null);
                    await adminProfileService.changeContact({
                      new_phone: phoneChangeFormData.new_phone,
                      password: phoneChangeFormData.password,
                    });
                    setSuccess(
                      "Token telah dikirim ke nomor telepon baru Anda."
                    );
                    setActiveModal("phoneOtp");
                  } catch (err: any) {
                    setError(
                      (await decodeErrorResponse(err)) || "Gagal mengirim token"
                    );
                  } finally {
                    setFormLoading(false);
                  }
                }}
              >
                <p className="text-sm text-gray-600 mb-4">
                  Kami akan mengirimkan token 6 digit ke nomor telepon **baru**
                  Anda untuk verifikasi.
                </p>
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{error}</p>
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="new_phone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nomor Telepon Baru
                    </label>
                    <input
                      type="tel"
                      id="new_phone"
                      name="new_phone"
                      required
                      value={phoneChangeFormData.new_phone}
                      onChange={(e) =>
                        setPhoneChangeFormData((prev) => ({
                          ...prev,
                          new_phone: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="password_for_phone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Konfirmasi Password Anda
                    </label>
                    <input
                      type="password"
                      id="password_for_phone"
                      name="password"
                      required
                      value={phoneChangeFormData.password}
                      onChange={(e) =>
                        setPhoneChangeFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setError(null);
                        setSuccess(null);
                        setPhoneChangeFormData({ new_phone: "", password: "" });
                      }}
                      className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading ? true : false}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-400"
                    >
                      {formLoading ? "Mengirim..." : "Kirim Token"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 4: PHONE OTP                                                     */}
      {/* ---------------------------------------------------------------------- */}
      {activeModal === "phoneOtp" && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Verifikasi Telepon</h3>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setError(null);
                    setSuccess(null);
                    settokenFormData({ token: "" });
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  &times;
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (formLoading) return;
                  try {
                    setFormLoading(true);
                    setError(null);
                    const response =
                      await adminProfileService.verifyPhoneChange({
                        otp: tokenFormData.token,
                        new_phone: phoneChangeFormData.new_phone,
                      });
                    setProfile(response.data.admin);
                    setProfile((prev) => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        phone:
                          response.data?.admin?.phone ||
                          phoneChangeFormData.new_phone,
                      };
                    });
                    setSuccess("Nomor telepon Anda berhasil diperbarui.");
                    setActiveModal(null);
                    setTimeout(() => {
                      window.location.reload();
                      setSuccess(null);
                    }, 1000);
                  } catch (err: any) {
                    setError(
                      (await decodeErrorResponse(err)) || "Kode OTP tidak valid"
                    );
                  } finally {
                    setFormLoading(false);
                  }
                }}
              >
                <p className="text-sm text-gray-600 mb-4">
                  Masukkan kode 6 digit yang kami kirim ke **
                  {phoneChangeFormData.new_phone}**.
                </p>
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{error}</p>
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{success}</p>
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="token_phone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Kode OTP
                    </label>
                    <input
                      type="text"
                      id="token_phone"
                      name="token_phone"
                      required
                      pattern="\d{6}"
                      maxLength={6}
                      value={tokenFormData.token}
                      onChange={(e) =>
                        settokenFormData({ token: e.target.value })
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 text-center tracking-[.5em]"
                    />
                  </div>
                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setError(null);
                        setSuccess(null);
                        settokenFormData({ token: "" });
                      }}
                      className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading ? true : false}
                      className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:bg-green-400"
                    >
                      {formLoading
                        ? "Memproses..."
                        : "Verifikasi & Ganti Telepon"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 5: FULL NAME CHANGE                                              */}
      {/* ---------------------------------------------------------------------- */}
      {activeModal === "fullName" && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Ubah Nama Lengkap</h3>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setError(null);
                    setSuccess(null);
                    // RESET FORM DATA (Kembalikan ke data asli)
                    setEditFormData(displayFormData);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  &times;
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (formLoading) return;
                  try {
                    setFormLoading(true);
                    setError(null);
                    await adminProfileService.updateFullName({
                      full_name: editFormData.full_name,
                      password: emailChangeFormData.password,
                    });

                    // UPDATE STATE PROFILE & DISPLAY DATA
                    setProfile((prev) => {
                      if (!prev) return null;
                      return { ...prev, full_name: editFormData.full_name };
                    });
                    setDisplayFormData((prev) => ({
                      ...prev,
                      full_name: editFormData.full_name,
                    }));

                    setSuccess("Nama lengkap berhasil diperbarui.");
                    setEmailChangeFormData({ new_email: "", password: "" });
                    setActiveModal(null);
                    setTimeout(() => {
                      window.location.reload();
                      setSuccess(null);
                    }, 1000);
                  } catch (err: any) {
                    setError(
                      (await decodeErrorResponse(err)) ||
                        "Gagal memperbarui nama lengkap"
                    );
                  } finally {
                    setFormLoading(false);
                  }
                }}
              >
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{error}</p>
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="full_name_modal"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nama Lengkap Baru
                    </label>
                    <input
                      type="text"
                      id="full_name_modal"
                      name="full_name"
                      required
                      value={editFormData.full_name}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          full_name: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="password_full_name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Konfirmasi Password Anda
                    </label>
                    <input
                      type="password"
                      id="password_full_name"
                      name="password"
                      required
                      value={emailChangeFormData.password}
                      onChange={(e) =>
                        setEmailChangeFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setError(null);
                        setSuccess(null);
                        setEditFormData(displayFormData);
                      }}
                      className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading ? true : false}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-400"
                    >
                      {formLoading ? "Menyimpan..." : "Simpan Nama Lengkap"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 6: NIP CHANGE                                                    */}
      {/* ---------------------------------------------------------------------- */}
      {activeModal === "nip" && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Ubah NIP</h3>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setError(null);
                    setSuccess(null);
                    setEditFormData(displayFormData); // Reset form
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  &times;
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (formLoading) return;
                  try {
                    setFormLoading(true);
                    setError(null);
                    await adminProfileService.updateNip({
                      nip: editFormData.nip,
                      password: phoneChangeFormData.password,
                    });

                    // UPDATE PARTIAL STATE AGAR TIDAK ERROR
                    setProfile((prev) => {
                      if (!prev) return null;
                      return { ...prev, nip: editFormData.nip };
                    });
                    setDisplayFormData((prev) => ({
                      ...prev,
                      nip: editFormData.nip,
                    }));

                    setSuccess("NIP berhasil diperbarui.");
                    setPhoneChangeFormData({ new_phone: "", password: "" });
                    setActiveModal(null);
                    setTimeout(() => {
                      window.location.reload();
                      setSuccess(null);
                    }, 1000);
                  } catch (err: any) {
                    setError(
                      (await decodeErrorResponse(err)) ||
                        "Gagal memperbarui NIP"
                    );
                  } finally {
                    setFormLoading(false);
                  }
                }}
              >
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{error}</p>
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="nip_modal"
                      className="block text-sm font-medium text-gray-700"
                    >
                      NIP Baru
                    </label>
                    <input
                      type="text"
                      id="nip_modal"
                      name="nip"
                      required
                      value={editFormData.nip}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          nip: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="password_nip"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Konfirmasi Password Anda
                    </label>
                    <input
                      type="password"
                      id="password_nip"
                      name="password"
                      required
                      value={phoneChangeFormData.password}
                      onChange={(e) =>
                        setPhoneChangeFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setError(null);
                        setSuccess(null);
                        setEditFormData(displayFormData);
                      }}
                      className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading ? true : false}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-400"
                    >
                      {formLoading ? "Menyimpan..." : "Simpan NIP"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 7: PASSWORD CHANGE                                               */}
      {/* ---------------------------------------------------------------------- */}
      {activeModal === "password" && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Ganti Password</h3>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setError(null);
                    setSuccess(null);
                    setPasswordFormData({
                      current_password: "",
                      password: "",
                      password_confirmation: "",
                      logout_other_devices: false,
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleChangePassword}>
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{error}</p>
                    </div>
                  )}
                  {/* Success di sini biasanya dari action submit sebelumnya */}
                  {success && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{success}</p>
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="current_password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password Saat Ini
                    </label>
                    <input
                      type="password"
                      id="current_password"
                      name="current_password"
                      required
                      value={passwordFormData.current_password}
                      onChange={handlePasswordChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password Baru
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      required
                      value={passwordFormData.password}
                      onChange={handlePasswordChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="password_confirmation"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Konfirmasi Password Baru
                    </label>
                    <input
                      type="password"
                      id="password_confirmation"
                      name="password_confirmation"
                      required
                      value={passwordFormData.password_confirmation}
                      onChange={handlePasswordChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      id="logout_other_devices"
                      name="logout_other_devices"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      onChange={handlePasswordChange}
                      checked={passwordFormData.logout_other_devices}
                    />
                    <label
                      htmlFor="logout_other_devices"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Keluarkan dari semua sesi lain
                    </label>
                  </div>
                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setError(null);
                        setSuccess(null);
                        setPasswordFormData({
                          current_password: "",
                          password: "",
                          password_confirmation: "",
                          logout_other_devices: false,
                        });
                      }}
                      className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading ? true : false}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-400"
                    >
                      {formLoading ? "Menyimpan..." : "Simpan Password"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeModal === "openKta" && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Masukkan Password</h3>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setError(null);
                    setSuccess(null);
                    setPasswordFormData((prev) => ({
                      ...prev,
                      current_password: "",
                    }));
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  &times;
                </button>
              </div>
              <p className="mb-4">Masukkan password untuk melihat KTA</p>
              <form onSubmit={handleOpenKTA}>
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{error}</p>
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{success}</p>
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="current_password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      id="current_password"
                      name="current_password"
                      required
                      value={passwordFormData.current_password}
                      onChange={handlePasswordChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setError(null);
                        setSuccess(null);
                      }}
                      className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading ? true : false}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-400"
                    >
                      {formLoading ? "Memuat..." : "Lihat KTA"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeModal === "changePhotoProfile" && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Masukkan Password</h3>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setError(null);
                    setPasswordFormData((prev) => ({
                      ...prev,
                      current_password: "",
                    }));
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  &times;
                </button>
              </div>
              <p className="mb-4">
                Masukkan password untuk mengganti foto profil
              </p>
              <form onSubmit={handleUpdatePhotoProfile}>
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{error}</p>
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{success}</p>
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="current_password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      id="current_password"
                      name="current_password"
                      required
                      onChange={handlePasswordChange}
                      value={passwordFormData.current_password}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setError(null);
                        setSuccess(null);
                        setPasswordFormData((prev) => ({
                          ...prev,
                          current_password: "",
                        }));
                      }}
                      className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading ? true : false}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-400"
                    >
                      {formLoading ? "Menyimpan..." : "Ganti Foto Profil"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeModal === "changeKta" && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Masukkan Password</h3>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setError(null);
                    setSuccess(null);
                    setPasswordFormData((prev) => ({
                      ...prev,
                      current_password: "",
                    }));
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  &times;
                </button>
              </div>
              <p className="mb-4">Masukkan password untuk mengupload KTA</p>
              <form onSubmit={handleUpdateKTA}>
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{error}</p>
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{success}</p>
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="current_password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      id="current_password"
                      name="current_password"
                      required
                      onChange={handlePasswordChange}
                      value={passwordFormData.current_password}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setError(null);
                        setSuccess(null);
                      }}
                      className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading ? true : false}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-400"
                    >
                      {formLoading ? "Menyimpan..." : "Ganti KTA"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 8: DEACTIVATE ACCOUNT                                            */}
      {/* ---------------------------------------------------------------------- */}
      {activeModal === "nonActive" && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Nonaktifkan Akun Saya</h3>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  &times;
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (formLoading) return;
                  try {
                    setFormLoading(true);
                    setError(null);
                    const response = await adminProfileService.deactivateSelf();
                    setSuccess(
                      response.message || "Akun berhasil dinonaktifkan"
                    );
                    await authService.logout();
                    setTimeout(() => {
                      navigate({ pathname: "/login" });
                    }, 1000);
                  } catch (err: any) {
                    setError(
                      (await decodeErrorResponse(err)) ||
                        "Gagal menonaktifkan akun"
                    );
                    setFormLoading(false); // Hanya stop loading jika error
                  }
                }}
              >
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{error}</p>
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{success}</p>
                    </div>
                  )}
                  <p>
                    Anda yakin ingin menonaktifkan akun anda? Tindakan ini tidak
                    dapat dibatalkan tanpa bantuan System Admin
                  </p>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setError(null);
                        setSuccess(null);
                      }}
                      className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading ? true : false}
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:bg-red-400"
                    >
                      {formLoading ? "Memproses..." : "Nonaktifkan"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {resultKTA.type === "resultScanKTA" && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white max-w-[600px] p-8 space-y-6 rounded-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Preview KTA</h3>
                <button
                  onClick={() => {
                    setResultKTA({ type: "", img: "" });
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  &times;
                </button>
              </div>
              <div className="flex justify-center bg-gray-50">
                <img
                  src={resultKTA.img}
                  alt="resultScanKTA"
                  className="max-w-full max-h-[700px] rounded-md shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
