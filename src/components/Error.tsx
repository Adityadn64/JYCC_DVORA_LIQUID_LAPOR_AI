export function errorDiv(error: string) {
    return (
      <div className="flex justify-center items-center">
        <p className="text-red-600 bg-red-100 p-4 rounded-lg shadow-md">
          {error}
        </p>
      </div>
    );
}