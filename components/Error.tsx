export const errorMessage = (error: string) => {
  return (
    <div className="flex justify-center items-center">
      <p className="text-red-600 bg-red-100 p-4 rounded-lg shadow-md">
        {error}
      </p>
    </div>
  );
};

export const errorMessages = (error: string[] | null) => {
  if (!error) return null;
  return (
    <div
      className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md"
      role="alert"
    >
      <p className="font-bold">Terjadi Kesalahan</p>
      {Array.isArray(error) ? (
        <ul className="mt-2 list-disc list-inside">
          {error.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      ) : (
        <p>{error}</p>
      )}
    </div>
  );
};
