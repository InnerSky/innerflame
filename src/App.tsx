import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronRight,
  Users,
  BookOpen
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserMenu } from "@/components/UserMenu";
import { OfflineBanner } from "@/components/OfflineBanner";
import Home from "./pages/Home";
import Articles from "./pages/Articles";
import Article from "./pages/Article";
import FoundersLab from "./pages/FoundersLab";
import AuthCallback from "./pages/AuthCallback";
import AdminPage from "./pages/Admin";
const OfflinePage = lazy(() => import("./pages/OfflinePage"));

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, loading } = useAuth();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const nav = document.getElementById('mobile-menu');
      if (isMenuOpen && nav && !nav.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  return (
    <>
      <OfflineBanner />
      
      <nav className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? "border-b bg-white/80 backdrop-blur-xl dark:bg-neutral-900/80" : "bg-transparent"
      }`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute -inset-1 animate-pulse rounded-full bg-orange-500/20"></div>
              <img 
                src="https://lpxnyybizytwcqdqasll.supabase.co/storage/v1/object/public/innerflame_asset//Logo1.png" 
                alt="InnerFlame Logo" 
                className="relative h-5 w-5 sm:h-6 sm:w-6"
              />
            </div>
            <span className="text-lg sm:text-xl font-semibold">InnerFlame</span>
          </Link>
          
          <Button 
            variant="ghost" 
            className="lg:hidden p-1"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </Button>

          <div className="hidden lg:flex items-center gap-6">
            <Link to="/articles">
              <Button variant="ghost" className="group">
                Articles
                <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/founders-lab">
              <Button variant="ghost" className="group">
                Founder's Lab
                <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button variant="ghost" className="group">
              About
              <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="ghost" className="group">
              Contact
              <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            {loading ? (
              <Button disabled>
                <span className="animate-pulse">Loading...</span>
              </Button>
            ) : user ? (
              <UserMenu />
            ) : (
              <AuthModal />
            )}
          </div>
        </div>

        <div 
          id="mobile-menu"
          className={`lg:hidden ${isMenuOpen ? 'block' : 'hidden'} border-t bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl`}
        >
          <div className="space-y-2 p-4">
            <Link to="/articles">
              <Button variant="ghost" className="w-full justify-start text-sm sm:text-base">
                Articles
                <ChevronRight className="ml-auto h-4 w-4" />
              </Button>
            </Link>
            <Link to="/founders-lab">
              <Button variant="ghost" className="w-full justify-start text-sm sm:text-base">
                Founder's Lab
                <ChevronRight className="ml-auto h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start text-sm sm:text-base">
              About
              <ChevronRight className="ml-auto h-4 w-4" />
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm sm:text-base">
              Contact
              <ChevronRight className="ml-auto h-4 w-4" />
            </Button>
            <Separator className="my-3" />
            {loading ? (
              <Button disabled className="w-full text-sm sm:text-base">
                <span className="animate-pulse">Loading...</span>
              </Button>
            ) : user ? (
              <Button 
                variant="outline" 
                className="w-full text-sm sm:text-base"
                onClick={() => {
                  setIsMenuOpen(false);
                }}
              >
                Profile
              </Button>
            ) : (
              <AuthModal 
                trigger={
                  <Button className="w-full text-sm sm:text-base">Sign In</Button>
                }
              />
            )}
          </div>
        </div>
      </nav>

      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/article/:slug" element={<Article />} />
          <Route path="/founders-lab" element={<FoundersLab />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/offline" element={<OfflinePage />} />
        </Routes>
      </Suspense>

      <footer className="border-t bg-white py-8 sm:py-12 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <img 
                  src="https://lpxnyybizytwcqdqasll.supabase.co/storage/v1/object/public/innerflame_asset//Logo1.png" 
                  alt="InnerFlame Logo" 
                  className="h-5 w-5 sm:h-6 sm:w-6"
                />
                <span className="text-lg sm:text-xl font-semibold">InnerFlame</span>
              </div>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
                Empowering founders with the mental tools and insights they need to thrive.
              </p>
            </div>
            
            <div className="text-center sm:text-left">
              <h4 className="text-sm sm:text-base font-semibold">Quick Links</h4>
              <div className="mt-3 sm:mt-4 flex flex-col gap-2">
                <Link to="/articles">
                  <Button variant="link" className="h-auto p-0 text-xs sm:text-sm">Articles</Button>
                </Link>
                <Button variant="link" className="h-auto p-0 text-xs sm:text-sm">About Us</Button>
                <Button variant="link" className="h-auto p-0 text-xs sm:text-sm">Contact</Button>
              </div>
            </div>

            <div className="text-center sm:text-left">
              <h4 className="text-sm sm:text-base font-semibold">Legal</h4>
              <div className="mt-3 sm:mt-4 flex flex-col gap-2">
                <Button variant="link" className="h-auto p-0 text-xs sm:text-sm">Privacy Policy</Button>
                <Button variant="link" className="h-auto p-0 text-xs sm:text-sm">Terms of Service</Button>
                <Button variant="link" className="h-auto p-0 text-xs sm:text-sm">Cookie Policy</Button>
              </div>
            </div>

            <div className="text-center sm:text-left">
              <h4 className="text-sm sm:text-base font-semibold">Newsletter</h4>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
                Subscribe to get the latest insights and updates.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="mt-3 sm:mt-4">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="h-8 sm:h-10 text-xs sm:text-sm"
                  />
                  <Button type="submit" size="sm" className="text-xs sm:text-sm">
                    Subscribe
                  </Button>
                </div>
              </form>
            </div>
          </div>
          
          <Separator className="my-6 sm:my-8" />
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              © 2025 InnerFlame. All rights reserved.
            </p>
            <div className="flex items-center gap-3 sm:gap-4">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="ml-1.5 sm:ml-2">Community</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="ml-1.5 sm:ml-2">Resources</span>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;