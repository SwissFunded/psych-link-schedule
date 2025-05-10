
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
      <div className={cn("flex flex-col bg-psychPurple py-2 px-4 rounded-l-md", 
        variant === 'icon' ? 'rounded-md' : '',
        iconClassName)}>
        <span className="font-gt-pressura text-black text-xl leading-tight">PsychCentral</span>
        <span className="font-gt-pressura text-black text-xl leading-tight">Ambulante</span>
        <span className="font-gt-pressura text-black text-xl leading-tight">Psychiatrie</span>
        <span className="font-gt-pressura text-black text-xl leading-tight">und</span>
        <span className="font-gt-pressura text-black text-xl leading-tight">Psychotherapie</span>
      </div>
      
      {/* Right logo section - Psychologie.ch */}
      {variant !== 'icon' && (
        <div className={cn("flex flex-col bg-psychGreen py-2 px-4 rounded-r-md", textClassName)}>
          <span className="font-gt-pressura text-black text-xl leading-tight">Psychologie.ch</span>
          <span className="font-gt-pressura text-black text-xl leading-tight">Zentrum für</span>
          <span className="font-gt-pressura text-black text-xl leading-tight">Psychotherapie</span>
        </div>
      )}
    </div>
  );
}
