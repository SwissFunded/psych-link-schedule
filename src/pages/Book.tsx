import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService, Therapist, TimeSlot } from '@/services/appointmentService';
import { format, addDays, startOfWeek, parse, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from 'sonner';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";

export default function Book() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [date, setDate] = useState<Date | undefined>(() => {
    const today = new Date();
    const nextMonday = startOfWeek(addDays(today, 7), { weekStartsOn: 1 });
    return nextMonday;
  });
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("therapist");
  const { patient } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        setLoading(true);
        const therapistsData = await appointmentService.getTherapists();
        setTherapists(therapistsData);
      } catch (error) {
        console.error('Failed to fetch therapists:', error);
        toast.error("Ärzte konnten nicht geladen werden");
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
        const slots = await appointmentService.getAvailableTimeSlots(
          selectedTherapist.id,
          date,
          addDays(date, 7)
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
  }, [selectedTherapist, date]);
  
  const handleTherapistSelect = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setActiveTab("date");
  };
  
  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    setActiveTab("confirm");
  };

  const handleTherapistChange = (therapistId: string) => {
    const selected = therapists.find(t => t.id === therapistId);
    if (selected) {
      setSelectedTherapist(selected);
      setActiveTab("date");
    }
  };
  
  const handleBookAppointment = async () => {
    if (!selectedTherapist || !selectedTimeSlot || !patient?.id) return;
    
    try {
      setLoading(true);
      
      const newAppointment = {
        patientId: patient.id,
        therapistId: selectedTherapist.id,
        date: selectedTimeSlot.date,
        duration: selectedTimeSlot.duration,
        status: 'scheduled' as const,
        type: 'video' as const,
      };
      
      const bookedAppointment = await appointmentService.bookAppointment(newAppointment);
      
      if (bookedAppointment) {
        toast.success("Termin erfolgreich gebucht");
        navigate('/appointments');
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
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold mb-6">Buchen Sie Ihren Termin</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="therapist">Therapeut wählen</TabsTrigger>
            <TabsTrigger value="date" disabled={!selectedTherapist}>Datum & Zeit wählen</TabsTrigger>
            <TabsTrigger value="confirm" disabled={!selectedTimeSlot}>Bestätigen</TabsTrigger>
          </TabsList>
          
          <TabsContent value="therapist" className="animate-fade-in">
            <h2 className="text-lg font-medium mb-4">Verfügbare Therapeuten</h2>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-12 bg-psychPurple/10 rounded w-1/2 mb-2"></div>
                <div className="h-12 bg-psychPurple/10 rounded w-1/2 mb-2"></div>
              </div>
            ) : (
              <div>
                <Select onValueChange={handleTherapistChange}>
                  <SelectTrigger className="w-full mb-4">
                    <SelectValue placeholder="Bitte wählen Sie einen Therapeuten" />
                  </SelectTrigger>
                  <SelectContent>
                    {therapists.map(therapist => (
                      <SelectItem key={therapist.id} value={therapist.id}>
                        {therapist.name} - {therapist.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {therapists.map(therapist => (
                    <Card 
                      key={therapist.id}
                      className={`border-psychPurple/10 highlight-effect cursor-pointer ${selectedTherapist?.id === therapist.id ? 'border-2 border-psychPurple' : ''}`}
                      onClick={() => handleTherapistSelect(therapist)}
                    >
                      <CardContent className="flex flex-col items-center justify-center p-4">
                        <Avatar className="mb-2">
                          <AvatarImage src={therapist.imageUrl} />
                          <AvatarFallback>{therapist.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h3 className="text-md font-medium">{therapist.name}</h3>
                        <p className="text-sm text-psychText/70">{therapist.specialty}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="date" className="animate-fade-in">
            <h2 className="text-lg font-medium mb-4">Wählen Sie ein Datum und eine Uhrzeit</h2>
            {selectedTherapist ? (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Avatar className="mr-2">
                    <AvatarImage src={selectedTherapist.imageUrl} />
                    <AvatarFallback>{selectedTherapist.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">Ausgewählter Therapeut</h3>
                    <p className="text-sm text-psychText/70">
                      {selectedTherapist.name} - {selectedTherapist.specialty}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="ml-auto"
                    onClick={() => setActiveTab("therapist")}
                  >
                    Ändern
                  </Button>
                </div>
              
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-md font-medium mb-2">Datum auswählen</h3>
                    <Card className="border-psychPurple/10">
                      <CardContent className="p-3">
                        <Calendar 
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium mb-2">Verfügbare Zeiten</h3>
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-10 bg-psychPurple/10 rounded mb-2"></div>
                        <div className="h-10 bg-psychPurple/10 rounded mb-2"></div>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availableSlots.map(slot => (
                          <Button
                            key={slot.date}
                            variant="outline"
                            className={`border-psychPurple/20 ${selectedTimeSlot?.date === slot.date ? 'bg-psychPurple text-white border-psychPurple' : 'hover:border-psychPurple hover:text-psychPurple'}`}
                            onClick={() => handleTimeSlotSelect(slot)}
                          >
                            {format(parseISO(slot.date), 'HH:mm', { locale: de })} Uhr
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-psychText/70">Keine verfügbaren Zeiten für dieses Datum</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-psychText/70">Bitte wählen Sie zuerst einen Therapeuten aus</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="confirm" className="animate-fade-in">
            <h2 className="text-lg font-medium mb-4">Bestätigen Sie Ihren Termin</h2>
            {selectedTherapist && selectedTimeSlot ? (
              <Card className="border-psychPurple/10">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-md font-medium">Therapeut</h3>
                    <p className="text-psychText/70">{selectedTherapist.name}</p>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-md font-medium">Datum und Uhrzeit</h3>
                    <p className="text-psychText/70">
                      {format(parseISO(selectedTimeSlot.date), 'EEEE, d. MMMM yyyy', { locale: de })}
                    </p>
                    <p className="text-psychText/70">
                      {format(parseISO(selectedTimeSlot.date), 'HH:mm', { locale: de })} Uhr
                    </p>
                  </div>
                  <Button 
                    className="w-full bg-psychPurple hover:bg-psychPurple/90"
                    onClick={handleBookAppointment}
                    disabled={loading}
                  >
                    Termin buchen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-6">
                <p className="text-psychText/70">Bitte wählen Sie zuerst einen Therapeuten und eine Uhrzeit aus</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
