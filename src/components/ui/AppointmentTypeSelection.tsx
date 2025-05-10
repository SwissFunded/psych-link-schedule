
import React from 'react';
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Computer, Building } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from "@/components/ui/form";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useForm } from "react-hook-form";

export interface AppointmentTypeValues {
  type: 'video' | 'in-person';
  duration: 30 | 60;
}

interface AppointmentTypeSelectionProps {
  value: AppointmentTypeValues;
  onChange: (value: AppointmentTypeValues) => void;
}

export const AppointmentTypeSelection: React.FC<AppointmentTypeSelectionProps> = ({
  value,
  onChange
}) => {
  const form = useForm<AppointmentTypeValues>({
    defaultValues: value
  });

  // Update the parent component when values change
  const handleValueChange = (newValue: Partial<AppointmentTypeValues>) => {
    const updatedValue = { ...value, ...newValue };
    
    // If type is video, force duration to 30
    if (newValue.type === 'video') {
      updatedValue.duration = 30;
    }
    
    onChange(updatedValue as AppointmentTypeValues);
    
    // Update form values for controlled components
    if (newValue.type) {
      form.setValue('type', newValue.type);
    }
    if (newValue.duration) {
      form.setValue('duration', newValue.duration);
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-md font-medium">Termin Art</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => handleValueChange({ type: value as 'video' | 'in-person' })}
                  defaultValue={field.value}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <FormItem>
                    <FormLabel className="cursor-pointer">
                      <Card className={`border-2 transition-all ${
                        value.type === 'video' ? 'border-psychPurple bg-psychPurple/5' : 'border-psychPurple/20 hover:border-psychPurple/40'
                      }`}>
                        <CardContent className="flex flex-col items-center p-4 space-y-2">
                          <FormControl>
                            <RadioGroupItem value="video" className="sr-only" />
                          </FormControl>
                          <Computer className={`h-12 w-12 ${
                            value.type === 'video' ? 'text-psychPurple' : 'text-psychText/60'
                          }`} />
                          <span className={`font-medium ${
                            value.type === 'video' ? 'text-psychPurple' : 'text-psychText'
                          }`}>
                            Online Termin (30 Min.)
                          </span>
                        </CardContent>
                      </Card>
                    </FormLabel>
                  </FormItem>

                  <FormItem>
                    <FormLabel className="cursor-pointer">
                      <Card className={`border-2 transition-all ${
                        value.type === 'in-person' ? 'border-psychPurple bg-psychPurple/5' : 'border-psychPurple/20 hover:border-psychPurple/40'
                      }`}>
                        <CardContent className="flex flex-col items-center p-4 space-y-2">
                          <FormControl>
                            <RadioGroupItem value="in-person" className="sr-only" />
                          </FormControl>
                          <Building className={`h-12 w-12 ${
                            value.type === 'in-person' ? 'text-psychPurple' : 'text-psychText/60'
                          }`} />
                          <span className={`font-medium ${
                            value.type === 'in-person' ? 'text-psychPurple' : 'text-psychText'
                          }`}>
                            Persönlicher Termin
                          </span>
                        </CardContent>
                      </Card>
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        {value.type === 'in-person' && (
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-md font-medium">Termindauer</FormLabel>
                <FormControl>
                  <ToggleGroup
                    type="single"
                    value={field.value.toString()}
                    onValueChange={(value) => value && handleValueChange({ duration: parseInt(value) as 30 | 60 })}
                    className="justify-start"
                    variant="outline"
                  >
                    <ToggleGroupItem 
                      value="30"
                      className={`border-psychPurple/20 ${value.duration === 30 ? 'bg-psychPurple text-white' : ''}`}
                    >
                      30 Minuten
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="60"
                      className={`border-psychPurple/20 ${value.duration === 60 ? 'bg-psychPurple text-white' : ''}`}
                    >
                      60 Minuten
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>
    </Form>
  );
};

export default AppointmentTypeSelection;
