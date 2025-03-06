import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeButtonMobile } from "@/components/ThemeButtonMobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronRight,
  Users,
  BookOpen,
  LogOut,
  Settings as SettingsIcon,
  Shield
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
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
import Documents from "./features/documents/pages/Documents";
import { SignOutDialog } from "@/components/SignOutDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
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

// New component for unified profile menu
interface ProfileMenuProps {
  onOpenChange?: (isOpen: boolean) => void;
  isMobile?: boolean;
}

function ProfileMenu({ onOpenChange, isMobile = false }: ProfileMenuProps) {
  const { user, loading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  
  // Check admin status when user changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();
          
        if (!error && data && data.is_admin) {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
      }
    };
    
    checkAdminStatus();
  }, [user]);
  
  const handleSignOut = async () => {
    if (signOut) {
      await signOut();
      // Navigate to landing page after signing out
      navigate('/');
      // Close mobile menu if applicable
      onOpenChange && onOpenChange(false);
    }
  };
  
  if (loading) {
    return (
      <Button disabled className={isMobile ? "w-full text-sm sm:text-base" : ""}>
        <span className="animate-pulse">Loading...</span>
      </Button>
    );
  }
  
  if (!user) {
    return (
      <AuthModal 
        trigger={
          <Button className={isMobile ? "w-full text-sm sm:text-base" : ""}>Sign In</Button>
        }
      />
    );
  }
  
  if (isMobile) {
    // Direct rendering in mobile menu
    return (
      <>
        <div className="flex items-center space-x-3 mb-3 px-4 py-2 border rounded-md bg-background/50">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || 'User'} />
            <AvatarFallback>
              {user?.email ? user.email.substring(0, 2).toUpperCase() : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="text-sm font-medium leading-none">{user?.user_metadata?.name || user?.email}</p>
            <p className="text-xs mt-1 leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>
        
        <Link to="/settings">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm sm:text-base"
            onClick={() => onOpenChange && onOpenChange(false)}
          >
            Settings
            <SettingsIcon className="ml-auto h-4 w-4" />
          </Button>
        </Link>
        
        {isAdmin && (
          <Link to="/admin">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sm sm:text-base"
              onClick={() => onOpenChange && onOpenChange(false)}
            >
              Admin Dashboard
              <Shield className="ml-auto h-4 w-4" />
            </Button>
          </Link>
        )}
        
        <Separator className="my-3 opacity-50" />
        
        <SignOutDialog 
          onSignOut={handleSignOut}
        />
      </>
    );
  }
  
  // Desktop dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || 'User'} />
            <AvatarFallback>
              {user?.email ? user.email.substring(0, 2).toUpperCase() : '?'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-2" align="end">
        <div className="flex items-center space-x-3 mb-2 px-4 py-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || 'User'} />
            <AvatarFallback>
              {user?.email ? user.email.substring(0, 2).toUpperCase() : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="text-sm font-medium leading-none">{user?.user_metadata?.name || user?.email}</p>
            <p className="text-xs mt-1 leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>
        
        <Separator className="my-1" />
        
        <div className="py-1">
          <Link to="/settings" className="w-full block">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sm"
            >
              Settings
              <SettingsIcon className="ml-auto h-4 w-4" />
            </Button>
          </Link>
          
          {isAdmin && (
            <Link to="/admin" className="w-full block">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm"
              >
                Admin Dashboard
                <Shield className="ml-auto h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
        
        <Separator className="my-1" />
        
        <div className="py-1">
          <SignOutDialog 
            onSignOut={handleSignOut}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppContent() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, loading, signOut } = useAuth();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if we're on the user documents page or documents page
  const isUserDocumentsPage = location.pathname === '/user-documents';
  const isDocumentsPage = location.pathname === '/documents';
  const hideNavAndFooter = isUserDocumentsPage || isDocumentsPage;

  // Check admin status when user changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();
          
        if (!error && data && data.is_admin) {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
      }
    };
    
    checkAdminStatus();
  }, [user]);

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
      
      {!hideNavAndFooter && (
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
              <Link to="/documents">
                <Button variant="ghost" className="group">
                  Documents
                  <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <ThemeToggle />
              <ProfileMenu />
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
              <Link to="/documents">
                <Button variant="ghost" className="w-full justify-start text-sm sm:text-base">
                  Documents
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>
              <Separator className="my-3" />
              <ThemeButtonMobile />
              <Separator className="my-3" />
              <ProfileMenu isMobile={true} onOpenChange={setIsMenuOpen} />
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
          <Route path="/documents" element={<Documents />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/offline" element={<OfflinePage />} />
          <Route path="/usage-policy" element={<UsagePolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
      </Suspense>

      {!hideNavAndFooter && (
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
                  <Link to="/documents">
                    <Button variant="link" className="h-auto p-0 text-xs sm:text-sm hover:text-orange-500 transition-colors">Documents</Button>
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