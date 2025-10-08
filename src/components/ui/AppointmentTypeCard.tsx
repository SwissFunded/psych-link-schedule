import React from 'react';
import { MapPin, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppointmentTypeCardProps {
  type: 'in-person' | 'video';
  selected: boolean;
  onClick: () => void;
}

export default function AppointmentTypeCard({ type, selected, onClick }: AppointmentTypeCardProps) {
  const isInPerson = type === 'in-person';
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg border-2 transition-all flex items-center space-x-3",
        selected 
          ? "border-psychPurple bg-psychPurple/5" 
          : "border-gray-200 hover:border-psychPurple/50"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center",
        selected ? "bg-psychPurple text-white" : "bg-gray-100 text-gray-600"
      )}>
        {isInPerson ? <MapPin className="w-5 h-5" /> : <Video className="w-5 h-5" />}
      </div>
      <span className={cn(
        "font-medium",
        selected ? "text-psychText" : "text-gray-600"
      )}>
        {isInPerson ? "Vor Ort" : "Virtuell"}
      </span>
    </button>
  );
}
