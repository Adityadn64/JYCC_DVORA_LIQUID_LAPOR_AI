import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAnalyticsService } from '../services/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  SkeletonStatsGrid, 
  SkeletonChart, 
  SkeletonFilterSection, 
  SkeletonTable, 
  SkeletonInsightsGrid,
  SkeletonExportSection,
  Skeleton
} from '../components/SkeletonLoading';

interface AnalyticsData {
  kpiStats: {
    totalReports: number;
    pendingReports: number;
    processReports: number;
    finishedReports: number;
    rejectedReports: number;
  };
  trendData: Array<{
    date: string;
    completed: number;
    pending: number;
  }>;
  distributionData: Array<{
    name: string;
    value: number;
  }>;
  adminPerformance: Array<{
    name: string;
    count: number;
  }>;
  dinasPerformance: Array<{
    name: string;
    count: number;
  }>;
  categoryAnalysis: Array<{
    name: string;
    count: number;
  }>;
  locationAnalysis: Array<{
    name: string;
    count: number;
  }>;
  insights: {
    topCategory: string;
    topLocation: string;
    avgResolutionTime: number;
    completionRate: number;
  };
  reports: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function AdminAnalyticsPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [serviceCode, setServiceCode] = useState('');
  const [priority, setPriority] = useState('');
  const [location, setLocation] = useState('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAnalyticsService.getAnalytics(filters);
      setAnalytics(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    const filters: any = {};
    if (dateStart) filters.date_start = dateStart;
    if (dateEnd) filters.date_end = dateEnd;
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (serviceCode) filters.service_code = serviceCode;
    if (priority) filters.priority = priority;
    if (location) filters.location = location;
    
    fetchAnalytics(filters);
  };

  const handleExport = async () => {
    try {
      const filters: any = {};
      if (dateStart) filters.date_start = dateStart;
      if (dateEnd) filters.date_end = dateEnd;
      if (category) filters.category = category;
      if (status) filters.status = status;
      if (serviceCode) filters.service_code = serviceCode;
      if (priority) filters.priority = priority;
      if (location) filters.location = location;
      
      const response = await adminAnalyticsService.exportAnalytics(exportFormat, filters);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.parentElement?.removeChild(link);
    } catch (err: any) {
      setError('Failed to export analytics');
      console.error('Export error:', err);
    }
  };

  const handleReset = () => {
    setDateStart('');
    setDateEnd('');
    setCategory('');
    setStatus('');
    setServiceCode('');
    setPriority('');
    setLocation('');
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 w-48 rounded"></div>
            <div className="h-4 bg-gray-200 w-64 rounded"></div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          <SkeletonStatsGrid count={5} />
          
          <SkeletonFilterSection />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SkeletonChart />
            <SkeletonChart />
            <SkeletonChart />
            <SkeletonChart />
          </div>

          <SkeletonInsightsGrid count={4} />

          <SkeletonExportSection />

          <SkeletonTable rows={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button onClick={() => fetchAnalytics()} className="mt-2 bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
              <p className="mt-1 text-gray-600">Detailed analytics and insights of all reports</p>
            </div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm font-medium">Total Reports</p>
            {loading ? (
              <Skeleton className="h-10 w-24 mt-2" />
            ) : (
              <p className="text-3xl font-bold text-blue-600 mt-2">{analytics.kpiStats.totalReports}</p>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm font-medium">Pending</p>
            {loading ? (
              <Skeleton className="h-10 w-24 mt-2" />
            ) : (
              <p className="text-3xl font-bold text-yellow-600 mt-2">{analytics.kpiStats.pendingReports}</p>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm font-medium">In Progress</p>
            {loading ? (
              <Skeleton className="h-10 w-24 mt-2" />
            ) : (
              <p className="text-3xl font-bold text-blue-400 mt-2">{analytics.kpiStats.processReports}</p>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm font-medium">Completed</p>
            {loading ? (
              <Skeleton className="h-10 w-24 mt-2" />
            ) : (
              <p className="text-3xl font-bold text-green-600 mt-2">{analytics.kpiStats.finishedReports}</p>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm font-medium">Rejected</p>
            {loading ? (
              <Skeleton className="h-10 w-24 mt-2" />
            ) : (
              <p className="text-3xl font-bold text-red-600 mt-2">{analytics.kpiStats.rejectedReports}</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                placeholder="Search category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="process">In Progress</option>
                <option value="finished">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                placeholder="Search location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <button
              onClick={handleFilter}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Apply Filters
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Report Trend</h3>
            {loading ? (
              <SkeletonChart />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" />
                  <Line type="monotone" dataKey="pending" stroke="#f59e0b" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Service Distribution</h3>
            {loading ? (
              <SkeletonChart />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Admin Performance</h3>
            {loading ? (
              <SkeletonChart />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.adminPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Category Analysis</h3>
            {loading ? (
              <SkeletonChart />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.categoryAnalysis}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.categoryAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium opacity-90">Top Category</p>
            {loading ? (
              <Skeleton className="h-8 w-32 mt-2 bg-blue-400" />
            ) : (
              <p className="text-2xl font-bold mt-2">{analytics.insights.topCategory}</p>
            )}
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium opacity-90">Top Location</p>
            {loading ? (
              <Skeleton className="h-8 w-32 mt-2 bg-green-400" />
            ) : (
              <p className="text-2xl font-bold mt-2">{analytics.insights.topLocation}</p>
            )}
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium opacity-90">Avg Resolution Time</p>
            {loading ? (
              <Skeleton className="h-8 w-32 mt-2 bg-yellow-400" />
            ) : (
              <p className="text-2xl font-bold mt-2">{analytics.insights.avgResolutionTime} hours</p>
            )}
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium opacity-90">Completion Rate</p>
            {loading ? (
              <Skeleton className="h-8 w-32 mt-2 bg-purple-400" />
            ) : (
              <p className="text-2xl font-bold mt-2">{analytics.insights.completionRate}%</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Export Report</h3>
          <div className="flex gap-2 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'csv' | 'xlsx')}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="csv">CSV</option>
                <option value="xlsx">Excel (XLSX)</option>
              </select>
            </div>
            <button
              onClick={handleExport}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Export
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Reports</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">ID</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">Title</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">Category</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">Status</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">Priority</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-2"><Skeleton className="h-4 w-8" /></td>
                      <td className="px-4 py-2"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-2"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-2"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-2"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-2"><Skeleton className="h-4 w-24" /></td>
                    </tr>
                  ))
                ) : (
                  analytics.reports.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-600">{report.id}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{report.title}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{report.category}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-white text-xs font-medium ${
                          report.status === 'pending' ? 'bg-yellow-500' :
                          report.status === 'process' ? 'bg-blue-500' :
                          report.status === 'finished' ? 'bg-green-500' :
                          'bg-red-500'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-white text-xs font-medium ${
                          report.priority === 'low' ? 'bg-green-500' :
                          report.priority === 'medium' ? 'bg-yellow-500' :
                          report.priority === 'high' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}>
                          {report.priority}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">{new Date(report.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
