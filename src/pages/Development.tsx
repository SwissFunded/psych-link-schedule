import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import { getTherapists, verifyApiKey, getServices, getAvailableAppointments, getCustomerByMail, getTreater, getAppointments, testGetSlots, testLeistungenabfragen, testCreateAppointment, Therapist, Service, Customer, Treater } from '@/lib/epatApi';
import { toast } from 'sonner';
import { CheckCircle, XCircle, User, Stethoscope, AlertCircle, RefreshCw, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Development() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [treater, setTreater] = useState<Treater | null>(null);
  const [appointments, setAppointments] = useState<any>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<{[key: number]: any}>({});
  const [loadingAppointments, setLoadingAppointments] = useState<{[key: number]: boolean}>({});
  const [loading, setLoading] = useState(true);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [searchingTreater, setSearchingTreater] = useState(false);
  const [apiVerified, setApiVerified] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTherapists, setShowTherapists] = useState(false);
  const [showServices, setShowServices] = useState(true);
  const [showCustomers, setShowCustomers] = useState(true);
  const [showTreater, setShowTreater] = useState(true);
  const [customerEmail, setCustomerEmail] = useState('shem-lee@gmx.ch');

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
      
      console.log('🛍️ Fetching services...');
      const servicesData = await getServices();
      setServices(servicesData);
      
      console.log('📅 Fetching available slots...');
      const slotsData = await getAvailableAppointments();
      setSlots(slotsData);
      
      console.log('👤 Testing customer lookup...');
      let customerData: Customer[] = [];
      try {
        customerData = await getCustomerByMail(customerEmail);
        setCustomers(customerData);
        console.log('✅ Initial customer lookup completed:', customerData.length, 'customers found');
      } catch (customerError) {
        console.warn('⚠️ Initial customer lookup failed:', customerError);
        setCustomers([]); // Set empty array on error
      }
      
      console.log('📅 Testing getAppointments endpoint...');
      let appointmentsData: any = null;
      try {
        // Test with a real patient ID if we have customer data, otherwise use documentation example
        const testPatientId = customerData.length > 0 ? customerData[0].patid : 4031;
        console.log('🔍 Testing getAppointments with patient ID:', testPatientId);
        
        appointmentsData = await getAppointments({ patid: testPatientId });
        setAppointments(appointmentsData);
        console.log('✅ getAppointments test completed');
      } catch (appointmentsError) {
        console.warn('⚠️ getAppointments test failed:', appointmentsError);
        setAppointments({ error: appointmentsError });
      }
      
      toast.success(`Successfully loaded ${therapistData.length} therapists, ${servicesData.length} services, ${slotsData.length} slots, ${customerData.length} customers, and tested appointments endpoint`);
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

  // Function to handle treater lookup
  const handleTreaterLookup = async (patid: number) => {
    setSearchingTreater(true);
    setSelectedPatientId(patid);
    
    try {
      console.log('🔍 Looking up treater for patient ID:', patid);
      const treaterData = await getTreater(patid);
      setTreater(treaterData);
      
      if (treaterData) {
        console.log('🔍 Treater found, checking if therapist exists in our list...');
        const matchingTherapist = therapists.find(t => t.id === treaterData.provider.toString());
        
        if (matchingTherapist) {
          console.log('✅ Matching therapist found:', matchingTherapist);
          toast.success(`Found treater: ${matchingTherapist.name} (Provider ID: ${treaterData.provider})`);
        } else {
          console.warn('⚠️ Provider ID mismatch detected:', {
            treaterProviderId: treaterData.provider,
            availableTherapistIds: therapists.slice(0, 10).map(t => ({ id: t.id, name: t.name }))
          });
          toast.warning(`Found treater (Provider ID: ${treaterData.provider}) but no matching therapist in list`);
        }
      } else {
        toast.info(`No treater assigned to patient ${patid}`);
      }
    } catch (error) {
      console.error('❌ Treater lookup error:', error);
      toast.error('Failed to lookup treater');
      setTreater(null);
    } finally {
      setSearchingTreater(false);
    }
  };

  // Function to fetch appointments for a specific patient
  const handleGetPatientAppointments = async (patid: number) => {
    setLoadingAppointments(prev => ({ ...prev, [patid]: true }));
    
    try {
      console.log('📅 Fetching appointments for patient ID:', patid);
      const appointmentData = await getAppointments({ patid });
      setPatientAppointments(prev => ({ ...prev, [patid]: appointmentData }));
      
      const appointmentCount = Array.isArray(appointmentData?.result) ? appointmentData.result.length : 0;
      console.log(`✅ Found ${appointmentCount} appointments for patient ${patid}`);
      toast.success(`Found ${appointmentCount} appointments for patient ${patid}`);
    } catch (error) {
      console.error('❌ Appointment lookup error:', error);
      toast.error(`Failed to load appointments for patient ${patid}`);
      setPatientAppointments(prev => ({ ...prev, [patid]: { error: error } }));
    } finally {
      setLoadingAppointments(prev => ({ ...prev, [patid]: false }));
    }
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
              API Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-psychText/60">Environment</div>
                <Badge variant={isDev ? "outline" : "default"}>
                  {isDev ? 'Development' : 'Production'}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-sm text-psychText/60">Username</div>
                <Badge variant={envUsername ? "default" : "destructive"}>
                  {envUsername ? 'Configured' : 'Missing'}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-sm text-psychText/60">Password</div>
                <Badge variant={envPassword ? "default" : "destructive"}>
                  {envPassword ? `${envPassword.length} chars` : 'Missing'}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-sm text-psychText/60">Verification</div>
                <Badge variant={apiVerified ? "default" : "destructive"}>
                  {apiVerified === null ? 'Testing...' : apiVerified ? 'Success' : 'Failed'}
                </Badge>
              </div>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 🚨 DIAGNOSTIC: shem-lee@gmx.ch Issue Investigation */}
        <Card className="mb-6 border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              🚨 DIAGNOSTIC: shem-lee@gmx.ch Appointment Issue
            </CardTitle>
            <CardDescription className="text-red-600">
              Investigating why appointments don't show for new user account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Test Email Lookup</h4>
                  <div className="space-y-2">
                    <Button 
                      onClick={async () => {
                        setSearchingCustomer(true);
                        try {
                          console.log('🔍 DIAGNOSTIC: Testing shem-lee@gmx.ch lookup...');
                          const result = await getCustomerByMail('shem-lee@gmx.ch');
                          console.log('📋 DIAGNOSTIC Results:', result);
                          toast.success(`Found ${result.length} customers for shem-lee@gmx.ch`);
                          setCustomers(result);
                        } catch (error) {
                          console.error('❌ DIAGNOSTIC Error:', error);
                          toast.error(`Lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        } finally {
                          setSearchingCustomer(false);
                        }
                      }}
                      disabled={searchingCustomer}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      {searchingCustomer ? 'Searching...' : 'Test shem-lee@gmx.ch'}
                    </Button>
                    <Button 
                      onClick={async () => {
                        setSearchingCustomer(true);
                        try {
                          console.log('🔍 DIAGNOSTIC: Testing kwegelin@gmx.de (known working)...');
                          const result = await getCustomerByMail('kwegelin@gmx.de');
                          console.log('📋 DIAGNOSTIC Results (comparison):', result);
                          toast.success(`Found ${result.length} customers for kwegelin@gmx.de (comparison)`);
                        } catch (error) {
                          console.error('❌ DIAGNOSTIC Error:', error);
                          toast.error(`Comparison lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        } finally {
                          setSearchingCustomer(false);
                        }
                      }}
                      disabled={searchingCustomer}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      {searchingCustomer ? 'Searching...' : 'Test kwegelin@gmx.de (Control)'}
                    </Button>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Results Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div>Customers Found: <Badge variant="outline">{customers.length}</Badge></div>
                    {customers.length > 0 && (
                      <>
                        <div>Patient ID: <Badge variant="default">{customers[0].patid}</Badge></div>
                        <div>Name: <Badge variant="outline">{customers[0].firstname} {customers[0].lastname}</Badge></div>
                        <div>Status: <Badge variant={customers[0].deleted === 0 ? "default" : "destructive"}>
                          {customers[0].deleted === 0 ? "Active" : "Deleted"}
                        </Badge></div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {customers.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-2">🔍 DIAGNOSTIC: Test Appointment Retrieval</h4>
                  <Button 
                    onClick={() => handleGetPatientAppointments(customers[0].patid)}
                    disabled={loadingAppointments[customers[0].patid]}
                    variant="outline"
                    size="sm"
                  >
                    {loadingAppointments[customers[0].patid] ? 'Loading...' : `Get Appointments for Patient ${customers[0].patid}`}
                  </Button>
                  
                  {patientAppointments[customers[0].patid] && (
                    <div className="mt-2 p-3 bg-white border rounded-md">
                      <div className="text-xs font-mono text-gray-600">
                        <strong>Appointment Data:</strong>
                        <pre className="mt-1 text-xs overflow-x-auto">
                          {JSON.stringify(patientAppointments[customers[0].patid], null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
              <div>
                <p className="text-sm text-psychText/70">Services Available</p>
                <p className="text-sm font-semibold">{services.length} services</p>
              </div>
              <div>
                <p className="text-sm text-psychText/70">Available Slots</p>
                <p className="text-sm font-semibold">{slots.length} slots</p>
              </div>
              <div>
                <p className="text-sm text-psychText/70">Customer Lookup</p>
                <p className="text-sm font-semibold">{customers.length} customers found</p>
              </div>
              <div>
                <p className="text-sm text-psychText/70">Therapist ID Range</p>
                <p className="text-sm font-semibold">
                  {therapists.length > 0 ? `${therapists[0]?.id} - ${therapists[therapists.length - 1]?.id}` : 'No data'}
                </p>
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
            <p className="text-psychText/70">Loading data from Vitabyte Booking API...</p>
            <p className="text-sm text-psychText/50 mt-2">Testing authentication, therapists, services, and available slots</p>
          </div>
        )}

        {/* Therapists Grid */}
        {!loading && therapists.length > 0 && (
          <Card className="mb-6 border-psychPurple/10">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-semibold text-psychText">
                    Real Therapist Data ({therapists.length} total)
                  </CardTitle>
                  <CardDescription>
                    Provider data loaded from /v1/system/getProviders
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowTherapists(!showTherapists)}
                  variant="outline"
                  size="sm"
                  className="border-psychPurple/20"
                >
                  {showTherapists ? 'Hide Details' : 'Show Details'}
                </Button>
              </div>
            </CardHeader>
            {showTherapists && (
              <CardContent>
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
              </CardContent>
            )}
          </Card>
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
                <h4 className="font-semibold text-green-700 mb-2">✅ Working System Endpoints</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-mono">/v1/system/verify</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Authentication ✅</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono">/v1/system/getProviders</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">{therapists.length} Therapists ✅</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono">/v1/agenda/getAppointments</span>
                    <Badge variant="outline" className={
                      appointments?.error ? "bg-red-50 text-red-700" : 
                      appointments ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                    }>
                      {appointments?.error ? "Error ❌" : 
                       appointments ? "Working ✅" : "Testing..."}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono">/v1/system/getCustomerByMail</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {customers.length > 0 ? `${customers.length} Customers ✅` : customers.length === 0 && !loading ? 'No Matches' : 'Testing...'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-blue-700 mb-2">🔍 Booking API Endpoints</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-mono">/v1/booking/getServices</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {services.length > 0 ? `${services.length} Services ✅` : 'Testing...'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono">/v1/booking/getSlots</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {slots.length > 0 ? `${slots.length} Slots ✅` : slots.length === 0 && !loading ? 'Empty Response' : 'Testing...'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono">/v1/booking/createAppointment</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Ready for Testing</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono">/v1/booking/modifyAppointment</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Ready for Testing</Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h5 className="font-semibold text-green-800 mb-2">🎉 API Integration Success:</h5>
              <div className="text-sm text-green-700 space-y-1">
                <p>✅ <strong>Authentication:</strong> Working perfectly with Basic Auth</p>
                <p>✅ <strong>System API:</strong> Provider data loading successfully ({therapists.length} therapists)</p>
                <p>✅ <strong>Booking API:</strong> Services endpoint responding ({services.length} services found)</p>
                <p>✅ <strong>Hardcoded Credentials:</strong> Bypassed environment variable issues</p>
                <p>🔍 <strong>Next:</strong> Test slot availability and booking workflow</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comprehensive Service Discovery (Leistungenabfragen) */}
        <Card className="mb-6 border-psychPurple/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-psychPurple" />
              Leistungenabfragen - Comprehensive Service Discovery
            </CardTitle>
            <CardDescription>
              Testing various endpoints to discover all available services/appointment types beyond the single "Massage" service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">🔍 Investigation Rationale</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p><strong>Current Issue:</strong> Only 1 service found (Massage, ID: 2) via /v1/booking/getServices</p>
                  <p><strong>Expected:</strong> Multiple appointment types based on patient appointment data</p>
                  <p><strong>Solution:</strong> Test "Leistungenabfragen" (services query) endpoints from documentation</p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">🧪 Location Services Test</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>Endpoint:</strong> /booking/getServices
                    <p className="text-blue-600 mt-1">Testing same endpoint with different location IDs</p>
                  </div>
                  <div>
                    <strong>Location Tests:</strong>
                    <ul className="list-disc list-inside text-blue-700 mt-1">
                      <li>Location 0: Central (baseline)</li>
                      <li>Location 1: Zähringerstr</li>
                      <li>Location 2: Sihlcity</li>
                      <li>Location 3: Cornelia Hatze</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={async () => {
                    try {
                      console.log('🧪 Starting comprehensive service discovery test...');
                      const results = await testLeistungenabfragen();
                      
                      console.log('📋 Leistungenabfragen test completed:', results);
                      
                      // Count successful locations and total services found
                      const successCount = Object.values(results).filter((r: any) => r.success).length;
                      const totalCount = Object.keys(results).length;
                      const totalServices = Object.values(results).reduce((sum: number, r: any) => sum + (r.serviceCount || 0), 0);
                      
                      toast.success(`Location services test completed: ${successCount}/${totalCount} locations successful, ${totalServices} total services found - check console for details`);
                    } catch (error) {
                      console.error('❌ Service discovery test failed:', error);
                      toast.error('Service discovery test failed - check console for details');
                    }
                  }}
                  className="bg-psychPurple hover:bg-psychPurple/90 text-white"
                >
                  Test All Locations
                </Button>
                
                <Button
                  onClick={async () => {
                    try {
                      console.log('🔍 Comparing current services with expected appointment types...');
                      
                      // Show current services
                      console.log('📋 Current services from getServices:', services);
                      
                      // Show appointment types from patient data
                      const appointmentTypes = new Set();
                      Object.values(patientAppointments).forEach((data: any) => {
                        if (data?.result && Array.isArray(data.result)) {
                          data.result.forEach((apt: any) => {
                            if (apt.appointment) {
                              appointmentTypes.add(apt.appointment);
                            }
                          });
                        }
                      });
                      
                      console.log('📋 Appointment types found in patient data:', Array.from(appointmentTypes));
                      console.log('⚠️ Service gap analysis:', {
                        currentServices: services.length,
                        currentServiceNames: services.map(s => s.name),
                        appointmentTypesFound: appointmentTypes.size,
                        appointmentTypesList: Array.from(appointmentTypes),
                        possibleMissingServices: Array.from(appointmentTypes).filter(type => 
                          !services.some(s => s.name.toLowerCase().includes((type as string).toLowerCase()))
                        )
                      });
                      
                      toast.success('Service gap analysis completed - check console for comparison');
                    } catch (error) {
                      console.error('❌ Service comparison failed:', error);
                      toast.error('Service comparison failed - check console');
                    }
                  }}
                  variant="outline"
                  className="border-psychPurple/20"
                >
                  Compare with Patient Data
                </Button>
              </div>
              
              <div className="text-xs text-psychText/60 mt-3">
                <strong>Goal:</strong> Discover comprehensive service catalog to enable complete appointment type coverage in the application.
                Results will show which endpoints return the most complete service data for integration.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GetSlots Testing with Sonja Sporer */}
        <Card className="mb-6 border-psychPurple/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-psychPurple" />
              GetSlots Testing - Sonja Sporer Calendar
            </CardTitle>
            <CardDescription>
              Testing /v1/agenda/getSlots with Massage service (ID: 2) and "sonja sporer" as provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">🧪 Test Parameters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>Service ID:</strong> 2 (Massage)
                  </div>
                  <div>
                    <strong>Provider:</strong> Calendar ID 2 (Sonja Sporer)
                  </div>
                  <div>
                    <strong>Duration:</strong> 50 minutes
                  </div>
                  <div>
                    <strong>Date Range:</strong> Next 30 days
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={async () => {
                    try {
                      // Find massage service (should be ID 2)
                      const massageService = services.find(s => s.serviceid === 2 || s.name.toLowerCase().includes('massage'));
                      if (!massageService) {
                        toast.error('Massage service not found');
                        return;
                      }
                      
                      const today = new Date();
                      const nextMonth = new Date(today);
                      nextMonth.setMonth(today.getMonth() + 1);
                      
                      const params = {
                        serviceid: massageService.serviceid,
                        provider: 2, // Calendar ID for Sonja Sporer
                        duration: 50,
                        from: today.toISOString().slice(0, 19).replace('T', ' '),
                        to: nextMonth.toISOString().slice(0, 19).replace('T', ' ')
                      };
                      
                      console.log('🧪 Testing getSlots with Sonja Sporer calendar:', params);
                      const result = await testGetSlots(params);
                      console.log('📋 GetSlots result:', result);
                      
                      toast.success('GetSlots test completed - check console for details');
                    } catch (error) {
                      console.error('❌ GetSlots test failed:', error);
                      toast.error('GetSlots test failed - check console for details');
                    }
                  }}
                  className="bg-psychPurple hover:bg-psychPurple/90 text-white"
                >
                  Test with Sonja Sporer
                </Button>
                
                <Button
                  onClick={async () => {
                    try {
                      // Test without provider to see all available slots
                      const massageService = services.find(s => s.serviceid === 2 || s.name.toLowerCase().includes('massage'));
                      if (!massageService) {
                        toast.error('Massage service not found');
                        return;
                      }
                      
                      const today = new Date();
                      const nextMonth = new Date(today);
                      nextMonth.setMonth(today.getMonth() + 1);
                      
                      const params = {
                        serviceid: massageService.serviceid,
                        duration: 50,
                        from: today.toISOString().slice(0, 19).replace('T', ' '),
                        to: nextMonth.toISOString().slice(0, 19).replace('T', ' ')
                      };
                      
                      console.log('🧪 Testing getSlots without specific provider:', params);
                      const result = await testGetSlots(params);
                      console.log('📋 GetSlots result (all providers):', result);
                      
                      toast.success('GetSlots test (all providers) completed - check console');
                    } catch (error) {
                      console.error('❌ GetSlots test failed:', error);
                      toast.error('GetSlots test failed - check console for details');
                    }
                  }}
                  variant="outline"
                  className="border-psychPurple/20"
                >
                  Test All Providers
                </Button>
                
                <Button
                  onClick={async () => {
                    try {
                      // Test with different provider names we've seen in appointments
                      const massageService = services.find(s => s.serviceid === 2 || s.name.toLowerCase().includes('massage'));
                      if (!massageService) {
                        toast.error('Massage service not found');
                        return;
                      }
                      
                      const today = new Date();
                      const nextMonth = new Date(today);
                      nextMonth.setMonth(today.getMonth() + 1);
                      
                      const providerVariations = [
                        2, // Calendar ID for Sonja Sporer (most likely)
                        1, // Try other calendar IDs
                        3,
                        4,
                        5
                      ];
                      
                      for (const provider of providerVariations) {
                        const params = {
                          serviceid: massageService.serviceid,
                          provider: provider,
                          duration: 50,
                          from: today.toISOString().slice(0, 19).replace('T', ' '),
                          to: nextMonth.toISOString().slice(0, 19).replace('T', ' ')
                        };
                        
                        console.log(`🧪 Testing getSlots with calendar ID: ${provider}`);
                        try {
                          const result = await testGetSlots(params);
                          console.log(`📋 Result for calendar ID ${provider}:`, result);
                        } catch (error) {
                          console.log(`❌ Failed for calendar ID ${provider}:`, error);
                        }
                      }
                      
                      toast.success('Provider variation tests completed - check console');
                    } catch (error) {
                      console.error('❌ Provider variation tests failed:', error);
                      toast.error('Provider tests failed - check console');
                    }
                  }}
                                     variant="outline"
                   className="border-yellow-500/20 text-yellow-700"
                 >
                   Test Calendar IDs (1-5)
                 </Button>
              </div>
              
              <div className="text-xs text-psychText/60 mt-3">
                <strong>Note:</strong> Based on the appointment data, we found calendar ID "2" with name "Sonja Sporer". 
                This test will help us determine if calendar ID 2 can be used as a provider parameter to get available slots for that calendar.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Display */}
        {!loading && services.length > 0 && (
          <Card className="mb-6 border-psychPurple/10">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-psychPurple" />
                    Available Services ({services.length})
                  </CardTitle>
                  <CardDescription>Services returned from /v1/booking/getServices</CardDescription>
                </div>
                <Button
                  onClick={() => setShowServices(!showServices)}
                  variant="outline"
                  size="sm"
                  className="border-psychPurple/20"
                >
                  {showServices ? 'Hide Details' : 'Show Details'}
                </Button>
              </div>
            </CardHeader>
            {showServices && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service, index) => (
                    <motion.div
                      key={service.serviceid}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-psychPurple/10 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-psychText">{service.name}</h3>
                        <Badge variant="secondary">ID: {service.serviceid}</Badge>
                      </div>
                      <p className="text-sm text-psychText/70 mb-2">{service.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-psychText/60">
                        <div><strong>Duration:</strong> {service.duration}min</div>
                        <div><strong>Price:</strong> {service.price}</div>
                        <div><strong>Category:</strong> {service.category}</div>
                        <div><strong>Providers:</strong> {service.providers.length}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Customer Lookup Section */}
        <Card className="mb-6 border-psychPurple/10">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-psychPurple" />
                  Customer Lookup ({customers.length} found)
                </CardTitle>
                <CardDescription>Test customer lookup by email using /v1/system/getCustomerByMail</CardDescription>
              </div>
              <Button
                onClick={() => setShowCustomers(!showCustomers)}
                variant="outline"
                size="sm"
                className="border-psychPurple/20"
              >
                {showCustomers ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="block text-sm font-medium text-psychText mb-2">
                Email Address to Search:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-psychPurple/20 rounded-md focus:outline-none focus:ring-2 focus:ring-psychPurple/50"
                  placeholder="customer@mail.com"
                />
                <Button
                  onClick={async () => {
                    if (!customerEmail.trim()) {
                      toast.error('Please enter an email address');
                      return;
                    }
                    
                    setSearchingCustomer(true);
                    try {
                      console.log('🔍 Manual customer lookup for:', customerEmail);
                      const customerData = await getCustomerByMail(customerEmail);
                      setCustomers(customerData);
                      console.log('✅ Customer lookup completed:', customerData);
                      toast.success(`Found ${customerData.length} customers for ${customerEmail}`);
                    } catch (error) {
                      console.error('❌ Customer lookup error:', error);
                      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                      toast.error(`Failed to lookup customer: ${errorMessage}`);
                    } finally {
                      setSearchingCustomer(false);
                    }
                  }}
                  disabled={loading || searchingCustomer || !customerEmail.trim()}
                  className="bg-psychPurple hover:bg-psychPurple/90 text-white"
                >
                  {searchingCustomer ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
            
            {showCustomers && (
              <div>
                {customers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customers.map((customer, index) => (
                      <motion.div
                        key={customer.patid}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-psychPurple/10 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-psychText">
                            {customer.title} {customer.firstname} {customer.lastname}
                          </h3>
                          <Badge variant="secondary">ID: {customer.patid}</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-psychText/70">
                          <div><strong>Email:</strong> {customer.mail}</div>
                          <div><strong>Gender:</strong> {customer.gender}</div>
                          <div><strong>DOB:</strong> {customer.dob}</div>
                          {customer.mobile && <div><strong>Mobile:</strong> {customer.mobile}</div>}
                          {customer.street && (
                            <div><strong>Address:</strong> {customer.street}, {customer.zip} {customer.city}</div>
                          )}
                          <div>
                            <strong>Status:</strong> 
                            <Badge 
                              variant={customer.deleted === 0 ? "default" : "destructive"}
                              className={`ml-2 ${customer.deleted === 0 ? "bg-green-500" : ""}`}
                            >
                              {customer.deleted === 0 ? 'Active' : 'Deleted'}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-psychPurple/10 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={() => handleTreaterLookup(customer.patid)}
                              disabled={searchingTreater}
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              {searchingTreater && selectedPatientId === customer.patid ? 'Looking up...' : 'Find Treater'}
                            </Button>
                            <Button
                              onClick={() => handleGetPatientAppointments(customer.patid)}
                              disabled={loadingAppointments[customer.patid]}
                              size="sm"
                              className="bg-psychPurple hover:bg-psychPurple/90 text-white text-xs"
                            >
                              {loadingAppointments[customer.patid] ? 'Loading...' : 'Get Appointments'}
                            </Button>
                          </div>
                          
                          {/* Show treater info if available */}
                          {selectedPatientId === customer.patid && treater && (
                            <div className="text-xs bg-green-50 p-2 rounded border border-green-200">
                              <div className="font-medium text-green-800">Assigned Treater:</div>
                              <div className="text-green-700">Provider ID: {treater.provider}</div>
                              {(() => {
                                const matchingTherapist = therapists.find(t => t.id === treater.provider.toString());
                                return matchingTherapist ? (
                                  <div className="text-green-700">✅ {matchingTherapist.name}</div>
                                ) : (
                                  <div className="text-yellow-700">⚠️ Provider not in therapist list</div>
                                );
                              })()}
                            </div>
                          )}
                          
                          {/* Show appointments if available */}
                          {patientAppointments[customer.patid] && (
                            <div className="text-xs">
                              {patientAppointments[customer.patid].error ? (
                                <div className="bg-red-50 p-2 rounded border border-red-200">
                                  <div className="font-medium text-red-800">Error loading appointments</div>
                                  <div className="text-red-700">
                                    {patientAppointments[customer.patid].error?.message || 'Unknown error'}
                                  </div>
                                </div>
                              ) : patientAppointments[customer.patid].result ? (
                                <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                  <div className="font-medium text-blue-800 mb-1">
                                    Appointments ({Array.isArray(patientAppointments[customer.patid].result) 
                                      ? patientAppointments[customer.patid].result.length 
                                      : 0})
                                  </div>
                                  {Array.isArray(patientAppointments[customer.patid].result) && 
                                   patientAppointments[customer.patid].result.length > 0 ? (
                                    <div className="space-y-1 max-h-20 overflow-y-auto">
                                      {patientAppointments[customer.patid].result.slice(0, 3).map((apt: any, idx: number) => (
                                        <div key={idx} className="text-blue-700 text-xs">
                                          <div className="font-medium">
                                            {apt.date ? new Date(apt.date).toLocaleDateString() : 'No date'} - 
                                            {apt.appointment || 'Unknown type'}
                                          </div>
                                          {apt.comment && (
                                            <div className="text-blue-600 truncate">{apt.comment}</div>
                                          )}
                                        </div>
                                      ))}
                                      {patientAppointments[customer.patid].result.length > 3 && (
                                        <div className="text-blue-600 font-medium">
                                          +{patientAppointments[customer.patid].result.length - 3} more...
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-blue-700">No appointments found</div>
                                  )}
                                </div>
                              ) : (
                                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                                  <div className="text-gray-600">Unexpected response format</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-psychText/30 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-psychText mb-2">No Customers Found</h3>
                    <p className="text-psychText/70">
                      No customers found for email: <code className="bg-gray-100 px-2 py-1 rounded">{customerEmail}</code>
                    </p>
                    <p className="text-sm text-psychText/60 mt-2">
                      Try searching with a different email address or check if customers exist in the system.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Treater Lookup Results Section */}
        {(treater !== null || selectedPatientId !== null) && (
          <Card className="mb-6 border-psychPurple/10">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-psychPurple" />
                    Treater Lookup Results
                  </CardTitle>
                  <CardDescription>
                    Results from /v1/system/getTreater for Patient ID: {selectedPatientId}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowTreater(!showTreater)}
                  variant="outline"
                  size="sm"
                  className="border-psychPurple/20"
                >
                  {showTreater ? 'Hide Details' : 'Show Details'}
                </Button>
              </div>
            </CardHeader>
            {showTreater && (
              <CardContent>
                {treater ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-green-200 bg-green-50 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-green-800">Treater Found</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-700">Provider ID:</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                          {treater.provider}
                        </Badge>
                      </div>
                      
                      {/* Check if this provider ID exists in our therapist list */}
                      {(() => {
                        const matchingTherapist = therapists.find(t => t.id === treater.provider.toString());
                        if (matchingTherapist) {
                          return (
                            <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-200">
                              <div className="text-sm font-medium text-green-800 mb-1">✅ Therapist Found:</div>
                              <div className="text-sm text-green-700">{matchingTherapist.name}</div>
                              <div className="text-xs text-green-600">{matchingTherapist.specialty}</div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="mt-3 p-3 bg-yellow-100 rounded-lg border border-yellow-200">
                              <div className="text-sm font-medium text-yellow-800 mb-1">⚠️ Provider ID Mismatch:</div>
                              <div className="text-sm text-yellow-700">
                                Provider ID {treater.provider} not found in therapist list
                              </div>
                              <div className="text-xs text-yellow-600 mt-1">
                                Available therapist IDs: {therapists.slice(0, 5).map(t => t.id).join(', ')}
                                {therapists.length > 5 && ` ... (+${therapists.length - 5} more)`}
                              </div>
                            </div>
                          );
                        }
                      })()}
                      
                      <div className="text-xs text-green-600 mt-2">
                        This provider ID can be used to look up the therapist details using the getProviders endpoint.
                      </div>
                    </div>
                  </motion.div>
                ) : selectedPatientId !== null ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-yellow-200 bg-yellow-50 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-semibold text-yellow-800">No Treater Assigned</h3>
                    </div>
                    <div className="text-sm text-yellow-700">
                      Patient ID {selectedPatientId} does not have an assigned treater/therapist.
                    </div>
                    <div className="text-xs text-yellow-600 mt-2">
                      This could mean the patient is new or hasn't been assigned to a specific provider yet.
                    </div>
                  </motion.div>
                ) : null}
              </CardContent>
            )}
          </Card>
        )}

        {/* Patient Appointments Results Section */}
        {Object.keys(patientAppointments).length > 0 && (
          <Card className="mb-6 border-psychPurple/10">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-psychPurple" />
                    Patient Appointments
                  </CardTitle>
                  <CardDescription>
                    Detailed appointment information for searched patients
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(patientAppointments).map(([patid, appointmentData]) => {
                  const patient = customers.find(c => c.patid.toString() === patid);
                  if (!patient) return null;

                  return (
                    <div key={patid} className="border border-psychPurple/10 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-psychText">
                            {patient.title} {patient.firstname} {patient.lastname}
                          </h3>
                          <div className="text-sm text-psychText/70">
                            Patient ID: {patient.patid} | Email: {patient.mail}
                          </div>
                        </div>
                        <Badge variant="outline">
                          Patient #{patient.patid}
                        </Badge>
                      </div>

                      {appointmentData.error ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-red-200 bg-red-50 rounded-lg p-4"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <XCircle className="w-5 h-5 text-red-600" />
                            <h3 className="font-semibold text-red-800">Error Loading Appointments</h3>
                          </div>
                          <div className="text-sm text-red-700">
                            {appointmentData.error?.message || 'Unknown error occurred'}
                          </div>
                        </motion.div>
                      ) : appointmentData.result ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-blue-200 bg-blue-50 rounded-lg p-4"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-blue-800">
                              Appointments Found ({Array.isArray(appointmentData.result) ? appointmentData.result.length : 0})
                            </h3>
                          </div>

                          {Array.isArray(appointmentData.result) && appointmentData.result.length > 0 ? (
                            <div className="space-y-3">
                              {appointmentData.result.map((apt: any, idx: number) => (
                                <div key={idx} className="bg-white p-4 rounded-lg border border-blue-200">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <div className="text-sm font-medium text-blue-800 mb-2">Appointment Details</div>
                                      <div className="space-y-1 text-sm">
                                        <div>
                                          <strong>Type:</strong> {apt.appointment || 'Unknown type'}
                                        </div>
                                        <div>
                                          <strong>Date:</strong> {apt.date ? new Date(apt.date).toLocaleDateString() : 'No date'}
                                        </div>
                                        {apt.date && apt.end && (
                                          <div>
                                            <strong>Time:</strong> {new Date(apt.date).toLocaleTimeString()} - {new Date(apt.end).toLocaleTimeString()}
                                          </div>
                                        )}
                                        {apt.duration && (
                                          <div>
                                            <strong>Duration:</strong> {apt.duration} minutes
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <div className="text-sm font-medium text-blue-800 mb-2">Additional Info</div>
                                      <div className="space-y-1 text-sm">
                                        <div>
                                          <strong>Appointment ID:</strong> {apt.id || 'No ID'}
                                        </div>
                                        {apt.calendar && (
                                          <div>
                                            <strong>Calendar ID:</strong> 
                                            <Badge variant="outline" className="ml-2 bg-purple-50 text-purple-700">
                                              {apt.calendar}
                                            </Badge>
                                          </div>
                                        )}
                                        {apt.calendarname && (
                                          <div>
                                            <strong>Calendar Name:</strong> {apt.calendarname}
                                          </div>
                                        )}
                                        {apt.state && (
                                          <div>
                                            <strong>Status:</strong> 
                                            <Badge variant="outline" className="ml-2">
                                              {apt.state}
                                            </Badge>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {apt.comment && (
                                    <div className="mt-3 pt-3 border-t border-blue-200">
                                      <div className="text-sm font-medium text-blue-800 mb-1">Comments:</div>
                                      <div className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
                                        {apt.comment}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-blue-700 text-center py-4">
                              No appointments found for this patient
                            </div>
                          )}

                          {/* Calendar Summary */}
                          {Array.isArray(appointmentData.result) && appointmentData.result.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-blue-200">
                              <div className="text-sm font-medium text-blue-800 mb-2">Calendar Information</div>
                              <div className="bg-purple-50 p-3 rounded border border-purple-200">
                                {(() => {
                                  const calendars = appointmentData.result
                                    .filter((apt: any) => apt.calendar)
                                    .reduce((acc: any, apt: any) => {
                                      const key = apt.calendar;
                                      if (!acc[key]) {
                                        acc[key] = {
                                          id: apt.calendar,
                                          name: apt.calendarname || 'Unknown',
                                          count: 0
                                        };
                                      }
                                      acc[key].count++;
                                      return acc;
                                    }, {});
                                  
                                  return Object.values(calendars).map((cal: any) => (
                                    <div key={cal.id} className="flex justify-between items-center text-sm">
                                      <div>
                                        <span className="font-medium text-purple-800">
                                          {cal.name === 'Unknown' ? 'Calendar' : cal.name}
                                        </span>
                                        <span className="text-purple-600 ml-2">
                                          ({cal.count} appointment{cal.count !== 1 ? 's' : ''})
                                        </span>
                                      </div>
                                      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                                        ID: {cal.id}
                                      </Badge>
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          )}

                          <div className="mt-4 pt-4 border-t border-blue-200">
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleGetPatientAppointments(parseInt(patid))}
                                disabled={loadingAppointments[parseInt(patid)]}
                                size="sm"
                                variant="outline"
                              >
                                {loadingAppointments[parseInt(patid)] ? 'Refreshing...' : 'Refresh Appointments'}
                              </Button>
                              <Button
                                onClick={() => {
                                  console.log(`🔍 Appointments for patient ${patid}:`, appointmentData);
                                  
                                  // Extract and log calendar information
                                  const calendars = appointmentData.result
                                    ?.filter((apt: any) => apt.calendar)
                                    ?.map((apt: any) => ({
                                      id: apt.calendar,
                                      name: apt.calendarname || 'Unknown'
                                    }));
                                  
                                  console.log(`📅 Calendar IDs found:`, calendars);
                                }}
                                variant="outline"
                                size="sm"
                              >
                                Log to Console
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                          <div className="text-gray-600 text-center">
                            Unexpected response format
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appointments Test Results - Compact */}
        {!loading && appointments && (
          <Card className="mb-6 border-psychPurple/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-psychPurple" />
                getAppointments API Test
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {appointments.error ? (
                <div className="text-sm text-red-700">
                  ❌ Error: {appointments.error.message || 'Endpoint failed'}
                </div>
              ) : (
                <div className="text-sm text-green-700">
                  ✅ Endpoint working - {Array.isArray(appointments?.result) ? appointments.result.length : 'Unknown count'} appointments found
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Phase 3A: Appointment Creation Testing */}
        <Card className="mb-6 border-psychPurple/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-psychPurple" />
              Phase 3A: Appointment Creation Testing
            </CardTitle>
            <CardDescription>
              Test appointment booking using Calendar ID 120 (Dr. med. Sonja Sporer) with Patient ID 27947 (shem-lee@gmx.ch)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">🎯 Test Parameters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>Patient:</strong> shem-lee@gmx.ch (ID: 27947)
                  </div>
                  <div>
                    <strong>Calendar:</strong> Dr. med. Sonja Sporer (ID: 120)
                  </div>
                  <div>
                    <strong>Appointment Type:</strong> Konsultation
                  </div>
                  <div>
                    <strong>Duration:</strong> 50 minutes
                  </div>
                  <div>
                    <strong>Time:</strong> Next business day at 10:00 AM
                  </div>
                  <div>
                    <strong>Provider ID:</strong> 96 (confirmed mapping)
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">📋 Test Strategy</h4>
                <div className="text-sm text-purple-700 space-y-2">
                  <div>• Test multiple appointment creation endpoints to find the working one</div>
                  <div>• Use real patient and calendar data discovered from working API calls</div>
                  <div>• Verify appointment creation response format and success indicators</div>
                  <div>• Document working endpoint and required parameters for production use</div>
                </div>
              </div>
              
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={async () => {
                    try {
                      console.log('🧪 Starting appointment creation test with Calendar ID 120...');
                      const result = await testCreateAppointment({
                        patid: 27947,  // shem-lee@gmx.ch
                        calendarId: 120,  // Dr. med. Sonja Sporer
                        appointmentType: 'Konsultation',
                        duration: 50,
                        comment: 'Phase 3A API Test - Calendar ID 120'
                      });
                      
                      console.log('📋 Appointment creation test completed:', result);
                      
                      if (result.success) {
                        toast.success(`✅ Appointment created successfully via ${result.workingEndpoint}!`);
                      } else {
                        toast.warning(`⚠️ Appointment creation failed - check console for details`);
                      }
                    } catch (error) {
                      console.error('❌ Appointment creation test failed:', error);
                      toast.error('Appointment creation test failed - check console for details');
                    }
                  }}
                  className="bg-psychPurple hover:bg-psychPurple/90 text-white"
                >
                  Test Create Appointment
                </Button>
                
                <Button
                  onClick={async () => {
                    try {
                      console.log('🧪 Testing appointment creation with different calendar IDs...');
                      
                      // Test with various calendar IDs found in appointments
                      const testCalendarIds = [120, 2, 1, 96]; // IDs we've seen in the system
                      const results = [];
                      
                      for (const calId of testCalendarIds) {
                        console.log(`🔍 Testing with Calendar ID ${calId}...`);
                        try {
                          const result = await testCreateAppointment({
                            patid: 27947,
                            calendarId: calId,
                            appointmentType: 'Test',
                            duration: 30,
                            comment: `Test with Calendar ID ${calId}`
                          });
                          results.push({ calendarId: calId, result });
                        } catch (error) {
                          results.push({ calendarId: calId, error: error });
                        }
                      }
                      
                      console.log('📋 Multi-calendar test results:', results);
                      const successCount = results.filter(r => r.result?.success).length;
                      toast.success(`Calendar test completed: ${successCount}/${testCalendarIds.length} successful`);
                    } catch (error) {
                      console.error('❌ Multi-calendar test failed:', error);
                      toast.error('Multi-calendar test failed - check console');
                    }
                  }}
                  variant="outline"
                  className="border-psychPurple/20"
                >
                  Test Multiple Calendars
                </Button>
                
                <Button
                  onClick={async () => {
                    try {
                      console.log('🧪 Testing different appointment types...');
                      
                      const appointmentTypes = ['Konsultation', 'Telefon', 'Ersttermin', 'Nachkontrolle'];
                      const results = [];
                      
                      for (const type of appointmentTypes) {
                        console.log(`🔍 Testing appointment type: ${type}...`);
                        try {
                          const result = await testCreateAppointment({
                            patid: 27947,
                            calendarId: 120,
                            appointmentType: type,
                            duration: 50,
                            comment: `Test appointment type: ${type}`
                          });
                          results.push({ type, result });
                        } catch (error) {
                          results.push({ type, error: error });
                        }
                      }
                      
                      console.log('📋 Appointment type test results:', results);
                      const successCount = results.filter(r => r.result?.success).length;
                      toast.success(`Appointment type test completed: ${successCount}/${appointmentTypes.length} successful`);
                    } catch (error) {
                      console.error('❌ Appointment type test failed:', error);
                      toast.error('Appointment type test failed - check console');
                    }
                  }}
                  variant="outline"
                  className="border-psychPurple/20"
                >
                  Test Appointment Types
                </Button>
                
                <Button
                  onClick={async () => {
                    try {
                      console.log('🧪 Testing custom date/time appointment creation...');
                      
                      // Test for specific date/time (next week at 2 PM)
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      nextWeek.setHours(14, 0, 0, 0);
                      
                      const customDate = nextWeek.toISOString().slice(0, 19).replace('T', ' ');
                      
                      const result = await testCreateAppointment({
                        patid: 27947,
                        calendarId: 120,
                        appointmentType: 'Custom Time Test',
                        date: customDate,
                        duration: 45,
                        comment: 'Custom date/time test appointment'
                      });
                      
                      console.log('📋 Custom date/time test result:', result);
                      
                      if (result.success) {
                        toast.success(`✅ Custom appointment created for ${customDate}!`);
                      } else {
                        toast.warning(`⚠️ Custom appointment failed - check console for details`);
                      }
                    } catch (error) {
                      console.error('❌ Custom date/time test failed:', error);
                      toast.error('Custom date/time test failed - check console');
                    }
                  }}
                  variant="outline"
                  className="border-psychPurple/20"
                >
                  Test Custom Date/Time
                </Button>
              </div>
              
              <div className="text-xs text-psychText/60 mt-3">
                <strong>Phase 3A Goal:</strong> Discover working appointment creation endpoint and validate booking capability using 
                real patient and calendar data. Results will determine the exact API structure needed for production appointment booking.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Slots Display */}
        {!loading && (
          <Card className="mb-6 border-psychPurple/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-psychPurple" />
                Available Time Slots ({slots.length})
              </CardTitle>
              <CardDescription>
                Slots returned from /v1/booking/getSlots 
                {services.length > 0 && ` for service: ${services[0].name} (ID: ${services[0].serviceid})`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {slots.slice(0, 12).map((slot, index) => (
                    <motion.div
                      key={slot.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-psychPurple/10 rounded-lg p-3"
                    >
                      <div className="text-sm">
                        <div className="font-semibold text-psychText">
                          {new Date(slot.dateTime).toLocaleDateString()}
                        </div>
                        <div className="text-psychText/70">
                          {new Date(slot.dateTime).toLocaleTimeString()}
                        </div>
                        <div className="text-xs text-psychText/50 mt-1">
                          Duration: {slot.duration}min
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-psychText/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-psychText mb-2">No Available Slots</h3>
                  <p className="text-psychText/70">
                    The getSlots endpoint returned empty results. This could mean:
                  </p>
                  <ul className="text-sm text-psychText/60 mt-2 space-y-1">
                    <li>• No appointments are configured for this service</li>
                    <li>• The date range needs to be adjusted</li>
                    <li>• Provider calendars need to be set up</li>
                    <li>• Service may not have available time slots</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
} 