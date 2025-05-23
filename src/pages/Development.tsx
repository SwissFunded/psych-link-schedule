import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import { getTherapists, verifyApiKey, Therapist } from '@/lib/epatApi';
import { toast } from 'sonner';
import { CheckCircle, XCircle, User, Stethoscope, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Development() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiVerified, setApiVerified] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debug environment variables
  const envUsername = import.meta.env.VITE_EPAT_USERNAME;
  const envPassword = import.meta.env.VITE_EPAT_PASSWORD;
  const envApiUrl = import.meta.env.VITE_EPAT_API_URL;
  const isDev = import.meta.env.DEV;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Environment variables check:');
      console.log('- Username:', envUsername ? 'Set' : 'Missing');
      console.log('- Password:', envPassword ? 'Set (length: ' + envPassword.length + ')' : 'Missing');
      console.log('- API URL:', envApiUrl || 'Using default');
      console.log('- Dev mode:', isDev);
      
      console.log('🔍 Verifying API credentials...');
      const isVerified = await verifyApiKey();
      setApiVerified(isVerified);
      
      if (!isVerified) {
        throw new Error('API credentials verification failed');
      }
      
      console.log('👥 Fetching therapists...');
      const therapistData = await getTherapists();
      setTherapists(therapistData);
      
      toast.success(`Successfully loaded ${therapistData.length} therapists from Vitabyte API`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ API Error:', err);
      toast.error(`Failed to load data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-psychText">Development</h1>
            <p className="text-psychText/70 mt-2">Real API Integration Testing</p>
          </div>
          <Button 
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            className="border-psychPurple/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* API Status Card */}
        <Card className="mb-6 border-psychPurple/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {apiVerified === null ? (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              ) : apiVerified ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              API Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-psychText/70">Status</p>
                <Badge 
                  variant={apiVerified ? "default" : "destructive"}
                  className={apiVerified ? "bg-green-500" : ""}
                >
                  {apiVerified === null ? 'Checking...' : apiVerified ? 'Connected' : 'Failed'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-psychText/70">Endpoint</p>
                <p className="text-sm font-mono">/v1/system/verify</p>
              </div>
              <div>
                <p className="text-sm text-psychText/70">Therapists Loaded</p>
                <p className="text-sm font-semibold">{therapists.length} therapists</p>
              </div>
            </div>
            {/* Debug info */}
            <div className="mt-4 pt-4 border-t border-psychPurple/10">
              <p className="text-xs text-psychText/50 mb-2">Environment Variables Debug:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="font-mono">USERNAME:</span> 
                  <span className={envUsername ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                    {envUsername ? '✓' : '✗'}
                  </span>
                </div>
                <div>
                  <span className="font-mono">PASSWORD:</span> 
                  <span className={envPassword ? "text-green-600 ml-1" : "text-red-600 ml-1"}>
                    {envPassword ? '✓' : '✗'}
                  </span>
                </div>
                <div>
                  <span className="font-mono">API_URL:</span> 
                  <span className={envApiUrl ? "text-green-600 ml-1" : "text-yellow-600 ml-1"}>
                    {envApiUrl ? '✓' : 'default'}
                  </span>
                </div>
                <div>
                  <span className="font-mono">DEV:</span> 
                  <span className={isDev ? "text-green-600 ml-1" : "text-blue-600 ml-1"}>
                    {isDev ? 'true' : 'false'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{error}</p>
              {error.includes('API credentials are missing') && (
                <div className="mt-3 text-sm text-red-600">
                  This error occurs when environment variables are not set. Create a .env file in the project root.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-3 border-psychPurple/30 border-t-psychPurple rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-psychText/70">Loading therapist data from Vitabyte API...</p>
          </div>
        )}

        {/* Therapists Grid */}
        {!loading && therapists.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-psychText">
              Real Therapist Data ({therapists.length} total)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {therapists.map((therapist, index) => (
                <motion.div
                  key={therapist.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-psychPurple/10 hover:border-psychPurple/20 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            <User className="w-4 h-4 text-psychPurple" />
                            {therapist.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Stethoscope className="w-3 h-3" />
                            {therapist.specialty}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          ID: {therapist.id}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm text-psychText/70">
                        {therapist.imageUrl && (
                          <div>
                            <span className="font-medium">Image URL:</span>
                            <p className="text-xs font-mono bg-gray-50 p-1 rounded mt-1 truncate">
                              {therapist.imageUrl}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && therapists.length === 0 && !error && (
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="w-12 h-12 text-psychText/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-psychText mb-2">No Therapist Data</h3>
              <p className="text-psychText/70">No therapists were returned from the API.</p>
            </CardContent>
          </Card>
        )}

        {/* API Endpoint Status */}
        <Card className="mb-6 border-psychPurple/10">
          <CardHeader>
            <CardTitle className="text-lg">API Endpoint Discovery</CardTitle>
            <CardDescription>Current status of Vitabyte ePAD API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-700 mb-2">✅ Working Endpoints</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-mono">/v1/system/verify</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Authentication</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono">/v1/system/getProviders</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">59 Therapists</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono">/v1/agenda/createAppointment</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Needs valid calendarId</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono">/v1/agenda/modifyAppointment</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Needs valid appointmentId</Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-yellow-700 mb-2">⚠️ Problematic Endpoints</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-mono">/v1/agenda/getAppointments</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700">HTTP 500 Server Error</Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-red-700 mb-2">❌ Non-existing Endpoints</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                  <span className="font-mono">/v1/agenda/getSlots</span>
                  <span className="font-mono">/v1/agenda/getAvailableSlots</span>
                  <span className="font-mono">/v1/agenda/getAppointment</span>
                  <span className="font-mono">/v1/agenda/getCalendar</span>
                  <span className="font-mono">/v1/system/getCalendars</span>
                  <span className="font-mono">/v1/system/getAppointments</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h5 className="font-semibold text-blue-800 mb-2">Calendar ID Testing Results:</h5>
              <div className="text-sm text-blue-700 space-y-1">
                <p>✅ <strong>Comprehensive testing:</strong> Tested calendar IDs 0-20, 39, 100-102, 150, 183, 200, 215, 300, 500, 1000</p>
                <p>❌ <strong>Result:</strong> ALL tested IDs return "The calendar id is invalid"</p>
                <p>❌ <strong>Discovery endpoints:</strong> No endpoints available to list valid calendar IDs</p>
                <p>❌ <strong>Alternative endpoints:</strong> /appointments/create, /schedule, /book do not exist</p>
                <p>⚠️ <strong>Conclusion:</strong> Calendar system may not be configured for this account</p>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <h5 className="font-semibold text-red-800 mb-2">Critical Issues Found:</h5>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• <strong>No Valid Calendar IDs:</strong> Extensive testing found no working calendar IDs</li>
                <li>• <strong>HTTP 500 Errors:</strong> getAppointments endpoint has server-side issues</li>
                <li>• <strong>Missing Endpoints:</strong> No slot/availability endpoints found</li>
                <li>• <strong>Account Setup:</strong> Calendar system may require additional configuration</li>
              </ul>
            </div>
            
            <div className="mt-4 p-4 bg-orange-50 rounded-lg">
              <h5 className="font-semibold text-orange-800 mb-2">Required from Vitabyte:</h5>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• <strong>Calendar Setup:</strong> Configure calendar system for account</li>
                <li>• <strong>Valid Calendar IDs:</strong> Provide working calendar ID(s)</li>
                <li>• <strong>Server Fix:</strong> Resolve HTTP 500 error on getAppointments</li>
                <li>• <strong>API Documentation:</strong> Complete workflow and parameter guide</li>
                <li>• <strong>Available Slots:</strong> Endpoint for getting available time slots</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 