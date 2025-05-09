
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
          <div className="text-center">Loading profile...</div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold mb-6">Your Profile</h1>
        
        <Card className="border-psychPurple/10 card-shadow mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-psychText/70">Name</p>
                <p>{patient.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-psychText/70">Email</p>
                <p>{patient.email}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-psychText/70">Phone</p>
                <p>{patient.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-psychPurple/10 card-shadow">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-psychText/70">
              Need to update your contact information? Please contact your therapist's office directly.
            </p>
          </CardContent>
          <Separator className="my-2" />
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={logout}
            >
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
