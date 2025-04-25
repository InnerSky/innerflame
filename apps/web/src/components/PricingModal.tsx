import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.js';
import { PlanSelector } from '@/components/founders-lab/PlanSelector.js';
import { AuthModal } from '@/components/auth/AuthModal.js';
import { Button } from '@/components/ui/button.js';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
  const authTriggerRef = useRef<HTMLButtonElement>(null);
  
  const handleFreePlanClick = () => {
    // Close the pricing modal
    onOpenChange(false);
    
    // Trigger the auth modal by clicking the hidden button
    setTimeout(() => {
      authTriggerRef.current?.click();
    }, 100); // Small delay to allow the pricing modal to close
  };
  
  const handlePlusPlanClick = () => {
    // For now, just close the modal and perhaps navigate to a checkout page
    onOpenChange(false);
    
    // You could add code here to navigate to a checkout page or show another modal
    // window.location.href = '/checkout/plus';
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
              Pricing
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <PlanSelector 
              onFreePlanClick={handleFreePlanClick}
              onPlusPlanClick={handlePlusPlanClick}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Hidden trigger button for AuthModal */}
      <div className="hidden">
        <AuthModal 
          defaultTab="sign-up"
          trigger={<Button ref={authTriggerRef}>Sign Up</Button>}
        />
      </div>
    </>
  );
} 