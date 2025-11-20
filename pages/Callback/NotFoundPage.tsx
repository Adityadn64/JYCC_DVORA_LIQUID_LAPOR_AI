import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="text-center">
        <br /> <br />

        <p className="text-4xl font-bold text-blue-600">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Halaman tidak ditemukan
        </h1>
        <p className="mt-6 text-base leading-7 text-gray-600">
            Maaf, kami tidak dapat menemukan halaman yang Anda cari.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
                to="/"
                className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
                Kembali ke Beranda
            </Link>
        </div>
    </div>
  );
}
