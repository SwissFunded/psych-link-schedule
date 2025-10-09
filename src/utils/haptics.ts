// Haptic feedback utilities for mobile devices
// Provides tactile feedback on user interactions

export const hapticFeedback = {
  // Light tap - for selections
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  
  // Medium tap - for confirmations
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  
  // Strong tap - for important actions (booking confirmation)
  strong: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]);
    }
  },
  
  // Error - for validation failures
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]);
    }
  },
  
  // Success - for successful completion
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 10, 20, 10, 40]);
    }
  }
};

