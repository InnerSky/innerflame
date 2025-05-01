import { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  twitterCard?: string;
}

/**
 * Custom hook to dynamically update document head metadata
 * @param props SEO properties to update
 */
export const useSEO = ({
  title,
  description,
  image,
  url,
  type = 'website',
  twitterCard = 'summary_large_image'
}: SEOProps) => {
  useEffect(() => {
    // Update the document title
    if (title) {
      document.title = `${title} | InnerFlame`;
    }

    // Get current URL if not provided
    const currentUrl = url || window.location.href;

    // Update meta description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);
    }

    // Update Open Graph data
    const updateMetaTag = (property: string, content?: string) => {
      if (!content) return;
      
      let metaTag = document.querySelector(`meta[property="${property}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('property', property);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    };

    // Open Graph meta tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:url', currentUrl);
    updateMetaTag('og:type', type);
    
    if (image) {
      // If image is a relative path, make it absolute
      const absoluteImage = image.startsWith('http') 
        ? image 
        : `${window.location.origin}${image.startsWith('/') ? '' : '/'}${image}`;
      updateMetaTag('og:image', absoluteImage);
      // Add standard image dimensions for better social media sharing
      updateMetaTag('og:image:width', '1200');
      updateMetaTag('og:image:height', '630');
    }

    // Twitter Card meta tags
    const updateTwitterTag = (name: string, content?: string) => {
      if (!content) return;
      
      let metaTag = document.querySelector(`meta[name="${name}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', name);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    };

    updateTwitterTag('twitter:card', twitterCard);
    updateTwitterTag('twitter:title', title);
    updateTwitterTag('twitter:description', description);
    
    if (image) {
      const absoluteImage = image.startsWith('http') 
        ? image 
        : `${window.location.origin}${image.startsWith('/') ? '' : '/'}${image}`;
      updateTwitterTag('twitter:image', absoluteImage);
    }
    
    // Cleanup is not necessary as the tags will be updated when the component using this hook unmounts
    // and another component using this hook mounts
    
  }, [title, description, image, url, type, twitterCard]);
};

export default useSEO; 