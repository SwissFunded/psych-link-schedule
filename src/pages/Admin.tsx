import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Calendar, Clock, User, Phone, Mail, FileText, Hash } from 'lucide-react';

interface Booking {
  id: string;
  created_at: string;
  patient_email: string;
  patient_name: string;
  patient_phone: string | null;
  vitabyte_patient_id: number | null;
  treater_name: string | null;
  treater_id: number | null;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  duration: number;
  notes: string | null;
  status: string;
}

export default function Admin() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating booking status:', error);
        return;
      }

      // Refresh bookings
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.patient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.appointment_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Geplant';
      case 'cancelled': return 'Storniert';
      case 'completed': return 'Abgeschlossen';
      default: return status;
    }
  };

  const groupBookingsByDate = () => {
    const grouped = filteredBookings.reduce((acc, booking) => {
      const date = booking.appointment_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(booking);
      return acc;
    }, {} as Record<string, Booking[]>);

    // Sort dates and bookings within each date
    const sortedDates = Object.keys(grouped).sort();
    const result = sortedDates.map(date => ({
      date,
      bookings: grouped[date].sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
    }));

    return result;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-psychPurple/30 border-t-psychPurple rounded-full animate-spin"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Admin - Terminübersicht</h1>
          <p className="text-psychText/60">Alle Buchungen und Patiententermine</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-psychText/60">Gesamt</p>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-psychPurple/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-psychText/60">Geplant</p>
                  <p className="text-2xl font-bold text-green-600">
                    {bookings.filter(b => b.status === 'scheduled').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-green-600/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-psychText/60">Storniert</p>
                  <p className="text-2xl font-bold text-red-600">
                    {bookings.filter(b => b.status === 'cancelled').length}
                  </p>
                </div>
                <User className="w-8 h-8 text-red-600/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-psychText/60">Mit Vitabyte ID</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {bookings.filter(b => b.vitabyte_patient_id).length}
                  </p>
                </div>
                <Hash className="w-8 h-8 text-blue-600/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Suche nach Name, E-Mail oder Terminart..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="all">Alle Status</option>
              <option value="scheduled">Geplant</option>
              <option value="cancelled">Storniert</option>
              <option value="completed">Abgeschlossen</option>
            </select>
          </div>
        </div>

        <Tabs defaultValue="table" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="table">Tabellenansicht</TabsTrigger>
            <TabsTrigger value="calendar">Kalenderansicht</TabsTrigger>
          </TabsList>

          <TabsContent value="table">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Kontakt</TableHead>
                      <TableHead>Termin</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Vitabyte</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{booking.patient_name}</div>
                            <div className="text-sm text-gray-500">
                              {format(new Date(booking.created_at), 'dd.MM.yyyy HH:mm')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3" />
                              {booking.patient_email}
                            </div>
                            {booking.patient_phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="w-3 h-3" />
                                {booking.patient_phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {format(new Date(booking.appointment_date), 'dd.MM.yyyy', { locale: de })}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.appointment_time} Uhr ({booking.duration} Min.)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{booking.appointment_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {booking.vitabyte_patient_id ? (
                              <div>
                                <div className="font-medium">ID: {booking.vitabyte_patient_id}</div>
                                {booking.treater_name && (
                                  <div className="text-gray-500">{booking.treater_name}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">Nicht verknüpft</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(booking.status)}>
                            {getStatusText(booking.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {booking.status === 'scheduled' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateBookingStatus(booking.id, 'completed')}
                                >
                                  Abschließen
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                >
                                  Stornieren
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <div className="space-y-6">
              {groupBookingsByDate().map(({ date, bookings: dateBookings }) => (
                <Card key={date}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {format(new Date(date), 'EEEE, d. MMMM yyyy', { locale: de })}
                      <Badge variant="outline">{dateBookings.length} Termine</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {dateBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-sm font-medium text-psychPurple">
                              {booking.appointment_time}
                            </div>
                            <div>
                              <div className="font-medium">{booking.patient_name}</div>
                              <div className="text-sm text-gray-500">
                                {booking.appointment_type} • {booking.duration} Min.
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusText(booking.status)}
                            </Badge>
                            {booking.notes && (
                              <div title={booking.notes}>
                                <FileText className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
} 