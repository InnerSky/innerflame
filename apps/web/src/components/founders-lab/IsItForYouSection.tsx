import { ArrowRight, Target, Clock, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedSection } from "@/components/animated-section";

interface IsItForYouSectionProps {
  scrollToCheckout: () => void;
}

export function IsItForYouSection({ scrollToCheckout }: IsItForYouSectionProps) {
  return (
    <section className="py-20 w-full bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AnimatedSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Is The Founder's Lab For You?</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              InnerFlame is designed specifically for early-stage entrepreneurs facing these common challenges:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card/50 backdrop-blur-sm border border-primary/10 overflow-hidden group hover:border-primary/20 transition-all">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Do you struggle to articulate your business idea into a coherent model?</h3>
                <p className="text-muted-foreground">
                  InnerFlame helps you gain clarity and structure your thinking, transforming vague ideas into clear business models in seconds.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border border-primary/10 overflow-hidden group hover:border-primary/20 transition-all">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Are you stuck in analysis paralysis, planning without taking action?</h3>
                <p className="text-muted-foreground">
                  Our structured guidance helps you overcome inertia and take meaningful steps forward in your entrepreneurial journey.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border border-primary/10 overflow-hidden group hover:border-primary/20 transition-all">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Do you worry about building a product no one wants?</h3>
                <p className="text-muted-foreground">
                  Our "sell before you build" approach ensures you validate your ideas with real customers before investing significant resources.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-lg mb-6">
              If you said yes to any of these, <span className="font-semibold">The Founder's Lab</span> provides the clarity, structure, and validation tools you need to move forward with confidence.
            </p>
            <Button onClick={scrollToCheckout} size="lg" className="group">
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
} 