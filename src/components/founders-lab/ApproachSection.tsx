import { Target, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedSection } from "@/components/animated-section";

export function ApproachSection() {
  return (
    <section className="py-20 w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AnimatedSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Approach to Founder Development</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              InnerFlame reimagines the founder journey through integrated features that combine business strategy with personal growth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-3xl mx-auto">
            <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-card to-muted">
              <div className="h-64 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                <Target className="h-32 w-32 text-primary/30" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">AI-Guided Lean Canvas</h3>
                <p className="text-muted-foreground">
                  Our smart AI adapts to your responses, guiding you through market-first thinking and providing tailored resource recommendations for your specific situation.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-card to-muted">
              <div className="h-64 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                <Brain className="h-32 w-32 text-primary/30" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">Reflective Journaling System</h3>
                <p className="text-muted-foreground">
                  Structured prompts, progress visualization, and pattern recognition help you track your growth, identify recurring themes, and maintain accountability.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 text-center">
            <p className="text-lg font-medium mb-6">
              Our AI seamlessly transitions between mentor mode (providing guidance) and coach mode (asking powerful questions) to meet you where you are in your journey.
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
} 