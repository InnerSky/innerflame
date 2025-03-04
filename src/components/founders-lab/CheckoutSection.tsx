import { useRef, useState } from 'react';
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedSection } from "@/components/animated-section";
import { Link } from "react-router-dom";

interface CheckoutSectionProps {
  email: string;
  setEmail: (email: string) => void;
  handleCheckout: () => void;
}

export function CheckoutSection({ email, setEmail, handleCheckout }: CheckoutSectionProps) {
  return (
    <section className="py-20 w-full bg-muted/50" id="checkout">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AnimatedSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Join The Founder's Lab Today</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Experience the power of our "sell before you build" approach
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="overflow-hidden border-primary/20">
              <div className="bg-primary text-primary-foreground p-6 text-center">
                <h3 className="text-2xl font-bold">Founder's Lab Membership</h3>
                <div className="mt-4 flex items-center justify-center">
                  <span className="text-4xl font-bold">$20</span>
                  <span className="ml-1 text-lg">/month</span>
                </div>
                <p className="mt-2 text-primary-foreground/80">Cancel anytime</p>
              </div>
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p>One-page sales page generator</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p>Customer onboarding flow designer</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p>Future press releases & testimonials</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p>Advanced journaling system</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p>Premium AI coaching & mentoring</p>
                  </div>
                </div>

                <form className="mt-8 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border border-gray-200 dark:border-gray-700 focus:border-primary/50 dark:focus:border-primary/70 bg-white dark:bg-neutral-800 dark:placeholder:text-gray-400"
                    />
                  </div>
                  <Button 
                    onClick={handleCheckout} 
                    className="w-full" 
                    size="lg"
                  >
                    Join Now
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    By joining, you agree to our <Link to="/usage-policy" className="text-primary hover:underline">Usage Policy</Link> and <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
} 