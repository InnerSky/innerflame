import { CheckCircle2, Star } from "lucide-react";
import { AnimatedSection } from "@/components/animated-section";

export function DifferenceSection() {
  return (
    <section className="py-20 w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AnimatedSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The InnerFlame Difference</h2>
          </div>

          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-6 text-center">Why traditional approaches fail early-stage founders:</h3>
            
            <div className="space-y-4 mb-12">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p>Too much time invested before receiving any meaningful value</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p>Focus only on business mechanics while ignoring founder personal growth</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p>Building products before validating market demand</p>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-6">
              <p className="text-lg font-medium mb-4 text-center">
                InnerFlame solves these problems through:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-card p-4 rounded-md border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Instant Gratification</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Generate a complete Lean Canvas in seconds from a simple prompt
                  </p>
                </div>
                <div className="bg-card p-4 rounded-md border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">AI Mentor/Coach</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Refine your canvas with personalized guidance that adapts to your needs
                  </p>
                </div>
                <div className="bg-card p-4 rounded-md border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Sell Before You Build</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Powerful tools for market validation before investing significant resources
                  </p>
                </div>
                <div className="bg-card p-4 rounded-md border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Integrated Growth</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Combines business strategy with founder personal development
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
} 