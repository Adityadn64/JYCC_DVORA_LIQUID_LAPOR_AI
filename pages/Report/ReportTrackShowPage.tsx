import { useState, useEffect, act } from 'react';
import { allService, decodeErrorResponse, reportService } from '@/services/api';
import { useParams, useNavigate } from 'react-router-dom';
import { SkeletonReportDetailPage } from '@/components/SkeletonLoading';
import { AuthUser, generateVideoThumbnail } from '@/types';

interface ReportFiles {
  files_path: string[];
  files_url: string[]
  files_type: string[];
  content_type: string[];
  thumbnails: string[]
}

interface Report {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  city_name: string;
  district_name: string;
  address: string;
  created_at: string;
  updated_at: string;
  statuses: string[];
  review_notes: string[];
  status_change_history: string[];
  review_timestamps: string[];
  media: { user: ReportFiles, work: ReportFiles };
  assignee?: { id: number; full_name: string; email: string };
  contributors?: { id: number; full_name: string; email: string }[];
}

interface ActiveModalStatus {
  type: string;
  change: boolean;
  comment: string
}

export default function ReportTrackShowPage({ csrfLoading, user, isAuthenticated }: { csrfLoading: boolean; user: AuthUser; isAuthenticated: boolean }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackFormData, setFeedbackFormData] = useState({ category: '', comment: '' });
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeModalStatus, setActiveModalStatus] = useState<ActiveModalStatus>({type: "", change: false, comment: ""});
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState("user");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  // const [reportsData, setReportsData] = useState({});

  // [HANDLER] Buka Modal Gallery
  const openGallery = (index: number) => {
    setCurrentMediaIndex(index);
    setZoomLevel(1);
    setIsGalleryOpen(true);
  };

  // [HANDLER] Tutup Modal Gallery
  const closeGallery = () => {
    setIsGalleryOpen(false);
    setZoomLevel(1);
  };

  // [HANDLER] Navigasi Carousel
  const nextMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel(1);
    if (report?.media?.user) {
      setCurrentMediaIndex((prev) => (prev + 1) % report.media.user.files_url.length);
    }
  };

  const prevMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel(1);
    if (report?.media?.user) {
      setCurrentMediaIndex((prev) => (prev - 1 + report.media.user.files_url.length) % report.media.user.files_url.length);
    }
  };

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
    if (csrfLoading) {
      fetchReport();
    }
  }, [id, csrfLoading]);

  // [EFFECT] Keyboard Navigation for Gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGalleryOpen) return;
      if (e.key === 'Escape') closeGallery();
      if (e.key === 'ArrowRight') nextMedia();
      if (e.key === 'ArrowLeft') prevMedia();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGalleryOpen]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getReportDetail(id);
      const report: Report = response.data.report;

      console.log({report});

      let userFiles = [];
      let workFiles = [];

      let userContentTypes = [];
      let workContentTypes = [];

      let idxFilesIteration = 0;

      for (const filesPath of [
        report.media.user.files_path,
        report.media.work.files_path,
      ]) {
        for (const filePath of filesPath || []) {
          try {
            const blob = await allService.getBlobFile(filePath);
            console.log({blob});
            const contentType = blob.type;
            const fileUri = URL.createObjectURL(blob);
  
            if (idxFilesIteration === 0) {
              userContentTypes.push(contentType);
              userFiles.push(fileUri)
            } else {
              workContentTypes.push(contentType);
              workFiles.push(fileUri);
            }
          } catch (err) {
            console.error('Error fetching report:', err);
            setError((await decodeErrorResponse(err)) || 'Gagal memuat data laporan');
          }
        }

        idxFilesIteration = 1;
      }

      let userThumbnails = [];

      for (let i = 0; i < userFiles.length; i++) {
        const fileUrl = userFiles[i];
        const type = userContentTypes[i];

        if (type.startsWith("image")) {
          userThumbnails.push(fileUrl);
        } else if (type.startsWith("video")) {
          try {
            const thumbUrl = await generateVideoThumbnail(fileUrl, 1);
            userThumbnails.push(thumbUrl);
          } catch (e) {
            console.error("Gagal generate thumbnail:", e);
            userThumbnails.push(""); 
          }
        } else {
            userThumbnails.push("");
        }
      }

      report.media.user.files_url = userFiles;
      report.media.work.files_url = workFiles;

      report.media.user.content_type = userContentTypes;
      report.media.work.content_type = workContentTypes;

      report.media.user.thumbnails = userThumbnails;
      setReport(report);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError((await decodeErrorResponse(err)) || 'Gagal memuat data laporan');
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
  
