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
    <div className="flex items-center space-x-4 mb-6">
      <Avatar className="h-16 w-16 border-2 border-psychPurple/10">
        {avatarUrl && (
          <img src={avatarUrl} alt={name} className="object-cover" />
        )}
        <AvatarFallback className="bg-psychPurple/10 text-psychPurple font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div>
        <h2 className="text-xl font-semibold text-psychText">{name}</h2>
        <p className="text-sm text-psychText/60">Buchen Sie einen Termin online</p>
      </div>
    </div>
  );
}
