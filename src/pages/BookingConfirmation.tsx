import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { Calendar, MapPin, Phone, User } from 'lucide-react';
import { Appointment } from '@/services/appointmentService';

export default function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const appointment = location.state?.appointment as Appointment;
  const therapistName = location.state?.therapistName as string;

  if (!appointment) {
    navigate('/book');
    return null;
  }

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-psychPurple/20 text-psychPurple flex items-center justify-center text-sm">
                ✓
              </div>
              <span className="ml-2 text-sm text-psychText/60">Verifikation</span>
            </div>
            <div className="w-16 h-px bg-gray-300" />
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-psychPurple/20 text-psychPurple flex items-center justify-center text-sm">
                ✓
              </div>
              <span className="ml-2 text-sm text-psychText/60">Informationen</span>
            </div>
            <div className="w-16 h-px bg-gray-300" />
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-psychPurple text-white flex items-center justify-center text-sm">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium text-psychText">Bestätigung</span>
            </div>
          </div>
        </div>

        {/* Confirmation Message */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-psychPurple mb-4">
            Ihr Termin ist gebucht!
          </h1>
          <p className="text-psychText/70">
            Die Bestätigungsemail wurde soeben versendet
          </p>
          <p className="text-psychText/70 mt-2">
            Sie werden auch noch 72 Stunden vor dem Termin eine SMS-Erinnerung erhalten!
          </p>
        </div>

        {/* Appointment Details */}
        <Card className="border-psychPurple/10 mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Zu Ihrem Termin</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <User className="w-5 h-5 text-psychPurple mr-3" />
                <span className="font-medium">{therapistName}</span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-psychPurple mr-3" />
                <span>
                  {format(parseISO(appointment.date), 'EEEE, d. MMMM yyyy', { locale: de })} um{' '}
                  {format(parseISO(appointment.date), 'HH:mm', { locale: de })}
                </span>
              </div>
              
              <div className="pt-4 border-t border-gray-100 mt-4">
                <p className="text-sm font-medium text-psychText mb-2">
                  {appointment.notes}
                </p>
                <p className="text-sm text-psychText/60">
                  Wenn es Ihnen nicht möglich ist, den vereinbarten Behandlungstermin
                  einzuhalten, so bitten wir Sie um rechtzeitige Terminabsage (24 Std. im
                  Voraus an Werktagen). Andernfalls wird eine Gebühr verrechnet.
                </p>
                <p className="text-sm text-psychText/60 mt-2">
                  Dies gilt auch im Fall von Krankheitsbedingter Absage.
                </p>
                <p className="text-sm text-psychText/70 mt-4">
                  Freundliche Grüsse PsychCentral Psychologie CH
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="border-psychPurple/10 mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Weitere Informationen</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-psychPurple mr-3 mt-1" />
                  <div>
                    <p className="font-medium">Weinbergstrasse 29</p>
                    <p className="text-psychText/70">8001 Zürich</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-psychPurple mr-3" />
                  <a href="tel:0442628550" className="text-psychPurple hover:underline">
                    044 262 85 50
                  </a>
                </div>
              </div>
              
              <div className="h-48 bg-gray-100 rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2701.547!2d8.540!3d47.377!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47900a0d3b7e3f5d%3A0x3d4b8a5e6c2d1a90!2sWeinbergstrasse%2029%2C%208001%20Z%C3%BCrich!5e0!3m2!1sen!2sch!4v1649000000000!5m2!1sen!2sch"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Button 
            variant="outline"
            className="border-psychPurple/20 hover:border-psychPurple"
            onClick={() => navigate('/appointments')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            MEINE TERMINE ANSEHEN
          </Button>
          <Button 
            className="bg-psychPurple hover:bg-psychPurple/90"
            onClick={() => navigate('/book')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            NEUER TERMIN
          </Button>
        </div>
      </div>
    </Layout>
  );
}
