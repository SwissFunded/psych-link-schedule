
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Profile() {
  const { patient, logout } = useAuth();
  
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
        <h1 className="text-2xl font-semibold mb-6">Ihr Profil</h1>
        
        <Card className="border-psychPurple/10 card-shadow mb-6">
          <CardHeader>
            <CardTitle>Persönliche Informationen</CardTitle>
            <CardDescription>Ihre Kontodaten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-psychText/70">Name</p>
                <p>{patient.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-psychText/70">E-Mail</p>
                <p>{patient.email}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-psychText/70">Telefon</p>
                <p>{patient.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-psychPurple/10 card-shadow">
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
      </div>
    </Layout>
  );
}
