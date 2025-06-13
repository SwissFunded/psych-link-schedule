import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService, TimeSlot, BookingData } from '@/services/appointmentService';
import { format, addDays, isWeekend } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Calendar as CalendarIcon, User, Info } from 'lucide-react';

export default function Book() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [allSlotsByDate, setAllSlotsByDate] = useState<Record<string, TimeSlot[]>>({});
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const { patient } = useAuth();
  const navigate = useNavigate();

  // Define static available slots
  useEffect(() => {
    const generateStaticSlots = () => {
      const staticSlots: TimeSlot[] = [];
      for (let hour = 8; hour < 18; hour++) {
        staticSlots.push({ time: `${String(hour).padStart(2, '0')}:00`, available: true });
        staticSlots.push({ time: `${String(hour).padStart(2, '0')}:30`, available: true });
      }
      return staticSlots;
    };
    
    setAvailableSlots(generateStaticSlots());
  }, []);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate && selectedDate >= new Date()) {
      setDate(selectedDate);
      setSelectedTime(''); // Reset time when date changes
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleBookAppointment = async () => {
    if (!patient?.email || !patient?.name || !date || !selectedTime || !appointmentType) {
      toast.error('Bitte füllen Sie alle erforderlichen Felder aus');
      return;
    }
    
    setLoading(true);
    
    const bookingData: BookingData = {
      patientEmail: patient.email,
      patientName: `${patient.name} ${patient.surname || ''}`.trim(),
      patientPhone: patient.phone || undefined,
      appointmentDate: format(date, 'yyyy-MM-dd'),
      appointmentTime: selectedTime,
      appointmentType,
      duration: 50,
      notes: notes || undefined
    };
    
    try {
      const result = await appointmentService.bookAppointment(bookingData);
      
      if (result.success) {
        toast.success('Termin erfolgreich gebucht!', {
          description: `${format(date, 'EEEE, d. MMMM yyyy', { locale: de })} um ${selectedTime} Uhr`
        });
        navigate('/profile');
      } else {
        toast.error(result.error || 'Termin konnte nicht gebucht werden');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || isWeekend(date);
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Neuen Termin buchen</h1>
          <p className="text-psychText/60">Wählen Sie Datum, Zeit und Terminart für Ihren Besuch</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Left side: Calendar and Time */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Datum und Uhrzeit wählen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  disabled={isDateDisabled}
                  locale={de}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {date && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Verfügbare Zeiten
                  </CardTitle>
                  <p className="text-sm text-psychText/60">
                    Für {format(date, 'EEEE, d. MMMM yyyy', { locale: de })}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        disabled={!slot.available}
                        onClick={() => handleTimeSelect(slot.time)}
                        className={`h-10 ${
                          selectedTime === slot.time 
                            ? "bg-psychPurple hover:bg-psychPurple/90" 
                            : "hover:bg-psychPurple/10"
                        }`}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right side: Details and Booking */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Termindetails
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appointmentType">Art des Termins</Label>
                  <Select onValueChange={setAppointmentType} value={appointmentType}>
                    <SelectTrigger id="appointmentType">
                      <SelectValue placeholder="Wählen Sie eine Terminart" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Beratungsgespräch</SelectItem>
                      <SelectItem value="therapy">Therapiesitzung</SelectItem>
                      <SelectItem value="followup">Nachkontrolle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Anmerkungen (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Möchten Sie uns etwas mitteilen?"
                  />
                </div>
              </CardContent>
            </Card>
            
            {(date && selectedTime && appointmentType) && (
              <Card className="bg-psychPurple/5 border-psychPurple/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-psychPurple">
                    <Info className="w-5 h-5" />
                    Zusammenfassung
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-psychText/70">Datum:</span>
                    <span className="font-medium">{format(date, 'EEEE, d. MMMM yyyy', { locale: de })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-psychText/70">Uhrzeit:</span>
                    <span className="font-medium">{selectedTime} Uhr</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-psychText/70">Terminart:</span>
                    <span className="font-medium capitalize">{appointmentType}</span>
                  </div>
                  <Button
                    onClick={handleBookAppointment}
                    disabled={loading}
                    className="w-full mt-4 bg-psychPurple hover:bg-psychPurple/90"
                  >
                    {loading ? 'Termin wird gebucht...' : 'Termin jetzt buchen'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
