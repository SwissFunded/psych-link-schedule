import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Computer, Building } from "lucide-react";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  date: string;
  type: 'video' | 'in-person';
  duration: 30 | 50 | 60;
  loading: boolean;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  date,
  type,
  duration,
  loading
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Terminbuchung bestätigen</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="flex items-center gap-3">
            {type === 'video' ? (
              <Computer className="h-5 w-5 text-psychPurple" />
            ) : (
              <Building className="h-5 w-5 text-psychPurple" />
            )}
            <div className="font-medium">
              {type === 'video' ? 'Online Termin' : 'Persönlicher Termin'}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="text-muted-foreground">Datum:</div>
            <div>{format(parseISO(date), 'EEEE, d. MMMM yyyy', { locale: de })}</div>
            
            <div className="text-muted-foreground">Uhrzeit:</div>
            <div>{format(parseISO(date), 'HH:mm', { locale: de })} Uhr</div>
            
            <div className="text-muted-foreground">Dauer:</div>
            <div>{duration} Minuten</div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button 
            className="bg-psychPurple hover:bg-psychPurple/90 text-white" 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Wird gebucht..." : "Termin buchen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentModal;
