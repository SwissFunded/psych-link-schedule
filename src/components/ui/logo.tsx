
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
      {(variant === 'default' || variant === 'icon') && (
        <div className={cn("h-8 w-8 bg-psychText flex items-center justify-center rounded", iconClassName)}>
          <span className="text-white font-gt-pressura font-normal text-xl leading-none">P</span>
        </div>
      )}
      
      {(variant === 'default' || variant === 'full') && (
        <div className={cn("ml-2.5 flex flex-col", textClassName)}>
          <span className="font-gt-pressura text-psychText text-xl leading-none">PsychCentral</span>
          {variant === 'full' && (
            <>
              <span className="font-gt-pressura text-psychText text-xl leading-none">Ambulante</span>
              <span className="font-gt-pressura text-psychText text-xl leading-none">Psychiatrie und</span>
              <span className="font-gt-pressura text-psychText text-xl leading-none">Psychotherapie</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
