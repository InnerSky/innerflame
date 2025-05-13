import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  ArrowRight,
  Check,
  Zap,
  Brain,
  FolderArchive,
  BarChart3,
  Lightbulb,
  FileText,
  Wallet,
  Target,
  Clock,
  Shield,
  MessageSquare,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { HeroSectionV2 } from '@/components/founders-lab/HeroSectionV2';
import { PlanSelector } from '@/components/founders-lab/PlanSelector';
import { SEO } from '@/components/SEO';
import { CalendlyEmbed } from '@/features/bookMeetings/index.js';

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
  const [email, setEmail] = useState('');
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
      <SEO
        title="InnerFlame - Your AI Co-Founder"
        description="InnerFlame helps founders navigate challenges with personalized guidance and insights, so you can keep your flame burning bright."
        image="/images/OpenGraphImage.png"
      />

      {/* Add the style for the handwriting font */}
      <style dangerouslySetInnerHTML={{ __html: handwritingFontStyle }} />

      {/* Full-width lake background section */}
      <section className="relative w-full h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/images/lake_bkg.png')` }}
        >
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50"></div>
        </div>

        {/* Text overlay */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 font-young-serif drop-shadow-lg">
            "The co-founder I never knew I needed."
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
            Clarity in days, not months. InnerFlame complements entrepreneur's growth and success
            with positive psychology in mind.
          </p>
        </div>
      </section>

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
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-young-serif">
              Your companion for mission-driven momentum
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              InnerFlame unites purpose alignment, real-world experiments, and compounding habits in
              one integrated workspace.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-6"
          >
            {/* Stay focused on your WHY */}
            <div className="bg-complement/10 dark:bg-complement/5 rounded-xl p-8 border border-complement/20 dark:border-complement/10 shadow-md transition-transform hover:scale-105 duration-300">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-6">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-center mb-4 font-young-serif">
                  Stay focused on your WHY
                </h3>
                <p className="text-center text-neutral-700 dark:text-neutral-300">
                  InnerFlame maps every decision and task back to your North Star, ending mission
                  drift and clarifying what matters most.
                </p>
              </div>
            </div>

            {/* Stress-test your business model */}
            <div className="bg-complement/10 dark:bg-complement/5 rounded-xl p-8 border border-complement/20 dark:border-complement/10 shadow-md transition-transform hover:scale-105 duration-300">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-6">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-center mb-4 font-young-serif">
                  Stress-test your business model
                </h3>
                <p className="text-center text-neutral-700 dark:text-neutral-300">
                  Surface your riskiest hypotheses and run lean experiments that uncover truth in
                  days, not quarters.
                </p>
              </div>
            </div>

            {/* Build compounding habits */}
            <div className="bg-complement/10 dark:bg-complement/5 rounded-xl p-8 border border-complement/20 dark:border-complement/10 shadow-md transition-transform hover:scale-105 duration-300">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-6">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-center mb-4 font-young-serif">
                  Build compounding habits
                </h3>
                <p className="text-center text-neutral-700 dark:text-neutral-300">
                  Design sprints, daily check-ins, and weekly reviews keep momentum high and burnout
                  low.
                </p>
              </div>
            </div>

            {/* Private and secure */}
            <div className="bg-complement/10 dark:bg-complement/5 rounded-xl p-8 border border-complement/20 dark:border-complement/10 shadow-md transition-transform hover:scale-105 duration-300">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-6">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-center mb-4 font-young-serif">
                  Private and secure
                </h3>
                <p className="text-center text-neutral-700 dark:text-neutral-300">
                  Your data is encrypted in transit and at rest to protect your privacy.
                </p>
              </div>
            </div>

            {/* Speak freely */}
            <div className="bg-complement/10 dark:bg-complement/5 rounded-xl p-8 border border-complement/20 dark:border-complement/10 shadow-md transition-transform hover:scale-105 duration-300">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-6">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-center mb-4 font-young-serif">
                  Speak freely
                </h3>
                <p className="text-center text-neutral-700 dark:text-neutral-300">
                  Tap InnerFlame as mentor, mindfulness coach, or brainstorming partner—anytime, in
                  text or voice.
                </p>
              </div>
            </div>

            {/* Earn loyal customers */}
            <div className="bg-complement/10 dark:bg-complement/5 rounded-xl p-8 border border-complement/20 dark:border-complement/10 shadow-md transition-transform hover:scale-105 duration-300">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-center mb-4 font-young-serif">
                  Earn loyal customers
                </h3>
                <p className="text-center text-neutral-700 dark:text-neutral-300">
                  Guided problem-discovery interviews help you understand users better than they
                  understand themselves.
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-young-serif">
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
                    src="/images/InnerFlame_atmospheric.png"
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
                      We imagine a world where founders wake up feeling clear and confident, spend
                      the day working on problems people actually care about, and head to bed proud
                      of real impact in the world.
                    </p>

                    <p className="handwriting-font text-neutral-700 dark:text-neutral-300">
                      We believe the way to build that world is to give every entrepreneur a simple,
                      living game plan and a tireless AI sidekick—to turn ideas into traction, one
                      proven step at a time.
                    </p>
                  </div>

                  {/* Closing quotation mark */}
                  <div className="absolute bottom-3 right-3 text-6xl text-orange-300/30 dark:text-orange-500/20 font-serif">
                    "
                  </div>

                  {/* Signature-like element */}
                  <div className="mt-8 flex justify-end pr-8">
                    <div className="signature">
                      — <span className="font-young-serif">The InnerFlame Team</span>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-young-serif">Pricing</h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto"></p>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-8 font-young-serif">
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

      {/* Calendly Section with Header */}
      <section className="bg-white dark:bg-neutral-950 pt-20 pb-0">
        <div className="max-w-4xl mx-auto px-4 mb-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-young-serif">
              Book a call with us
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-0">
              Have questions or want to learn more? Schedule a 30-minute call with our team.
            </p>
          </motion.div>
        </div>
        
        {/* Direct embed with responsive settings */}
        <div className="w-full overflow-visible">
          <CalendlyEmbed 
            key="calendly-embed-2"
            className="w-full max-w-[1600px] mx-auto"
            backgroundColor="f8f8f8"
            textColor="313131"
            primaryColor="00c5c3"
            height={900}
            minWidth={320}
            hideScrollbar={true}
          />
        </div>
      </section>

      <div ref={startRef} id="start"></div>
    </main>
  );
}
