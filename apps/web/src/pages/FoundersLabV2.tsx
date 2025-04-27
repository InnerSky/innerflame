import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Check, Zap, Brain, FolderArchive, BarChart3, Lightbulb, FileText, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { HeroSectionV2 } from "@/components/founders-lab/HeroSectionV2";
import { PlanSelector } from "@/components/founders-lab/PlanSelector";
import atmosphericImage from "@/assets/images/InnerFlame_atmospheric.png";

// Add Google Fonts import for a handwriting font
const handwritingFontStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Architects+Daughter&display=swap');
  
  .handwriting-font {
    font-family: 'Architects Daughter', cursive;
    font-size: 1.3rem;
    line-height: 1.6;
    letter-spacing: 0.02em;
  }
  
  .signature {
    font-family: 'Architects Daughter', cursive;
    font-size: 1.5rem;
    font-weight: 500;
    color: #f97316;
  }
`;

export default function FoundersLabV2() {
  const startRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [showWhySection, setShowWhySection] = useState(false);
  const [showPricingSection, setShowPricingSection] = useState(false);

  const scrollToStart = () => {
    startRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHero = () => {
    // Scroll to the top of the page to show the hero section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="flex flex-col w-full overflow-hidden">
      {/* Add the style for the handwriting font */}
      <style dangerouslySetInnerHTML={{ __html: handwritingFontStyle }} />
      
      {/* HeroSectionV2 */}
      <div className="w-full" ref={heroRef}>
        <HeroSectionV2 scrollToCheckout={scrollToStart} />
      </div>
      
      {/* Process Steps Section */}
      <section className="py-20 bg-white dark:bg-neutral-950">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How does InnerFlame work?
            </h2>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
          >
            {/* Step 1: Idea In */}
            <div className="bg-orange-50 dark:bg-neutral-900 rounded-xl p-8 border border-orange-100 dark:border-neutral-800 shadow-md transition-transform hover:scale-105 duration-300">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-6">
                  <Lightbulb className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-center mb-4">Idea In</h3>
                <p className="text-center text-neutral-700 dark:text-neutral-300">
                  Just type one sentence about the product you want to build.
                </p>
              </div>
            </div>
            
            {/* Step 2: Canvas Out */}
            <div className="bg-orange-50 dark:bg-neutral-900 rounded-xl p-8 border border-orange-100 dark:border-neutral-800 shadow-md transition-transform hover:scale-105 duration-300">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-6">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-center mb-4">Canvas Out</h3>
                <p className="text-center text-neutral-700 dark:text-neutral-300">
                Our AI instantly turns it into a crisp Lean Canvas and lets you refine your assumptions on the spot.
                </p>
              </div>
            </div>
            
            {/* Step 3: Validate with Wallet */}
            <div className="bg-orange-50 dark:bg-neutral-900 rounded-xl p-8 border border-orange-100 dark:border-neutral-800 shadow-md transition-transform hover:scale-105 duration-300">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-6">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-center mb-4">Validate</h3>
                <p className="text-center text-neutral-700 dark:text-neutral-300">
                  Run experiments with your AI mentor and see if real customers pay—proof in days, not months.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Why We Do What We Do Section */}
      {showWhySection && (
        <section className="py-20 bg-gradient-to-br from-orange-50/50 via-white to-orange-50/50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why we do what we do
              </h2>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center"
            >
              {/* Placeholder image */}
              <div className="order-2 md:order-1 flex justify-center">
                <div className="bg-orange-100 dark:bg-neutral-800 rounded-xl overflow-hidden shadow-lg w-full max-w-md flex items-center justify-center">
                  <img 
                    src={atmosphericImage} 
                    alt="InnerFlame Vision" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
              
              {/* Mission text */}
              <div className="order-1 md:order-2">
                <div className="bg-white dark:bg-neutral-900 p-6 md:p-8 rounded-xl border border-orange-100 dark:border-neutral-800 shadow-md relative">
                  {/* Decorative quotation mark */}
                  <div className="absolute top-3 left-3 text-6xl text-orange-300/30 dark:text-orange-500/20 font-serif">
                    "
                  </div>
                  
                  <div className="space-y-6 relative z-10 px-8 pt-5">
                    <p className="handwriting-font text-neutral-700 dark:text-neutral-300">
                      We imagine a world where founders wake up feeling clear and confident, spend the day working on problems people actually care about, and head to bed proud of real impact in the world.
                    </p>
                    
                    <p className="handwriting-font text-neutral-700 dark:text-neutral-300">
                      We believe the way to build that world is to give every entrepreneur a simple, living game plan and a tireless AI sidekick—to turn ideas into traction, one proven step at a time.
                    </p>
                  </div>
                  
                  {/* Closing quotation mark */}
                  <div className="absolute bottom-3 right-3 text-6xl text-orange-300/30 dark:text-orange-500/20 font-serif">
                    "
                  </div>
                  
                  {/* Signature-like element */}
                  <div className="mt-8 flex justify-end pr-8">
                    <div className="signature">
                      — The InnerFlame Team
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}
      
      {/* Plan Selector Section */}
      {showPricingSection && (
        <section className="py-20 bg-white dark:bg-neutral-950">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pricing
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
                
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <PlanSelector />
            </motion.div>
          </div>
        </section>
      )}
      
      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              Your dream is one click from clarity
            </h2>
            
            <Button 
              onClick={scrollToHero}
              size="lg" 
              className="text-base md:text-lg px-8 py-6 font-medium group bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all duration-300 border-0 shadow-lg"
            >
              Start for $0
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>
      
      <div ref={startRef} id="start"></div>
    </main>
  );
} 