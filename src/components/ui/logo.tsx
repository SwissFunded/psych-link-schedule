
import React from 'react';
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: 'default' | 'full' | 'icon';
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export function Logo({ 
  variant = 'default', 
  className,
  iconClassName,
  textClassName
}: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {/* Left logo section - PsychCentral */}
      <div className={cn("flex flex-col bg-psychPurple/30 py-2 px-4 rounded-l-md", 
        variant === 'icon' ? 'rounded-md' : '',
        iconClassName)}>
        <span className="font-gt-pressura text-psychText text-xl leading-none">PsychCentral</span>
        <span className="font-gt-pressura text-psychText text-xl leading-none mt-1">Ambulante Psychiatrie</span>
        <span className="font-gt-pressura text-psychText text-xl leading-none mt-1">und Psychotherapie</span>
      </div>
      
      {/* Right logo section - Psychologie.ch */}
      {variant !== 'icon' && (
        <div className={cn("flex flex-col bg-psychGreen py-2 px-4 rounded-r-md", textClassName)}>
          <span className="font-gt-pressura text-psychText text-xl leading-none">Psychologie.ch</span>
          <span className="font-gt-pressura text-psychText text-xl leading-none mt-1">Zentrum für</span>
          <span className="font-gt-pressura text-psychText text-xl leading-none mt-1">Psychotherapie</span>
        </div>
      )}
    </div>
  );
}
