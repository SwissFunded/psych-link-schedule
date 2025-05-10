
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
    <div className={cn("flex items-center h-10", className)}>
      {/* Left logo section - PsychCentral */}
      <div className={cn("flex flex-col justify-center bg-psychPurple py-1 px-2 rounded-l-md h-full", 
        variant === 'icon' ? 'rounded-md' : '',
        iconClassName)}>
        <span className="font-gt-pressura text-black text-xs font-medium leading-none">Ambulante</span>
        <span className="font-gt-pressura text-black text-xs font-medium leading-none">Psychiatrie</span>
        <span className="font-gt-pressura text-black text-xs font-medium leading-none">und</span>
      </div>
      
      {/* Right logo section - Psychologie.ch */}
      {variant !== 'icon' && (
        <div className={cn("flex flex-col justify-center bg-psychGreen py-1 px-2 rounded-r-md h-full", textClassName)}>
          <span className="font-gt-pressura text-black text-xs font-medium leading-none">Psychologie.ch</span>
          <span className="font-gt-pressura text-black text-xs font-medium leading-none">Zentrum für</span>
          <span className="font-gt-pressura text-black text-xs font-medium leading-none">Psychotherapie</span>
        </div>
      )}
    </div>
  );
}
