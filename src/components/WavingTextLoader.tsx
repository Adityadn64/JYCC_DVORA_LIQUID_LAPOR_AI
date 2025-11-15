// src/components/WavingTextLoader.tsx

import React from 'react';

const WavingTextLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-700 waving-text-loader">
          {/* Setiap karakter dibungkus span agar bisa dianimasikan satu per satu */}
          <span>L</span>
          <span>o</span>
          <span>a</span>
          <span>d</span>
          <span>i</span>
          <span>n</span>
          <span>g</span>
          <span>.</span>
          <span>.</span>
          <span>.</span>
          <span> </span>
        </h2>
      </div>
    </div>
  );
};

export default WavingTextLoader;