import React, { useState } from 'react';
import { reportService } from '../services/api';

interface TrackReport {
  id: number;
  title: string;
  description: string;
  city: string;
  priority: string;
  created_at: string;
  status: string;
}

export default function ReportTrackPage() {
  const [searchId, setSearchId] = useState('');
  const [reports, setReports] = useState<TrackReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) {
      setError('Masukkan ID laporan');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await reportService.getReportDetail(searchId);
      setReports(response.data.reports || []);
      setSearched(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mencari laporan');
      setReports([]);
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lacak Laporan</h1>
        <p className="mt-2 text-gray-600">Cari dan pantau status laporan Anda</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label htmlFor="search_id" className="block text-sm font-medium text-gray-700 mb-1">
              ID Laporan
            </label>
            <input
              type="number"
              id="search_id"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Masukkan ID laporan"
              className="w-full border-gray-300 rounded-md shadow-sm p-2 border outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sedang mencari...' : 'Cari Laporan'}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          {error}
        </div>
      )}

      {searched && (
        <>
          {reports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reports.map((report) => (
                <div key={report.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = `/report/${report.id}/track`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">#{report.id}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">{report.title}</h4>
                  <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{report.city}</span>
                    <span>{new Date(report.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Laporan tidak ditemukan</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
