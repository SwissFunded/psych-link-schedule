
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService, Therapist, TimeSlot } from '@/services/appointmentService';
import { format, addDays, startOfWeek, parse, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { CalendarIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Book() {
  const { patient } = useAuth();
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        setLoading(true);
        const fetchedTherapists = await appointmentService.getTherapists();
        setTherapists(fetchedTherapists);
        
        if (fetchedTherapists.length > 0) {
          setSelectedTherapist(fetchedTherapists[0]);
        }
      } catch (error) {
        console.error('Error fetching therapists:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTherapists();
  }, []);
  
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedTherapist || !date) return;
      
      try {
        setLoading(true);
        
        const startDate = startOfWeek(date);
        const endDate = addDays(startDate, 6);
        
        const slots = await appointmentService.getAvailableTimeSlots(
          selectedTherapist.id,
          startDate,
          endDate
        );
        
        setAvailableSlots(slots);
      } catch (error) {
        console.error('Error fetching time slots:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeSlots();
  }, [selectedTherapist, date]);
  
  const handleTherapistSelect = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setSelectedTimeSlot(null);
  };
  
  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
  };
  
  const handleBookAppointment = async () => {
    if (!patient || !selectedTherapist || !selectedTimeSlot) return;
    
    try {
      setLoading(true);
      
      const appointment = await appointmentService.bookAppointment({
        patientId: patient.id,
        therapistId: selectedTherapist.id,
        date: selectedTimeSlot.date,
        duration: selectedTimeSlot.duration,
        status: 'scheduled',
        type: 'in-person'
      });
      
      toast.success("Appointment booked successfully");
      navigate('/appointments');
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error("Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const groupSlotsByDay = () => {
    const groupedSlots: { [key: string]: TimeSlot[] } = {};
    
    availableSlots.forEach(slot => {
      const dateKey = format(parseISO(slot.date), 'yyyy-MM-dd');
      if (!groupedSlots[dateKey]) {
        groupedSlots[dateKey] = [];
      }
      groupedSlots[dateKey].push(slot);
    });
    
    return groupedSlots;
  };
  
  const groupedSlots = groupSlotsByDay();
  const weekDays = Object.keys(groupedSlots).sort();
  
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={() => navigate('/appointments')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to appointments
        </Button>
        
        <h1 className="text-2xl font-semibold mb-6">Book a New Appointment</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium mb-4">1. Select a Therapist</h2>
            <div className="space-y-3">
              {therapists.map(therapist => (
                <Card 
                  key={therapist.id}
                  className={cn(
                    "border cursor-pointer transition-all highlight-effect",
                    selectedTherapist?.id === therapist.id 
                      ? "border-psychPurple bg-psychPurple/5" 
                      : "border-psychPurple/10"
                  )}
                  onClick={() => handleTherapistSelect(therapist)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-medium">{therapist.name}</h3>
                    <p className="text-sm text-psychText/70">{therapist.specialty}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <h2 className="text-lg font-medium mt-6 mb-4">2. Select a Date</h2>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-psychPurple/20",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 pointer-events-auto">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => 
                    date < new Date() ||
                    date > addDays(new Date(), 30)
                  }
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <h2 className="text-lg font-medium mb-4">3. Select a Time</h2>
            
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-psychPurple/5 rounded"></div>
                ))}
              </div>
            ) : weekDays.length > 0 ? (
              <div className="space-y-4">
                {weekDays.map(dayKey => (
                  <div key={dayKey}>
                    <h3 className="text-sm font-medium mb-2 text-psychText/70">
                      {format(parseISO(dayKey), 'EEEE, MMMM d')}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {groupedSlots[dayKey]
                        .filter(slot => slot.available)
                        .map(slot => (
                          <Button
                            key={slot.date}
                            variant="outline"
                            className={cn(
                              "border-psychPurple/20",
                              selectedTimeSlot?.date === slot.date 
                                ? "bg-psychPurple text-white border-psychPurple" 
                                : "hover:border-psychPurple hover:text-psychPurple"
                            )}
                            onClick={() => handleTimeSlotSelect(slot)}
                          >
                            {format(parseISO(slot.date), 'h:mm a')}
                          </Button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-psychPurple/5 rounded p-6 text-center">
                <p className="text-psychText/70">
                  {!selectedTherapist
                    ? "Please select a therapist"
                    : !date
                    ? "Please select a date"
                    : "No available time slots for the selected date"}
                </p>
              </div>
            )}
            
            <div className="mt-8">
              <Button 
                className="w-full bg-psychPurple hover:bg-psychPurple/90"
                disabled={!selectedTimeSlot || loading}
                onClick={handleBookAppointment}
              >
                Book Appointment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
