import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  Clock, 
  CheckCircle2, 
  Target, 
  Users, 
  BarChart, 
  Brain, 
  Calendar, 
  CreditCard,
  Wallet,
  ArrowRight,
  ArrowUpRight,
  Star
} from "lucide-react";

import { AnimatedSection } from "@/components/animated-section";

export default function FoundersLab() {
  const checkoutRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const scrollToCheckout = () => {
    checkoutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCheckout = () => {
    // Get the email from the input field
    const emailInput = document.getElementById('email') as HTMLInputElement;
    if (emailInput && emailInput.value.trim() !== "") {
      setEmail(emailInput.value);
      setDialogOpen(true);
    } else {
      // Focus on the email input if it's empty
      emailInput?.focus();
    }
  };

  return (
    <main className="pt-4 sm:pt-0">
      {/* Hero Section with animated background */}
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
              <filter id="goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                <feColorMatrix in="blur" mode="matrix" 
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
                <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
              </filter>
            </defs>
            <g filter="url(#goo)">
              <circle cx="30%" cy="30%" r="15%" fill="url(#grad1)" className="animate-blob">
                <animate attributeName="cx" values="30%;40%;30%" dur="10s" repeatCount="indefinite" />
                <animate attributeName="cy" values="30%;40%;30%" dur="10s" repeatCount="indefinite" />
              </circle>
              <circle cx="70%" cy="70%" r="15%" fill="url(#grad1)" className="animate-blob">
                <animate attributeName="cx" values="70%;60%;70%" dur="10s" repeatCount="indefinite" />
                <animate attributeName="cy" values="70%;60%;70%" dur="10s" repeatCount="indefinite" />
              </circle>
            </g>
          </svg>
        </div>

        <AnimatedSection>
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-primary font-medium text-sm mb-4">
                <span className="mr-2">🚀</span> Launch Your Startup Faster
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                The Solo-Founder's Lab
              </h1>
              <h2 className="text-2xl md:text-3xl font-semibold text-primary">
                Build Your Startup Without Wasting Time
              </h2>
              <p className="text-lg italic text-muted-foreground">
                (Without Overwhelm or Guessing What Works)
              </p>
              <p className="text-lg">
                Imagine launching your startup with a clear plan—without spinning your wheels or losing focus.
                Say goodbye to endless planning headaches and hello to a fast, focused path to real customer traction.
              </p>
              <p className="text-lg font-medium">
                <span className="text-primary">The Solo-Founder's Lab</span> gives you the tools to craft your strategy in minutes, 
                test it with customers, and grow with confidence—all without the chaos of going it alone.
              </p>
              <div className="pt-4">
                <Button onClick={scrollToCheckout} size="lg" className="group">
                  Join the Lab
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <div className="mt-6 flex items-center gap-2">
                  <Badge variant="outline" className="px-3 py-1 bg-primary/5">
                    <Clock className="w-3 h-3 mr-1" />
                    Limited Time Offer
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/40 rounded-2xl blur-lg"></div>
                <Card className="relative overflow-hidden border-2 border-primary/20">
                  <CardContent className="p-6">
                    <div className="aspect-video bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070')] bg-cover bg-center rounded-lg mb-6"></div>
                    <h3 className="text-xl font-semibold mb-2">Build your startup with InnerFlame</h3>
                    <p className="text-muted-foreground mb-4">
                      This is the exact system we've used to help founders launch startups in weeks—and now we're sharing it with you!
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Craft your strategy in minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Test with real customers</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Grow with confidence</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Is It For You Section */}
      <section className="py-20 w-full bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Is The Solo-Founder's Lab For You?</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Answer these questions to find out if our program is the right fit for your startup journey.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-card/50 backdrop-blur-sm border border-primary/10 overflow-hidden group hover:border-primary/20 transition-all">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Target className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Do you feel stuck figuring out where to start your startup?</h3>
                  <p className="text-muted-foreground">
                    The Solo-Founder's Lab shows you how to turn your idea into a clear plan fast, so you're not paralyzed by indecision.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border border-primary/10 overflow-hidden group hover:border-primary/20 transition-all">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Clock className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Are you tired of wasting time on tasks that don't get you closer to customers?</h3>
                  <p className="text-muted-foreground">
                    We'll help you focus only on what matters, cutting through the noise to reach real users sooner.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border border-primary/10 overflow-hidden group hover:border-primary/20 transition-all">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Brain className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Do you worry you're experimenting blindly without a strategy?</h3>
                  <p className="text-muted-foreground">
                    This Lab guides you to test your ideas intentionally, so every step teaches you something valuable.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-12">
              <p className="text-lg mb-6">
                If you said yes to any of these, <span className="font-semibold">The Solo-Founder's Lab</span> is your shortcut to launching smarter—without losing your precious time or sanity.
              </p>
              <Button onClick={scrollToCheckout} size="lg" className="group">
                Get Started Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Creators Section */}
      <section className="py-20 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Startup Lab Creators</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Created by the team at InnerFlame—passionate builders who've been in your shoes.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 max-w-3xl mx-auto">
              <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-card to-muted">
                <div className="h-64 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop" 
                    alt="Emma" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">Emma</h3>
                  <p className="text-muted-foreground">
                    Founder of InnerFlame. Bootstrapped two startups to thousands of users, including one that hit traction in under a year.
                  </p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-card to-muted">
                <div className="h-64 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40?q=80&w=2070&auto=format&fit=crop" 
                    alt="Alex" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">Alex</h3>
                  <p className="text-muted-foreground">
                    Tech innovator with a decade of experience building tools that scale startups from zero to success.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-16 text-center">
              <p className="text-lg font-medium mb-6">
                We've lived the bootstrapping grind—and now we're here to help you succeed faster.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Data Points Section */}
      <section className="py-20 w-full bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">A Few Data Points to Prove We Get Startups</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <p className="text-center font-medium">Helped 50+ founders launch in weeks</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8" />
                </div>
                <p className="text-center font-medium">Cut planning time by 70% for early users</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <BarChart className="h-8 w-8" />
                </div>
                <p className="text-center font-medium">Guided startups to 5,000+ combined users</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Brain className="h-8 w-8" />
                </div>
                <p className="text-center font-medium">Crafted 200+ strategies with MentorAI</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Stop Wasting Time Section */}
      <section className="py-20 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Stop Wasting Time—Start Building With Focus</h2>
            </div>

            <div className="max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold mb-6 text-center">Most solo founders face these 3 big challenges:</h3>
              
              <div className="space-y-4 mb-12">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p>Hours lost on vague plans that go nowhere</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p>Distraction from too many tasks, stalling progress</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p>Slow traction because real customer feedback feels out of reach</p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-6">
                <p className="text-lg font-medium mb-4 text-center">
                  The Solo-Founder's Lab solves these challenges by giving you:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-card p-4 rounded-md border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">Clear Strategy Framework</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      A step-by-step approach to defining your startup strategy in hours, not weeks
                    </p>
                  </div>
                  <div className="bg-card p-4 rounded-md border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">Customer Focus Tools</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Methods to reach and learn from real users right from the start
                    </p>
                  </div>
                  <div className="bg-card p-4 rounded-md border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">Focused Action Plans</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Prioritized tasks that actually move the needle on your business
                    </p>
                  </div>
                  <div className="bg-card p-4 rounded-md border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">Community Support</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Connect with other founders on similar journeys for accountability
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Pricing/Checkout Section */}
      <section ref={checkoutRef} className="py-20 w-full bg-muted/50" id="checkout">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Join The Solo-Founder's Lab Today</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Start building your focused startup strategy with our proven framework
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <Card className="overflow-hidden border-primary/20">
                <div className="bg-primary text-primary-foreground p-6 text-center">
                  <h3 className="text-2xl font-bold">Founder's Lab Membership</h3>
                  <div className="mt-4 flex items-center justify-center">
                    <span className="text-4xl font-bold">$197</span>
                    <span className="ml-1 text-lg">/month</span>
                  </div>
                  <p className="mt-2 text-primary-foreground/80">Cancel anytime</p>
                </div>
                
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <p>Complete Strategy Framework Access</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <p>Weekly Coaching Calls</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <p>Private Community Access</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <p>Founder Tools Library</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <p>Personal Startup Roadmap</p>
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
                      By joining, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Everything you need to know about the Solo-Founder's Lab
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="mt-6">
                  <div className="divide-y">
                    <div className="py-4">
                      <h3 className="text-lg font-medium">Is this right for me if I don't have a tech background?</h3>
                      <p className="mt-2 text-muted-foreground">
                        Absolutely! The Lab is designed for founders from all backgrounds. We provide frameworks that help you think clearly about your startup regardless of your technical expertise.
                      </p>
                    </div>
                    <div className="py-4">
                      <h3 className="text-lg font-medium">How much time do I need to commit each week?</h3>
                      <p className="mt-2 text-muted-foreground">
                        We recommend at least 5-7 hours per week to see meaningful progress. The program is self-paced, but consistent effort yields the best results.
                      </p>
                    </div>
                    <div className="py-4">
                      <h3 className="text-lg font-medium">Can I get a refund if it's not for me?</h3>
                      <p className="mt-2 text-muted-foreground">
                        Yes, we offer a 14-day money-back guarantee. If you feel the Lab isn't right for you after trying it, simply let us know and we'll process your refund.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="technical" className="mt-6">
                  <div className="divide-y">
                    <div className="py-4">
                      <h3 className="text-lg font-medium">What tools do I need to participate?</h3>
                      <p className="mt-2 text-muted-foreground">
                        Just a computer with internet access and a willingness to learn! All our resources are cloud-based, so you don't need to install special software.
                      </p>
                    </div>
                    <div className="py-4">
                      <h3 className="text-lg font-medium">How do I access the community?</h3>
                      <p className="mt-2 text-muted-foreground">
                        After joining, you'll receive an email with instructions to access our private Discord community where you can connect with fellow founders and mentors.
                      </p>
                    </div>
                    <div className="py-4">
                      <h3 className="text-lg font-medium">Are the coaching calls recorded?</h3>
                      <p className="mt-2 text-muted-foreground">
                        Yes, all coaching calls are recorded and made available in our members area within 24 hours, so you never miss valuable insights even if you can't attend live.
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
    </main>
  );
} 