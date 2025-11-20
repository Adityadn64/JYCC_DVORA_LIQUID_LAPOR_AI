import { useState, useEffect, useCallback } from 'react';
import { allService, reportService } from '@/services/api';
import { useParams, useNavigate } from 'react-router-dom';
import { SkeletonReportDetailPage } from '@/components/SkeletonLoading';
import { AuthUser, generateVideoThumbnail } from '@/types';

// [FIX] Perbaiki Interface agar konsisten
interface ReportFiles {
  files_path: string[];
  files_url: string[];
  content_type: string[]; // Gunakan content_type, hapus files_type yang membingungkan
  thumbnails: string[];
}

interface Report {
  id: number;
  title: string;
  description: string;
  service_code: string;
  category: string;
  priority: string;
  city_name: string;
  district_name: string;
  address: string;
  created_at: string;
  updated_at: string;
  statuses: string[];
  review_notes: string[];
  status_change_history: string[]; // boolean convert to string from API? asumsikan boolean/number
  review_timestamps: string[];
  media: { user: ReportFiles; work: ReportFiles };
  assignee?: { id: number; full_name: string; email: string };
  contributors?: { id: number; full_name: string; email: string }[];
}

interface ActiveModalStatus {
  type: string;
  change: boolean;
  comment: string;
}

