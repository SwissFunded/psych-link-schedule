
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService, Appointment, TimeSlot } from '@/services/appointmentService';
import { format, addDays, parseISO } from 'date-fns';
import de from 'date-fns/locale/de';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Reschedule() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { patient } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchAppointment = async () => {
      if (!patient?.id || !appointmentId) return;
      
      try {
        setLoading(true);
        
        // Get all appointments and find the one matching the ID
        const appointments = await appointmentService.getPatientAppointments(patient.id);
        const found = appointments.find(apt => apt.id === appointmentId);
        
        if (!found) {
          toast.error("Termin nicht gefunden");
          navigate('/appointments');
          return;
        }
        
        setAppointment(found);
        
        // Set initial date to the appointment date
        const appointmentDate = parseISO(found.date);
        setDate(appointmentDate);
      } catch (error) {
        console.error('Fehler beim Laden des Termins:', error);
        toast.error("Termindetails konnten nicht geladen werden");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointment();
  }, [appointmentId, patient?.id, navigate]);
  
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!appointment || !date) return;
      
      try {
        setLoading(true);
        
        const slots = await appointmentService.getAvailableTimeSlots(
          appointment.therapistId,
          date,
          addDays(date, 7)
        );
        
        setAvailableSlots(slots.filter(slot => slot.available));
      } catch (error) {
        console.error('Fehler beim Laden der Zeitfenster:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeSlots();
  }, [appointment, date]);
  
  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
  };
  
  const handleReschedule = async () => {
    if (!appointment || !selectedTimeSlot) return;
    
    try {
      setLoading(true);
      
      const updated = await appointmentService.rescheduleAppointment(
        appointment.id,
        selectedTimeSlot.date
      );
      
      if (updated) {
        toast.success("Termin erfolgreich verschoben");
        navigate('/appointments');
      }
    } catch (error) {
      console.error('Fehler beim Verschieben des Termins:', error);
      toast.error("Termin konnte nicht verschoben werden");
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
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={() => navigate('/appointments')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Zurück zu Terminen
        </Button>
        
        <h1 className="text-2xl font-semibold mb-6">Termin verschieben</h1>
        
        {loading && !appointment ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-psychPurple/10 w-3/4 rounded"></div>
            <div className="h-40 bg-psychPurple/5 rounded"></div>
          </div>
        ) : appointment ? (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-medium mb-4">Aktueller Termin</h2>
              <Card className="border-psychPurple/10 mb-6">
                <CardContent className="p-4">
                  <p className="font-medium">
                    {format(parseISO(appointment.date), 'EEEE, d. MMMM yyyy', { locale: de })}
                  </p>
                  <p className="text-psychText/70">
                    {format(parseISO(appointment.date), 'HH:mm', { locale: de })} Uhr
                  </p>
                </CardContent>
              </Card>
              
              <h2 className="text-lg font-medium mb-4">Neues Datum wählen</h2>
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
                    {date ? format(date, 'PPP', { locale: de }) : <span>Datum auswählen</span>}
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
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <h2 className="text-lg font-medium mb-4">Neue Zeit wählen</h2>
              
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
                        {format(parseISO(dayKey), 'EEEE, d. MMMM', { locale: de })}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {groupedSlots[dayKey].map(slot => (
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
                            {format(parseISO(slot.date), 'HH:mm', { locale: de })} Uhr
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-psychPurple/5 rounded p-6 text-center">
                  <p className="text-psychText/70">
                    Keine verfügbaren Zeitfenster für das ausgewählte Datum
                  </p>
                </div>
              )}
              
              <div className="mt-8">
                <Button 
                  className="w-full bg-psychPurple hover:bg-psychPurple/90"
                  disabled={!selectedTimeSlot || loading}
                  onClick={handleReschedule}
                >
                  Verschiebung bestätigen
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-psychText/70">Termin nicht gefunden</p>
            <Button 
              onClick={() => navigate('/appointments')}
              className="mt-4"
            >
              Alle Termine anzeigen
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
