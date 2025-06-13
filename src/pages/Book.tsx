import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService, TimeSlot, BookingData, getAppointmentDuration } from '@/services/appointmentService';
import { getMultipleTreaters, Treater } from '@/lib/epatApi';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Layout from '@/components/layout/Layout';
import { PageSection, FloatingCard } from '@/components/ui/PageTransition';
import { Clock, CheckCircle, AlertCircle, Calendar as CalendarIcon, User, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface BookingState {
  selectedDate: Date | undefined;
  selectedSlot: TimeSlot | null;
  isLoading: boolean;
  isBooking: boolean;
  bookingSuccess: boolean;
  error: string | null;
}

export default function Book() {
  const [bookingState, setBookingState] = useState<BookingState>({
    selectedDate: undefined,
    selectedSlot: null,
    isLoading: false,
    isBooking: false,
    bookingSuccess: false,
    error: null
  });

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [allSlotsByDate, setAllSlotsByDate] = useState<Record<string, TimeSlot[]>>({});
  const [appointmentType, setAppointmentType] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Multiple treaters state
  const [availableTreaters, setAvailableTreaters] = useState<Treater[]>([]);
  const [selectedTreater, setSelectedTreater] = useState<Treater | null>(null);
  const [loadingTreaters, setLoadingTreaters] = useState(false);
  
  const { patient, vitabytePatient } = useAuth();
  const navigate = useNavigate();

  // Load multiple treaters for the patient
  useEffect(() => {
    const fetchTreaters = async () => {
      if (!vitabytePatient?.patid) return;
      
      setLoadingTreaters(true);
      try {
        console.log('🔄 Fetching multiple treaters for patient:', vitabytePatient.patid);
        const treatersResponse = await getMultipleTreaters(vitabytePatient.patid);
        
        if (treatersResponse && treatersResponse.treaters.length > 0) {
          console.log('✅ Found multiple treaters:', treatersResponse.treaters);
          setAvailableTreaters(treatersResponse.treaters);
          
          // If only one treater, auto-select it
          if (treatersResponse.treaters.length === 1) {
            setSelectedTreater(treatersResponse.treaters[0]);
          }
        } else {
          console.log('ℹ️ No multiple treaters found, using default');
          setAvailableTreaters([]);
        }
      } catch (error) {
        console.error('Error fetching multiple treaters:', error);
      } finally {
        setLoadingTreaters(false);
      }
    };
    
    fetchTreaters();
  }, [vitabytePatient?.patid]);
  
  // Load all available slots from Vitabyte ICS Calendar on component mount
  useEffect(() => {
    const fetchAllSlots = async () => {
      setBookingState(prev => ({ ...prev, isLoading: true }));
      try {
        console.log('🔄 Fetching slots from Vitabyte ICS Calendar...');
        const slotsByDate = await appointmentService.getAllAvailableSlots();
        console.log('✅ Vitabyte ICS Calendar Response:', slotsByDate);
        setAllSlotsByDate(slotsByDate);
      } catch (error) {
        console.error('Error fetching slots from Vitabyte ICS Calendar:', error);
        setBookingState(prev => ({ 
          ...prev, 
          error: 'Verfügbare Termine konnten nicht geladen werden' 
        }));
      } finally {
        setBookingState(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    fetchAllSlots();
  }, []);
  
  const loadTimeSlots = useCallback(async (date: Date) => {
    setBookingState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const slotsForDate = allSlotsByDate[dateString] || [];
      setTimeSlots(slotsForDate);
    } catch (error) {
      setBookingState(prev => ({ 
        ...prev, 
        error: 'Fehler beim Laden der verfügbaren Zeiten' 
      }));
    } finally {
      setBookingState(prev => ({ ...prev, isLoading: false }));
    }
  }, [allSlotsByDate]);

  useEffect(() => {
    if (bookingState.selectedDate) {
      loadTimeSlots(bookingState.selectedDate);
    }
  }, [bookingState.selectedDate, loadTimeSlots]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return;
    
    setBookingState(prev => ({
      ...prev,
      selectedDate: date,
      selectedSlot: null,
      bookingSuccess: false,
      error: null
    }));
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    if (!slot.available) return;
    
    setBookingState(prev => ({
      ...prev,
      selectedSlot: prev.selectedSlot?.time === slot.time ? null : slot,
      error: null
    }));
  };

  const handleBooking = async () => {
    if (!patient?.email || !patient?.name || !bookingState.selectedDate || !bookingState.selectedSlot || !appointmentType) {
      setBookingState(prev => ({ 
        ...prev, 
        error: 'Bitte füllen Sie alle erforderlichen Felder aus' 
      }));
      return;
    }
    
    // Check if treater selection is required
    if (availableTreaters.length > 1 && !selectedTreater) {
      setBookingState(prev => ({ 
        ...prev, 
        error: 'Bitte wählen Sie einen Therapeuten aus' 
      }));
      return;
    }
    
    setBookingState(prev => ({ ...prev, isBooking: true, error: null }));
    
    const bookingData: BookingData = {
      patientEmail: patient.email,
      patientName: `${patient.name} ${patient.surname || ''}`.trim(),
      patientPhone: patient.phone || undefined,
      appointmentDate: format(bookingState.selectedDate, 'yyyy-MM-dd'),
      appointmentTime: bookingState.selectedSlot.time,
      appointmentType,
      duration: getAppointmentDuration(appointmentType),
      notes: notes || undefined,
      selectedTreater: selectedTreater || undefined
    };
    
    try {
      const result = await appointmentService.bookAppointment(bookingData);
      
      if (result.success) {
        setBookingState(prev => ({ 
          ...prev, 
          bookingSuccess: true,
          selectedSlot: null
        }));
        
        toast.success('Termin erfolgreich gebucht!', {
          description: `${format(bookingState.selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })} um ${bookingState.selectedSlot.time} Uhr`
        });
        
        // Update the time slots to mark this one as booked
        setTimeSlots(prev => prev.map(slot => 
          slot.time === bookingState.selectedSlot?.time 
            ? { ...slot, available: false }
            : slot
        ));
        
        // Navigate to appointments after a short delay
        setTimeout(() => {
        navigate('/appointments');
        }, 2000);
      } else {
        setBookingState(prev => ({ 
          ...prev, 
          error: result.error || 'Termin konnte nicht gebucht werden' 
        }));
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      setBookingState(prev => ({ 
        ...prev, 
        error: 'Ein Fehler ist aufgetreten' 
      }));
    } finally {
      setBookingState(prev => ({ ...prev, isBooking: false }));
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Only disable past dates and Sundays (Sunday = 0)
    return date < today || date.getDay() === 0;
  };

  const formatDate = (date: Date) => {
    return format(date, 'EEEE, d. MMMM yyyy', { locale: de });
  };

  return (
    <Layout>
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <PageSection className="text-center space-y-2">
          <motion.h1 
            className="text-2xl sm:text-3xl font-bold text-psychText"
            initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: [0.19, 1.0, 0.22, 1.0] }}
          >
            Neuen Termin buchen
          </motion.h1>
          <motion.p 
            className="text-psychText/60 text-sm sm:text-base"
            initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.19, 1.0, 0.22, 1.0] }}
          >
            Wählen Sie Datum und Zeit für Ihren Besuch
          </motion.p>
        </PageSection>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          <FloatingCard index={0}>
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Datum wählen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                selected={bookingState.selectedDate}
                  onSelect={handleDateSelect}
                  disabled={isDateDisabled}
                  locale={de}
                className="rounded-md border-0"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-psychText/60 rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-psychPurple/10 hover:text-psychPurple transition-colors",
                  day_range_end: "day-range-end",
                  day_selected: "bg-psychPurple text-white hover:bg-psychPurple/90 hover:text-white focus:bg-psychPurple focus:text-white",
                  day_today: "bg-psychPurple/10 text-psychPurple",
                  day_outside: "day-outside text-psychText/30 opacity-50 aria-selected:bg-psychPurple/50 aria-selected:text-psychText/60 aria-selected:opacity-30",
                  day_disabled: "text-psychText/30 opacity-50 cursor-not-allowed",
                  day_range_middle: "aria-selected:bg-psychPurple/10 aria-selected:text-psychPurple",
                  day_hidden: "invisible",
                }}
              />
                          </CardContent>
            </Card>
          </FloatingCard>

          <FloatingCard index={1}>
            <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Verfügbare Zeiten
                {bookingState.selectedDate && (
                  <Badge variant="secondary" className="ml-auto">
                    {formatDate(bookingState.selectedDate)}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {!bookingState.selectedDate ? (
                  <motion.div
                    key="no-date"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center py-8 text-psychText/60"
                  >
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Bitte wählen Sie ein Datum, um verfügbare Zeiten zu sehen</p>
                  </motion.div>
                ) : bookingState.isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="slots"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    {timeSlots.length === 0 ? (
                      <div className="text-center py-8 text-psychText/60">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Keine verfügbaren Zeiten für dieses Datum</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                          {timeSlots.map((slot) => (
                            <motion.div
                              key={slot.time}
                              whileHover={slot.available ? { scale: 1.02 } : {}}
                              whileTap={slot.available ? { scale: 0.95 } : {}}
                            >
                              <Button
                                variant={
                                  bookingState.selectedSlot?.time === slot.time
                                    ? "default"
                                    : slot.available
                                    ? "outline"
                                    : "ghost"
                                }
                                className={`w-full h-14 sm:h-12 text-sm sm:text-base transition-all duration-200 ${
                                  !slot.available
                                    ? "opacity-50 cursor-not-allowed"
                                    : bookingState.selectedSlot?.time === slot.time
                                    ? "bg-psychPurple hover:bg-psychPurple/90 shadow-lg"
                                    : "hover:shadow-md hover:bg-psychPurple/10 hover:text-psychPurple hover:border-psychPurple/50"
                                }`}
                                onClick={() => handleSlotSelect(slot)}
                                disabled={!slot.available}
                                aria-label={`${slot.time} ${slot.available ? 'verfügbar' : 'nicht verfügbar'}`}
                              >
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  <span className="font-medium">{slot.time}</span>
                                  {!slot.available && (
                                    <Badge variant="destructive" className="text-xs hidden sm:inline-flex">
                                      Belegt
                                    </Badge>
                                  )}
                                </div>
                              </Button>
                            </motion.div>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-psychText/60 pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded border-2 border-psychPurple"></div>
                            <span>Verfügbar</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-psychText/20"></div>
                            <span>Belegt</span>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              </CardContent>
            </Card>
          </FloatingCard>
        </div>

        <AnimatePresence>
          {bookingState.error && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, scale: 0.98, filter: 'blur(2px)' }}
              transition={{ duration: 0.4, ease: [0.19, 1.0, 0.22, 1.0] }}
            >
              <Alert variant="destructive" className="shadow-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{bookingState.error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {bookingState.bookingSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, scale: 0.95, filter: 'blur(2px)' }}
              transition={{ duration: 0.6, ease: [0.19, 1.0, 0.22, 1.0] }}
            >
              <Alert className="border-blue-200 bg-blue-50 text-blue-800 shadow-lg">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  Ihre Terminanfrage wurde erfolgreich eingereicht! Der Termin wird von unserem Team geprüft und Sie erhalten eine Bestätigung.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {bookingState.selectedSlot && bookingState.selectedDate && (
            <FloatingCard index={2}>
              <Card className="border-psychPurple/20 bg-psychPurple/5 shadow-xl">
                 <CardContent className="pt-4 sm:pt-6 space-y-4">
                   <div className="space-y-3">
                     <p className="font-medium text-psychText text-lg">Termin bestätigen</p>
                     <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-psychText/60">
                       <div className="flex items-center gap-2">
                         <CalendarIcon className="h-4 w-4 text-psychPurple" />
                         <span className="font-medium">{formatDate(bookingState.selectedDate)}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <Clock className="h-4 w-4 text-psychPurple" />
                         <span className="font-medium">{bookingState.selectedSlot.time} Uhr</span>
                       </div>
                     </div>
                   </div>

                                     {/* Treater Selection - only show if multiple treaters available */}
                   {availableTreaters.length > 1 && (
                     <div className="space-y-2">
                       <Label htmlFor="treater-select" className="text-sm font-medium">Therapeut/in wählen *</Label>
                       <Select 
                         value={selectedTreater?.provider.toString() || ''} 
                         onValueChange={(value) => {
                           const treater = availableTreaters.find(t => t.provider.toString() === value);
                           setSelectedTreater(treater || null);
                         }}
                       >
                         <SelectTrigger className="h-12 text-base">
                           <SelectValue placeholder="Wählen Sie Ihren Therapeuten/Ihre Therapeutin" />
                         </SelectTrigger>
                         <SelectContent>
                           {availableTreaters.map((treater) => (
                             <SelectItem key={treater.provider} value={treater.provider.toString()} className="text-base py-3">
                               <div className="flex items-center gap-2">
                                 <Users className="w-4 h-4" />
                                 <span>
                                   {treater.name || `Therapeut ${treater.provider}`}
                                   {treater.specialty && (
                                     <span className="text-sm text-gray-500 ml-2">({treater.specialty})</span>
                                   )}
                                 </span>
                               </div>
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                   )}

                                     <div className="space-y-2">
                     <Label htmlFor="appointment-type" className="text-sm font-medium">Terminart *</Label>
                  <Select value={appointmentType} onValueChange={setAppointmentType}>
                       <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Wählen Sie die Terminart" />
                    </SelectTrigger>
                    <SelectContent>
                         <SelectItem value="medical_60" className="text-base py-3">Ärztliche Betreuung 60 Min</SelectItem>
                         <SelectItem value="medical_30" className="text-base py-3">Ärztliche Betreuung 30 min</SelectItem>
                         <SelectItem value="phone_video_60" className="text-base py-3">Telefon/Video Termin 60min</SelectItem>
                         <SelectItem value="therapy_60" className="text-base py-3">Therapie 60 min</SelectItem>
                         <SelectItem value="short_30" className="text-base py-3">Kurztermin 30 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                   <div className="space-y-2">
                     <Label htmlFor="notes" className="text-sm font-medium">Anmerkungen (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Teilen Sie uns mit, wenn Sie spezielle Anliegen haben..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                       className="text-base resize-none"
                  />
                </div>

                   <Button
                     onClick={handleBooking}
                     disabled={
                       bookingState.isBooking || 
                       !appointmentType || 
                       (availableTreaters.length > 1 && !selectedTreater)
                     }
                     className="w-full h-12 sm:h-10 bg-psychPurple hover:bg-psychPurple/90 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                   >
                     {bookingState.isBooking ? (
                       <div className="flex items-center gap-2">
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         <span>Buchung läuft...</span>
                  </div>
                     ) : (
                       <div className="flex items-center gap-2">
                         <User className="h-4 w-4" />
                         <span>Termin buchen</span>
                  </div>
                )}
                </Button>
              </CardContent>
            </Card>
            </FloatingCard>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
