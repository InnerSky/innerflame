import { ArrowRight, Clock, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedSection } from "@/components/animated-section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext.js";
import { useNavigate } from "react-router-dom";
import leanCanvasService from "@/features/documents/services/leanCanvasService.js";
import { anonymousAuthService } from "@/features/auth/services/anonymousAuthService.js";
import dollarBillImage from "@/assets/images/Dollar bill.png";
import walletImage from "@/assets/images/sniping-wallets.png";

// CSS for the falling dollar bills animation and wallet vibration animation
const animationStyles = `
@keyframes falling1 {
  0% {
    opacity: 0;
    transform: translateY(-20vh) rotate(0deg) scale(0.7);
  }
  15% {
    opacity: 0.35;
  }
  100% {
    opacity: 0.35;
    transform: translateY(100vh) rotate(180deg) scale(0.7);
  }
}

@keyframes falling2 {
  0% {
    opacity: 0;
    transform: translateY(-20vh) rotate(20deg) scale(0.5);
  }
  15% {
    opacity: 0.4;
  }
  100% {
    opacity: 0.3;
    transform: translateY(100vh) rotate(-120deg) scale(0.5);
  }
}

@keyframes falling3 {
  0% {
    opacity: 0;
    transform: translateY(-20vh) rotate(-30deg) scale(0.9);
  }
  15% {
    opacity: 0.45;
  }
  100% {
    opacity: 0.35;
    transform: translateY(100vh) rotate(80deg) scale(0.9);
  }
}

@keyframes falling4 {
  0% {
    opacity: 0;
    transform: translateY(-20vh) rotate(10deg) scale(0.6);
  }
  15% {
    opacity: 0.35;
  }
  100% {
    opacity: 0.25;
    transform: translateY(100vh) rotate(210deg) scale(0.6);
  }
}

@keyframes falling5 {
  0% {
    opacity: 0;
    transform: translateY(-20vh) rotate(-10deg) scale(0.8);
  }
  15% {
    opacity: 0.4;
  }
  100% {
    opacity: 0.3;
    transform: translateY(100vh) rotate(-90deg) scale(0.8);
  }
}

@keyframes vibrate {
  0% {
    transform: scale(1) rotate(0deg);
  }
  10% {
    transform: scale(1.05) rotate(1deg);
  }
  20% {
    transform: scale(1.05) rotate(-1deg);
  }
  30% {
    transform: scale(1.05) rotate(1deg);
  }
  40% {
    transform: scale(1.05) rotate(-1deg);
  }
  50% {
    transform: scale(1.05) rotate(0deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

.dollar-rain-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}

.dollar-bill {
  position: absolute;
  width: 70px;
  height: auto;
  top: -100px;
  opacity: 0;
}

.dollar-1 {
  left: 10%;
  animation: falling1 10s linear infinite;
  animation-delay: 1s;
}

.dollar-2 {
  left: 25%;
  animation: falling2 8s linear infinite;
  animation-delay: 0s;
}

.dollar-3 {
  left: 40%;
  animation: falling3 12s linear infinite;
  animation-delay: 3s;
}

.dollar-4 {
  left: 60%;
  animation: falling4 9s linear infinite;
  animation-delay: 2s;
}

.dollar-5 {
  left: 75%;
  animation: falling5 11s linear infinite;
  animation-delay: 0.5s;
}

.dollar-6 {
  left: 90%;
  animation: falling1 10s linear infinite;
  animation-delay: 4s;
}

.dollar-7 {
  left: 15%;
  animation: falling3 9s linear infinite;
  animation-delay: 6s;
}

.dollar-8 {
  left: 50%;
  animation: falling2 11s linear infinite;
  animation-delay: 5s;
}

.dollar-9 {
  left: 85%;
  animation: falling5 13s linear infinite;
  animation-delay: 7s;
}

.dollar-10 {
  left: 30%;
  animation: falling4 9.5s linear infinite;
  animation-delay: 3.5s;
}

.wallet-image {
  position: absolute;
  top: 5%;
  right: 5%;
  width: 270px;
  height: auto;
  z-index: 2;
  animation: vibrate 5s ease-in-out infinite;
  animation-delay: 2s;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .wallet-image {
    width: 180px;
    top: 3%;
    right: 3%;
  }
}

@media (max-width: 480px) {
  .wallet-image {
    width: 150px;
    top: 2%;
    right: 2%;
  }
}
`;

interface HeroSectionV2Props {
  scrollToCheckout: () => void;
}