//   useEffect(() => {
//     const reports = report.statuses.map((status, index) => ({
//       status: status,
//       review_note: report.review_notes[index],
//       review_timestamp: report.review_timestamps[index],
//     }));
//     setReportsData(reports)
//   }, [report])
// console.log(report)


  if (loading) {
    return <SkeletonReportDetailPage />;
  }

  if (error || !report) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-red-600">{error || 'Laporan tidak ditemukan'}</p></div>;
  }

  const currentStatus = report.statuses && report.statuses.length > 0 ? report.statuses[report.statuses.length - 1] : 'unknown';
  const activeMedia = {
    user: {
      type: report?.media?.user ? report.media.user.files_type[currentMediaIndex] : null,
      url: report?.media?.user ? report.media.user.files_url[currentMediaIndex] : null
    },
    work: {
      type: report?.media?.work ? report.media.work.files_type[currentMediaIndex] : null,
      url: report?.media?.work ? report.media.work.files_url[currentMediaIndex] : null
    }
  };

  return (
    <div>
      <div className="space-y-8">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Kembali
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Detail Laporan #{report.id}</h1>
      </div>

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

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Laporan</h3>
        <div className="space-y-3">
          <div className="flex justify-between"><strong className="text-gray-700">Kategori:</strong> <span className="text-gray-600">{report.category}</span></div>
          <div className="flex justify-between"><strong className="text-gray-700">Prioritas:</strong> <span className="text-gray-600">{report.priority}</span></div>
          <div className="flex justify-between"><strong className="text-gray-700">Kota/Kabupaten:</strong> <span className="text-gray-600">{report.city_name}</span></div>
          <div className="flex justify-between"><strong className="text-gray-700">Kecamatan:</strong> <span className="text-gray-600">{report.district_name}</span></div>
          <div className="flex justify-between"><strong className="text-gray-700">Lokasi:</strong> <span className="text-gray-600">{report.address}</span></div>
          <div className="flex justify-between"><strong className="text-gray-700">Dibuat:</strong> <span className="text-gray-600">{new Date(report.created_at).toLocaleDateString('id-ID')}</span></div>
          <div className="flex justify-between"><strong className="text-gray-700">Diperbarui:</strong> <span className="text-gray-600">{new Date(report.updated_at).toLocaleDateString('id-ID')}</span></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Penanganan</h3>
        <div className="space-y-3">
          <div className='flex flex-col'>
            <strong className="text-gray-700 text-base">Penanggung Jawab:</strong>
            <div className='flex items-center gap-4 grid-cols-2 justify-between w-full'>
              <p className="text-gray-600">{report.assignee?.full_name || 'Belum ditugaskan'}</p>
              {report.assignee && report.assignee.email && <p className="text-sm text-gray-500">{report.assignee.email}</p>}
            </div>
          </div>
          {report.contributors && report.contributors.length > 0 && <div>
            <strong className="text-gray-700 text-base">Kontributor:</strong>
            <div className='flex flex-col gap-2'>
              {(report.contributors || [{ id: 0, full_name: null, email: null }])
                .filter(
                  (obj, index) =>
                    report.contributors.findIndex(item => item.id === obj.id) === index
                )
                .map(contributor => (
                  <div key={contributor.id} className='flex gap-1'>
                    <div>
                      <span>-</span>
                    </div>
                    <div className='flex items-center gap-4 grid-cols-2 justify-between w-full'>
                      <p className="text-gray-600">{contributor?.full_name || 'Belum ditugaskan'}</p>
                      {contributor.email && <p className="text-sm text-gray-500">{contributor.email}</p>}
                    </div>
                  </div>
                ))}
            </div>
          </div>}
        </div>
      </div>

      {/* [MODIFIKASI] Ubah ke format Table dengan overflow auto */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Timeline & Komentar</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Komentar / Catatan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Waktu
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" colSpan={report.assignee.id === user?.id && isAuthenticated ? 2 : 1}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {report.statuses.map((status, index) => ({
                status: status,
                review_note: report.review_notes[index],
                review_timestamp: report.review_timestamps[index],
              })).map((data, index) => (
                report.status_change_history[index] || isAuthenticated
                  ? <tr key={index} className={`${report.status_change_history[index] ? 'hover:bg-gray-100' : 'bg-red-200 hover:bg-red-300'} transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(data.status)}`}>
                        {data.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 min-w-[250px]">
                      {data.review_note ? (
                        <p className="line-clamp-2">{data.review_note}</p>
                      ) : (
                        <span className="text-gray-400 italic">- Tidak ada catatan -</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.review_timestamp || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {index === 0 ? (
                        <p></p>
                      ) : (<button
                        onClick={() => {
                          setPreview("work");
                          setIsGalleryOpen(!isGalleryOpen)
                        }}
                        className="text-blue-600 hover:text-blue-900 hover:underline"
                      >
                        Lihat Proses
                      </button>)}
                      
                    </td>
                    {report.assignee.id === user?.id && isAuthenticated && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {index === 0 ? (
                        <p></p>
                      ) : (
                      <button
                        onClick={() => setActiveModalStatus({type: "editStatus", change: report.status_change_history[index] ? true : false, comment: data.review_note ? data.review_note : "Tidak ada catatan"})}
                        className="text-blue-600 hover:text-blue-900 hover:underline"
                      >
                        Edit Tampilan
                      </button>
                      )}
                    </td>}
                  </tr>
                  : <></>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {report.media && report.media.user && report.media.user.files_url.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Media</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {report.media.user.thumbnails.map((file, index) => (
              <div
                key={index}
                onClick={() => {
                  setPreview("user");
                  openGallery(index);
                }}
                className="border rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group"
              >
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 font-semibold">Lihat</span>
                </div>
                <img src={file} alt={`Media ${index}`} className="w-full h-48 object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tombol Pemicu (Trigger) - Tetap butuh Auth untuk tombol bawah ini */}
      {isAuthenticated && (
        <div className="mt-4 text-right">
          <button
            onClick={() => setActiveModal('feedback')}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Perbarui Status
          </button>
        </div>
      )}
</div>
      {activeModalStatus.type === "editStatus" && (
        <div className='fixed inset-0 z-50' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">

              {/* Header Modal */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Edit Tampilan</h3>
                <button
                  onClick={() => {
                    setActiveModalStatus({type: "", change: false, comment: ""});
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  &times;
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={(e) => {
                e.preventDefault();
              }}>
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                      <p>{error}</p>
                    </div>
                  )}

                  {/* Input Komentar (Textarea) */}
                  <div>
                    <p className="line-clamp-2">{activeModalStatus.comment}</p>
                  </div>

                  {/* Footer Buttons */}
                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModalStatus({type: "", change: false, comment: ""});
                      }}
                      className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Batal
                    </button>
                      <button
                        type="submit"
                        className={`rounded-md ${activeModalStatus.change ? "bg-red-500 hover:bg-blue-red" : "bg-blue-500 hover:bg-blue-700"} px-4 py-2 text-sm font-semibold text-white shadow-sm`}
                      >
                        {activeModalStatus.change ? "Sembunyikan" : "Tampilkan"}
                      </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* [MODIFIKASI] Kondisi 'isAuthenticated' DIHAPUS agar modal bisa muncul untuk publik */}
      {activeModal === 'feedback' && (
        <div className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">

              {/* Header Modal */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Kirim Masukan</h3>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setFeedbackFormData({ category: '', comment: '' });
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  &times;
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={(e) => {
                e.preventDefault();
                console.log(feedbackFormData);
              }}>
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                      <p>{error}</p>
                    </div>
                  )}

                  {/* Input Select */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Kategori</label>
                    <select
                      id="category"
                      name="category"
                      required
                      value={feedbackFormData.category}
                      onChange={(e) => setFeedbackFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Pilih Kategori</option>
                      <option value="bug">Laporan Bug</option>
                      <option value="feature">Saran Fitur</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>

                  {/* Input Komentar (Textarea) */}
                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Komentar</label>
                    <textarea
                      id="comment"
                      name="comment"
                      rows={4}
                      required
                      placeholder="Tuliskan komentar atau masukan Anda di sini..."
                      value={feedbackFormData.comment}
                      onChange={(e) => setFeedbackFormData(prev => ({ ...prev, comment: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Footer Buttons */}
                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setFeedbackFormData({ category: '', comment: '' });
                      }}
                      className="mr-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                    >
                      Kirim
                    </button>
                  </div>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* --- MEDIA GALLERY MODAL --- */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm space-y-0" onClick={closeGallery}>

          <button
            onClick={closeGallery}
            className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          {report.media.work.files_url.length > 1 && (
            <button
              onClick={prevMedia}
              className="absolute left-4 z-50 p-3 bg-black/50 hover:bg-white/20 rounded-full text-white transition-colors hidden sm:block"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
          )}

          <div className="relative w-full h-full flex items-center justify-center p-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {(preview === "user" ? activeMedia.user.type.startsWith("image") : activeMedia.work.type.startsWith("image")) ? (
              <div
                className="transition-transform duration-200 ease-out"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={preview === "user" ? activeMedia.user.url : activeMedia.work.url}
                  alt="Preview"
                  className="max-h-screen max-w-full object-contain"
                  draggable={false}
                />
              </div>
            ) : (preview === "user" ? activeMedia.user.type.startsWith("video") : activeMedia.work.type.startsWith("video")) ? (
              <video
                src={preview === "user" ? activeMedia.user.url : activeMedia.work.url}
                controls
                autoPlay
                className="max-h-screen max-w-full w-full md:w-4/5 bg-black"
              />
            ) : (
              <div className="bg-white p-8 rounded-lg text-center">
                <p className="text-xl font-semibold text-gray-800 mb-4">File ini tidak dapat dipratinjau</p>
                <a
                  href={preview === "user" ? activeMedia.user.url : activeMedia.work.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                  Download / Buka File
                </a>
              </div>
            )}
          </div>

          {report.media.user.files_url.length > 1 && (
            <button
              onClick={nextMedia}
              className="absolute right-4 z-50 p-3 bg-black/50 hover:bg-white/20 rounded-full text-white transition-colors hidden sm:block"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          )}

          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-4 bg-black/60 px-6 py-2 rounded-full backdrop-blur-md text-white" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm font-medium border-r border-gray-500 pr-4">
              {currentMediaIndex + 1} / {report.media.user.files_url.length}
            </span>

            {(preview === "user" ? activeMedia.user.type === 'image' : activeMedia.work.type === "image") && (
              <div className="flex items-center gap-2">
                <button onClick={handleZoomOut} disabled={zoomLevel <= 1} className="p-1 hover:text-blue-400 disabled:opacity-30">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                </button>
                <span className="text-xs w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={handleZoomIn} disabled={zoomLevel >= 3} className="p-1 hover:text-blue-400 disabled:opacity-30">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                </button>
              </div>
            )}

            {(preview === "user" ? activeMedia.user.type === 'image' : activeMedia.work.type === "image") && (
              <span className="text-xs text-gray-300 uppercase tracking-wider">
                {preview === "user" ? activeMedia.user.type : activeMedia.work.type}
              </span>
            )}
          </div>
        </div>
      )}

    </div>
  );
}