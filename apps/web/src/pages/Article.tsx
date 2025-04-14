import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatedSection } from "@/components/animated-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Clock,
  Share2,
  BookmarkPlus,
  ChevronLeft,
  BookOpen,
  Calendar,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getArticleBySlug, getArticles } from "@/lib/api";
import type { Article } from "@/lib/api";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ArticleCard } from "@/components/article-card";

export default function Article() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!slug) return;
        const [articleData, allArticles] = await Promise.all([
          getArticleBySlug(slug),
          getArticles()
        ]);
        
        if (!articleData) {
          throw new Error('Article not found');
        }

        console.log('Article data:', articleData);
        setArticle(articleData);
        
        const related = allArticles
          .filter(a => a.id !== articleData.id)
          .filter(a => {
            return a.id_categories_array?.some(cat => 
              articleData.id_categories_array?.includes(cat)
            );
          })
          .slice(0, 3);
        
        setRelatedArticles(related);
      } catch (error) {
        console.error('Error loading article:', error);
        setError(error instanceof Error ? error.message : 'Failed to load article');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slug, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  const ArticleActions = () => (
    <>
      {/* Desktop Actions */}
      <div className="hidden sm:flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className={`group ${isBookmarked ? 'text-orange-500' : ''}`}
          onClick={() => setIsBookmarked(!isBookmarked)}
        >
          <BookmarkPlus className={`mr-2 h-4 w-4 transition-transform group-hover:scale-110 ${
            isBookmarked ? 'fill-orange-500' : ''
          }`} />
          Save for later
        </Button>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="group"
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
            Share
          </Button>
          {showShareTooltip && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded bg-neutral-900 px-2 py-1 text-xs text-white dark:bg-white dark:text-neutral-900">
              Copied!
            </div>
          )}
        </div>
      </div>

      {/* Mobile Actions */}
      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => setIsBookmarked(!isBookmarked)}>
              <BookmarkPlus className={`mr-2 h-4 w-4 ${isBookmarked ? 'text-orange-500' : ''}`} />
              Save for later
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading article...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-lg text-red-500">{error}</div>
        <Button onClick={() => navigate('/articles')}>
          Return to Articles
        </Button>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-lg">Article not found</div>
        <Button onClick={() => navigate('/articles')}>
          Return to Articles
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-50 via-white to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900">
      {/* Hero Section */}
      <section className="relative py-6 sm:py-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent"></div>
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <AnimatedSection>
            <Button
              variant="ghost"
              className="group mb-6"
              onClick={() => navigate('/articles')}
            >
              <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Articles
            </Button>

            <div className="flex flex-wrap gap-2">
              {article.id_categories_array?.map((category) => (
                <Badge 
                  key={category}
                  variant="secondary" 
                  className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                >
                  {category}
                </Badge>
              ))}
            </div>
            
            <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="mt-4 text-lg text-muted-foreground">
                {article.excerpt}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(article.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {article.x_min_read || '5'} min read
                </div>
              </div>
              <ArticleActions />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Featured Image */}
      {article.image_url && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <AnimatedSection>
            <div className="overflow-hidden rounded-lg">
              <img 
                src={article.image_url} 
                alt={article.title}
                className="w-full"
              />
            </div>
          </AnimatedSection>
        </div>
      )}

      {/* Main Content */}
      <section className="py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <AnimatedSection immediate={true}>
            <Separator className="mb-8" />
            <MarkdownRenderer content={article.content} />
          </AnimatedSection>
        </div>
      </section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="py-12 sm:py-16 bg-orange-50/50 dark:bg-neutral-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <AnimatedSection>
              <div className="flex items-center gap-2 mb-8">
                <BookOpen className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl sm:text-2xl font-semibold">Related Articles</h2>
              </div>
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
                {relatedArticles.map((relatedArticle) => (
                  <div key={relatedArticle.id} className="mb-6 break-inside-avoid">
                    <AnimatedSection>
                      <ArticleCard 
                        article={relatedArticle} 
                        variant="compact"
                      />
                    </AnimatedSection>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}
    </div>
  );
}