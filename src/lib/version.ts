
// This version is auto-updated during builds
export const APP_VERSION = import.meta.env.APP_VERSION || '0.2.0';

// Get the current environment
export const getEnvironment = () => {
  return import.meta.env.MODE || 'development';
};

// Get the build time
export const getBuildTime = () => {
  return import.meta.env.BUILD_TIME || new Date().toISOString();
};

// Get the full version info
export const getVersionInfo = () => {
  return {
    version: APP_VERSION,
    environment: getEnvironment(),
    buildTime: getBuildTime(),
  };
}; 
