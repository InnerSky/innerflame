import { useState, useEffect, lazy, Suspense, useRef } from "react";
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
import { Toaster } from "@/components/ui/toaster";
import { DevTools } from "@/components/DevTools";
import { SEO } from "@/components/SEO";
import Home from "./pages/Home";
import Articles from "./pages/Articles";
import Article from "./pages/Article";
import FoundersLab from "./pages/FoundersLab";
import FoundersLabV2 from "./pages/FoundersLabV2";
import AuthCallback from "./pages/AuthCallback";
import AdminPage from "./pages/Admin";
import Settings from "./pages/Settings";
import UsagePolicy from "./pages/UsagePolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Documents from "./features/documents/pages/Documents";
import TestQuestionnaire from "./pages/test-questionnaire";
import { SignOutDialog } from "@/components/SignOutDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { anonymousAuthService } from "@/features/auth/services/anonymousAuthService.js";
import { OnboardingModal } from "@/components/OnboardingModal.js";
import { TrackingProvider } from "@/contexts/TrackingContext.js";
import CoachPage from "./features/coach/CoachPage.js";
const OfflinePage = lazy(() => import("./pages/OfflinePage.js"));
const LeanCanvas = lazy(() => import("./pages/LeanCanvas.js"));

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="innerflame-ui-theme">
      <BrowserRouter>
        <TrackingProvider>
        <SEO 
          title="InnerFlame Studio"
          description="InnerFlame helps founders navigate challenges with personalized guidance and insights, so you can keep your flame burning bright."
          image="/images/OpenGraphImage.png"
        />
        <AppContent />
        </TrackingProvider>
        <Toaster />
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
  const { user, loading, signOut, isAnonymous } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Check admin status when user changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || isAnonymous) {
        setIsAdmin(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();
          
        // Set admin status based on result or false if error
        setIsAdmin(error ? false : !!data?.is_admin);
      } catch (err) {
        setIsAdmin(false); 
      }
    };
    
    checkAdminStatus();
  }, [user, isAnonymous, signOut]);
  
  const handleSignOut = async () => {
    if (signOut) {
      await signOut();
      navigate('/');
      onOpenChange && onOpenChange(false);
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <Button disabled className={isMobile ? "w-full text-sm sm:text-base" : ""}>
        <span className="animate-pulse">Loading...</span>
      </Button>
    );
  }
  
  // Show Sign In button for both non-logged in and anonymous users
  const isPermanentUser = user && !isAnonymous;
  
  if (!isPermanentUser) {
    return (
      <AuthModal 
        defaultTab={isAnonymous ? "sign-up" : "sign-in"}
        trigger={
          <Button className={isMobile ? "w-full text-sm sm:text-base" : ""}>
            Sign In
          </Button>
        }
      />
    );
  }
  
  // From here on, we only show profile UI for authenticated permanent users
  if (isMobile) {
    return (
      <>
        <div className="flex items-center space-x-3 mb-3 px-4 py-2 border rounded-md bg-background/50">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || 'User'} />
            <AvatarFallback>
              {user?.email ? user.email.substring(0, 2).toUpperCase() : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <p className="text-sm font-medium break-words leading-tight">
              {user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email}
            </p>
            <p className="text-xs mt-1 text-muted-foreground break-all leading-tight">
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
        
        <SignOutDialog onSignOut={handleSignOut} />
      </>
    );
  }
  
  // Desktop dropdown for authenticated permanent users
  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-8 w-8 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || 'User'} />
            <AvatarFallback>
              {user?.email ? user.email.substring(0, 2).toUpperCase() : '?'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 p-2" align="end">
        <div className="flex items-center space-x-3 mb-2 px-4 py-2">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || 'User'} />
            <AvatarFallback>
              {user?.email ? user.email.substring(0, 2).toUpperCase() : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <p className="text-sm font-medium break-words leading-tight">
              {user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email}
            </p>
            <p className="text-xs mt-1 text-muted-foreground break-all leading-tight">
              {user?.email}
            </p>
          </div>
        </div>
        
        <Separator className="my-1" />
        
        <div className="py-1">
          <Link to="/settings" className="w-full block" onClick={() => {
            setDropdownOpen(false);
            onOpenChange && onOpenChange(false);
          }}>
            <Button variant="ghost" className="w-full justify-start text-sm">
              Settings
              <SettingsIcon className="ml-auto h-4 w-4" />
            </Button>
          </Link>
          
          {isAdmin && (
            <Link to="/admin" className="w-full block" onClick={() => {
              setDropdownOpen(false);
              onOpenChange && onOpenChange(false);
            }}>
              <Button variant="ghost" className="w-full justify-start text-sm">
                Admin Dashboard
                <Shield className="ml-auto h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
        
        <Separator className="my-1" />
        
        <div className="py-1">
          <SignOutDialog onSignOut={handleSignOut} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppContent() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, loading, signOut, isAnonymous } = useAuth();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [anonSignInAttempted, setAnonSignInAttempted] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  // Define ref at component level, not inside useEffect
  const isFirstAuthRender = useRef(true);
  
  // Check if we're on the documents page or lean-canvas page
  const isDocumentsPage = location.pathname === '/documents';
  const isLeanCanvasPage = location.pathname === '/lean-canvas';
  const isHomePage = location.pathname === '/home';
  const isCoachPage = location.pathname === '/coach';
  const hideNavAndFooter = isDocumentsPage || isLeanCanvasPage || isHomePage || isCoachPage;

  // Only log auth status check in development and only on 
  // significant changes (user ID change or anonymous status change)
  useEffect(() => {
    // Skip excessive logging in production
    if (process.env.NODE_ENV !== 'development') return;
    
    // Use the ref defined at component level
    if (user) {
      // Only log on first render or when important values change
      if (isFirstAuthRender.current) {
        console.log('Auth Status Check (Initial):', {
          user_id: user.id,
          email: user.email,
          isAnonymous,
          metadata: user.app_metadata,
          is_anonymous_flag: user.app_metadata?.is_anonymous
        });
        isFirstAuthRender.current = false;
      }
    } else {
      if (isFirstAuthRender.current) {
        console.log('Auth Status Check (Initial): No user logged in');
        isFirstAuthRender.current = false;
      }
    }
  }, [user?.id, isAnonymous]); // Only re-run if user ID or anonymous status changes

  // Automatically sign in anonymously if no user is present
  useEffect(() => {
    const autoSignInAnonymously = async () => {
      // Only proceed if:
      // 1. Auth context is not loading
      // 2. There's no user logged in
      // 3. We haven't already attempted anonymous sign-in in this component lifecycle/state
      // 4. We're not on the auth callback page
      // 5. Add a slight delay to avoid race conditions with AuthContext
      if (!loading && !user && !anonSignInAttempted && !location.pathname.includes('/auth/callback')) {
        setAnonSignInAttempted(true); // Mark that we are attempting
        
        // Add a small delay to let any pending auth operations complete
        // This avoids race conditions with token refreshes and AuthContext operations
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check again after the delay to make sure we still need to sign in
        if (!user) {
          try {
            const anonymousUser = await anonymousAuthService.getOrCreateAnonymousUser();
            
            if (!anonymousUser) {
              // Keep anonSignInAttempted as true so we don't immediately retry on failure
            }
          } catch (error) {
            // Also keep anonSignInAttempted as true to prevent looping on errors (like rate limit)
          }
        }
      } else if (user) {
         // If a user becomes available (either anonymous or registered), reset the attempt flag
         // This allows a new attempt if the user signs out later.
         if (anonSignInAttempted) {
             setAnonSignInAttempted(false);
         }
      }
    };

    autoSignInAnonymously();
    // Dependency array: includes user and loading from AuthContext, and the local attempt flag
  }, [loading, user, location.pathname, anonSignInAttempted]);

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

  // Check if user has completed onboarding
  useEffect(() => {
    // Only check once for permanent users who haven't been checked yet
    if (!loading && user && !isAnonymous && !onboardingChecked && !checkingOnboarding) {
      const checkOnboardingStatus = async () => {
        try {
          setCheckingOnboarding(true);
          
          const { data, error } = await supabase
            .from('questionnaire_responses')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .not('completed_at', 'is', null)
            .limit(1)
            .maybeSingle();
          
          if (error) {
            console.error('Error checking onboarding status:', error);
            return;
          }
          
          // Show onboarding modal if no completed questionnaire
          setShowOnboardingModal(!data);
          // Mark as checked regardless of outcome
          setOnboardingChecked(true);
        } catch (err) {
          console.error('Error checking onboarding status:', err);
        } finally {
          setCheckingOnboarding(false);
        }
      };
      
      checkOnboardingStatus();
    } else if (!user || isAnonymous) {
      // Reset for non-permanent users
      setShowOnboardingModal(false);
      setOnboardingChecked(false);
    }
  }, [user, isAnonymous, loading, onboardingChecked, checkingOnboarding]);
  
  // Handler for when onboarding is completed
  const handleOnboardingComplete = () => {
    setShowOnboardingModal(false);
  };

  return (
    <>
      <OfflineBanner />
      <DevTools />
      
      {!hideNavAndFooter && (
        <nav className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? "border-b bg-gradient-to-r from-white/90 via-white/90 to-complement/5 backdrop-blur-xl dark:from-neutral-900/90 dark:via-neutral-900/90 dark:to-complement/10" : "bg-transparent"
        }`}>
          <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/images/Logo_512x512.png"
                alt="InnerFlame Logo" 
                className="h-7 w-7 sm:h-8 sm:w-8"
              />
              <div className="flex items-center">
                <span className="text-lg sm:text-xl font-normal font-young-serif">InnerFlame</span>
                <span className="text-lg sm:text-xl font-normal font-young-serif text-muted-foreground ml-1">Studio</span>
              </div>
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
              {/* Navigation links temporarily hidden
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
              <Link to="/lean-canvas">
                <Button variant="ghost" className="group">
                  Lean Canvas
                  <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              */}
              <ThemeToggle />
              <ProfileMenu />
            </div>
          </div>

          <div 
            id="mobile-menu"
            className={`lg:hidden ${isMenuOpen ? 'block' : 'hidden'} border-t bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl`}
          >
            <div className="space-y-2 p-4">
              {/* Mobile navigation links temporarily hidden
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
              <Link to="/lean-canvas">
                <Button variant="ghost" className="w-full justify-start text-sm sm:text-base">
                  Lean Canvas
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>
              <Separator className="my-3" />
              */}
              <ThemeButtonMobile />
              <Separator className="my-3" />
              <ProfileMenu isMobile={true} onOpenChange={setIsMenuOpen} />
            </div>
          </div>
        </nav>
      )}

      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <Routes>
          <Route path="/" element={<FoundersLabV2 />} />
          <Route path="/home" element={<Home />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/article/:slug" element={<Article />} />
          <Route path="/founders-lab" element={<FoundersLab />} />
          <Route path="/founders-lab-v2" element={<FoundersLabV2 />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/lean-canvas" element={<LeanCanvas />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/offline" element={<OfflinePage />} />
          <Route path="/usage-policy" element={<UsagePolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/test-questionnaire" element={<TestQuestionnaire />} />
          <Route path="/coach" element={<CoachPage />} />
        </Routes>
      </Suspense>

      {!hideNavAndFooter && (
        <footer className="border-t bg-gradient-to-b from-white to-complement/10 py-12 sm:py-16 dark:from-neutral-900 dark:to-complement/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <img 
                    src="/images/Logo_512x512.png"
                    alt="InnerFlame Logo" 
                    className="h-7 w-7 sm:h-8 sm:w-8"
                  />
                  <div className="flex items-center">
                    <span className="text-lg sm:text-xl font-normal font-young-serif">InnerFlame</span>
                  </div>
                </div>
                <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-muted-foreground">
                To keep bold ideas burning bright—so every dream can light up the sky.
                </p>
              </div>
              
              <div className="text-center sm:text-left">
                <h4 className="text-sm sm:text-base font-semibold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Quick Links</h4>
                <div className="mt-4 sm:mt-5 flex flex-col gap-3 items-center sm:items-start">
                  <Link to="/home">
                    <Button variant="link" className="h-auto p-0 text-xs sm:text-sm hover:text-orange-500 transition-colors">App</Button>
                  </Link>
                  <Link to="/articles">
                    <Button variant="link" className="h-auto p-0 text-xs sm:text-sm hover:text-orange-500 transition-colors">Articles</Button>
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
            </div>
            
            <Separator className="my-8 sm:my-10 bg-gradient-to-r from-transparent via-complement/30 dark:via-complement/20 to-transparent" />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                © 2025 InnerFlame. All rights reserved.
              </p>
              <div className="flex items-center gap-5 justify-center sm:justify-end">
                <a href="https://www.youtube.com/@founders_innerflame" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-complement transition-colors duration-200 hover:scale-110 transform">
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
      
      {/* Show onboarding modal when needed */}
      {showOnboardingModal && <OnboardingModal onComplete={handleOnboardingComplete} />}
    </>
  );
}

export default App;