import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';

interface AuthModalProps {
  defaultTab?: 'sign-in' | 'sign-up';
  trigger?: React.ReactNode;
}

export function AuthModal({ defaultTab = 'sign-in', trigger }: AuthModalProps) {
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
            Welcome to InnerFlame
          </DialogTitle>
          <DialogDescription className="text-center">
            Join our community of founders and access exclusive content
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={defaultTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign-in">Sign In</TabsTrigger>
            <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="sign-in" className="mt-4">
            <SignInForm />
          </TabsContent>
          <TabsContent value="sign-up" className="mt-4">
            <SignUpForm />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}