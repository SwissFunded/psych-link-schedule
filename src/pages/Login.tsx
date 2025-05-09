
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, this would send a request to your backend to generate
      // and send a magic link. For demo purposes, we'll simulate a successful response.
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Magic link sent! Check your email", {
        description: "For this demo, use the button below to simulate clicking the link",
        duration: 5000,
      });
      
      // For demo: Add simulate button
      const mockToken = "demo-token-" + Math.random().toString(36).substr(2, 9);
      setTimeout(() => {
        const demoArea = document.getElementById('demo-magic-link');
        if (demoArea) {
          demoArea.innerHTML = `
            <div class="mt-6 p-4 bg-psychPurple/5 rounded-md border border-psychPurple/20">
              <h3 class="text-sm font-medium mb-2">Demo: Simulate magic link</h3>
              <button 
                id="simulate-magic-link"
                class="text-sm text-white bg-psychPurple px-4 py-2 rounded-md w-full"
              >
                Click here to simulate magic link
              </button>
            </div>
          `;
          
          document.getElementById('simulate-magic-link')?.addEventListener('click', () => {
            login(mockToken);
          });
        }
      }, 1500);
      
    } catch (error) {
      console.error("Error sending magic link:", error);
      toast.error("Failed to send login link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-psychPurple/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-psychPurple">PsychCentral</h1>
          <p className="text-psychText/60 mt-2">Appointment Scheduler</p>
        </div>
        
        <Card className="w-full border-psychPurple/10 card-shadow">
          <CardHeader>
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your email to receive a magic link
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-psychPurple/20 focus:border-psychPurple"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                className="w-full bg-psychPurple hover:bg-psychPurple/90" 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Magic Link"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div id="demo-magic-link" className="mt-4"></div>
        
        <p className="text-center text-sm text-psychText/50 mt-8">
          Need help? Contact your therapist's office
        </p>
      </div>
    </div>
  );
}
