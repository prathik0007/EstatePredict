const BACKEND_BASE_URL = 'https://rental-price-prediction-1ez4.onrender.com';

/**
 * Resolves a property image URL to a fully-qualified URL.
 * Supports:
 * - Cloudinary CDN URLs (https://res.cloudinary.com/...)
 * - External URLs (Unsplash, etc.)
 * - Legacy local uploads (/uploads/...) with backend fallback
 */
export const getPropertyImageUrl = (imagePath, fallback = '/datasets-images/image_0.jpg') => {
  if (!imagePath || typeof imagePath !== 'string') {
    return fallback;
  }

  // If already absolute URL (Cloudinary, Unsplash, etc.)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If legacy relative /uploads/ path on deployed frontend, point to Render backend
  if (imagePath.startsWith('/uploads')) {
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '');
    
    if (isLocalhost) {
      return imagePath; // Handled by Vite proxy
    }
    return `${BACKEND_BASE_URL}${imagePath}`;
  }

  return imagePath;
};

