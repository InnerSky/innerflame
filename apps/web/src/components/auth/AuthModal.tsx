import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AuthGoogleButtons } from './AuthGoogleButtons';

interface AuthModalProps {
  defaultTab?: 'sign-in' | 'sign-up';
  trigger?: React.ReactNode;
}

export function AuthModal({ trigger }: AuthModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="relative overflow-hidden">
            <span className="relative z-10">Sign In</span>
            <div className="absolute inset-0 -z-0 translate-y-full bg-gradient-to-r from-orange-600 to-red-600 transition-transform duration-300 hover:translate-y-0"></div>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Ignite Your InnerFlame
          </DialogTitle>
          <DialogDescription className="text-center">
            Dream big, ship fast, and love the journey
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <AuthGoogleButtons />
        </div>
      </DialogContent>
    </Dialog>
  );
}