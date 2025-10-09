import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TherapistHeaderProps {
  name: string;
  avatarUrl?: string;
}

export default function TherapistHeader({ name, avatarUrl }: TherapistHeaderProps) {
  // Get initials from name for avatar fallback
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
    
  return (
    <div className="flex items-center gap-3 md:gap-4 mb-0 min-w-0">
      <Avatar className="h-12 w-12 md:h-16 md:w-16 border-2 border-psychPurple/10 flex-shrink-0">
        {avatarUrl && (
          <img src={avatarUrl} alt={name} className="object-cover" />
        )}
        <AvatarFallback className="bg-psychPurple/10 text-psychPurple font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <h2 className="text-base md:text-xl font-semibold text-psychText truncate">{name}</h2>
        <p className="text-xs md:text-sm text-psychText/60 hidden sm:block">Buchen Sie einen Termin online</p>
      </div>
    </div>
  );
}
