import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { PageSection, FloatingCard } from '@/components/ui/PageTransition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, User, Stethoscope, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const { patient, vitabytePatient, vitabyteLoading, refreshVitabyteData, logout } = useAuth();
  
  if (!patient) {
    return (
      <Layout>
        <div className="container max-w-2xl mx-auto py-8 px-4">
          <div className="text-center">Profil wird geladen...</div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <PageSection className="flex justify-between items-center mb-6">
          <motion.h1 
            className="text-2xl font-semibold"
            initial={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: [0.19, 1.0, 0.22, 1.0] }}
          >
            Ihr Profil
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.19, 1.0, 0.22, 1.0] }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={refreshVitabyteData}
              disabled={vitabyteLoading}
              variant="outline"
              size="sm"
              className="border-psychPurple/20 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${vitabyteLoading ? 'animate-spin' : ''}`} />
              {vitabyteLoading ? 'Aktualisiere...' : 'Daten aktualisieren'}
            </Button>
          </motion.div>
        </PageSection>
        
        {/* Supabase User Information */}
        <FloatingCard index={0}>
          <Card className="border-psychPurple/10 card-shadow mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-psychPurple" />
              Persönliche Informationen
            </CardTitle>
            <CardDescription>Ihre Kontodaten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-psychText/70">Name</p>
                <p>{patient.name} {patient.surname}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-psychText/70">E-Mail</p>
                <p>{patient.email}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-psychText/70">Telefon</p>
                <p>{patient.phone}</p>
              </div>
              
              {patient.birthdate && (
                <div>
                  <p className="text-sm font-medium text-psychText/70">Geburtsdatum</p>
                  <p>{new Date(patient.birthdate).toLocaleDateString('de-DE')}</p>
                </div>
              )}
            </div>
          </CardContent>
          </Card>
        </FloatingCard>

        {/* Vitabyte Patient Information */}
        <FloatingCard index={1}>
          <Card className="border-psychPurple/10 card-shadow mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-psychPurple" />
              Patienteninformationen
              {vitabyteLoading && (
                <div className="w-4 h-4 border-2 border-psychPurple/30 border-t-psychPurple rounded-full animate-spin ml-2"></div>
              )}
            </CardTitle>
            <CardDescription>
              Ihre Daten aus dem Praxissystem
              {vitabytePatient?.lastSync && (
                <span className="text-xs text-psychText/50 ml-2">
                  (Zuletzt aktualisiert: {vitabytePatient.lastSync.toLocaleString('de-DE')})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {vitabytePatient ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-700">
                    Patientendaten gefunden
                  </span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Patient ID: {vitabytePatient.patid}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-psychText/70">Vollständiger Name</p>
                    <p>{vitabytePatient.title} {vitabytePatient.firstname} {vitabytePatient.lastname}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-psychText/70">Geschlecht</p>
                    <p>{vitabytePatient.gender}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-psychText/70">Geburtsdatum</p>
                    <p>{new Date(vitabytePatient.dob).toLocaleDateString('de-DE')}</p>
                  </div>
                  
                  {vitabytePatient.mobile && (
                    <div>
                      <p className="text-sm font-medium text-psychText/70">Mobiltelefon</p>
                      <p>{vitabytePatient.mobile}</p>
                    </div>
                  )}
                </div>

                {(vitabytePatient.street || vitabytePatient.zip || vitabytePatient.city) && (
                  <div>
                    <p className="text-sm font-medium text-psychText/70">Adresse</p>
                    <p>
                      {vitabytePatient.street && `${vitabytePatient.street}, `}
                      {vitabytePatient.zip} {vitabytePatient.city}
                    </p>
                  </div>
                )}



                {/* Appointment Information */}
                <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <h4 className="font-medium text-purple-800">Termine</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-purple-700">
                      Anzahl Termine: 
                    </p>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                      {vitabytePatient.appointmentCount || 0}
                    </Badge>
                  </div>
                  {vitabytePatient.appointmentCount && vitabytePatient.appointmentCount > 0 && (
                    <p className="text-xs text-purple-600 mt-1">
                      Detaillierte Terminübersicht finden Sie im Terminbereich.
                    </p>
                  )}
                </div>

                {/* Status Information */}
                <div className="mt-4 pt-4 border-t border-psychPurple/10">
                  <div className="flex items-center justify-between text-xs text-psychText/60">
                    <span>Status: {vitabytePatient.deleted === 0 ? 'Aktiv' : 'Inaktiv'}</span>
                    {vitabytePatient.ahv && (
                      <span>AHV: {vitabytePatient.ahv}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : vitabyteLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-3 border-psychPurple/30 border-t-psychPurple rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-psychText/70">Lade Patientendaten...</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <AlertCircle className="w-8 h-8 text-psychText/30" />
                </div>
                <h3 className="text-lg font-medium text-psychText mb-2">Keine Patientendaten gefunden</h3>
                <p className="text-psychText/70 mb-4">
                  Ihre E-Mail-Adresse wurde nicht im Praxissystem gefunden.
                </p>
                <p className="text-sm text-psychText/60">
                  Falls Sie bereits Patient sind, wenden Sie sich bitte an die Praxis, 
                  um Ihre E-Mail-Adresse zu aktualisieren.
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
        </FloatingCard>
        
        {/* Account Settings */}
        <FloatingCard index={2}>
          <Card className="border-psychPurple/10 card-shadow shadow-lg">
          <CardHeader>
            <CardTitle>Kontoeinstellungen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-psychText/70">
              Möchten Sie Ihre Kontaktinformationen aktualisieren? Bitte wenden Sie sich direkt an die Praxis Ihres Therapeuten.
            </p>
          </CardContent>
          <Separator className="my-2" />
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={logout}
            >
              Abmelden
            </Button>
          </CardFooter>
          </Card>
        </FloatingCard>
      </div>
    </Layout>
  );
}
