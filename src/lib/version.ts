// This version is auto-updated during builds
export const APP_VERSION = '0.2.0';

// Get the current environment
export const getEnvironment = () => {
  return import.meta.env.MODE || 'development';
};

// Get the full version info
export const getVersionInfo = () => {
  return {
    version: APP_VERSION,
    environment: getEnvironment(),
    buildTime: new Date().toISOString(),
  };
}; 