import React, { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';

interface Report {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  city: string;
  created_at: string;
  updated_at: string;
  statuses: string[];
  media: any[];
  assignee?: { full_name: string; email: string };
}

export default function ReportTrackShowPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const response = await reportService.getReportDetail(id);
      setReport(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Gagal memuat data laporan');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-gray-600">Memuat laporan...</p></div>;
  }

  if (error || !report) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-red-600">{error || 'Laporan tidak ditemukan'}</p></div>;
  }

  const currentStatus = report.statuses && report.statuses.length > 0 ? report.statuses[report.statuses.length - 1] : 'unknown';

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'process': 'bg-cyan-100 text-cyan-800',
      'finished': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
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

      {/* Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{report.title}</h2>
            <p className="text-gray-600">{report.description}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentStatus)}`}>
            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Laporan</h3>
          <div className="space-y-3">
            <div><strong className="text-gray-700">Kategori:</strong> <span className="text-gray-600">{report.category}</span></div>
            <div><strong className="text-gray-700">Prioritas:</strong> <span className="text-gray-600">{report.priority}</span></div>
            <div><strong className="text-gray-700">Lokasi:</strong> <span className="text-gray-600">{report.city}</span></div>
            <div><strong className="text-gray-700">Dibuat:</strong> <span className="text-gray-600">{new Date(report.created_at).toLocaleDateString('id-ID')}</span></div>
            <div><strong className="text-gray-700">Diperbarui:</strong> <span className="text-gray-600">{new Date(report.updated_at).toLocaleDateString('id-ID')}</span></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Penanganan</h3>
          <div className="space-y-3">
            <div>
              <strong className="text-gray-700">Penanggung Jawab:</strong>
              <p className="text-gray-600">{report.assignee?.full_name || 'Belum ditugaskan'}</p>
              {report.assignee && <p className="text-sm text-gray-500">{report.assignee.email}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Timeline</h3>
        <div className="space-y-4">
          {report.statuses?.map((status, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${getStatusColor(status).split(' ')[0]}`}></div>
              <p className="text-gray-700 capitalize">{status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Media */}
      {report.media && report.media.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Media</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {report.media.map((file, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                {file.type === 'image' ? (
                  <img src={file.url} alt={`Media ${index}`} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-600">File: {file.name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
