// Auth Token Management
export const authTokens = {
  set: (token: string) => {
    localStorage.setItem('auth_token', token);
    sessionStorage.setItem('auth_token', token);
  },
  
  get: () => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  },
  
  remove: () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  },
  
  exists: () => {
    return !!(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'));
  }
};

// User Data Management
export const userData = {
  set: (data: any) => {
    localStorage.setItem('user_data', JSON.stringify(data));
  },
  
  get: () => {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  },
  
  remove: () => {
    localStorage.removeItem('user_data');
  }
};

// Date formatting
export const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

// Relative time (e.g., "2 hours ago")
export const diffForHumans = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' tahun lalu';

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' bulan lalu';

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' hari lalu';

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' jam lalu';

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' menit lalu';

  return Math.floor(seconds) + ' detik lalu';
};

// Text truncation
export const truncate = (text: string, length: number = 100): string => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};
