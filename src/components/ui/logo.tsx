
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
      <div className={cn("flex flex-col bg-psychPurple py-1.5 px-3 rounded-l-md text-center", 
        variant === 'icon' ? 'rounded-md' : '',
        iconClassName)}>
        <span className="font-gt-pressura text-black text-sm leading-tight">PsychCentral</span>
        <span className="font-gt-pressura text-black text-sm leading-tight">Ambulante</span>
        <span className="font-gt-pressura text-black text-sm leading-tight">Psychiatrie</span>
        <span className="font-gt-pressura text-black text-sm leading-tight">und</span>
        <span className="font-gt-pressura text-black text-sm leading-tight">Psychotherapie</span>
      </div>
      
      {/* Right logo section - Psychologie.ch */}
      {variant !== 'icon' && (
        <div className={cn("flex flex-col bg-psychGreen py-1.5 px-3 rounded-r-md text-center", textClassName)}>
          <span className="font-gt-pressura text-black text-sm leading-tight">Psychologie.ch</span>
          <span className="font-gt-pressura text-black text-sm leading-tight">Zentrum für</span>
          <span className="font-gt-pressura text-black text-sm leading-tight">Psychotherapie</span>
        </div>
      )}
    </div>
  );
}
