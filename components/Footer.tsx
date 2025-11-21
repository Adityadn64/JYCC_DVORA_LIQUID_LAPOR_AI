export default function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} Lapor.ai. Didukung oleh Teknologi
          Cerdas untuk Pelayanan Publik Jawa Timur.
        </p>
      </div>
    </footer>
  );
}
