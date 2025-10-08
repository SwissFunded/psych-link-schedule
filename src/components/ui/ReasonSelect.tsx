import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReasonSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const reasons = [
  { value: 'folgetermin-30', label: 'Folgetermin (30 Minuten)' },
  { value: 'folgetermin-60', label: 'Folgetermin (60 Minuten)' },
  { value: 'telefontermin', label: 'Telefontermin (30 Minuten)' },
];

export default function ReasonSelect({ value, onChange, disabled }: ReasonSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-psychText/70">
        Wählen Sie Ihren Behandlungsgrund
      </label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full border-psychPurple/20">
          <SelectValue placeholder="Wählen Sie Ihren Behandlungsgrund" />
        </SelectTrigger>
        <SelectContent>
          {reasons.map((reason) => (
            <SelectItem key={reason.value} value={reason.value}>
              {reason.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
