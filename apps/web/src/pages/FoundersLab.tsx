import { useState, useRef } from 'react';

import { 
  HeroSection,
  IsItForYouSection,
  ApproachSection,
  JourneySection,
  DifferenceSection,
  CheckoutSection,
  FAQSection
} from '@/components/founders-lab';

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
      <HeroSection scrollToCheckout={scrollToCheckout} />
      <IsItForYouSection scrollToCheckout={scrollToCheckout} />
      <ApproachSection />
      <JourneySection />
      <DifferenceSection />
      <div ref={checkoutRef}>
        <CheckoutSection 
          email={email} 
          setEmail={setEmail} 
          handleCheckout={handleCheckout} 
                      />
                    </div>
      <FAQSection scrollToCheckout={scrollToCheckout} />
    </main>
  );
} 