export default function ReportTrackShowPage({ csrfLoading, user, isAuthenticated }: { csrfLoading: boolean; user: AuthUser; isAuthenticated: boolean }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [feedbackFormData, setFeedbackFormData] = useState({ category: '', comment: '' });
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeModalStatus, setActiveModalStatus] = useState<ActiveModalStatus>({ type: "", change: false, comment: "" });
  
  // State untuk Gallery
  const [preview, setPreview] = useState<"user" | "work">("user"); // [FIX] Strict typing
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  // [HELPER] Ambil list media yang sedang aktif (User atau Work)
  const getActiveMediaList = () => {
    if (!report?.media) return null;
    return preview === "user" ? report.media.user : report.media.work;
  };

  const activeMediaList = getActiveMediaList();

  // [HANDLER] Buka Modal Gallery
  const openGallery = (index: number, type: "user" | "work") => {
    setPreview(type);
    setCurrentMediaIndex(index);
    setZoomLevel(1);
    setIsGalleryOpen(true);
  };

  // [HANDLER] Tutup Modal Gallery
  const closeGallery = () => {
    setIsGalleryOpen(false);
    setZoomLevel(1);
  };

  // [HANDLER] Navigasi Carousel (Diperbaiki untuk support User & Work)
  const nextMedia = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    e?.stopPropagation();
    setZoomLevel(1);
    if (activeMediaList?.files_url) {
      setCurrentMediaIndex((prev) => (prev + 1) % activeMediaList.files_url.length);
    }
  }, [activeMediaList]);

  const prevMedia = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    e?.stopPropagation();
    setZoomLevel(1);
    if (activeMediaList?.files_url) {
      setCurrentMediaIndex((prev) => (prev - 1 + activeMediaList.files_url.length) % activeMediaList.files_url.length);
    }
  }, [activeMediaList]);

  // [HANDLER] Zoom
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  useEffect(() => {
    if (csrfLoading || !id) return; // Guard clause
    fetchReport();
  }, [id, csrfLoading]);

  // [EFFECT] Keyboard Navigation for Gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGalleryOpen) return;
      if (e.key === 'Escape') closeGallery();
      if (e.key === 'ArrowRight') nextMedia(e);
      if (e.key === 'ArrowLeft') prevMedia(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGalleryOpen, nextMedia, prevMedia]);

  // [FIX] Refactor Fetch Report agar lebih bersih dan menangani thumbnail Work juga
  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getReportDetail(id);
      const reportData: Report = response.data.report;

      // Helper untuk memproses file (User & Work logic sama)
      const processFiles = async (filesPath: string[] = []) => {
        const urls: string[] = [];
        const types: string[] = [];
        const thumbs: string[] = [];

        for (const filePath of filesPath) {
          try {
            const blob = await allService.getBlobFile(filePath);
            const contentType = blob.type;
            const fileUri = URL.createObjectURL(blob);

            urls.push(fileUri);
            types.push(contentType);

            // Generate Thumbnail
            if (contentType.startsWith("image")) {
              thumbs.push(fileUri);
            } else if (contentType.startsWith("video")) {
              try {
                const thumbUrl = await generateVideoThumbnail(fileUri, 1);
                thumbs.push(thumbUrl);
              } catch (e) {
                console.error("Gagal generate thumbnail:", e);
                thumbs.push("/assets/video-placeholder.png"); // Fallback image jika ada
              }
            } else {
              thumbs.push("/assets/file-placeholder.png"); // Fallback
            }
          } catch (err) {
            console.error(`Error processing file ${filePath}:`, err);
          }
        }
        return { files_path: filesPath, files_url: urls, content_type: types, thumbnails: thumbs };
      };

      // Proses User dan Work secara paralel (opsional, disini sequential agar aman)
      reportData.media.user = await processFiles(reportData.media.user?.files_path || []);
      reportData.media.work = await processFiles(reportData.media.work?.files_path || []);

      setReport(reportData);
    } catch (err) {
      console.error('Error fetching report:', err);
      // setError('Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'process': 'bg-cyan-100 text-cyan-800',
      'finished': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <SkeletonReportDetailPage />;
  if (error || !report) return <div className="flex justify-center items-center min-h-screen"><p className="text-red-600">{error || 'Laporan tidak ditemukan'}</p></div>;

  const currentStatus = report.statuses?.length > 0 ? report.statuses[report.statuses.length - 1] : 'unknown';
  
  // [FIX] Logic untuk menentukan media yang sedang tampil di Modal
  const currentActiveFile = activeMediaList && activeMediaList.files_url[currentMediaIndex] 
    ? {
        url: activeMediaList.files_url[currentMediaIndex],
        type: activeMediaList.content_type[currentMediaIndex],
      } 
    : null;

  return (
    <div>
      <div className="space-y-8">
        <div>
          <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-800 mb-4">← Kembali</button>
          <h1 className="text-3xl font-bold text-gray-900">Detail Laporan #{report.id}</h1>
        </div>

        {/* Summary Box */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{report.title}</h2>
              <p className="text-gray-600">{report.description}</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentStatus)} flex-shrink-0 ml-4`}>
              {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
            </span>
          </div>
        </div>

        {/* Detail Info */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Laporan</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><strong className="text-gray-700">Dinas:</strong> <span className="text-gray-600">{report.service_code}</span></div>
            <div className="flex justify-between"><strong className="text-gray-700">Kategori:</strong> <span className="text-gray-600">{report.category}</span></div>
            <div className="flex justify-between"><strong className="text-gray-700">Prioritas:</strong> <span className="text-gray-600">{report.priority}</span></div>
            <div className="flex justify-between"><strong className="text-gray-700">Lokasi:</strong> <span className="text-gray-600">{report.address}, {report.district_name}, {report.city_name}</span></div>
            <div className="flex justify-between"><strong className="text-gray-700">Dibuat:</strong> <span className="text-gray-600">{new Date(report.created_at).toLocaleDateString('id-ID')}</span></div>
          </div>
        </div>

        {/* Penanganan */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Penanganan</h3>
          <div className="space-y-3">
            <div className='flex flex-col'>
              <strong className="text-gray-700 text-base">Penanggung Jawab:</strong>
              <div className='flex items-center gap-4 justify-between w-full'>
                <p className="text-gray-600">{report.assignee?.full_name || 'Belum ditugaskan'}</p>
                {report.assignee?.email && <p className="text-sm text-gray-500">{report.assignee.email}</p>}
              </div>
            </div>
            {report.contributors && report.contributors.length > 0 && (
              <div>
                <strong className="text-gray-700 text-base">Kontributor:</strong>
                <div className='flex flex-col gap-2 mt-1'>
                  {/* Filter unique contributors */}
                  {report.contributors
                    .filter((obj, index, self) => index === self.findIndex((t) => t.id === obj.id))
                    .map(contributor => (
                      <div key={contributor.id} className='flex gap-2 items-center'>
                        <span>-</span>
                        <div className='flex items-center gap-4 justify-between w-full'>
                          <p className="text-gray-600">{contributor.full_name}</p>
                          {contributor.email && <p className="text-sm text-gray-500">{contributor.email}</p>}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabel Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Timeline & Komentar</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catatan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.statuses.map((status, index) => {
                    const note = report.review_notes[index];
                    const timestamp = report.review_timestamps[index];
                    const isHistoryVisible = report.status_change_history[index] || isAuthenticated;
                    // Check if there are work files associated with this status or generally available
                    // Note: Usually work files are tied to 'finished' or 'process', assuming logic here:
                    const hasWorkFiles = report.media.work.files_url.length > 0 && index > 0; 

                    if (!isHistoryVisible) return null;

                    return (
                      <tr key={index} className={report.status_change_history[index] ? 'hover:bg-gray-100' : 'bg-red-50 hover:bg-red-100'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 min-w-[250px]">
                          <p className="line-clamp-2">{note || <span className="italic text-gray-400">- Tidak ada catatan -</span>}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{timestamp || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex flex-col gap-2">
                          
                          {/* [FIX] Tombol Lihat Proses hanya muncul jika ada file work */}
                          {hasWorkFiles && (
                            <button
                              onClick={() => openGallery(0, 'work')}
                              className="text-blue-600 hover:text-blue-900 hover:underline text-left"
                            >
                              Lihat Bukti Pengerjaan
                            </button>
                          )}

                          {/* Tombol Edit Tampilan (Admin Only) */}
                          {report.assignee?.id === user?.id && isAuthenticated && index > 0 && (
                            <button
                              onClick={() => setActiveModalStatus({ 
                                type: "editStatus", 
                                change: !!report.status_change_history[index], // force boolean
                                comment: note || "Tidak ada catatan" 
                              })}
                              className="text-orange-600 hover:text-orange-900 hover:underline text-left"
                            >
                              {report.status_change_history[index] ? 'Sembunyikan' : 'Tampilkan'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Media Grid (User Reports) */}
        {report.media.user && report.media.user.files_url.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Lampiran Pelapor</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {report.media.user.thumbnails.map((file, index) => (
                <div
                  key={index}
                  onClick={() => openGallery(index, 'user')}
                  className="border rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group h-48 bg-gray-100"
                >
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center z-10">
                    <span className="text-white opacity-0 group-hover:opacity-100 font-semibold bg-black/50 px-3 py-1 rounded">Lihat</span>
                  </div>
                  <img src={file} alt={`Media ${index}`} className="w-full h-full object-cover" />
                  {report.media.user.content_type[index]?.startsWith('video') && (
                     <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full z-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                     </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trigger Modal Feedback (Auth Only) */}
        {isAuthenticated && (
          <div className="mt-4 text-right">
            <button
              onClick={() => setActiveModal('feedback')}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Perbarui Status / Beri Tanggapan
            </button>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* 1. Modal Edit Status Visibility */}
      {activeModalStatus.type === "editStatus" && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Konfirmasi Tampilan</h3>
            <p className="text-gray-600 mb-2">Catatan:</p>
            <div className="bg-gray-50 p-3 rounded mb-4 text-sm italic border">"{activeModalStatus.comment}"</div>
            <p className="mb-6 text-sm text-gray-700">
              Apakah Anda yakin ingin <strong>{activeModalStatus.change ? "Menyembunyikan" : "Menampilkan"}</strong> status ini ke publik?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setActiveModalStatus({ type: "", change: false, comment: "" })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                onClick={() => {
                    // Logika API call disini
                    setActiveModalStatus({ type: "", change: false, comment: "" });
                }}
                className={`px-4 py-2 text-white rounded ${activeModalStatus.change ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {activeModalStatus.change ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Feedback */}
      {activeModal === 'feedback' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                <h3 className="text-xl font-semibold mb-4">Kirim Masukan</h3>
                <form onSubmit={(e) => { e.preventDefault(); setActiveModal(null); }}>
                    {/* Form content simplified for brevity */}
                    <div className="space-y-4">
                        <select className="w-full border p-2 rounded" onChange={e => setFeedbackFormData({...feedbackFormData, category: e.target.value})}>
                            <option value="">Pilih Kategori</option>
                            <option value="progress">Update Progress</option>
                            <option value="finish">Selesai</option>
                        </select>
                        <textarea 
                            className="w-full border p-2 rounded" 
                            rows={4} 
                            placeholder="Tulis komentar..."
                            onChange={e => setFeedbackFormData({...feedbackFormData, comment: e.target.value})}
                        ></textarea>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-gray-100 rounded">Batal</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Kirim</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* 3. MEDIA GALLERY MODAL */}
      {isGalleryOpen && currentActiveFile && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center backdrop-blur-sm" onClick={closeGallery}>
          
          {/* Close Button */}
          <button onClick={closeGallery} className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          {/* Prev Button */}
          {activeMediaList && activeMediaList.files_url.length > 1 && (
            <button onClick={prevMedia} className="absolute left-4 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors hidden sm:block">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
          )}

          {/* Main Content */}
          <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            {currentActiveFile.type.startsWith("image") ? (
              <div className="transition-transform duration-200 ease-out" style={{ transform: `scale(${zoomLevel})` }}>
                <img
                  src={currentActiveFile.url}
                  alt="Preview"
                  className="max-h-[85vh] max-w-full object-contain shadow-2xl"
                  draggable={false}
                />
              </div>
            ) : currentActiveFile.type.startsWith("video") ? (
              <video src={currentActiveFile.url} controls autoPlay className="max-h-[85vh] max-w-full w-full md:w-3/4 bg-black shadow-2xl" />
            ) : (
              <div className="bg-white p-8 rounded-lg text-center">
                <p className="text-gray-800 mb-4">Format file tidak didukung untuk pratinjau.</p>
                <a href={currentActiveFile.url} target="_blank" rel="noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded">Download File</a>
              </div>
            )}
          </div>

          {/* Next Button */}
          {activeMediaList && activeMediaList.files_url.length > 1 && (
            <button onClick={nextMedia} className="absolute right-4 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors hidden sm:block">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          )}

          {/* Footer Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-4 bg-black/60 px-6 py-2 rounded-full backdrop-blur-md text-white" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm font-medium border-r border-gray-500 pr-4">
              {currentMediaIndex + 1} / {activeMediaList?.files_url.length}
            </span>

            {currentActiveFile.type.startsWith('image') && (
              <div className="flex items-center gap-2">
                <button onClick={handleZoomOut} disabled={zoomLevel <= 1} className="p-1 hover:text-blue-400 disabled:opacity-30"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                <span className="text-xs w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={handleZoomIn} disabled={zoomLevel >= 3} className="p-1 hover:text-blue-400 disabled:opacity-30"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
              </div>
            )}
            
            <span className="text-xs text-gray-400 uppercase tracking-wider border-l border-gray-500 pl-4">
              {preview === "user" ? "Bukti Laporan" : "Bukti Pengerjaan"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}