import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import type { Article } from "@/lib/api";

interface ArticleCardProps {
  article: Article;
  variant?: "default" | "compact";
  className?: string;
}

export function ArticleCard({ article, variant = "default", className = "" }: ArticleCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/article/${article.slug}`);
  };

  // Strip markdown formatting for content preview
  const stripMarkdown = (text: string) => {
    return text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/[#*`_~]/g, '') // Remove markdown symbols
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
  };

  const contentPreview = article.content ? stripMarkdown(article.content) : '';

  return (
    <Card 
      onClick={handleClick}
      className={`group cursor-pointer overflow-hidden border-none bg-background transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-500/5 ${className}`}
    >
      <div className="overflow-hidden bg-orange-100 dark:bg-orange-900/30">
        {article.image_url ? (
          <img 
            src={article.image_url} 
            alt={article.title}
            className="w-full transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="aspect-video w-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30" />
        )}
      </div>
      <div className="p-4 sm:p-6">
        <h3 className={`font-semibold leading-tight transition-colors group-hover:text-orange-500 ${
          variant === "compact" ? "text-base" : "text-base sm:text-xl"
        }`}>
          {article.title}
        </h3>
        {variant === "default" && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {article.excerpt || contentPreview}
          </p>
        )}
      </div>
    </Card>
  );
}