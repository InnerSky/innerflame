import { useState, useEffect } from "react";
import { AnimatedSection } from "@/components/animated-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Search,
  TrendingUp,
  Filter,
  ChevronDown,
  X
} from "lucide-react";
import { getArticles } from "@/lib/api";
import type { Article } from "@/lib/api";
import { ArticleCard } from "@/components/article-card";

const categories = [
  "All",
  "Mental Resilience",
  "Leadership",
  "Productivity",
  "Work-Life Balance",
  "Team Building",
  "Growth"
];

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const data = await getArticles();
        setArticles(data);
      } catch (error) {
        console.error('Error loading articles:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, []);

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === "All" || 
      (article.id_categories_array && article.id_categories_array.includes(selectedCategory));
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesCategory && matchesSearch;
  });

  const trendingArticles = filteredArticles.slice(0, 3);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-50 via-white to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900">
      {/* Hero Section */}
      <section className="relative pt-8 pb-2 sm:py-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent"></div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AnimatedSection className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">Latest Insights</h1>
            <p className="mt-3 text-muted-foreground">
              Discover articles that will help you grow as a founder
            </p>
          </AnimatedSection>

          {/* Search and Filters */}
          <AnimatedSection className="mt-6 sm:mt-8" delay={200}>
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full sm:w-auto"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
                {searchQuery && (
                  <Button
                    variant="ghost"
                    onClick={() => setSearchQuery("")}
                    className="px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Category Filters */}
            <div className={`mt-3 flex flex-wrap gap-2 justify-center transition-all duration-300 ${showFilters ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className="text-sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-1 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Trending Articles */}
          <AnimatedSection className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <h2 className="text-xl sm:text-2xl font-semibold">Trending Now</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trendingArticles.map(article => (
                <AnimatedSection key={article.id}>
                  <ArticleCard article={article} />
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>

          <Separator className="my-8" />

          {/* All Articles */}
          <AnimatedSection>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl sm:text-2xl font-semibold">All Articles</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {filteredArticles.length} articles
              </p>
            </div>
            {loading ? (
              <div className="text-center py-12">Loading articles...</div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map(article => (
                  <AnimatedSection key={article.id}>
                    <ArticleCard article={article} />
                  </AnimatedSection>
                ))}
              </div>
            )}
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}