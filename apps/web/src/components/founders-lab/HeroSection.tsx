import { ArrowRight, Clock, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedSection } from "@/components/animated-section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext.js";
import { useNavigate } from "react-router-dom";
import leanCanvasService from "@/features/documents/services/leanCanvasService.js";
import { anonymousAuthService } from "@/features/auth/services/anonymousAuthService.js";

interface HeroSectionProps {
  scrollToCheckout: () => void;
}

export function HeroSection({ scrollToCheckout }: HeroSectionProps) {
  const [startupIdea, setStartupIdea] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [hasExistingCanvas, setHasExistingCanvas] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has any lean canvases
  useEffect(() => {
    async function checkExistingCanvas() {
      if (!user?.id) {
        setHasExistingCanvas(false);
        setIsLoading(false);
        return;
      }

      try {
        const mostRecentCanvas = await leanCanvasService.getMostRecentLeanCanvas(user.id);
        setHasExistingCanvas(!!mostRecentCanvas);
      } catch (error) {
        console.error("Error checking for existing canvas:", error);
        setHasExistingCanvas(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkExistingCanvas();
  }, [user?.id]);

  const handleGenerateCanvas = async () => {
    if (!startupIdea.trim()) return;
    
    try {
      setIsCreating(true);
      
      let currentUser = user;
      
      // If no user is logged in, create an anonymous user
      if (!currentUser?.id) {
        currentUser = await anonymousAuthService.getOrCreateAnonymousUser();
        if (!currentUser?.id) {
          throw new Error("Failed to create anonymous user");
        }
      }
      
      // Create the lean canvas with the current user (anonymous or registered)
      await leanCanvasService.createLeanCanvas(currentUser.id);
      
      // Navigate to the lean canvas page
      navigate("/lean-canvas", { 
        state: { 
          initialIdea: startupIdea,
          isAnonymous: anonymousAuthService.isAnonymousUser(currentUser)
        } 
      });
    } catch (error) {
      console.error("Error creating lean canvas:", error);
      alert("Failed to create lean canvas. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleGoToCanvas = () => {
    navigate("/lean-canvas");
  };

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24 lg:py-32">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <svg className="absolute h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className="animate-gradient-shift-1">
                <animate attributeName="stop-color" 
                  values="#fed7aa;#ffedd5;#fed7aa" 
                  dur="4s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" className="animate-gradient-shift-2">
                <animate attributeName="stop-color" 
                  values="#ffedd5;#fed7aa;#ffedd5" 
                  dur="4s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
            <linearGradient id="grad1-dark" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className="animate-gradient-shift-1">
                <animate attributeName="stop-color" 
                  values="#7c2d12;#9a3412;#7c2d12" 
                  dur="4s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" className="animate-gradient-shift-2">
                <animate attributeName="stop-color" 
                  values="#9a3412;#7c2d12;#9a3412" 
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
          <g filter="url(#goo)" className="dark:opacity-30">
            <circle cx="30%" cy="30%" r="15%" fill="url(#grad1)" className="animate-blob light-mode-blob block dark:hidden">
              <animate attributeName="cx" values="30%;40%;30%" dur="10s" repeatCount="indefinite" />
              <animate attributeName="cy" values="30%;40%;30%" dur="10s" repeatCount="indefinite" />
            </circle>
            <circle cx="70%" cy="70%" r="15%" fill="url(#grad1)" className="animate-blob light-mode-blob block dark:hidden">
              <animate attributeName="cx" values="70%;60%;70%" dur="10s" repeatCount="indefinite" />
              <animate attributeName="cy" values="70%;60%;70%" dur="10s" repeatCount="indefinite" />
            </circle>
            <circle cx="30%" cy="30%" r="15%" fill="url(#grad1-dark)" className="animate-blob dark-mode-blob hidden dark:block">
              <animate attributeName="cx" values="30%;40%;30%" dur="10s" repeatCount="indefinite" />
              <animate attributeName="cy" values="30%;40%;30%" dur="10s" repeatCount="indefinite" />
            </circle>
            <circle cx="70%" cy="70%" r="15%" fill="url(#grad1-dark)" className="animate-blob dark-mode-blob hidden dark:block">
              <animate attributeName="cx" values="70%;60%;70%" dur="10s" repeatCount="indefinite" />
              <animate attributeName="cy" values="70%;60%;70%" dur="10s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>
      </div>

      <AnimatedSection>
        {/* Header - First Focal Point */}
        <div className="text-center mb-10">
          <div className="inline-block px-4 py-1.5 bg-primary/10 dark:bg-primary/20 rounded-full text-primary font-medium text-sm mb-4">
            <span className="mr-2">🚀</span> Founder Development Reimagined
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-2">
            InnerFlame 
            <span className="relative mx-2 inline-block">
              <span className="relative z-10 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text px-2 text-transparent">
                Founder's Lab
              </span>
              <svg className="absolute -bottom-1 sm:-bottom-2 left-0 -z-0 h-2 sm:h-3 w-full text-orange-500/30 dark:text-orange-400/40" viewBox="0 0 100 12" preserveAspectRatio="none">
                <path d="M0,0 Q50,12 100,0" stroke="currentColor" strokeWidth="8" fill="none">
                  <animate attributeName="d" dur="4s" repeatCount="indefinite"
                    values="M0,0 Q50,12 100,0;M0,0 Q50,8 100,0;M0,0 Q50,12 100,0" />
                </path>
              </svg>
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            From idea to market validation in record time
          </p>
        </div>
        
        {/* Idea Input - Second Focal Point */}
        <div className="max-w-3xl mx-auto mb-16">
          <Card className="border-2 border-primary/20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur shadow-lg">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-primary mb-4">
                {hasExistingCanvas ? "Continue Building Your Business" : "Start Building Your Business Today"}
              </h2>
              
              <div className="space-y-4">
                {!hasExistingCanvas && (
                  <>
                    <label htmlFor="startup-idea" className="block text-sm font-medium">
                      Describe your startup idea:
                    </label>
                    <Textarea
                      id="startup-idea"
                      placeholder="e.g., A platform that helps remote workers find coworking spaces with AI matchmaking based on work style, amenities needed, and location preferences..."
                      value={startupIdea}
                      onChange={(e) => setStartupIdea(e.target.value)}
                      className="resize-none min-h-[120px] w-full border border-gray-200 dark:border-gray-700 focus:border-primary/50 dark:focus:border-primary/70 bg-white dark:bg-neutral-800 dark:placeholder:text-gray-400"
                    />
                  </>
                )}
                
                <Button 
                  onClick={hasExistingCanvas ? handleGoToCanvas : handleGenerateCanvas}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  disabled={isLoading || isCreating || (!hasExistingCanvas && !startupIdea.trim())}
                >
                  <Zap className="mr-2 h-5 w-5" />
                  {isLoading ? "Loading..." : 
                   isCreating ? "Creating Canvas..." : 
                   hasExistingCanvas ? "Go to My Lean Canvas" : 
                   "Generate Lean Canvas Now"}
                </Button>
              </div>
              
              {!hasExistingCanvas && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Identify your key value propositions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Clarify your target segments</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">Map revenue streams & costs</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Purpose Section - Third Focal Point */}
        <div className="max-w-4xl mx-auto bg-white/80 dark:bg-neutral-900/80 rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Why InnerFlame?</h2>
            <div className="w-16 h-1 bg-primary mx-auto mb-6 rounded-full"></div>
          </div>
          
          <div className="space-y-6">
            <p className="text-lg text-center">
              Gain instant clarity on your business idea and rapidly move to market validation. 
              InnerFlame delivers immediate value through a frictionless experience designed 
              specifically for early-stage entrepreneurs.
            </p>
            
            <p className="text-lg text-center font-medium">
              <span className="text-primary">The Founder's Lab</span> combines strategic business 
              development with founder personal growth, empowering you to dream big, ship fast, 
              and have fun learning.
            </p>
          </div>
          
          <div className="mt-8 flex flex-col items-center">
            <Button onClick={scrollToCheckout} size="lg" className="group px-8">
              Join the Full Founder's Lab
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            
            <div className="mt-4">
              <Badge variant="outline" className="px-3 py-1 bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30">
                <Clock className="w-3 h-3 mr-1" />
                Try for Free - No Account Required
              </Badge>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
} 