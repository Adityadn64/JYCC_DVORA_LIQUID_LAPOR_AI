import { allService } from "../services/api";

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
  service_code: string;
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

export const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

export const DOTS = "...";

export const generatePaginationItems = (
  currentPage: number,
  totalPages: number,
  siblingCount = 1
) => {
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
    let rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    );
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

export const generateVideoThumbnail = (
  videoSource: Blob | string,
  seekTo: number = 0.5
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.style.display = "none";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous"; // Penting jika URL dari domain berbeda
    document.body.appendChild(video);

    let videoUrl: string;
    let isCreatedUrl = false;

    // LOGIKA UTAMA PERBAIKAN:
    if (typeof videoSource === "string") {
      // Jika input sudah berupa URL (contoh: blob:http://...), gunakan langsung
      videoUrl = videoSource;
    } else {
      // Jika input berupa Blob, buat URL baru
      videoUrl = URL.createObjectURL(videoSource);
      isCreatedUrl = true;
    }

    video.src = videoUrl;

    // Fungsi cleanup
    const cleanup = () => {
      // Hanya revoke jika KITA yang membuat URL-nya di fungsi ini.
      // Jika URL dari luar (fetchReport), jangan revoke di sini karena masih dipakai di UI.
      if (isCreatedUrl) {
        URL.revokeObjectURL(videoUrl);
      }

      if (document.body.contains(video)) {
        document.body.removeChild(video);
      }
    };

    video.addEventListener("loadedmetadata", () => {
      if (video.duration < seekTo) {
        cleanup();
        reject("Video is too short to seek to the specified time.");
        return;
      }
      video.currentTime = seekTo;
    });

    video.addEventListener("seeked", () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        cleanup();
        reject("Could not get 2d context from canvas");
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (thumbnailBlob) => {
          if (!thumbnailBlob) {
            cleanup();
            reject("Failed to generate thumbnail blob");
            return;
          }

          try {
            // URL Thumbnail ini harus di-revoke manual nanti oleh component
            const thumbnailImageUrl = URL.createObjectURL(thumbnailBlob);
            cleanup();
            resolve(thumbnailImageUrl);
          } catch (error) {
            cleanup();
            reject(error);
          }
        },
        "image/jpeg",
        0.9
      );
    });

    video.addEventListener("error", (err) => {
      cleanup();
      reject("Error loading video file for thumbnail generation.");
    });
  });
};

export const processFiles = async (filesPath: string[] = []) => {
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
  return {
    files_path: filesPath,
    files_url: urls,
    content_type: types,
    thumbnails: thumbs,
  };
};