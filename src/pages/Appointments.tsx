
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService, Appointment } from '@/services/appointmentService';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

const AppointmentCard = ({ appointment, onReschedule, onCancel }: { 
  appointment: Appointment; 
  onReschedule: (apt: Appointment) => void;
  onCancel: (aptId: string) => void;
}) => {
  const date = parseISO(appointment.date);
  const formattedDate = format(date, "EEEE, d. MMMM yyyy", { locale: de });
  const formattedTime = format(date, "HH:mm 'Uhr'", { locale: de });
  const [therapistName, setTherapistName] = useState('');

  useEffect(() => {
    const getTherapistDetails = async () => {
      try {
        const therapist = await appointmentService.getTherapistById(appointment.therapistId);
        if (therapist) {
          setTherapistName(therapist.name);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Therapeuteninformationen:", error);
      }
    };
    
    getTherapistDetails();
  }, [appointment.therapistId]);
  
  return (
    <Card className="mb-4 border-psychPurple/10">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{therapistName}</CardTitle>
            <CardDescription className="mt-1">
              {appointment.type === 'in-person' ? 'Persönliche' : 'Online'} Sitzung • {appointment.duration} Minuten
            </CardDescription>
          </div>
          <div className="bg-psychPurple/10 px-3 py-1 rounded-full text-xs font-medium text-psychPurple">
            {appointment.status === 'scheduled' ? 'Anstehend' : 
             appointment.status === 'completed' ? 'Abgeschlossen' : 
             appointment.status === 'cancelled' ? 'Storniert' :
             appointment.status}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 text-sm text-psychText">
          <Calendar size={14} className="text-psychPurple" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-psychText mt-1">
          <Clock size={14} className="text-psychPurple" />
          <span>{formattedTime}</span>
        </div>
      </CardContent>
      {appointment.status === 'scheduled' && (
        <CardFooter className="flex justify-end gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-psychPurple/20 text-psychText/70 hover:text-destructive hover:border-destructive/30"
            onClick={() => onCancel(appointment.id)}
          >
            Stornieren
          </Button>
          <Button 
            size="sm" 
            className="bg-psychPurple hover:bg-psychPurple/90"
            onClick={() => onReschedule(appointment)}
          >
            Verschieben
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default function Appointments() {
  const { patient } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!patient?.id) return;
      
      try {
        setLoading(true);
        const upcoming = await appointmentService.getUpcomingAppointments(patient.id);
        const past = await appointmentService.getPastAppointments(patient.id);
        
        setUpcomingAppointments(upcoming);
        setPastAppointments(past);
      } catch (error) {
        console.error('Fehler beim Abrufen der Termine:', error);
        toast.error("Termine konnten nicht geladen werden. Bitte versuchen Sie es später erneut.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [patient?.id]);
  
  const handleReschedule = (appointment: Appointment) => {
    navigate(`/reschedule/${appointment.id}`);
  };
  
  const handleCancel = async (appointmentId: string) => {
    try {
      const success = await appointmentService.cancelAppointment(appointmentId);
      
      if (success) {
        // Update local state
        setUpcomingAppointments(prev => 
          prev.map(apt => 
            apt.id === appointmentId 
              ? { ...apt, status: 'cancelled' } 
              : apt
          )
        );
        
        toast.success("Ihr Termin wurde erfolgreich storniert.");
      }
    } catch (error) {
      console.error('Fehler beim Stornieren des Termins:', error);
      toast.error("Der Termin konnte nicht storniert werden. Bitte versuchen Sie es später erneut.");
    }
  };
  
  const handleBookNew = () => {
    navigate('/book');
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="container max-w-3xl mx-auto py-8 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-psychPurple/10 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-40 bg-white rounded-lg border border-psychPurple/10"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  const hasUpcoming = upcomingAppointments.length > 0;
  
  return (
    <Layout>
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Ihre Termine</h1>
          <Button 
            onClick={handleBookNew}
            className="bg-psychPurple hover:bg-psychPurple/90"
          >
            Neuen Termin buchen
          </Button>
        </div>
        
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">Anstehend</TabsTrigger>
            <TabsTrigger value="past">Vergangen</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="animate-fade-in">
            {hasUpcoming ? (
              upcomingAppointments.map(appointment => (
                <AppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                  onReschedule={handleReschedule}
                  onCancel={handleCancel}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-psychText mb-2">Keine anstehenden Termine</h3>
                <p className="text-psychText/60 mb-6">Buchen Sie Ihren nächsten Termin, um Ihre Therapie fortzusetzen</p>
                <Button 
                  onClick={handleBookNew}
                  className="bg-psychPurple hover:bg-psychPurple/90"
                >
                  Termin buchen
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past" className="animate-fade-in">
            {pastAppointments.length > 0 ? (
              pastAppointments.map(appointment => (
                <AppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                  onReschedule={() => {}}
                  onCancel={() => {}}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-psychText/60">Keine vergangenen Termine gefunden</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
