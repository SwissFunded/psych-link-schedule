import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService, Appointment } from '@/services/appointmentService';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isValid as isValidDate } from 'date-fns';
import { de } from 'date-fns/locale/de';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, Users, CheckCircle2, Circle, Filter, Search, AlertTriangle, Check, X } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { PageSection, FloatingCard, StaggeredList, StaggeredItem } from '@/components/ui/PageTransition';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface AdminAppointment extends Appointment {
  patientEmail?: string;
  patientName?: string;
  isCompleted?: boolean;
  isPending?: boolean;
  isPendingCancellation?: boolean;
  isPendingReschedule?: boolean;
}

const AdminAppointmentCard = ({ 
  appointment, 
  onToggleComplete,
  onApprove,
  onReject,
  onApproveCancellation,
  onApproveReschedule,
  onRejectChange
}: { 
  appointment: AdminAppointment; 
  onToggleComplete: (aptId: string, completed: boolean) => void;
  onApprove?: (aptId: string) => void;
  onReject?: (aptId: string) => void;
  onApproveCancellation?: (aptId: string) => void;
  onApproveReschedule?: (aptId: string, newDate: string, newTime: string) => void;
  onRejectChange?: (aptId: string) => void;
}) => {
  const [therapistName, setTherapistName] = useState('');
  
  // Safe date parsing with fallback
  const parseAppointmentDate = () => {
    try {
      // The date should already be in ISO format from getAllAppointments
      const date = parseISO(appointment.date);
      
      // Check if the parsed date is valid
      if (!isValidDate(date)) {
        throw new Error('Invalid date');
      }
      
      return {
        formattedDate: format(date, "EEEE, d. MMMM yyyy", { locale: de }),
        formattedTime: format(date, "HH:mm", { locale: de }),
        isValid: true
      };
    } catch (error) {
      console.warn('Failed to parse appointment date:', appointment.date, error);
      return {
        formattedDate: 'Ungültiges Datum',
        formattedTime: '--:--',
        isValid: false
      };
    }
  };
  
  const { formattedDate, formattedTime, isValid } = parseAppointmentDate();

  const appointmentTitle = appointment.metadata?.appointmentTitle || 
                          appointment.metadata?.appointmentType || 
                          'Termin';

  useEffect(() => {
    const getTherapistDetails = async () => {
      if (appointment.metadata?.calendarname) {
        setTherapistName(appointment.metadata.calendarname);
        return;
      }
      
      if (appointment.therapistId && appointment.therapistId !== 'undefined') {
        const therapist = await appointmentService.getTherapistById(appointment.therapistId);
        if (therapist) {
          setTherapistName(therapist.name);
        } else {
          const fallbackName = appointment.metadata?.provider || 
                              appointment.metadata?.therapist || 
                              'Therapeut';
          setTherapistName(fallbackName);
        }
      } else {
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
        <Card className={`mb-4 border-psychPurple/10 shadow-sm hover:shadow-lg transition-all duration-300 ${
          appointment.isCompleted ? 'bg-green-50/50 border-green-200/50' : 
          appointment.isPending ? 'bg-orange-50/50 border-orange-200/50' :
          appointment.isPendingCancellation ? 'bg-red-50/50 border-red-200/50' :
          appointment.isPendingReschedule ? 'bg-blue-50/50 border-blue-200/50' : 'bg-white'
        }`}>
          <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {appointment.isPending || appointment.isPendingCancellation || appointment.isPendingReschedule ? (
                    <motion.div
                      className="mt-1 flex-shrink-0"
                      whileHover={{ scale: 1.05 }}
                    >
                      {appointment.isPending && <AlertTriangle className="h-6 w-6 text-orange-500" />}
                      {appointment.isPendingCancellation && <X className="h-6 w-6 text-red-500" />}
                      {appointment.isPendingReschedule && <Calendar className="h-6 w-6 text-blue-500" />}
                    </motion.div>
                  ) : (
                    <motion.button
                      onClick={() => onToggleComplete(appointment.id, !appointment.isCompleted)}
                      className="mt-1 flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {appointment.isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500 hover:text-green-600" />
                      ) : (
                        <Circle className="h-6 w-6 text-psychText/40 hover:text-psychPurple" />
                      )}
                    </motion.button>
                  )}
                
                <div className="flex-1">
                  <CardTitle className={`text-lg ${appointment.isCompleted ? 'line-through text-psychText/60' : ''}`}>
                    {appointmentTitle}
                  </CardTitle>
                  <CardDescription className="mt-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3.5 w-3.5 text-psychPurple" />
                      <span className="font-medium">
                        {appointment.patientName || appointment.metadata?.patientName || appointment.patientEmail || appointment.metadata?.patientEmail || 'Unbekannter Patient'}
                      </span>
                    </div>
                    <div className="text-xs text-psychText/60">
                      {therapistName && `${therapistName} • `}
                      {appointment.type === 'in-person' ? 'Persönlich' : 'Online'} • {appointment.duration} Min
                    </div>
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    appointment.status === 'pending_admin_review' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    appointment.status === 'pending_cancellation' ? 'bg-red-50 text-red-700 border-red-200' :
                    appointment.status === 'pending_reschedule' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    appointment.status === 'scheduled' ? 'bg-green-50 text-green-700 border-green-200' :
                    appointment.status === 'completed' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                    appointment.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  {appointment.status === 'pending_admin_review' ? 'Wartet auf Genehmigung' :
                   appointment.status === 'pending_cancellation' ? 'Stornierung angefragt' :
                   appointment.status === 'pending_reschedule' ? 'Verschiebung angefragt' :
                   appointment.status === 'scheduled' ? 'Geplant' : 
                   appointment.status === 'completed' ? 'Abgeschlossen' : 
                   appointment.status === 'cancelled' ? 'Storniert' : 
                   appointment.status}
                </Badge>
                
                {appointment.isCompleted && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                    ✓ Erledigt
                  </Badge>
                )}
                
                {appointment.isPending && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                    ⏳ Neu
                  </Badge>
                )}
                
                {appointment.isPendingCancellation && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                    🗑️ Stornierung
                  </Badge>
                )}
                
                {appointment.isPendingReschedule && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                    📅 Verschiebung
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-4 text-sm text-psychText/70">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-psychPurple" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-psychPurple" />
                <span>{formattedTime} Uhr</span>
              </div>
            </div>
            
            {appointment.metadata?.notes && (
              <div className="mt-3 p-2 bg-psychPurple/5 rounded text-sm text-psychText/80">
                <strong>Notizen:</strong> {appointment.metadata.notes}
              </div>
            )}
            
            {appointment.isPending && onApprove && onReject && (
              <div className="mt-4 flex gap-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => onApprove(appointment.id)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Genehmigen
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => onReject(appointment.id)}
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Ablehnen
                  </Button>
                </motion.div>
              </div>
            )}

            {appointment.isPendingCancellation && onApproveCancellation && onRejectChange && (
              <div className="mt-4 flex gap-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => onApproveCancellation(appointment.id)}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Stornierung genehmigen
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => onRejectChange(appointment.id)}
                    size="sm"
                    variant="outline"
                    className="border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Ablehnen
                  </Button>
                </motion.div>
              </div>
            )}

            {appointment.isPendingReschedule && onApproveReschedule && onRejectChange && (
              <div className="mt-4 space-y-3">
                {appointment.metadata?.requested_new_date && appointment.metadata?.requested_new_time && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 font-medium">Neue gewünschte Zeit:</p>
                    <p className="text-sm text-blue-700">
                      {format(parseISO(`${appointment.metadata.requested_new_date}T${appointment.metadata.requested_new_time}`), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </p>
                    {appointment.metadata?.reschedule_reason && (
                      <p className="text-sm text-blue-600 mt-1">
                        <strong>Grund:</strong> {appointment.metadata.reschedule_reason}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => onApproveReschedule(
                        appointment.id, 
                        appointment.metadata?.requested_new_date || '', 
                        appointment.metadata?.requested_new_time || ''
                      )}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Verschiebung genehmigen
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => onRejectChange(appointment.id)}
                      size="sm"
                      variant="outline"
                      className="border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Ablehnen
                    </Button>
                  </motion.div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </StaggeredItem>
  );
};

export default function AdminAppointments() {
  const { patient } = useAuth();
  const [allAppointments, setAllAppointments] = useState<AdminAppointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [completionFilter, setCompletionFilter] = useState<string>('all');

  // Check if user is authorized (miromw@icloud.com)
  const isAuthorized = patient?.email === 'miromw@icloud.com';

  useEffect(() => {
    if (!isAuthorized) return;

    const fetchAllAppointments = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching all appointments for admin view');
        
        // Get all appointments from the system
        const appointments = await appointmentService.getAllAppointments();
        
        console.log('📅 All appointments fetched:', appointments.length);
        
        // Add completion status from localStorage and check for pending status
        const appointmentsWithCompletion: AdminAppointment[] = appointments.map(apt => ({
          ...apt,
          // Extract patient data from metadata for proper display
          patientName: apt.metadata?.patientName,
          patientEmail: apt.metadata?.patientEmail || apt.patientId,
          isCompleted: localStorage.getItem(`appointment_${apt.id}_completed`) === 'true',
          isPending: apt.status === 'pending_admin_review',
          isPendingCancellation: apt.status === 'pending_cancellation',
          isPendingReschedule: apt.status === 'pending_reschedule'
        }));
        
        setAllAppointments(appointmentsWithCompletion);
        setFilteredAppointments(appointmentsWithCompletion);
      } catch (error) {
        console.error('Fehler beim Abrufen aller Termine:', error);
        toast.error("Termine konnten nicht geladen werden");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllAppointments();
  }, [isAuthorized]);

  // Filter appointments based on search and filters
  useEffect(() => {
    let filtered = allAppointments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.patientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (apt.metadata?.appointmentTitle || apt.metadata?.appointmentType || '')
          .toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Completion filter
    if (completionFilter === 'completed') {
      filtered = filtered.filter(apt => apt.isCompleted);
    } else if (completionFilter === 'pending') {
      filtered = filtered.filter(apt => !apt.isCompleted && !apt.isPending && !apt.isPendingCancellation && !apt.isPendingReschedule);
    } else if (completionFilter === 'awaiting_approval') {
      filtered = filtered.filter(apt => apt.isPending);
    } else if (completionFilter === 'awaiting_cancellation') {
      filtered = filtered.filter(apt => apt.isPendingCancellation);
    } else if (completionFilter === 'awaiting_reschedule') {
      filtered = filtered.filter(apt => apt.isPendingReschedule);
    }

    setFilteredAppointments(filtered);
  }, [allAppointments, searchTerm, statusFilter, completionFilter]);

  const handleToggleComplete = (appointmentId: string, completed: boolean) => {
    // Update localStorage
    localStorage.setItem(`appointment_${appointmentId}_completed`, completed.toString());
    
    // Update state
    setAllAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, isCompleted: completed }
          : apt
      )
    );

    toast.success(completed ? "Termin als erledigt markiert" : "Termin als ausstehend markiert");
  };

  const handleApprove = async (appointmentId: string) => {
    try {
      // Update appointment status in Supabase
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'scheduled' })
        .eq('id', appointmentId);

      if (error) {
        toast.error("Fehler beim Genehmigen des Termins");
        return;
      }

      // Update local state
      setAllAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'scheduled' as const, isPending: false }
            : apt
        )
      );

      toast.success("Termin erfolgreich genehmigt!");
    } catch (error) {
      console.error('Error approving appointment:', error);
      toast.error("Fehler beim Genehmigen des Termins");
    }
  };

  const handleReject = async (appointmentId: string) => {
    try {
      // Update appointment status in Supabase
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) {
        toast.error("Fehler beim Ablehnen des Termins");
        return;
      }

      // Update local state
      setAllAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'cancelled' as const, isPending: false }
            : apt
        )
      );

      toast.success("Termin abgelehnt");
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      toast.error("Fehler beim Ablehnen des Termins");
    }
  };

  const handleApproveCancellation = async (appointmentId: string) => {
    try {
      // Update appointment status in Supabase to cancelled
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) {
        toast.error("Fehler beim Genehmigen der Stornierung");
        return;
      }

      // Update local state
      setAllAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'cancelled' as const, isPendingCancellation: false }
            : apt
        )
      );

      toast.success("Stornierung erfolgreich genehmigt!");
    } catch (error) {
      console.error('Error approving cancellation:', error);
      toast.error("Fehler beim Genehmigen der Stornierung");
    }
  };

  const handleApproveReschedule = async (appointmentId: string, newDate: string, newTime: string) => {
    try {
      // Update appointment with new date/time and set status to scheduled
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'scheduled',
          appointment_date: newDate,
          appointment_time: newTime
        })
        .eq('id', appointmentId);

      if (error) {
        toast.error("Fehler beim Genehmigen der Verschiebung");
        return;
      }

      // Update local state
      setAllAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { 
                ...apt, 
                status: 'scheduled' as const, 
                isPendingReschedule: false,
                date: `${newDate}T${newTime}:00`
              }
            : apt
        )
      );

      toast.success("Verschiebung erfolgreich genehmigt!");
    } catch (error) {
      console.error('Error approving reschedule:', error);
      toast.error("Fehler beim Genehmigen der Verschiebung");
    }
  };

  const handleRejectChange = async (appointmentId: string) => {
    try {
      // Revert appointment status back to scheduled
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'scheduled' })
        .eq('id', appointmentId);

      if (error) {
        toast.error("Fehler beim Ablehnen der Änderung");
        return;
      }

      // Update local state
      setAllAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { 
                ...apt, 
                status: 'scheduled' as const, 
                isPendingCancellation: false,
                isPendingReschedule: false
              }
            : apt
        )
      );

      toast.success("Änderung abgelehnt - Termin bleibt bestehen");
    } catch (error) {
      console.error('Error rejecting change:', error);
      toast.error("Fehler beim Ablehnen der Änderung");
    }
  };

  if (!isAuthorized) {
    return (
      <Layout>
        <div className="container max-w-2xl mx-auto py-8 px-4">
          <PageSection className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, ease: [0.19, 1.0, 0.22, 1.0] }}
            >
              <h1 className="text-2xl font-semibold text-psychText mb-4">Zugriff verweigert</h1>
              <p className="text-psychText/60">Sie haben keine Berechtigung für diese Seite.</p>
            </motion.div>
          </PageSection>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-psychPurple/10 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-white rounded-lg border border-psychPurple/10"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const completedCount = filteredAppointments.filter(apt => apt.isCompleted).length;
  const pendingApprovalCount = filteredAppointments.filter(apt => apt.isPending).length;
  const pendingCancellationCount = filteredAppointments.filter(apt => apt.isPendingCancellation).length;
  const pendingRescheduleCount = filteredAppointments.filter(apt => apt.isPendingReschedule).length;
  const totalCount = filteredAppointments.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <PageSection className="mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: [0.19, 1.0, 0.22, 1.0] }}
          >
            <h1 className="text-3xl font-bold text-psychText mb-2">Admin: Alle Termine</h1>
            <p className="text-psychText/60">Verwalten Sie alle Termine im System</p>
          </motion.div>
        </PageSection>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <FloatingCard index={0}>
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-psychText/70">Gesamt</p>
                    <p className="text-2xl font-bold text-psychText">{totalCount}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-psychPurple/60" />
                </div>
              </CardContent>
            </Card>
          </FloatingCard>

          <FloatingCard index={1}>
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-psychText/70">Benötigen Aktion</p>
                    <p className="text-2xl font-bold text-orange-600">{pendingApprovalCount + pendingCancellationCount + pendingRescheduleCount}</p>
                    <div className="flex gap-2 mt-1">
                      {pendingApprovalCount > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          {pendingApprovalCount} Neu
                        </span>
                      )}
                      {pendingCancellationCount > 0 && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          {pendingCancellationCount} Stornierung
                        </span>
                      )}
                      {pendingRescheduleCount > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {pendingRescheduleCount} Verschiebung
                        </span>
                      )}
                    </div>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </FloatingCard>

          <FloatingCard index={2}>
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-psychText/70">Erledigt</p>
                    <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </FloatingCard>

          <FloatingCard index={3}>
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-psychText/70">Ausstehend</p>
                    <p className="text-2xl font-bold text-blue-600">{totalCount - completedCount - pendingApprovalCount - pendingCancellationCount - pendingRescheduleCount}</p>
                  </div>
                  <Circle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </FloatingCard>

          <FloatingCard index={4}>
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-psychText/70">Fortschritt</p>
                    <p className="text-2xl font-bold text-psychPurple">{completionRate}%</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-psychPurple/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-psychPurple">{completionRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FloatingCard>
        </div>

        {/* Filters */}
        <FloatingCard index={4}>
          <Card className="mb-6 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-psychText/40" />
                    <Input
                      placeholder="Nach Patient oder Terminart suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Status filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="pending_admin_review">Warten auf Genehmigung</SelectItem>
                    <SelectItem value="pending_cancellation">Stornierung angefragt</SelectItem>
                    <SelectItem value="pending_reschedule">Verschiebung angefragt</SelectItem>
                    <SelectItem value="scheduled">Geplant</SelectItem>
                    <SelectItem value="completed">Abgeschlossen</SelectItem>
                    <SelectItem value="cancelled">Storniert</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={completionFilter} onValueChange={setCompletionFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Erledigung filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="awaiting_approval">Warten auf Genehmigung</SelectItem>
                    <SelectItem value="awaiting_cancellation">Stornierung angefragt</SelectItem>
                    <SelectItem value="awaiting_reschedule">Verschiebung angefragt</SelectItem>
                    <SelectItem value="completed">Erledigt</SelectItem>
                    <SelectItem value="pending">Ausstehend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </FloatingCard>

        {/* Appointments List */}
        <AnimatePresence>
          {filteredAppointments.length > 0 ? (
            <StaggeredList>
              {filteredAppointments.map(appointment => (
                <AdminAppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                  onToggleComplete={handleToggleComplete}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onApproveCancellation={handleApproveCancellation}
                  onApproveReschedule={handleApproveReschedule}
                  onRejectChange={handleRejectChange}
                />
              ))}
            </StaggeredList>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, ease: [0.19, 1.0, 0.22, 1.0] }}
              className="text-center py-12"
            >
              <Users className="h-16 w-16 text-psychText/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-psychText mb-2">Keine Termine gefunden</h3>
              <p className="text-psychText/60">
                {searchTerm || statusFilter !== 'all' || completionFilter !== 'all' 
                  ? 'Versuchen Sie andere Filtereinstellungen'
                  : 'Es sind noch keine Termine im System vorhanden'
                }
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
} 