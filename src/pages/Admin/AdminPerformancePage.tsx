import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { adminPerformanceService, decodeErrorResponse } from '@/services/api';
import { SkeletonStatsGrid, SkeletonChart, Skeleton } from '@/components/SkeletonLoading';
import { CsrfLoadingProps } from '@/types';

interface PerformanceData {
  totalReports: number;
  avgResolutionTime: number;
  completionRate: number;
  adminPerformance: { name: string; completed: number; pending: number }[];
  trendData: { month: string; completed: number; pending: number }[];
  serviceBreakdown: { name: string; value: number }[];
  topIssues: { name: string; count: number }[];
  slaStatus: { onTime: number; breached: number };
}

type ScopeType = 'all' | 'admin' | 'service' | 'category';

export default function AdminPerformancePage({csrfLoading}: CsrfLoadingProps) {
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');
  const [scopeType, setScopeType] = useState<ScopeType>('all');
  const [scopeValue, setScopeValue] = useState<string>('');
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#38BDF8'];

  useEffect(() => {
    if (csrfLoading) fetchPerformance();
  }, [scopeType, scopeValue, csrfLoading]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {};
      if (scopeType !== 'all') {
        filters[`${scopeType}_id`] = scopeValue;
      }
      const response = await adminPerformanceService.getPerformance(filters);
      setPerformance(response.data);
    } catch (err: any) {
      setError((await decodeErrorResponse(err)) || 'Gagal memuat data performa');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (scopeType !== 'all') {
        filters[`${scopeType}_id`] = scopeValue;
      }
      const response = await adminPerformanceService.exportPerformance(exportFormat, filters);
      
      const blob = new Blob([response.data], {
        type: exportFormat === 'csv' ? 'text/csv' : 'application/vnd.ms-excel'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `performance_${new Date().toISOString().split('T')[0]}.${exportFormat === 'csv' ? 'csv' : 'xlsx'}`;
      link.click();
    } catch (err: any) {
      setError((await decodeErrorResponse(err)) || 'Gagal mengunduh file');
    } finally {
      setLoading(false);
    }
  };

  if (error || !performance) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-600">{error || 'Data tidak ditemukan'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analisis Performa</h1>
        <p className="mt-2 text-gray-600">Pantau metrik performa sistem dan kinerja admin.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Cakupan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Cakupan</label>
            <select
              value={scopeType}
              onChange={(e) => {
                setScopeType(e.target.value as ScopeType);
                setScopeValue('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Semua</option>
              <option value="admin">Berdasarkan Admin</option>
              <option value="service">Berdasarkan Layanan</option>
              <option value="category">Berdasarkan Kategori</option>
            </select>
          </div>

          {scopeType !== 'all' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih {scopeType === 'admin' ? 'Admin' : scopeType === 'service' ? 'Layanan' : 'Kategori'}</label>
              <input
                type="text"
                value={scopeValue}
                onChange={(e) => setScopeValue(e.target.value)}
                placeholder="ID atau nama"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          <div className="flex items-end gap-2">
            <button
              onClick={fetchPerformance}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Terapkan Filter
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <p className="text-sm font-medium text-gray-500">Total Laporan</p>
          {loading ? (
            <Skeleton className="h-10 w-24 mt-2" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-blue-600">{performance.totalReports}</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl shadow border">
          <p className="text-sm font-medium text-gray-500">Waktu Penyelesaian Rata-rata</p>
          {loading ? (
            <Skeleton className="h-10 w-24 mt-2" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-green-600">{performance.avgResolutionTime} jam</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl shadow border">
          <p className="text-sm font-medium text-gray-500">Tingkat Penyelesaian</p>
          {loading ? (
            <Skeleton className="h-10 w-24 mt-2" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-cyan-600">{performance.completionRate}%</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tren Penyelesaian Laporan</h3>
          {loading ? (
            <SkeletonChart />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performance.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="pending" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribusi Layanan</h3>
          {loading ? (
            <SkeletonChart />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={performance.serviceBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {performance.serviceBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Kinerja Admin</h3>
        {loading ? (
          <SkeletonChart />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performance.adminPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10B981" />
              <Bar dataKey="pending" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Masalah Teratas</h3>
          <div className="space-y-3">
            {performance.topIssues.map((issue, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{issue.name}</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {issue.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status SLA</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Tepat Waktu', value: performance.slaStatus.onTime },
                  { name: 'Terlamabat', value: performance.slaStatus.breached }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#10B981" />
                <Cell fill="#EF4444" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ekspor Data</h3>
        <div className="flex gap-4">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'csv' | 'xlsx')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="csv">CSV</option>
            <option value="xlsx">Excel</option>
          </select>
          <button
            onClick={handleExport}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Mengunduh...' : 'Unduh Laporan'}
          </button>
        </div>
      </div>
    </div>
  );
}
