import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService, TimeSlot } from '@/services/appointmentService';
import { recheckTimeSlot, clearAllCalendarCache } from '@/services/vitabyteCalendarService';
import { format, addDays, startOfDay, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { toast } from 'sonner';
import TherapistHeader from '@/components/ui/TherapistHeader';
import Stepper, { Step } from '@/components/ui/Stepper';
import AppointmentTypeCard from '@/components/ui/AppointmentTypeCard';
import ReasonSelect, { reasons } from '@/components/ui/ReasonSelect';
import DayCarousel from '@/components/ui/DayCarousel';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Book() {
  const [appointmentType, setAppointmentType] = useState<'in-person' | 'video'>('in-person');
  const [reason, setReason] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [startDate, setStartDate] = useState(new Date());
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const { patient } = useAuth();
  const navigate = useNavigate();
  
  // Default therapist ID - since we're removing therapist selection
  const defaultTherapistId = "t1";
  const therapistName = "Dipl. Arzt Antoine Theurillat"; // Therapist name for display
  
  // Stepper configuration
  const steps: Step[] = [
    {
      id: 'terminart',
      label: 'Terminart',
      complete: currentStep > 0,
      current: currentStep === 0
    },
    {
      id: 'behandlungsgrund',
      label: 'Behandlungsgrund',
      complete: currentStep > 1,
      current: currentStep === 1
    },
    {
      id: 'termin',
      label: 'Wählen Sie einen Termin',
      complete: currentStep > 2,
      current: currentStep === 2
    }
  ];

  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        setLoading(true);
        const endDate = addDays(startDate, 14); // Load 14 days instead of 7
        const slots = await appointmentService.getAvailableTimeSlots(
          defaultTherapistId,
          startDate,
          endDate
        );
        setAvailableSlots(slots.filter(slot => slot.available));
      } catch (error) {
        console.error('Failed to fetch time slots:', error);
        toast.error("Zeitfenster konnten nicht geladen werden");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeSlots();
  }, [startDate]);
  
  // Auto-select first day with available slots
  useEffect(() => {
    if (!selectedDate && availableSlots.length > 0) {
      const firstSlotDate = parseISO(availableSlots[0].date);
      setSelectedDate(startOfDay(firstSlotDate));
    }
  }, [availableSlots, selectedDate]);
  
  const handleLoadMore = () => {
    setStartDate(prev => addDays(prev, 14)); // Load 14 more days
  };
  
  const handleRefreshCalendar = async () => {
    try {
      setLoading(true);
      clearAllCalendarCache(); // Clear all calendar caches
      toast.info("🔄 Kalender wird aktualisiert...");
      
      // Refetch time slots
      const endDate = addDays(startDate, 14);
      const slots = await appointmentService.getAvailableTimeSlots(
        defaultTherapistId,
        startDate,
        endDate
      );
      setAvailableSlots(slots.filter(slot => slot.available));
      toast.success("✅ Kalender aktualisiert!");
    } catch (error) {
      console.error('Failed to refresh calendar:', error);
      toast.error("Kalender konnte nicht aktualisiert werden");
    } finally {
      setLoading(false);
    }
  };
  
  const handleNext = () => {
    if (currentStep === 0 && appointmentType) {
      setCurrentStep(1);
    } else if (currentStep === 1 && reason) {
      // Skip appointment type selection for phone appointments
      if (reason === 'telefontermin') {
        setAppointmentType('video');
      }
      setCurrentStep(2);
    }
  };
  
  const isStepValid = () => {
    switch(currentStep) {
      case 0: return !!appointmentType;
      case 1: return !!reason;
      case 2: return !!selectedTimeSlot;
      default: return false;
    }
  };
  
  const handleBookAppointment = async () => {
    if (!selectedTimeSlot || !patient?.id || !reason || !policyAccepted) return;
    
    try {
      setLoading(true);
      
      // Determine duration based on appointment type
      const duration = reason === 'folgetermin-60' ? 60 : 30;
      const appointmentTypeDisplay = reasons.find(r => r.value === reason)?.label || reason;
      
      // Pre-booking recheck: verify slot is still available
      const isStillAvailable = await recheckTimeSlot(
        defaultTherapistId,
        selectedTimeSlot.date,
        duration
      );
      
      if (!isStillAvailable) {
        toast.error("Dieser Termin wurde gerade gebucht. Bitte wählen Sie einen anderen Zeitpunkt.");
        // Refresh available slots
        const endDate = addDays(startDate, 7);
        const refreshedSlots = await appointmentService.getAvailableTimeSlots(
          defaultTherapistId,
          startDate,
          endDate
        );
        setAvailableSlots(refreshedSlots.filter(slot => slot.available));
        setSelectedTimeSlot(null);
        setLoading(false);
        return;
      }
      
      // Phone appointments are always virtual
      const finalAppointmentType = reason === 'telefontermin' ? 'video' : appointmentType;
      
      const newAppointment = {
        patientId: patient.id,
        therapistId: defaultTherapistId,
        date: selectedTimeSlot.date,
        duration: duration,
        status: 'scheduled' as const,
        type: finalAppointmentType,
        notes: appointmentTypeDisplay,
      };
      
      const bookedAppointment = await appointmentService.bookAppointment(newAppointment);
      
      if (bookedAppointment) {
        navigate('/booking-confirmation', { 
          state: { 
            appointment: bookedAppointment,
            therapistName: therapistName 
          } 
        });
      }
    } catch (error) {
      console.error('Failed to book appointment:', error);
      toast.error("Termin konnte nicht gebucht werden");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <TherapistHeader name={therapistName} />
          
          {/* DEV: Temporary refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshCalendar}
            disabled={loading}
            className="gap-2 border-orange-400 text-orange-600 hover:bg-orange-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">DEV: Kalender aktualisieren</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Left side - Stepper */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <Stepper steps={steps} />
          </div>
          
          {/* Right side - Content */}
          <div className="space-y-6">
            {/* Step 1: Appointment Type */}
            {currentStep === 0 && (
              <Card className="border-psychPurple/10">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Terminart</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AppointmentTypeCard
                      type="in-person"
                      selected={appointmentType === 'in-person'}
                      onClick={() => setAppointmentType('in-person')}
                    />
                    <AppointmentTypeCard
                      type="video"
                      selected={appointmentType === 'video'}
                      onClick={() => setAppointmentType('video')}
                    />
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button 
                      onClick={handleNext}
                      disabled={!appointmentType}
                      className="bg-psychPurple hover:bg-psychPurple/90"
                    >
                      Weiter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Step 2: Treatment Reason */}
            {currentStep === 1 && (
              <Card className="border-psychPurple/10">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Behandlungsgrund</h2>
                  <ReasonSelect
                    value={reason}
                    onChange={setReason}
                  />
                  <div className="mt-6 flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentStep(0)}
                    >
                      Zurück
                    </Button>
                    <Button 
                      onClick={handleNext}
                      disabled={!reason}
                      className="bg-psychPurple hover:bg-psychPurple/90"
                    >
                      Weiter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Step 3: Select Time */}
            {currentStep === 2 && (
              <div>
                  <DayCarousel
                    availableSlots={availableSlots}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    onSelectSlot={setSelectedTimeSlot}
                    selectedSlot={selectedTimeSlot}
                    onLoadMore={handleLoadMore}
                    loading={loading}
                  />
                  
                  {selectedTimeSlot && (
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-amber-900 mb-2">
                            Bitte vor der Buchung lesen
                          </h3>
                          <p className="text-sm text-amber-800 mb-2">
                            Wenn es Ihnen nicht möglich ist, den vereinbarten Behandlungstermin
                            einzuhalten, so bitten wir Sie um rechtzeitige Terminabsage (24 Std. im
                            Voraus an Werktagen). Andernfalls wird eine Gebühr verrechnet.
                          </p>
                          <p className="text-sm text-amber-800 mb-2">
                            Dies gilt auch im Fall von Krankheitsbedingter Absage.
                          </p>
                          <p className="text-sm text-amber-800">
                            Freundliche Grüsse PsychCentral Psychologie CH
                          </p>
                          <div className="flex items-center space-x-2 mt-4">
                            <Checkbox
                              id="policy"
                              checked={policyAccepted}
                              onCheckedChange={(checked) => setPolicyAccepted(checked as boolean)}
                            />
                            <label
                              htmlFor="policy"
                              className="text-sm font-medium text-amber-900 cursor-pointer"
                            >
                              Ich habe die Stornierungsbedingungen gelesen und akzeptiert
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                    >
                      Zurück
                    </Button>
                    <Button 
                      onClick={handleBookAppointment}
                      disabled={!selectedTimeSlot || loading || !policyAccepted}
                      className="bg-psychPurple hover:bg-psychPurple/90 disabled:opacity-50"
                    >
                      Termin buchen
                    </Button>
                  </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
