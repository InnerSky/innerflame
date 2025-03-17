import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedSection } from "@/components/animated-section";

interface FAQSectionProps {
  scrollToCheckout: () => void;
}

export function FAQSection({ scrollToCheckout }: FAQSectionProps) {
  return (
    <section className="py-20 w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AnimatedSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Everything you need to know about the Founder's Lab
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="technical">Platform</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="mt-6">
                <div className="divide-y">
                  <div className="py-4">
                    <h3 className="text-lg font-medium">Who is InnerFlame designed for?</h3>
                    <p className="mt-2 text-muted-foreground">
                      InnerFlame is designed primarily for early-stage founders, first-time entrepreneurs, side-hustlers balancing day jobs with startup ambitions, self-directed learners, and startup teams seeking clarity.
                    </p>
                  </div>
                  <div className="py-4">
                    <h3 className="text-lg font-medium">What makes InnerFlame different from other platforms?</h3>
                    <p className="mt-2 text-muted-foreground">
                      Unlike existing solutions, InnerFlame integrates strategic business guidance with founder personal growth, emphasizes market validation before building, and provides immediate value through instant Lean Canvas generation.
                    </p>
                  </div>
                  <div className="py-4">
                    <h3 className="text-lg font-medium">Can I try InnerFlame before subscribing?</h3>
                    <p className="mt-2 text-muted-foreground">
                      Yes! You can generate a complete Lean Canvas and refine it with our AI coach/mentor without creating an account. Experience the value firsthand before deciding to subscribe.
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="technical" className="mt-6">
                <div className="divide-y">
                  <div className="py-4">
                    <h3 className="text-lg font-medium">What are the "sell before you build" tools?</h3>
                    <p className="mt-2 text-muted-foreground">
                      These are premium tools ($20/month) that help you validate your business idea with real customers before building anything. They include a one-page sales page generator, customer onboarding flow designer, and vision concretization tools.
                    </p>
                  </div>
                  <div className="py-4">
                    <h3 className="text-lg font-medium">How does the AI mentor/coach work?</h3>
                    <p className="mt-2 text-muted-foreground">
                      Our AI seamlessly transitions between mentor mode (providing guidance and resources) and coach mode (asking powerful questions) to adapt to your specific needs at different stages of your journey.
                    </p>
                  </div>
                  <div className="py-4">
                    <h3 className="text-lg font-medium">What is the reflective journaling system?</h3>
                    <p className="mt-2 text-muted-foreground">
                      This system provides structured prompts tailored to your current challenges, helps visualize progress, identifies patterns in your reflections, and creates an accountability framework to keep you moving forward.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="text-center mt-12">
            <p className="text-lg mb-6">
              Still have questions? Contact us at <a href="mailto:support@innerflame.xyz" className="text-primary underline">support@innerflame.xyz</a>
            </p>
            <Button onClick={scrollToCheckout} size="lg" className="group">
              Join The Lab Today
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
} 