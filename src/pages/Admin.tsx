import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Mail, Phone, User, X, RefreshCw, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Booking {
  id: string;
  therapist_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  appointment_type: string;
  appointment_mode: string;
  notes: string | null;
  vitabyte_appointment_id: number | null;
  status: 'scheduled' | 'cancelled' | 'failed';
  source: string;
  created_at: string;
  cancelled_at: string | null;
}

export default function Admin() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch bookings from Supabase
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Fehler beim Laden der Buchungen');
        return;
      }

      setBookings(data || []);
      setFilteredBookings(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Fehler beim Laden der Buchungen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Filter bookings based on search and status
  useEffect(() => {
    let filtered = bookings;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.first_name.toLowerCase().includes(term) ||
        booking.last_name.toLowerCase().includes(term) ||
        booking.email.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  }, [searchTerm, statusFilter, bookings]);

  // Cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Möchten Sie diese Buchung wirklich stornieren?')) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('cancel-booking', {
        body: { bookingId }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Stornierung fehlgeschlagen');
      }

      toast.success('Buchung erfolgreich storniert');
      fetchBookings();
      setDetailsOpen(false);
    } catch (error: any) {
      console.error('Cancel error:', error);
      toast.error(error.message || 'Fehler beim Stornieren');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Datum',
      'Zeit',
      'Dauer',
      'Vorname',
      'Nachname',
      'Email',
      'Telefon',
      'Terminart',
      'Modus',
      'Status',
      'Vitabyte ID',
      'Erstellt am'
    ];

    const csvData = filteredBookings.map(booking => [
      format(parseISO(booking.start_time), 'dd.MM.yyyy', { locale: de }),
      format(parseISO(booking.start_time), 'HH:mm', { locale: de }),
      `${booking.duration_minutes} Min`,
      booking.first_name,
      booking.last_name,
      booking.email,
      booking.phone || '',
      booking.appointment_type,
      booking.appointment_mode,
      booking.status,
      booking.vitabyte_appointment_id || '',
      format(parseISO(booking.created_at), 'dd.MM.yyyy HH:mm', { locale: de })
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `buchungen_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('CSV-Export erfolgreich');
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-green-500">Gebucht</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Storniert</Badge>;
      case 'failed':
        return <Badge variant="secondary">Fehlgeschlagen</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Stats
  const stats = {
    total: bookings.length,
    scheduled: bookings.filter(b => b.status === 'scheduled').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    failed: bookings.filter(b => b.status === 'failed').length
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-psychPurple/5 to-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-psychText mb-2">Admin-Panel</h1>
            <p className="text-psychText/60">Verwaltung aller Terminbuchungen</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Gebucht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.scheduled}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">Storniert</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-600">Fehlgeschlagen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.failed}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter & Suche</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Name oder Email suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="md:w-64"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="md:w-48">
                    <SelectValue placeholder="Status filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="scheduled">Gebucht</SelectItem>
                    <SelectItem value="cancelled">Storniert</SelectItem>
                    <SelectItem value="failed">Fehlgeschlagen</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2 ml-auto">
                  <Button onClick={fetchBookings} variant="outline" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleExportCSV} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    CSV Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Buchungen ({filteredBookings.length})</CardTitle>
              <CardDescription>Alle Terminbuchungen mit Details</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-psychPurple border-r-transparent"></div>
                  <p className="mt-2 text-sm text-psychText/60">Lade Buchungen...</p>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-8 text-psychText/60">
                  Keine Buchungen gefunden
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum & Zeit</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Terminart</TableHead>
                        <TableHead>Dauer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Vitabyte ID</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => (
                        <TableRow 
                          key={booking.id}
                          className="cursor-pointer hover:bg-psychPurple/5"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setDetailsOpen(true);
                          }}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-psychPurple" />
                              <div>
                                <div>{format(parseISO(booking.start_time), 'dd.MM.yyyy', { locale: de })}</div>
                                <div className="text-xs text-psychText/60">
                                  {format(parseISO(booking.start_time), 'HH:mm', { locale: de })} Uhr
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-psychPurple" />
                              {booking.first_name} {booking.last_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-psychPurple" />
                              {booking.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{booking.appointment_type}</Badge>
                          </TableCell>
                          <TableCell>{booking.duration_minutes} Min</TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                          <TableCell>
                            {booking.vitabyte_appointment_id ? (
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {booking.vitabyte_appointment_id}
                              </code>
                            ) : (
                              <span className="text-xs text-psychText/40">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {booking.status === 'scheduled' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelBooking(booking.id);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details Sheet */}
          <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Buchungsdetails</SheetTitle>
                <SheetDescription>
                  Vollständige Informationen zur Buchung
                </SheetDescription>
              </SheetHeader>
              {selectedBooking && (
                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Patient
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Name:</strong> {selectedBooking.first_name} {selectedBooking.last_name}</p>
                      <p><strong>Email:</strong> {selectedBooking.email}</p>
                      {selectedBooking.phone && <p><strong>Telefon:</strong> {selectedBooking.phone}</p>}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Termin
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Datum:</strong> {format(parseISO(selectedBooking.start_time), 'dd. MMMM yyyy', { locale: de })}</p>
                      <p><strong>Zeit:</strong> {format(parseISO(selectedBooking.start_time), 'HH:mm', { locale: de })} - {format(parseISO(selectedBooking.end_time), 'HH:mm', { locale: de })} Uhr</p>
                      <p><strong>Dauer:</strong> {selectedBooking.duration_minutes} Minuten</p>
                      <p><strong>Art:</strong> {selectedBooking.appointment_type}</p>
                      <p><strong>Modus:</strong> {selectedBooking.appointment_mode}</p>
                    </div>
                  </div>

                  {selectedBooking.notes && (
                    <div>
                      <h3 className="font-semibold mb-2">Notizen</h3>
                      <p className="text-sm text-psychText/80">{selectedBooking.notes}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-2">System</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Status:</strong> {getStatusBadge(selectedBooking.status)}</p>
                      <p><strong>Quelle:</strong> {selectedBooking.source}</p>
                      <p><strong>Vitabyte ID:</strong> {selectedBooking.vitabyte_appointment_id || '-'}</p>
                      <p><strong>Erstellt:</strong> {format(parseISO(selectedBooking.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                      {selectedBooking.cancelled_at && (
                        <p><strong>Storniert:</strong> {format(parseISO(selectedBooking.cancelled_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                      )}
                    </div>
                  </div>

                  {selectedBooking.status === 'scheduled' && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleCancelBooking(selectedBooking.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Buchung stornieren
                    </Button>
                  )}
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </Layout>
  );
}

