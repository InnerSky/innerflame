# SEO Component for InnerFlame

This document explains how to use the custom SEO component to manage dynamic title and meta tags throughout the InnerFlame application.

## Overview

We've implemented a lightweight, dependency-free approach to SEO management that:

1. Dynamically updates the document title
2. Sets appropriate meta description
3. Updates Open Graph meta tags for social sharing
4. Updates Twitter Card meta tags
5. Handles both absolute and relative image paths

## Basic Usage

Import and add the SEO component at the top level of your page component:

```tsx
import { SEO } from "@/components/SEO";

export default function YourPage() {
  return (
    <>
      <SEO 
        title="Your Page Title"
        description="A detailed description of your page content"
        image="/images/your-image.png" // Optional
      />
      
      {/* Rest of your page content */}
    </>
  );
}
```

## Props

The SEO component accepts the following props:

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `title` | string | Page title (will be appended with " \| InnerFlame") | - |
| `description` | string | Meta description for search engines and social sharing | - |
| `image` | string | Image URL for social sharing | `/images/OpenGraphImage.png` |
| `url` | string | Canonical URL for the page | Current URL |
| `type` | string | Content type for Open Graph | `"website"` |
| `twitterCard` | string | Twitter card type | `"summary_large_image"` |

## Dynamic Content

For pages with dynamic content (like article pages), conditionally render the SEO component once your data is loaded:

```tsx
export default function ArticlePage() {
  const [article, setArticle] = useState(null);
  
  // Fetch article data...
  
  return (
    <>
      {article && (
        <SEO
          title={article.title}
          description={article.excerpt || `${article.title} - Read the full article on InnerFlame`}
          image={article.image_url || '/images/OpenGraphImage.png'}
          type="article"
        />
      )}
      
      {/* Rest of the article page */}
    </>
  );
}
```

## Best Practices

1. **Titles**: Keep them under 60 characters for optimal display in search results
2. **Descriptions**: Aim for 150-160 characters to avoid truncation in search results
3. **Images**: Use high-quality images at least 1200×630 pixels for optimal social sharing display
4. **Default SEO**: The app already has default SEO in App.tsx, but you should override it with page-specific content

## Implementation Details

The SEO component uses the browser's native Document API to:
1. Set the document title
2. Update or create meta tags in the document head
3. Handle proper formatting of absolute/relative image URLs

This approach avoids external dependencies while providing full SEO functionality.

## Future Enhancements

As the application grows, you might consider:

1. Implementing a more structured approach with dedicated route-based SEO configuration
2. Adding canonical URL management
3. Integrating with analytics tools to track page views
4. Adding schema.org structured data for rich results in search engines

For these more advanced features, you could consider integrating a library like `react-helmet-async` in the future. 