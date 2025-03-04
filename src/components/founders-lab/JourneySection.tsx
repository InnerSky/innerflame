import { Target, Brain, BarChart, Rocket, Check } from "lucide-react";
import { AnimatedSection } from "@/components/animated-section";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function JourneySection() {
  const journeySteps = [
    {
      icon: Target,
      title: "Ideation & Clarity",
      description: "Generate a complete Lean Canvas in seconds from your business idea",
      benefits: ["Instant business model generation", "Automatic problem-solution fit analysis", "Structured thinking framework"],
      color: "bg-orange-50 dark:bg-orange-950/40",
      borderColor: "border-orange-100 dark:border-orange-900/60",
      iconBg: "bg-white dark:bg-neutral-900",
      iconColor: "text-orange-600 dark:text-orange-400",
      stepColor: "text-orange-600 dark:text-orange-400",
      stepBg: "bg-orange-50 dark:bg-orange-950/40",
      stepBorder: "border-orange-200 dark:border-orange-900/60",
      step: 1
    },
    {
      icon: Brain,
      title: "Refinement",
      description: "Refine your business model with AI coaching that adapts to your needs",
      benefits: ["AI-guided business model refinement", "Personalized improvement suggestions", "Identify blind spots and weaknesses"],
      color: "bg-blue-50 dark:bg-blue-950/40",
      borderColor: "border-blue-100 dark:border-blue-900/60",
      iconBg: "bg-white dark:bg-neutral-900",
      iconColor: "text-blue-600 dark:text-blue-400",
      stepColor: "text-blue-600 dark:text-blue-400",
      stepBg: "bg-blue-50 dark:bg-blue-950/40",
      stepBorder: "border-blue-200 dark:border-blue-900/60",
      step: 2
    },
    {
      icon: BarChart,
      title: "Validation",
      description: "Use our tools to test your ideas with real customers before building",
      benefits: ["Landing page & signup flow generator", "Customer interview framework", "Feedback aggregation tools"],
      color: "bg-indigo-50 dark:bg-indigo-950/40",
      borderColor: "border-indigo-100 dark:border-indigo-900/60",
      iconBg: "bg-white dark:bg-neutral-900",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      stepColor: "text-indigo-600 dark:text-indigo-400",
      stepBg: "bg-indigo-50 dark:bg-indigo-950/40",
      stepBorder: "border-indigo-200 dark:border-indigo-900/60",
      step: 3
    },
    {
      icon: Rocket,
      title: "Launch & Scale",
      description: "Build your product with confidence and scale with proven demand",
      benefits: ["Minimum viable product roadmap", "Growth strategy development", "Scaling framework and metrics"],
      color: "bg-green-50 dark:bg-green-950/40",
      borderColor: "border-green-100 dark:border-green-900/60",
      iconBg: "bg-white dark:bg-neutral-900",
      iconColor: "text-green-600 dark:text-green-400",
      stepColor: "text-green-600 dark:text-green-400",
      stepBg: "bg-green-50 dark:bg-green-950/40",
      stepBorder: "border-green-200 dark:border-green-900/60",
      step: 4
    }
  ];

  return (
    <section className="py-20 w-full bg-white dark:bg-neutral-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/60 mb-6">
              <span className="mr-2 text-orange-600 dark:text-orange-400">📋</span>
              <span className="text-orange-600 dark:text-orange-400 font-medium">Four-Step Process</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Founder Journey with InnerFlame</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our structured approach guides you through each stage of the entrepreneurial process, 
              from ideation to market validation and beyond.
            </p>
          </div>

          {/* Mobile view */}
          <div className="md:hidden relative">
            {/* Vertical connection line */}
            <div className="absolute left-6 top-6 bottom-6 w-[1px] bg-gradient-to-b from-orange-200 via-indigo-200 to-green-200 dark:from-orange-800 dark:via-indigo-800 dark:to-green-800"></div>
            
            <div className="space-y-10">
              {journeySteps.map((step, index) => (
                <div key={index} className="relative pl-16">
                  {/* Step circle directly on the vertical line */}
                  <div className="absolute left-0 top-0">
                    <div className={cn(
                      "absolute left-6 h-12 w-12 rounded-full border flex items-center justify-center transform -translate-x-1/2",
                      step.stepBg,
                      step.stepBorder,
                      step.stepColor
                    )}>
                      <span className="font-medium">{step.step}</span>
                    </div>
                  </div>
                  
                  {/* Card - rest of the card content remains unchanged */}
                  <div className={cn(
                    "rounded-xl border p-5",
                    step.color,
                    step.borderColor
                  )}>
                    <div className="flex items-start mb-3">
                      <div className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0",
                        step.iconBg,
                        step.iconColor
                      )}>
                        <step.icon className="h-6 w-6" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-xl font-bold mb-1">{step.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{step.description}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      {step.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop view with connected journey path */}
          <div className="hidden md:block relative mx-auto mt-16">
            {/* Step circles with numbers */}
            <div className="grid md:grid-cols-4 gap-6 mb-6 relative">
              {/* Horizontal connection line */}
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-orange-200 via-indigo-200 to-green-200 dark:from-orange-800 dark:via-indigo-800 dark:to-green-800 -translate-y-1/2"></div>
              
              {journeySteps.map((step, index) => (
                <div key={index} className="flex justify-center">
                  <div className="relative">
                    {/* White dot on the line */}
                    <div className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-gray-700 -translate-x-1/2 -translate-y-1/2"></div>
                    
                    {/* Step number circle */}
                    <div className={cn(
                      "h-12 w-12 rounded-full border flex items-center justify-center font-medium text-lg z-10 relative",
                      step.stepBg,
                      step.stepBorder,
                      step.stepColor
                    )}>
                      {step.step}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Cards */}
            <div className="grid md:grid-cols-4 gap-6 mt-4">
              {journeySteps.map((step, index) => (
                <div key={index}>
                  <div className={cn(
                    "rounded-xl border p-6 h-full",
                    step.color,
                    step.borderColor
                  )}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center",
                        step.iconBg,
                        step.iconColor
                      )}>
                        <step.icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold">{step.title}</h3>
                    </div>
                    
                    <p className="mb-4 text-gray-600 dark:text-gray-300">{step.description}</p>
                    
                    <div className="space-y-2">
                      {step.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <div className="inline-block px-6 py-4 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/60">
              <p className="text-lg font-medium text-orange-600 dark:text-orange-400 mb-2">
                Ready to start your founder journey?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Our structured process has helped hundreds of founders go from idea to validated business
              </p>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
} 