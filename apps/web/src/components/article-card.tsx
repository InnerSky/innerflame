import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ArrowUpRight } from "lucide-react";
import type { Article } from "@/lib/api";

interface ArticleCardProps {
  article: Article;
  variant?: "default" | "compact";
  className?: string;
}

export function ArticleCard({ article, variant = "default", className = "" }: ArticleCardProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.read-more-btn')) {
      e.preventDefault();
      return;
    }
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
      <div className="aspect-video overflow-hidden bg-orange-100 dark:bg-orange-900/30">
        {article.image_url ? (
          <img 
            src={article.image_url} 
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30" />
        )}
      </div>
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {article.id_categories_array?.map((category) => (
            <Badge 
              key={category}
              variant="secondary" 
              className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
            >
              {category}
            </Badge>
          ))}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            {article.x_min_read || '5'} min read
          </div>
        </div>
        <h3 className={`mt-4 font-semibold leading-tight transition-colors group-hover:text-orange-500 ${
          variant === "compact" ? "text-base" : "text-base sm:text-xl"
        }`}>
          {article.title}
        </h3>
        {variant === "default" && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {article.excerpt || contentPreview}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {new Date(article.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
          <Link to={`/article/${article.slug}`} className="read-more-btn">
            <Button variant="ghost" size="sm" className="group/btn">
              Read more
              <ArrowUpRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}