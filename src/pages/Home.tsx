import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Flame, 
  Sparkles, 
  Brain, 
  Heart, 
  Coffee, 
  ArrowRight, 
  Star, 
  Users, 
  Trophy, 
  BookOpen,
  Quote,
  ArrowUpRight
} from "lucide-react";
import { AnimatedSection } from "@/components/animated-section";
import { ArticleCard } from "@/components/article-card";
import { getArticles } from "@/lib/api";
import type { Article } from "@/lib/api";

export default function Home() {
  const [email, setEmail] = useState("");
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedArticles() {
      try {
        const articles = await getArticles();
        // Get the first 3 articles as featured
        setFeaturedArticles(articles.slice(0, 3));
      } catch (error) {
        console.error('Error loading featured articles:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedArticles();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Subscribed:", email);
    setEmail("");
  };

  return (
    <main className="pt-4 sm:pt-0">
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <svg className="absolute h-full w-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" className="animate-gradient-shift-1">
                  <animate attributeName="stop-color" 
                    values="#fb923c;#f97316;#fb923c" 
                    dur="4s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" className="animate-gradient-shift-2">
                  <animate attributeName="stop-color" 
                    values="#f97316;#fb923c;#f97316" 
                    dur="4s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" className="animate-gradient-shift-3">
                  <animate attributeName="stop-color" 
                    values="#fdba74;#fb923c;#fdba74" 
                    dur="4s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" className="animate-gradient-shift-4">
                  <animate attributeName="stop-color" 
                    values="#fb923c;#fdba74;#fb923c" 
                    dur="4s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
              <filter id="goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                <feColorMatrix in="blur" mode="matrix" 
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
                <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
              </filter>
            </defs>
            <g filter="url(#goo)">
              <circle cx="30%" cy="30%" r="15%" fill="url(#grad1)" className="animate-blob">
                <animate attributeName="cx" values="30%;40%;30%" dur="10s" repeatCount="indefinite" />
                <animate attributeName="cy" values="30%;40%;30%" dur="10s" repeatCount="indefinite" />
              </circle>
              <circle cx="70%" cy="70%" r="15%" fill="url(#grad2)" className="animate-blob">
                <animate attributeName="cx" values="70%;60%;70%" dur="10s" repeatCount="indefinite" />
                <animate attributeName="cy" values="70%;60%;70%" dur="10s" repeatCount="indefinite" />
              </circle>
              <circle cx="30%" cy="70%" r="15%" fill="url(#grad1)" className="animate-blob">
                <animate attributeName="cx" values="30%;40%;30%" dur="10s" repeatCount="indefinite" />
                <animate attributeName="cy" values="70%;60%;70%" dur="10s" repeatCount="indefinite" />
              </circle>
              <circle cx="70%" cy="30%" r="15%" fill="url(#grad2)" className="animate-blob">
                <animate attributeName="cx" values="70%;60%;70%" dur="10s" repeatCount="indefinite" />
                <animate attributeName="cy" values="30%;40%;30%" dur="10s" repeatCount="indefinite" />
              </circle>
            </g>
          </svg>
          <div className="absolute inset-0 bg-white/50 backdrop-blur-3xl dark:bg-neutral-900/50"></div>
        </div>
        
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1.5 sm:px-4 sm:py-2 dark:bg-orange-900/30">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 animate-[pulse_3s_ease-in-out_infinite] text-orange-500" />
            <span className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400">For Early-Stage Founders</span>
          </div>
          
          <h1 className="mt-6 sm:mt-8 text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight tracking-tight">
            Ignite Your
            <span className="relative mx-2 inline-block">
              <span className="relative z-10 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text px-2 text-transparent">
                Inner Flame
              </span>
              <svg className="absolute -bottom-1 sm:-bottom-2 left-0 -z-0 h-2 sm:h-3 w-full text-orange-500/30" viewBox="0 0 100 12" preserveAspectRatio="none">
                <path d="M0,0 Q50,12 100,0" stroke="currentColor" strokeWidth="8" fill="none">
                  <animate attributeName="d" dur="4s" repeatCount="indefinite"
                    values="M0,0 Q50,12 100,0;M0,0 Q50,8 100,0;M0,0 Q50,12 100,0" />
                </path>
              </svg>
            </span>
          </h1>
          
          <p className="mt-6 sm:mt-8 max-w-2xl text-sm sm:text-base lg:text-lg text-muted-foreground px-4 sm:px-6">
            Unlock daily insights on founder psychology—to dream big, ship fast, and enjoy the journey.
          </p>
          
          <form onSubmit={handleSubscribe} className="relative mt-8 sm:mt-10 w-full max-w-md px-4 sm:px-0">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 sm:h-12 rounded-full pr-20 sm:pr-36 shadow-lg transition-all duration-300 focus:ring-2 focus:ring-orange-500/50 text-sm sm:text-base"
            />
            <Button 
              type="submit" 
              size="sm"
              className="absolute right-5 sm:right-1 top-1 h-8 sm:h-10 rounded-full transition-transform duration-300 hover:scale-105 text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Subscribe</span>
              <ArrowRight className="h-4 w-4 sm:ml-2" />
            </Button>
          </form>

          <div className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-8 px-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 sm:h-5 w-3 sm:w-5 fill-orange-500 text-orange-500 transition-all duration-300 hover:scale-125" />
                ))}
              </div>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">Trusted by founders</p>
            </div>
            <Separator orientation="vertical" className="h-6 sm:h-8 hidden sm:block" />
            <div className="flex items-center gap-1.5 sm:gap-2 group">
              <Users className="h-3 sm:h-5 w-3 sm:w-5 text-muted-foreground transition-transform duration-300 group-hover:scale-110" />
              <span className="text-xs sm:text-sm text-muted-foreground">10k+ subscribers</span>
            </div>
            <Separator orientation="vertical" className="h-6 sm:h-8 hidden sm:block" />
            <div className="flex items-center gap-1.5 sm:gap-2 group">
              <Trophy className="h-3 sm:h-5 w-3 sm:w-5 text-muted-foreground transition-transform duration-300 group-hover:scale-110" />
              <span className="text-xs sm:text-sm text-muted-foreground">#1 Founder Newsletter</span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-white py-16 sm:py-24 dark:bg-neutral-900">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"></div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AnimatedSection className="mb-12 sm:mb-16 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Transform Your Journey</h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-muted-foreground">
              Discover the tools and insights that will elevate your founder mindset
            </p>
          </AnimatedSection>
          <div className="grid gap-6 sm:gap-8 lg:gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Brain,
                title: "Mental Resilience",
                description: "Develop the psychological strength to overcome startup challenges.",
              },
              {
                icon: Heart,
                title: "Emotional Intelligence",
                description: "Master the art of understanding yourself and leading others.",
              },
              {
                icon: Coffee,
                title: "Work-Life Harmony",
                description: "Create sustainable success without sacrificing personal well-being.",
              },
            ].map((feature, index) => (
              <AnimatedSection key={index} delay={index * 200}>
                <Card className="group relative overflow-hidden border-none bg-orange-50/50 p-4 sm:p-6 shadow-none transition-all duration-300 hover:bg-orange-100/50 hover:scale-105 dark:bg-neutral-800/50 dark:hover:bg-neutral-800">
                  <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-orange-500/10 transition-transform duration-500 group-hover:scale-[2]"></div>
                  <div className="relative">
                    <div className="inline-flex rounded-full bg-orange-100 p-2 sm:p-3 transition-transform duration-300 group-hover:scale-110 dark:bg-orange-900/30">
                      <feature.icon className="h-4 w-4 sm:h-6 sm:w-6 text-orange-500" />
                    </div>
                    <h3 className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-xs sm:text-sm lg:text-base text-muted-foreground">{feature.description}</p>
                    <Button variant="ghost" className="mt-3 sm:mt-4 text-sm sm:text-base group/btn">
                      Learn more
                      <ArrowUpRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-300 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                    </Button>
                  </div>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-orange-500/5"></div>
          <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white to-transparent dark:from-neutral-900"></div>
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-white to-transparent dark:from-neutral-900"></div>
        </div>
        <div className="mx-auto max-w-7xl px-4">
          <AnimatedSection className="text-center">
            <Badge variant="secondary" className="mb-4 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              Testimonials
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold lg:text-4xl">What Founders Say</h2>
          </AnimatedSection>
          <AnimatedSection className="relative mt-12" delay={200}>
            <div className="flex items-center justify-center">
              <Card className="relative max-w-2xl overflow-hidden">
                {[
                  {
                    quote: "InnerFlame has been instrumental in helping me maintain mental clarity during the most challenging phases of my startup journey.",
                    author: "Sarah Chen",
                    role: "Founder & CEO, TechVision",
                  },
                  {
                    quote: "The insights and strategies shared through InnerFlame have transformed how I approach leadership and decision-making.",
                    author: "Michael Rodriguez",
                    role: "Co-founder, StartupLabs",
                  },
                  {
                    quote: "A game-changer for founders who want to build not just successful companies, but sustainable, fulfilling careers.",
                    author: "Emily Zhang",
                    role: "Founder, GrowthMind",
                  },
                ].map((testimonial, index) => (
                  <div
                    key={index}
                    className={`transition-opacity duration-500 ${
                      activeTestimonial === index ? "opacity-100" : "absolute inset-0 opacity-0"
                    }`}
                  >
                    <div className="p-6 sm:p-8">
                      <Quote className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500/20" />
                      <p className="mt-4 text-base sm:text-lg font-medium italic">{testimonial.quote}</p>
                      <div className="mt-6">
                        <p className="font-semibold">{testimonial.author}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
            <div className="mt-8 flex justify-center gap-2">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    activeTestimonial === index
                      ? "w-8 bg-orange-500"
                      : "bg-orange-200 hover:bg-orange-300 dark:bg-orange-800 dark:hover:bg-orange-700"
                  }`}
                />
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24">
        <AnimatedSection className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <Badge variant="secondary" className="mb-4 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              Latest Insights
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold lg:text-4xl">Featured Articles</h2>
          </div>
          <Link to="/articles">
            <Button variant="ghost" className="group">
              View all articles
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </AnimatedSection>
        <div className="mt-12 grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full text-center py-12">Loading articles...</div>
          ) : featuredArticles.length > 0 ? (
            featuredArticles.map((article, index) => (
              <AnimatedSection key={article.id} delay={index * 200}>
                <ArticleCard article={article} />
              </AnimatedSection>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No articles available
            </div>
          )}
        </div>
      </section>
    </main>
  );
}