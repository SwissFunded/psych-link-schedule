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
import { Clock, Calendar as CalendarIcon, User } from 'lucide-react';

export default function Book() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [allSlotsByDate, setAllSlotsByDate] = useState<Record<string, TimeSlot[]>>({});
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("slots");
  
  const { patient, vitabytePatient } = useAuth();
  const navigate = useNavigate();
  
  // Load all available slots from Vitabyte ICS Calendar on component mount
  useEffect(() => {
    const fetchAllSlots = async () => {
      setLoading(true);
      try {
        console.log('🔄 Fetching slots from Vitabyte ICS Calendar...');
        const slotsByDate = await appointmentService.getAllAvailableSlots();
        console.log('✅ Vitabyte ICS Calendar Response:', slotsByDate);
        setAllSlotsByDate(slotsByDate);
      } catch (error) {
        console.error('Error fetching slots from Vitabyte ICS Calendar:', error);
        toast.error('Verfügbare Termine konnten nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllSlots();
  }, []);
  
  // Update available slots when date changes
  useEffect(() => {
    if (date) {
      const dateString = format(date, 'yyyy-MM-dd');
      const slotsForDate = allSlotsByDate[dateString] || [];
      setAvailableSlots(slotsForDate);
    }
  }, [date, allSlotsByDate]);
  
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate && selectedDate >= new Date()) {
      setDate(selectedDate);
      setSelectedTime('');
      if (selectedDate > new Date()) {
        setActiveTab("time");
      }
    }
  };
  
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setActiveTab("details");
  };

  const handleSlotSelect = (dateStr: string, time: string) => {
    setDate(new Date(dateStr));
    setSelectedTime(time);
    setActiveTab("details");
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
        navigate('/appointments');
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
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Neuen Termin buchen</h1>
          <p className="text-psychText/60">Wählen Sie Datum, Zeit und Terminart für Ihren Besuch</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="slots" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Vitabyte Kalender
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Kalender
            </TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedTime} className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="slots">
            <Card>
              <CardHeader>
                <CardTitle>Verfügbare Termine (Vitabyte ICS Kalender)</CardTitle>
                <p className="text-sm text-psychText/60">
                  Wählen Sie einen verfügbaren Termin aus der Vitabyte Kalender
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-2 border-psychPurple/30 border-t-psychPurple rounded-full animate-spin"></div>
                    <p className="ml-3 text-psychText/60">Lade verfügbare Termine von Vitabyte ICS...</p>
                  </div>
                ) : Object.keys(allSlotsByDate).length > 0 ? (
                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {Object.entries(allSlotsByDate)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([dateStr, slots]) => {
                        const availableSlotsForDate = slots.filter(slot => slot.available);
                        if (availableSlotsForDate.length === 0) return null;
                        
                        return (
                          <div key={dateStr} className="border rounded-lg p-4">
                            <h3 className="font-medium mb-3 text-psychPurple">
                              {format(new Date(dateStr), 'EEEE, d. MMMM yyyy', { locale: de })}
                            </h3>
                            <div className="grid grid-cols-4 gap-2">
                              {availableSlotsForDate.map((slot) => (
                                <Button
                                  key={`${dateStr}-${slot.time}`}
                                  variant={selectedTime === slot.time && date && format(date, 'yyyy-MM-dd') === dateStr ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleSlotSelect(dateStr, slot.time)}
                                  className={`h-10 ${
                                    selectedTime === slot.time && date && format(date, 'yyyy-MM-dd') === dateStr
                                      ? "bg-psychPurple hover:bg-psychPurple/90" 
                                      : "hover:bg-psychPurple/10"
                                  }`}
                                >
                                  {slot.time}
                                </Button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-psychText/60">
                      Keine verfügbaren Termine gefunden
                    </p>
                    <p className="text-sm text-psychText/40 mt-2">
                      Vitabyte ICS Kalender über Server-Proxy nicht erreichbar
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Kalenderansicht</CardTitle>
                <p className="text-sm text-psychText/60">
                  Wählen Sie ein Datum aus dem Kalender
                </p>
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
                
                {date && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">
                      Verfügbare Zeiten für {format(date, 'EEEE, d. MMMM yyyy', { locale: de })}
                    </h4>
                    {availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {availableSlots.map((slot) => (
                          <Button
                            key={slot.time}
                            variant={selectedTime === slot.time ? "default" : "outline"}
                            disabled={!slot.available}
                            onClick={() => handleTimeSelect(slot.time)}
                            className={`h-12 ${
                              selectedTime === slot.time 
                                ? "bg-psychPurple hover:bg-psychPurple/90" 
                                : "hover:bg-psychPurple/10"
                            }`}
                          >
                            {slot.time}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-psychText/60 text-center py-4">
                        Keine verfügbaren Zeiten für das gewählte Datum
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Termindetails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="appointment-type">Terminart *</Label>
                  <Select value={appointmentType} onValueChange={setAppointmentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wählen Sie die Terminart" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Beratungsgespräch</SelectItem>
                      <SelectItem value="therapy">Therapiesitzung</SelectItem>
                      <SelectItem value="followup">Nachkontrolle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Anmerkungen (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Teilen Sie uns mit, wenn Sie spezielle Anliegen haben..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Patient Info Display */}
                <div className="p-4 bg-psychPurple/5 rounded-lg border border-psychPurple/10">
                  <h4 className="font-medium mb-2">Patienteninformationen</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Name:</strong> {patient?.name} {patient?.surname}</p>
                    <p><strong>E-Mail:</strong> {patient?.email}</p>
                    {patient?.phone && <p><strong>Telefon:</strong> {patient.phone}</p>}
                    {vitabytePatient?.patid && (
                      <p><strong>Patienten-ID:</strong> {vitabytePatient.patid}</p>
                    )}
                    {vitabytePatient?.assignedTherapist && (
                      <p><strong>Therapeut:</strong> {vitabytePatient.assignedTherapist.name}</p>
                    )}
                  </div>
                </div>

                {/* Vitabyte ICS Calendar Info */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium mb-2 text-blue-800">📡 Vitabyte ICS Kalender Status</h4>
                  <div className="text-sm space-y-1 text-blue-700">
                    <p><strong>Kalender Status:</strong> {Object.keys(allSlotsByDate).length > 0 ? '✅ Verbunden' : '❌ Getrennt'}</p>
                    <p><strong>Verfügbare Tage:</strong> {Object.keys(allSlotsByDate).length}</p>
                    <p><strong>Termine insgesamt:</strong> {Object.values(allSlotsByDate).flat().length}</p>
                    <p><strong>Verfügbare Termine:</strong> {Object.values(allSlotsByDate).flat().filter(s => s.available).length}</p>
                    <p><strong>Quelle:</strong> api.vitabyte.ch/calendar (ICS via Proxy)</p>
                  </div>
                </div>

                {/* Booking Summary */}
                {date && selectedTime && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium mb-2 text-green-800">Terminübersicht</h4>
                    <div className="text-sm space-y-1 text-green-700">
                      <p><strong>Datum:</strong> {format(date, 'EEEE, d. MMMM yyyy', { locale: de })}</p>
                      <p><strong>Zeit:</strong> {selectedTime} Uhr</p>
                      <p><strong>Dauer:</strong> 50 Minuten</p>
                      {appointmentType && <p><strong>Art:</strong> {appointmentType}</p>}
                      <p><strong>Quelle:</strong> EPAT Calendar API</p>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleBookAppointment}
                  disabled={loading || !appointmentType}
                  className="w-full bg-psychPurple hover:bg-psychPurple/90"
                >
                  {loading ? 'Buchung läuft...' : 'Termin buchen'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
