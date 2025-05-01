import React from 'react';
import useSEO, { SEOProps } from '@/hooks/useSEO.js';

/**
 * SEO component for managing all document head metadata
 * 
 * Usage example:
 * <SEO 
 *   title="Page Title" 
 *   description="Page description" 
 *   image="/images/OpenGraphImage.png" 
 * />
 */
export const SEO: React.FC<SEOProps> = ({ 
  title,
  description,
  image = '/images/OpenGraphImage.png',
  url,
  type = 'website',
  twitterCard = 'summary_large_image'
}) => {
  // Use the custom SEO hook to update metadata
  useSEO({ title, description, image, url, type, twitterCard });
  
  // This component doesn't render anything visible
  return null;
};

export default SEO; 