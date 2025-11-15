import React, { useEffect, useState } from 'react';
import { decodeErrorResponse, regionService, reportService } from '../services/api'; // Pastikan path ini benar
import { useNavigate } from 'react-router-dom';

interface DistrictsData {
  code: string;
  name: string;
}

interface CitiesData {
  code: string;
  name: string;
  districts: DistrictsData[];
}

// Interface ini adalah "sumber kebenaran" kita
interface ReportForm {
  name: string;
  phone: string;
  description: string;
  city: string;
  district: string;
  address: string;
  photo_files: File[];
  video_files: File[];
}

export default function ReportCreatePage() {
  const [formData, setFormData] = useState<ReportForm>({
    name: '',
    phone: '',
    description: '',
    city: '',
    district: '',
    address: '',
    photo_files: [],
    video_files: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const [regenciesData, setRegenciesData] = useState<CitiesData[]>([]);
  const [districts, setDistricts] = useState<DistrictsData[]>([]);
  const [regenciesDataLoading, setRegenciesDataLoading] = useState(true);
  const [districtsLoading, setDistrictsLoading] = useState(false);

  useEffect(() => {
    const fetchRegenciesData = async () => {
      try {
        const response = await regionService.getRegencies();
        if (response.data) {
          setRegenciesData(response.data);
        }
      } catch (err) {
        setError('Tidak dapat memuat daftar kota/kabupaten.');
      } finally {
        setRegenciesDataLoading(false);
      }
    };
    fetchRegenciesData();
  }, []);

  // --- Fetch Data Kecamatan saat Kota Dipilih ---
  useEffect(() => {
    if (!formData.city) {
      setDistricts([]); // Kosongkan kecamatan jika tidak ada kota yang dipilih
      return;
    }

    const fetchDistricts = () => {
      setDistrictsLoading(true);
      setDistricts([]); // Kosongkan list sebelumnya saat loading baru
      try {
        setDistricts(regenciesData.find(city => city.code === formData.city)?.districts || []);
      } catch (err) {
        setError('Tidak dapat memuat daftar kecamatan.');
      } finally {
        setDistrictsLoading(false);
      }
    };
    fetchDistricts();
  }, [formData.city]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'city') {
      setFormData(prev => ({
        ...prev,
        city: value,
        district: '',
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // PERBAIKAN: Logika penanganan file diubah total.
  // Sekarang memisahkan file gambar dan video ke dalam array yang benar.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const photos: File[] = [];
      const videos: File[] = [];

      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          photos.push(file);
        } else if (file.type.startsWith('video/')) {
          videos.push(file);
        }
      });
      
      setFormData(prev => ({
        ...prev,
        photo_files: [...prev.photo_files, ...photos],
        video_files: [...prev.video_files, ...videos],
      }));
    }
  };

  // PERBAIKAN: Dibuat dua fungsi terpisah untuk menghapus foto dan video
  const handleRemovePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photo_files: prev.photo_files.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      video_files: prev.video_files.filter((_, i) => i !== index),
    }));
  };

  // PERBAIKAN BESAR: Logika handleSubmit sekarang membangun objek FormData dengan benar.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // 1. Buat instance FormData baru. Ini wajib untuk upload file.
    const dataToSend = new FormData();

    // 2. Tambahkan setiap field teks dari state ke FormData.
    dataToSend.append('name', formData.name);
    dataToSend.append('phone', formData.phone);
    dataToSend.append('description', formData.description);
    dataToSend.append('city', formData.city);
    dataToSend.append('district', formData.district);
    dataToSend.append('location', formData.address);

    // 3. Tambahkan setiap file foto. Kunci 'photo_files[]' adalah konvensi umum
    //    agar backend (seperti Laravel/PHP) membacanya sebagai array.
    formData.photo_files.forEach((file) => {
      dataToSend.append('images[]', file);
    });

    // 4. Lakukan hal yang sama untuk file video.
    formData.video_files.forEach((file) => {
      dataToSend.append('videos[]', file);
    });

    try {
      // 5. Kirim objek FormData yang sudah dibuat.
      const response = await reportService.createReport(dataToSend);
      setSuccess(response.data.message || 'Laporan berhasil dibuat!');
      setTimeout(() => {
        // Asumsi response memiliki data yang dibutuhkan, sesuaikan jika perlu
        navigate(`/report/${response.data.id}/track`);
      }, 1500);
    } catch (err: any) {
      setError(decodeErrorResponse(err) || 'Gagal membuat laporan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Buat Laporan Baru</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-6">
        <div className="border-b pb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Kontak</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                id="name"
                name="name"
                // PERBAIKAN: value diubah dari formData.email menjadi formData.name
                value={formData.name || ''}
                onChange={handleChange}
                required
                placeholder='Nama anda'
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                No. Telepon
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                required
                placeholder='+62 812 345 678'
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="border-b pb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detail Laporan</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi Lengkap (Judul & Detail)
              </label>
              <textarea
                id="description"
                name="description"
                // PERBAIKAN: Input 'title' dan 'description' digabung menjadi satu.
                // Sesuai dengan interface yang hanya memiliki 'description'.
                value={formData.description || ''}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Jelaskan masalah secara detail, termasuk judul singkat di awal jika perlu"
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* --- DROPDOWN KOTA/KABUPATEN BARU --- */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                Kota / Kabupaten
              </label>
              <select
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                disabled={regenciesDataLoading}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">{regenciesDataLoading ? 'Memuat...' : 'Pilih Kota/Kabupaten'}</option>
                {regenciesData.map(city => (
                  <option key={city.code} value={city.code}>{city.name}</option>
                ))}
              </select>
            </div>

            {/* --- DROPDOWN KECAMATAN BARU --- */}
            <div>
              <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                Kecamatan
              </label>
              <select
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                required
                disabled={districtsLoading || !formData.city} // Nonaktif jika loading atau kota belum dipilih
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">{districtsLoading ? 'Memuat...' : 'Pilih Kecamatan'}</option>
                {districts.map(district => (
                  <option key={district.code} value={district.code}>{district.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Alamat/Lokasi
              </label>
              <input
                type="text"
                id="address"
                name="address"
                // PERBAIKAN: name dan value diubah dari 'city' menjadi 'address'
                value={formData.address || ''}
                onChange={handleChange}
                required
                placeholder="Lokasi kejadian"
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="border-b pb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Media (Foto/Video)</h2>
          <div>
            <label htmlFor="media-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Upload bukti (opsional)
            </label>
            <input
              type="file"
              id="media-upload"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-2 text-xs text-gray-500">Anda bisa memilih foto dan video sekaligus. Maksimal 2MB per foto dan 10MB per video.</p>
          </div>
          
          {/* PERBAIKAN: Tampilkan daftar file yang dipilih secara terpisah */}
          {(formData.photo_files.length > 0 || formData.video_files.length > 0) && (
            <div className="mt-4 space-y-3">
              {formData.photo_files.length > 0 && <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Foto yang dipilih:</p>
                {formData.photo_files.map((file, index) => (
                  <div key={`photo-${index}`} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700 truncate pr-2">{file.name}</span>
                    <button type="button" onClick={() => handleRemovePhoto(index)} className="text-red-600 hover:text-red-800 text-sm font-semibold">Hapus</button>
                  </div>
                ))}
              </div>}

              {formData.video_files.length > 0 && <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Video yang dipilih:</p>
                {formData.video_files.map((file, index) => (
                  <div key={`video-${index}`} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700 truncate pr-2">{file.name}</span>
                    <button type="button" onClick={() => handleRemoveVideo(index)} className="text-red-600 hover:text-red-800 text-sm font-semibold">Hapus</button>
                  </div>
                ))}
              </div>}
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            {loading ? 'Sedang Mengirim...' : 'Kirim Laporan'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}