export function HeroSectionV2({ scrollToCheckout }: HeroSectionV2Props) {
  const [startupIdea, setStartupIdea] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [hasExistingCanvas, setHasExistingCanvas] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea function
  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set new height based on content
      textarea.style.height = `${Math.min(textarea.scrollHeight, window.innerHeight * 0.4)}px`;
    }
  };

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

  // Auto-resize textarea when content changes
  useEffect(() => {
    autoResizeTextarea();
  }, [startupIdea]);

  // Adjust height on window resize
  useEffect(() => {
    window.addEventListener('resize', autoResizeTextarea);
    return () => {
      window.removeEventListener('resize', autoResizeTextarea);
    };
  }, []);

  const handleStartupIdeaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Limit to 2500 characters
    const limitedValue = e.target.value.slice(0, 2500);
    setStartupIdea(limitedValue);
  };

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
    <section className="w-full px-4 py-16 sm:py-24 lg:py-32 bg-gradient-to-br from-orange-50/50 via-white to-orange-50/50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950 relative overflow-hidden">
      {/* Inject the animation styles */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      {/* Wallet Image */}
      <img src={walletImage} alt="Wallet in crosshairs" className="wallet-image" />
      
      {/* Falling Dollar Bills */}
      <div className="dollar-rain-container">
        <img src={dollarBillImage} alt="" className="dollar-bill dollar-1" />
        <img src={dollarBillImage} alt="" className="dollar-bill dollar-2" />
        <img src={dollarBillImage} alt="" className="dollar-bill dollar-3" />
        <img src={dollarBillImage} alt="" className="dollar-bill dollar-4" />
        <img src={dollarBillImage} alt="" className="dollar-bill dollar-5" />
        <img src={dollarBillImage} alt="" className="dollar-bill dollar-6" />
        <img src={dollarBillImage} alt="" className="dollar-bill dollar-7" />
        <img src={dollarBillImage} alt="" className="dollar-bill dollar-8" />
        <img src={dollarBillImage} alt="" className="dollar-bill dollar-9" />
        <img src={dollarBillImage} alt="" className="dollar-bill dollar-10" />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <AnimatedSection>
          {/* Header - First Focal Point */}
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-1.5 bg-primary/10 dark:bg-primary/20 rounded-full text-primary font-medium text-sm mb-4">
              <span className="mr-2">🧲</span> Traction-Hungry Founders
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-2">
              Build something people 
              <span className="relative mx-2 inline-block">
                <span className="relative z-10 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text px-2 text-transparent">
                  beg
                </span>
                <svg className="absolute -bottom-1 sm:-bottom-2 left-0 -z-0 h-2 sm:h-3 w-full text-orange-500 dark:text-orange-400" viewBox="0 0 100 12" preserveAspectRatio="none">
                  <path d="M0,0 Q50,12 100,0" stroke="currentColor" strokeWidth="8" fill="none">
                    <animate attributeName="d" dur="4s" repeatCount="indefinite"
                      values="M0,0 Q50,12 100,0;M0,0 Q50,8 100,0;M0,0 Q50,12 100,0" />
                  </path>
                </svg>
              </span>
              to pay for
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              InnerFlame is your <strong className="font-bold">superhuman startup mentor</strong>
            </p>
          </div>
          
          {/* Idea Input - Second Focal Point */}
          <div className="max-w-3xl mx-auto mb-16">
            <Card className="border-2 border-primary/20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur shadow-lg relative">
              {/* Price tag */}
              <div className="absolute -top-4 -right-3 z-10 rotate-12">
                <div className="bg-green-500 text-white font-bold px-4 py-1 rounded-full shadow-lg transform -rotate-12">
                  No Signup & FREE
                </div>
              </div>
              
              <CardContent className="p-6 md:p-8">              
                <div className="space-y-4">
                  {!hasExistingCanvas && (
                    <>
                      <p className="text-left text-sm md:text-base text-neutral-700 dark:text-neutral-300 mb-2">
                      <strong className="font-bold">STEP 1:</strong> Idea in → Canvas out
                      </p>
                      <Textarea
                        id="startup-idea"
                        ref={textareaRef}
                        placeholder="What business do you want to build?"
                        value={startupIdea}
                        onChange={handleStartupIdeaChange}
                        maxLength={2500}
                        className="resize-none min-h-[120px] max-h-[40vh] w-full border border-gray-200 dark:border-gray-700 focus:border-primary/50 dark:focus:border-primary/70 bg-white dark:bg-neutral-800 dark:placeholder:text-gray-400 overflow-y-auto"
                      />
                    </>
                  )}
                  
                  <Button 
                    onClick={hasExistingCanvas ? handleGoToCanvas : handleGenerateCanvas}
                    size="lg"
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all duration-300 border-0 shadow-lg group text-white font-medium"
                    disabled={isLoading || isCreating || (!hasExistingCanvas && !startupIdea.trim())}
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    {isLoading ? "Loading..." : 
                     isCreating ? "Creating Canvas..." : 
                     hasExistingCanvas ? "Go to My Lean Canvas" : 
                     "Generate Lean Canvas in 30 seconds"}
                    <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <p className="mt-6 text-center text-neutral-700 dark:text-neutral-300 text-sm font-medium">
              <span className="text-orange-500 font-semibold">Save months</span> of blind pivots
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
} 