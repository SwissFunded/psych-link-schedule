import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService, Appointment } from '@/services/appointmentService';
import { format, isSameDay, parseISO } from 'date-fns';
import { de } from 'date-fns/locale/de';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Stethoscope, User } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { PageSection, FloatingCard, StaggeredList, StaggeredItem } from '@/components/ui/PageTransition';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const AppointmentCard = ({ appointment, onReschedule, onCancel }: { 
  appointment: Appointment; 
  onReschedule: (apt: Appointment) => void;
  onCancel: (aptId: string) => void;
}) => {
  const date = parseISO(appointment.date);
  const formattedDate = format(date, "EEEE, d. MMMM yyyy", { locale: de });
  const formattedTime = format(date, "HH:mm", { locale: de });
  const [therapistName, setTherapistName] = useState('');

  // Get appointment title from metadata or fallback
  const appointmentTitle = appointment.metadata?.appointmentTitle || 
                          appointment.metadata?.appointmentType || 
                          'Termin';

  useEffect(() => {
    const getTherapistDetails = async () => {
      // First try to use calendar name from metadata if available
      if (appointment.metadata?.calendarname) {
        setTherapistName(appointment.metadata.calendarname);
        return;
      }
      
      // Fallback to therapist lookup if we have a valid therapist ID
      if (appointment.therapistId && appointment.therapistId !== 'undefined') {
      const therapist = await appointmentService.getTherapistById(appointment.therapistId);
      if (therapist) {
        setTherapistName(therapist.name);
        } else {
          // If therapist lookup fails, try to use any available name from metadata
          const fallbackName = appointment.metadata?.provider || 
                              appointment.metadata?.therapist || 
                              appointment.metadata?.calendar ||
                              'Therapeut';
          setTherapistName(fallbackName);
        }
      } else {
        // No valid therapist ID, use fallback
        setTherapistName('Therapeut');
      }
    };
    
    getTherapistDetails();
  }, [appointment.therapistId, appointment.metadata]);
  
  return (
    <StaggeredItem>
      <motion.div
        whileHover={{ 
          y: -2, 
          scale: 1.01,
          transition: { duration: 0.2, ease: [0.4, 0.0, 0.2, 1.0] }
        }}
        whileTap={{ scale: 0.99 }}
      >
        <Card className="mb-4 border-psychPurple/10 highlight-effect shadow-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{appointmentTitle}</CardTitle>
            <CardDescription className="mt-1">
              {therapistName && `${therapistName} • `}
              {appointment.type === 'in-person' ? 'Persönliche' : 'Online'} Sitzung • {appointment.duration} Minuten
            </CardDescription>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            appointment.status === 'scheduled' ? 'bg-psychPurple/10 text-psychPurple' :
            appointment.status === 'pending_cancellation' ? 'bg-red-100 text-red-700' :
            appointment.status === 'pending_reschedule' ? 'bg-blue-100 text-blue-700' :
            appointment.status === 'completed' ? 'bg-green-100 text-green-700' :
            appointment.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
            'bg-psychPurple/10 text-psychPurple'
          }`}>
            {appointment.status === 'scheduled' ? 'Bevorstehend' : 
             appointment.status === 'pending_cancellation' ? 'Stornierung angefragt' :
             appointment.status === 'pending_reschedule' ? 'Verschiebung angefragt' :
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
          <span>{formattedTime} Uhr</span>
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
            className="bg-psychPurple hover:bg-psychPurple/90 text-white"
            onClick={() => onReschedule(appointment)}
          >
            Verschieben
          </Button>
        </CardFooter>
      )}
      
      {(appointment.status === 'pending_cancellation' || appointment.status === 'pending_reschedule') && (
        <CardFooter className="pt-2">
          <div className="w-full text-center text-sm text-psychText/60">
            {appointment.status === 'pending_cancellation' ? 
              '⏳ Stornierungsanfrage wird geprüft' : 
              '⏳ Verschiebungsanfrage wird geprüft'
            }
          </div>
        </CardFooter>
      )}
        </Card>
      </motion.div>
    </StaggeredItem>
  );
};

export default function Appointments() {
  const { patient, vitabytePatient, vitabyteLoading } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!patient?.email) {
        console.log('No patient email available for fetching appointments');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('🔍 Fetching appointments for patient email:', patient.email);
        
        const upcoming = await appointmentService.getUpcomingAppointments(patient.email);
        const past = await appointmentService.getPastAppointments(patient.email);
        
        console.log('📅 Appointments fetched:', {
          upcoming: upcoming.length,
          past: past.length
        });
        
        setUpcomingAppointments(upcoming);
        setPastAppointments(past);
      } catch (error) {
        console.error('Fehler beim Abrufen von Terminen:', error);
        toast.error("Termine konnten nicht geladen werden");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [patient?.email]);
  
  const handleReschedule = (appointment: Appointment) => {
    navigate(`/reschedule/${appointment.id}`);
  };
  
  const handleCancel = async (appointmentId: string) => {
    try {
      const result = await appointmentService.cancelAppointment(appointmentId);
      
      if (result.success) {
        // Update local state to show pending cancellation
        setUpcomingAppointments(prev => 
          prev.map(apt => 
            apt.id === appointmentId 
              ? { ...apt, status: 'pending_cancellation' } 
              : apt
          )
        );
        toast.success("Stornierungsanfrage eingereicht - wird geprüft");
      } else {
        toast.error(result.error || "Stornierungsanfrage konnte nicht eingereicht werden");
      }
    } catch (error) {
      console.error('Fehler beim Einreichen der Stornierungsanfrage:', error);
      toast.error("Stornierungsanfrage konnte nicht eingereicht werden");
    }
  };
  
  const handleBookNew = () => {
    navigate('/buchen');
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
        <PageSection className="flex justify-between items-center mb-6">
          <motion.h1 
            className="text-2xl font-semibold"
            initial={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: [0.19, 1.0, 0.22, 1.0] }}
          >
            Ihre Termine
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.19, 1.0, 0.22, 1.0] }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={handleBookNew}
              className="bg-psychPurple hover:bg-psychPurple/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Neuen Termin buchen
            </Button>
          </motion.div>
        </PageSection>
        
        {/* Assigned Therapist Information */}
        {vitabyteLoading ? (
          <div className="mb-4 p-3 bg-psychPurple/5 rounded-lg border border-psychPurple/10">
            <div className="flex items-center gap-2 text-psychText">
              <Stethoscope className="w-4 h-4 text-psychPurple-dark" />
              <span className="text-sm font-medium">Therapeuteninformationen werden geladen...</span>
              <div className="w-3 h-3 border-2 border-psychPurple/30 border-t-psychPurple rounded-full animate-spin"></div>
            </div>
          </div>
        ) : vitabytePatient?.assignedTherapist ? (
          <div className="mb-4 p-3 bg-psychPurple/5 rounded-lg border border-psychPurple/10 highlight-effect">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-psychPurple-dark" />
                <div>
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-psychText/60" />
                    <span className="text-sm font-medium text-psychText">
                      {vitabytePatient.assignedTherapist.name}
                    </span>
                  </div>
                  <div className="text-xs text-psychText/70 ml-5">
                    {vitabytePatient.assignedTherapist.specialty}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="bg-psychPurple/10 text-psychText border-psychPurple/20 text-xs">
                ID: {vitabytePatient.assignedTherapist.providerId}
              </Badge>
            </div>
          </div>
        ) : vitabytePatient && !vitabytePatient.assignedTherapist ? (
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-yellow-600" />
              <div>
                <div className="text-sm font-medium text-yellow-800">Therapeutenzuordnung</div>
                <div className="text-xs text-yellow-700">
                  Kein Therapeut zugewiesen. Bitte kontaktieren Sie die Praxis.
                </div>
              </div>
            </div>
          </div>
        ) : null}
        
        {/* Debug Panel - Only show in development */}
        {import.meta.env.DEV && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">🔧 Debug Info (Development Only)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <strong>Supabase Patient:</strong>
                <div className="mt-1 font-mono text-gray-600">
                  ID: {patient?.id || 'N/A'}<br/>
                  Email: {patient?.email || 'N/A'}<br/>
                  Name: {patient?.name || 'N/A'}
                </div>
              </div>
              <div>
                <strong>Vitabyte Patient:</strong>
                <div className="mt-1 font-mono text-gray-600">
                  PatID: {vitabytePatient?.patid || 'N/A'}<br/>
                  Email: {vitabytePatient?.mail || 'N/A'}<br/>
                  Name: {vitabytePatient ? `${vitabytePatient.firstname} ${vitabytePatient.lastname}` : 'N/A'}<br/>
                  Therapist: {vitabytePatient?.assignedTherapist?.name || 'N/A'}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Using Patient ID: <strong>{vitabytePatient?.patid?.toString() || patient?.id || 'None'}</strong>
              {vitabytePatient?.patid ? ' (Vitabyte)' : ' (Supabase)'}
            </div>
          </div>
        )}
        
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">Bevorstehend</TabsTrigger>
            <TabsTrigger value="past">Vergangen</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="animate-fade-in">
            {hasUpcoming ? (
              <StaggeredList>
                {upcomingAppointments.map(appointment => (
                  <AppointmentCard 
                    key={appointment.id} 
                    appointment={appointment} 
                    onReschedule={handleReschedule}
                    onCancel={handleCancel}
                  />
                ))}
              </StaggeredList>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-psychText mb-2">Keine bevorstehenden Termine</h3>
                {!vitabytePatient && !vitabyteLoading ? (
                  <div className="mb-6 max-w-md mx-auto">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <h4 className="text-sm font-medium text-amber-800 mb-1">
                            Patientendaten nicht gefunden
                          </h4>
                          <p className="text-sm text-amber-700 mb-2">
                            Ihre E-Mail-Adresse <strong>{patient?.email}</strong> wurde in unserem Patientensystem nicht gefunden.
                          </p>
                          <p className="text-xs text-amber-600">
                            Wenn Sie bereits Patient bei uns sind, kontaktieren Sie bitte die Praxis, 
                            um Ihre E-Mail-Adresse zu aktualisieren oder ein neues Patientenkonto zu erstellen.
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-psychText/60 mb-4">
                      Sie können trotzdem Termine buchen. Diese werden nach der Verknüpfung Ihrer Daten angezeigt.
                    </p>
                  </div>
                ) : vitabyteLoading ? (
                  <div className="mb-6">
                    <p className="text-psychText/60 mb-2">Ihre Patientendaten werden geladen...</p>
                    <div className="flex justify-center">
                      <div className="w-4 h-4 border-2 border-psychPurple/30 border-t-psychPurple rounded-full animate-spin"></div>
                    </div>
                  </div>
                ) : (
                  <p className="text-psychText/60 mb-6">Buchen Sie Ihren nächsten Termin, um Ihre Therapiereise fortzusetzen</p>
                )}
                <Button 
                  onClick={handleBookNew}
                  className="bg-psychPurple hover:bg-psychPurple/90 text-white"
                >
                  Termin buchen
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past" className="animate-fade-in">
            {pastAppointments.length > 0 ? (
              <StaggeredList>
                {pastAppointments.map(appointment => (
                  <AppointmentCard 
                    key={appointment.id} 
                    appointment={appointment} 
                    onReschedule={() => {}}
                    onCancel={() => {}}
                  />
                ))}
              </StaggeredList>
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
