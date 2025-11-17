export interface CsrfLoadingProps {
  csrfLoading: boolean;
}

export interface ResponseData {
  d: string;
}

export interface SuccessResultResponseData {
  data: Array<any>;
  message: string;
  statusCode: number;
}

export interface ErrorResultResponseData {
  message: string;
  statusCode: number;
  errors: Array<any>;
}

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  profile_picture_path?: string;
}

export interface PaginationInfo {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

export const DOTS = '...';

export const generatePaginationItems = (currentPage, totalPages, siblingCount = 1) => {
  // Jumlah total item yang akan ditampilkan di pagination (angka + elipsis)
  // siblingCount + firstPage + lastPage + currentPage + 2*DOTS
  const totalPageNumbers = siblingCount + 5;

  // Kasus 1: Jika total halaman lebih sedikit dari angka yang ingin kita tampilkan,
  // tampilkan saja semua halaman tanpa elipsis.
  if (totalPageNumbers >= totalPages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  // Tentukan kapan harus menampilkan elipsis
  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  // Kasus 2: Hanya tampilkan elipsis di kanan
  if (!shouldShowLeftDots && shouldShowRightDots) {
    let leftItemCount = 3 + 2 * siblingCount;
    let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, DOTS, totalPages];
  }

  // Kasus 3: Hanya tampilkan elipsis di kiri
  if (shouldShowLeftDots && !shouldShowRightDots) {
    let rightItemCount = 3 + 2 * siblingCount;
    let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
    return [firstPageIndex, DOTS, ...rightRange];
  }

  // Kasus 4: Tampilkan elipsis di kedua sisi
  if (shouldShowLeftDots && shouldShowRightDots) {
    let middleRange = [];
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      middleRange.push(i);
    }
    return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
  }

  // Fallback (seharusnya tidak pernah terjadi dengan logika di atas)
  return [];
};