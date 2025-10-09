import React from 'react';

export default function DayCarouselSkeleton() {
  return (
    <div className="space-y-6">
      {/* Day Carousel Skeleton */}
      <div className="bg-white rounded-lg shadow-lg p-4 animate-pulse">
        <div className="flex items-center gap-2">
          {/* Arrow placeholder */}
          <div className="w-9 h-9 bg-gray-200 rounded-lg flex-shrink-0 hidden sm:block" />
          
          {/* Day pills */}
          <div className="flex gap-3 overflow-hidden flex-1">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex-shrink-0">
                <div className="w-24 h-16 bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
          
          {/* Arrow placeholder */}
          <div className="w-9 h-9 bg-gray-200 rounded-lg flex-shrink-0 hidden sm:block" />
        </div>
        
        {/* Load more button skeleton */}
        <div className="w-full h-10 bg-gray-200 rounded-lg mt-4" />
      </div>

      {/* Time Grid Skeleton */}
      <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
        <div className="h-7 bg-gray-200 rounded w-64 mb-6" />
        
        {/* Morning section */}
        <div className="mb-6">
          <div className="h-5 bg-gray-200 rounded w-24 mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-14 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
        
        {/* Afternoon section */}
        <div>
          <div className="h-5 bg-gray-200 rounded w-24 mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-14 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

