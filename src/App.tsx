import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
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
import Settings from "./pages/Settings";
import UsagePolicy from "./pages/UsagePolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import UserDocuments from "./pages/UserDocuments";
const OfflinePage = lazy(() => import("./pages/OfflinePage"));

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="innerflame-ui-theme">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

function AppContent() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, loading } = useAuth();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Check if we're on the user documents page
  const isUserDocumentsPage = location.pathname === '/user-documents';

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
      const button = document.querySelector('button[aria-label="Toggle menu"]');
      
      // Don't close menu if clicking on the toggle button itself - that's handled by the button's onClick
      if (button && button.contains(event.target as Node)) {
        return;
      }
      
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
      
      {!isUserDocumentsPage && (
        <nav className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? "border-b bg-white/80 backdrop-blur-xl dark:bg-neutral-900/80" : "bg-transparent"
        }`}>
          <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute -inset-1 animate-pulse rounded-full bg-orange-500/20 dark:bg-orange-500/30"></div>
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
                  <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                </Button>
              </Link>
              <Link to="/founders-lab">
                <Button variant="ghost" className="group">
                  Founder's Lab
                  <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <ThemeToggle />
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
              <Separator className="my-3" />
              <div className="flex items-center justify-between px-3">
                <span className="text-sm">Theme</span>
                <ThemeToggle />
              </div>
              <Separator className="my-3" />
              {loading ? (
                <Button disabled className="w-full text-sm sm:text-base">
                  <span className="animate-pulse">Loading...</span>
                </Button>
              ) : user ? (
                <Link to="/settings">
                  <Button 
                    variant="outline" 
                    className="w-full text-sm sm:text-base"
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                  >
                    Settings
                  </Button>
                </Link>
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
      )}

      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <Routes>
          <Route path="/" element={<FoundersLab />} />
          <Route path="/home" element={<Home />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/article/:slug" element={<Article />} />
          <Route path="/founders-lab" element={<FoundersLab />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/user-documents" element={<UserDocuments />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/offline" element={<OfflinePage />} />
          <Route path="/usage-policy" element={<UsagePolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
      </Suspense>

      {!isUserDocumentsPage && (
        <footer className="border-t bg-gradient-to-b from-white to-orange-50/30 py-12 sm:py-16 dark:from-neutral-900 dark:to-neutral-900/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <div className="relative">
                    <div className="absolute -inset-1 animate-pulse rounded-full bg-orange-500/20 dark:bg-orange-500/30"></div>
                    <img 
                      src="https://lpxnyybizytwcqdqasll.supabase.co/storage/v1/object/public/innerflame_asset//Logo1.png" 
                      alt="InnerFlame Logo" 
                      className="relative h-5 w-5 sm:h-6 sm:w-6"
                    />
                  </div>
                  <span className="text-lg sm:text-xl font-semibold">InnerFlame</span>
                </div>
                <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-muted-foreground">
                  Empowering founders with the mental tools and insights they need to thrive.
                </p>
              </div>
              
              <div className="text-center sm:text-left">
                <h4 className="text-sm sm:text-base font-semibold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Quick Links</h4>
                <div className="mt-4 sm:mt-5 flex flex-col gap-3 items-center sm:items-start">
                  <Link to="/articles">
                    <Button variant="link" className="h-auto p-0 text-xs sm:text-sm hover:text-orange-500 transition-colors">Articles</Button>
                  </Link>
                  <Link to="/founders-lab">
                    <Button variant="link" className="h-auto p-0 text-xs sm:text-sm hover:text-orange-500 transition-colors">Founder's Lab</Button>
                  </Link>
                </div>
              </div>

              <div className="text-center sm:text-left">
                <h4 className="text-sm sm:text-base font-semibold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Legal</h4>
                <div className="mt-4 sm:mt-5 flex flex-col gap-3 items-center sm:items-start">
                  <Link to="/privacy-policy">
                    <Button variant="link" className="h-auto p-0 text-xs sm:text-sm hover:text-orange-500 transition-colors">Privacy Policy</Button>
                  </Link>
                  <Link to="/usage-policy">
                    <Button variant="link" className="h-auto p-0 text-xs sm:text-sm hover:text-orange-500 transition-colors">Usage Policy</Button>
                  </Link>
                </div>
              </div>

              <div className="text-center sm:text-left">
                <h4 className="text-sm sm:text-base font-semibold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Newsletter</h4>
                <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  Subscribe to get the latest insights and updates.
                </p>
                <form onSubmit={(e) => e.preventDefault()} className="mt-4 sm:mt-5">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="h-9 sm:h-10 text-xs sm:text-sm border-orange-200 focus:border-orange-400 focus:ring-orange-400 transition-colors"
                    />
                    <Button type="submit" size="sm" className="text-xs sm:text-sm bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all duration-300 border-0">
                      Subscribe
                    </Button>
                  </div>
                </form>
              </div>
            </div>
            
            <Separator className="my-8 sm:my-10 bg-gradient-to-r from-transparent via-orange-200/50 dark:via-orange-500/10 to-transparent" />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                © 2025 InnerFlame. All rights reserved.
              </p>
              <div className="flex items-center gap-5 justify-center sm:justify-end">
                <a href="https://www.youtube.com/@founders_innerflame" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-orange-500 transition-colors duration-200 hover:scale-110 transform">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </>
  );
}

export default App;