import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: string;
  label: string;
  complete: boolean;
  current: boolean;
}

interface StepperProps {
  steps: Step[];
  className?: string;
}

export default function Stepper({ steps, className }: StepperProps) {
  return (
    <div className={cn("relative", className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="relative">
          <div className="flex items-start mb-8 last:mb-0">
            <div className="flex items-center">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all z-10 bg-white",
                  step.complete ? "bg-psychPurple border-psychPurple" : 
                  step.current ? "border-psychPurple bg-white" : 
                  "border-gray-300 bg-white"
                )}
              >
                {step.complete ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span 
                    className={cn(
                      "text-sm font-medium",
                      step.current ? "text-psychPurple" : "text-gray-400"
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </div>
            </div>
            <div className="ml-4 pt-2">
              <p 
                className={cn(
                  "text-sm font-medium transition-colors",
                  step.complete || step.current ? "text-psychText" : "text-gray-400"
                )}
              >
                {step.label}
              </p>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div 
              className={cn(
                "absolute left-5 top-10 w-0.5 h-[calc(100%-40px)] transition-colors",
                step.complete ? "bg-psychPurple" : "bg-gray-300"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
