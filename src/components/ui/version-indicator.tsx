import React from 'react';
import { getVersionInfo } from '@/lib/version';

export function VersionIndicator() {
  const versionInfo = getVersionInfo();
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
      <div className="text-xs font-medium">
        <span className="text-gray-600">v{versionInfo.version}</span>
        <span className="mx-1.5 text-gray-400">•</span>
        <span className="text-gray-500">{versionInfo.environment}</span>
      </div>
    </div>
  );
} 