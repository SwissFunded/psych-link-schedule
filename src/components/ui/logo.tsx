
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
      <img 
        src="/lovable-uploads/258abd78-f060-466b-a5e4-b963c44f1d49.png" 
        alt="PsychCentral Logo" 
        className={cn(
          "h-12",
          variant === 'icon' ? 'rounded-md' : '',
          iconClassName
        )}
      />
    </div>
  );
}
