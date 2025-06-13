import axios from 'axios';

// Base types for the API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Types for services (newly discovered from API)
export interface Service {
  category: string;
  serviceid: number;
  name: string;
  description: string;
  price: number;
  providers: number[];
  duration: number;
  hits: number;
  calendars?: number[];
}





// API Response types for Vitabyte API
interface VitabyteApiResponse<T> {
  status: boolean;
  msg: string;
  result: T;
  servertime?: string;
}

// Types for appointments
export interface Appointment {
  id: string;
  dateTime: string;
  duration: number;
  patientId: string;
  therapistId?: string;
  status: 'scheduled' | 'cancelled' | 'completed' | 'no-show';
  type?: 'in-person' | 'video' | 'phone';
  notes?: string;
  metadata?: Record<string, unknown>;
}



export interface BookAppointmentData {
  date: string;        // "2022-12-04 14:00:00" format
  end: string;         // "2022-12-04 15:00:00" format
  dateTs?: string;       // "2022-12-04 14:00:00" format, as per API docs (page 12)
  endTs?: string;         // "2022-12-04 15:00:00" format, as per API docs (page 12)
  calendar: number;    // Calendar ID (required)
  patid: number;       // Patient ID
  appointment: string; // Appointment type (e.g., "Telefon", "Konsultation")
  comment?: string;    // Optional comment
  state?: string;      // Optional appointment state as per API docs (page 12)
}

export interface RescheduleAppointmentData {
  date: string;        // New appointment start time
  end: string;         // New appointment end time
  calendar: number;    // Calendar ID
  appointment: string; // Appointment type
  comment?: string;    // Optional comment
}

// Additional types for therapists and patient appointments
export interface Therapist {
  id: string;
  name: string;
  specialty: string;
  imageUrl?: string;
}

// Types for customer/patient data
export interface Customer {
  patid: number;
  firstname: string;
  lastname: string;
  gender: string;
  dob: string; // Date of birth in "YYYY-MM-DD" format
  title?: string;
  street?: string;
  zip?: string;
  city?: string;
  mobile?: string;
  mail: string;
  ahv?: string; // Swiss social security number
  deleted: number; // 0 = active, 1 = deleted
}

export interface GetCustomerByMailParams {
  mail: string;
}

// Types for treater/therapist lookup
export interface Treater {
  provider: number;
  name?: string;
  specialty?: string;
}

export interface MultipleTreatersResponse {
  treaters: Treater[];
  count: number;
}

export interface GetTreaterParams {
  patid: number;
}

export interface GetAppointmentsParams {
  patientId: string;
  startDate?: string;
  endDate?: string;
  status?: 'scheduled' | 'cancelled' | 'completed';
}

// Create Axios instance with default configuration using Basic Auth
const createApiClient = (appName: 'system' | 'agenda' = 'system') => {
  // 🚨 TEMPORARY DEBUG: Hardcoded credentials (REMOVE IN PRODUCTION!)
  const username = 'miro';
  const password = 'Mu%zN.^(?gA{@2rbF#Ke';
  const apiUrl = 'https://psych.vitabyte.ch/v1';
  
  // TODO: Switch back to environment variables once debugging is complete
  // const username = import.meta.env.VITE_EPAT_USERNAME;
  // const password = import.meta.env.VITE_EPAT_PASSWORD;
  // const apiUrl = import.meta.env.VITE_EPAT_API_URL || 'https://psych.vitabyte.ch/v1';
  
  console.warn('🚨 WARNING: Using hardcoded credentials for debugging. Remove before production!');
  
  if (!username || !password) {
    console.error('API credentials are not defined');
    throw new Error('API credentials are missing');
  }
  
  // Create Base64 encoded credentials
  const token = btoa(`${username}:${password}`);
  
  console.log('🔧 Authorization debug:', {
    username,
    passwordLength: password.length,
    expectedToken: 'bWlybzpNdSV6Ti5eKD9nQXtAMnJiRiNLZQ==',
    actualToken: token,
    tokenMatch: token === 'bWlybzpNdSV6Ti5eKD9nQXtAMnJiRiNLZQ=='
  });
  
  // Always use proxy for both development and production
  // In development: Vite proxy routes (/api/system, /api/agenda)
  // In production: Vercel serverless function proxy with endpoint parameter
  const isDevelopment = import.meta.env.DEV;
  const baseURL = isDevelopment ? `/api/${appName}` : `/api/proxy`;
  
  console.log('🔧 Environment check:', {
    hostname: window.location.hostname,
    isDevelopment,
    envDEV: import.meta.env.DEV,
    usingProxy: true,
    baseURL,
    appName
  });
  
  const client = axios.create({
    baseURL,
    headers: {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // For production, intercept requests to add endpoint and path parameters
  if (!isDevelopment) {
    client.interceptors.request.use((config) => {
      // Extract the path from the request URL (like /verify, /getCustomerByMail)
      const path = config.url || '';
      
      // For proxy, we send everything to /api/proxy with endpoint and path as parameters
      config.url = ''; // Clear the URL since we're using query params
      config.params = {
        ...config.params,
        endpoint: appName,
        path: path  // Add the path as a parameter
      };
      
      console.log('🔧 Request interceptor:', {
        originalPath: path,
        endpoint: appName,
        finalUrl: `${client.defaults.baseURL}`,
        params: config.params
      });
      
      return config;
    });
  }

  return client;
};

// Error handling helper
const handleApiError = (error: unknown): never => {
  // Check if error is an Axios error object
  const axiosError = error as any;
  
  if (axiosError.response) {
    // Don't log sensitive data, only status and message
    console.error(`API Error:`, {
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
    });
    
    throw new Error(
      axiosError.response?.data?.error || 
      axiosError.message || 
      'An error occurred with the ePat API'
    );
  }
  
  // For non-Axios errors
  console.error('Unexpected error during API call:', (error as Error)?.message);
  throw error;
};

/**
 * Verifies if the API credentials are valid by calling the verify endpoint
 * @returns Promise with boolean indicating if the credentials are valid
 */
export const verifyApiKey = async (): Promise<boolean> => {
  try {
    const apiClient = createApiClient('system');
    
    // Log the request details for debugging
    console.log('🔍 API Client config:', {
      baseURL: apiClient.defaults.baseURL,
      headers: {
        ...apiClient.defaults.headers,
        Authorization: (apiClient.defaults.headers as any)?.Authorization ? '[REDACTED]' : 'Missing'
      }
    });
    
    console.log('📡 Making request to /verify...');
    const response = await apiClient.post('/verify');
    
    console.log('📥 Response received:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    
    // Log response details separately to avoid object collapsing
    console.log('🔍 Response data type:', typeof response.data);
    console.log('🔍 Response data content:', response.data);
    console.log('🔍 Response data JSON:', JSON.stringify(response.data, null, 2));
    console.log('🔍 Has status field:', (response.data as any)?.status);
    console.log('🔍 Status value:', (response.data as any)?.status === true);
    console.log('🔍 Status type:', typeof (response.data as any)?.status);
    
    // Handle multiple possible response formats
    const responseData = response.data as any;
    
    // Check for different possible formats:
    // 1. Standard: {"status": true, "msg": "..."}
    // 2. String response that needs parsing
    // 3. Nested response structure
    let isValid = false;
    
    if (response.status === 200) {
      if (typeof responseData === 'object' && responseData !== null) {
        // Standard object response
        isValid = responseData.status === true;
      } else if (typeof responseData === 'string') {
        // String response - try to parse as JSON
        try {
          const parsed = JSON.parse(responseData);
          isValid = parsed.status === true;
        } catch {
          // If not JSON, check for success message
          isValid = responseData.includes('authenticated successfully') || responseData.includes('Congrats');
        }
      }
    }
    
    console.log('✅ API verification result:', isValid);
    
    return isValid;
  } catch (error) {
    // For this specific function, we return false instead of throwing
    // since it's used to check authentication
    console.error('❌ API verification error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      statusText: (error as any)?.response?.statusText,
      data: (error as any)?.response?.data,
      config: {
        url: (error as any)?.config?.url,
        method: (error as any)?.config?.method,
        baseURL: (error as any)?.config?.baseURL
      }
    });
    return false;
  }
};

/**
 * Fetches available services from the Vitabyte API
 * @returns Promise with array of available services
 */
export const getServices = async (): Promise<Service[]> => {
  const apiClient = createApiClient('system'); // Use system API instead of agenda
  
  try {
    console.log('📡 Fetching services from /v1/booking/getServices...');
    
    // Send the correct payload according to API documentation
    const payload = { location: 0 };
    console.log('📤 Sending payload:', payload);
    
    const response = await apiClient.post('/booking/getServices', payload); // Correct path
    
    console.log('📥 Services response received:', {
      status: response.status,
      resultCount: (response.data as VitabyteApiResponse<Service[]>)?.result?.length || 0
    });
    
    console.log('🔍 Services response details:', {
      dataType: typeof response.data,
      dataContent: response.data,
      dataJSON: JSON.stringify(response.data, null, 2),
      hasStatus: (response.data as VitabyteApiResponse<Service[]>)?.status,
      hasResult: (response.data as VitabyteApiResponse<Service[]>)?.result,
      resultLength: (response.data as VitabyteApiResponse<Service[]>)?.result?.length
    });
    
    // Handle the expected Vitabyte API response format
    const responseData = response.data as VitabyteApiResponse<Service[]>;
    
    if (response.status === 200 && responseData.status === true && Array.isArray(responseData.result)) {
      const services = responseData.result;
      console.log('🎯 Successfully parsed services count:', services.length);
      
      if (services.length > 0) {
        console.log('🎯 Sample services:', services.slice(0, 3).map(s => ({
          serviceid: s.serviceid,
          name: s.name,
          category: s.category,
          duration: s.duration
        })));
      }
      
      return services;
    } else {
      console.warn('⚠️ Unexpected response format:', {
        status: response.status,
        responseStatus: responseData.status,
        hasResult: Array.isArray(responseData.result)
      });
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching services:', error);
    return handleApiError(error);
  }
};

/**
 * Tests comprehensive service discovery (Leistungenabfragen) with different location IDs
 * @returns Promise with raw API response for debugging
 */
export const testLeistungenabfragen = async (): Promise<any> => {
  const results: any = {};
  
  // Test /booking/getServices with different location IDs (1, 2, 3)
  // We already know location 0 returns only Massage service
  const locationTests = [
    { location: 1, description: 'Location 1 - Zähringerstr' },
    { location: 2, description: 'Location 2 - Sihlcity' }, 
    { location: 3, description: 'Location 3 - Cornelia Hatze' },
    { location: 0, description: 'Location 0 - Central (baseline)' }
  ];
  
  for (const test of locationTests) {
    try {
      console.log(`🧪 Testing /booking/getServices with location ${test.location}: ${test.description}`);
      
      const apiClient = createApiClient('system'); // Use system API instead of agenda
      const payload = { location: test.location };
      console.log(`📤 Sending payload:`, payload);
      
      const response = await apiClient.post('/booking/getServices', payload); // Correct path
      
      console.log(`📥 Location ${test.location} response:`, {
        status: response.status,
        data: response.data,
        serviceCount: (response.data as any)?.result?.length || 0
      });
      
      // Extract service details for comparison
      const serviceDetails = (response.data as any)?.result?.map((service: any) => ({
        serviceid: service.serviceid,
        name: service.name,
        category: service.category,
        duration: service.duration,
        price: service.price,
        providers: service.providers
      })) || [];
      
      results[`Location ${test.location}`] = {
        description: test.description,
        status: response.status,
        serviceCount: serviceDetails.length,
        services: serviceDetails,
        rawData: response.data,
        success: true
      };
      
    } catch (error) {
      console.log(`❌ Location ${test.location} failed:`, error);
      results[`Location ${test.location}`] = {
        description: test.description,
        error: error,
        success: false
      };
    }
  }
  
  console.log('🔍 Complete location services test results:', results);
  
  // Summary analysis
  const successfulLocations = Object.entries(results).filter(([, result]: [string, any]) => result.success);
  const totalServices = successfulLocations.reduce((sum, [, result]: [string, any]) => sum + (result.serviceCount || 0), 0);
  
  console.log('📊 Location Services Summary:', {
    successfulLocations: successfulLocations.length,
    totalServices,
    locationBreakdown: successfulLocations.map(([location, result]: [string, any]) => ({
      location,
      serviceCount: result.serviceCount,
      services: result.services?.map((s: any) => s.name) || []
    }))
  });
  
  return results;
};





/**
 * Books an appointment using the booking API
 * @param data The appointment booking data
 * @returns Promise with the booked appointment details
 */
export const bookAppointment = async (data: BookAppointmentData): Promise<Appointment> => {
  const apiClient = createApiClient('agenda');
  
  try {
    console.log('📡 Creating appointment with data:', data);
    const response = await apiClient.post('/createAppointment', data);
    
    console.log('📥 Create appointment response:', response.data);
    
    // Handle the expected Vitabyte API response format
    const responseData = response.data as VitabyteApiResponse<{ appointmentid: number }>;
    
    if (responseData.status === true && responseData.result?.appointmentid) {
      return {
        id: responseData.result.appointmentid.toString(),
        dateTime: data.date,
        duration: Math.round((new Date(data.end).getTime() - new Date(data.date).getTime()) / (1000 * 60)),
        patientId: data.patid.toString(),
        therapistId: undefined, // Will be determined by calendar
        status: 'scheduled',
        type: data.appointment === 'Telefon' ? 'phone' : 'in-person',
        notes: data.comment,
        metadata: { calendar: data.calendar }
      };
    } else {
      throw new Error(`Failed to create appointment: ${responseData.msg || 'Unknown error'}`);
    }
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Cancels an appointment
 * @param appointmentId ID of the appointment to cancel
 * @returns Promise with the cancelled appointment details
 */
export const cancelAppointment = async (appointmentId: string): Promise<Appointment> => {
  const apiClient = createApiClient('agenda');
  
  try {
    const response = await apiClient.post('/modifyAppointment', {
      appointmentId,
      status: 'cancelled'
    });
    
    const appointmentData = response.data as any;
    return {
      id: appointmentData?.id || appointmentId,
      dateTime: appointmentData?.dateTime || appointmentData?.start,
      duration: appointmentData?.duration || 50,
      patientId: appointmentData?.patientId || '',
      therapistId: appointmentData?.therapistId,
      status: 'cancelled',
      type: appointmentData?.type || 'in-person',
      notes: appointmentData?.notes,
      metadata: appointmentData?.metadata
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Gets a specific appointment by ID
 * @param appointmentId ID of the appointment to fetch
 * @returns Promise with the appointment details
 */
export const getAppointmentById = async (appointmentId: string): Promise<Appointment> => {
  const apiClient = createApiClient('agenda');
  
  try {
    const response = await apiClient.post('/getAppointment', { appointmentId });
    
    const appointmentData = response.data as any;
    return {
      id: appointmentData?.id || appointmentId,
      dateTime: appointmentData?.dateTime || appointmentData?.start,
      duration: appointmentData?.duration || 50,
      patientId: appointmentData?.patientId || appointmentData?.customerId || '',
      therapistId: appointmentData?.therapistId || appointmentData?.providerId,
      status: appointmentData?.status || 'scheduled',
      type: appointmentData?.type || 'in-person',
      notes: appointmentData?.notes,
      metadata: appointmentData?.metadata
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Reschedules an appointment by cancelling the old one and booking a new one
 * @param appointmentId ID of the appointment to reschedule
 * @param newData New appointment data
 * @returns Promise with the rescheduled appointment details
 */
export const rescheduleAppointment = async (
  appointmentId: string, 
  newData: RescheduleAppointmentData
): Promise<Appointment> => {
  try {
    // First get the original appointment to extract the patientId
    const originalAppointment = await getAppointmentById(appointmentId);
    
    // Cancel the existing appointment
    await cancelAppointment(appointmentId);
    
    // Then book the new appointment
    const bookingData: BookAppointmentData = {
      date: newData.date,
      end: newData.end,
      calendar: newData.calendar,
      patid: parseInt(originalAppointment.patientId),
      appointment: newData.appointment,
      comment: newData.comment,
    };
    
    // Book the new appointment
    return await bookAppointment(bookingData);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Gets all therapists
 * @returns Promise with array of therapists
 */
export const getTherapists = async (): Promise<Therapist[]> => {
  const apiClient = createApiClient('system');
  
  try {
    const response = await apiClient.post('/getProviders');
    const data = response.data as any;
    
    // Handle the working system API response format
    if (data?.status === 'ok' && Array.isArray(data?.result)) {
      return data.result.map((provider: any) => ({
        id: provider.userid?.toString() || provider.id,
        name: `${provider.title || ''} ${provider.givenname || ''} ${provider.familyname || ''}`.trim(),
        specialty: provider.specialization || 'General Practice',
        imageUrl: provider.imageUrl || provider.avatar
      }));
    }
    
    // Fallback to old format if needed
    const providers = Array.isArray(data) ? data : [];
    return providers.map((provider: any) => ({
      id: provider.id || provider.providerId,
      name: provider.name || `${provider.firstName} ${provider.lastName}`,
      specialty: provider.specialty || provider.specialization || 'General Practice',
      imageUrl: provider.imageUrl || provider.avatar
    }));
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Gets a therapist by ID
 * @param therapistId ID of the therapist to fetch
 * @returns Promise with the therapist details
 */
export const getTherapistById = async (therapistId: string): Promise<Therapist | undefined> => {
  const apiClient = createApiClient('system');
  
  try {
    const response = await apiClient.post('/getProvider', { providerId: therapistId });
    
    const provider = response.data as any;
    if (!provider) {
      return undefined;
    }
    
    return {
      id: provider.userid?.toString() || provider.id || provider.providerId,
      name: `${provider.title || ''} ${provider.givenname || ''} ${provider.familyname || ''}`.trim() || provider.name || `${provider.firstName} ${provider.lastName}`,
      specialty: provider.specialization || provider.specialty || 'General Practice',
      imageUrl: provider.imageUrl || provider.avatar
    };
  } catch (error) {
    // For this function, return undefined on error rather than throwing
    // to match the expected behavior from appointmentService
    console.error('Error fetching therapist:', (error as Error)?.message);
    return undefined;
  }
};

/**
 * Looks up customer/patient by email address
 * @param email Email address to search for
 * @returns Promise with array of matching customers
 */
export const getCustomerByMail = async (email: string): Promise<Customer[]> => {
  const apiClient = createApiClient('system');
  
  try {
    console.log('📡 Looking up customer by email:', email);
    
    const payload = { mail: email };
    console.log('📤 Sending payload:', payload);
    
    const response = await apiClient.post('/getCustomerByMail', payload);
    
    console.log('📥 Customer lookup response received:', {
      status: response.status,
      resultCount: (response.data as VitabyteApiResponse<Customer[]>)?.result?.length || 0
    });
    
    console.log('🔍 Customer response details:', {
      dataType: typeof response.data,
      dataContent: response.data,
      dataJSON: JSON.stringify(response.data, null, 2),
      hasStatus: (response.data as VitabyteApiResponse<Customer[]>)?.status,
      hasResult: (response.data as VitabyteApiResponse<Customer[]>)?.result,
      resultLength: (response.data as VitabyteApiResponse<Customer[]>)?.result?.length
    });
    
    // Handle the expected Vitabyte API response format
    const responseData = response.data as any;
    
    // Check for both boolean true and string "ok" status formats
    const isSuccess = response.status === 200 && 
                     (responseData.status === true || responseData.status === "ok") && 
                     Array.isArray(responseData.result);
    
    if (isSuccess) {
      const rawCustomers = responseData.result;
      console.log('🎯 Successfully parsed customers count:', rawCustomers.length);
      console.log('🔍 Raw customer data:', rawCustomers);
      
      // Convert and normalize customer data to handle type mismatches
      const customers: Customer[] = rawCustomers.map((rawCustomer: any) => ({
        patid: typeof rawCustomer.patid === 'string' ? parseInt(rawCustomer.patid) : rawCustomer.patid,
        firstname: rawCustomer.firstname || '',
        lastname: rawCustomer.lastname || '',
        gender: rawCustomer.gender || '',
        dob: rawCustomer.dob || '',
        title: rawCustomer.title || '',
        street: rawCustomer.street || '',
        zip: rawCustomer.zip || '',
        city: rawCustomer.city || '',
        mobile: rawCustomer.mobile || '',
        mail: rawCustomer.mail || rawCustomer.email || '',
        ahv: rawCustomer.ahv || rawCustomer.AHV || '',
        deleted: typeof rawCustomer.deleted === 'string' ? parseInt(rawCustomer.deleted) : rawCustomer.deleted || 0
      }));
      
      if (customers.length > 0) {
        console.log('🎯 Processed customers:', customers.slice(0, 3).map(c => ({
          patid: c.patid,
          name: `${c.firstname} ${c.lastname}`,
          email: c.mail,
          deleted: c.deleted,
          isActive: c.deleted === 0
        })));
      }
      
      return customers;
    } else {
      console.warn('⚠️ Unexpected response format:', {
        status: response.status,
        responseStatus: responseData.status,
        hasResult: Array.isArray(responseData.result),
        actualData: responseData
      });
      return [];
    }
  } catch (error) {
    console.error('❌ Error looking up customer:', error);
    return handleApiError(error);
  }
};

/**
 * Gets the treater (therapist) assigned to a specific patient
 * @param patid Patient ID to look up treater for
 * @returns Promise with treater information
 */
export const getTreater = async (patid: number): Promise<Treater | null> => {
  const apiClient = createApiClient('system');
  
  try {
    console.log('📡 Looking up treater for patient ID:', patid);
    
    const payload = { patid };
    console.log('📤 Sending payload:', payload);
    
    const response = await apiClient.post('/getTreater', payload);
    
    console.log('📥 Treater lookup response received:', {
      status: response.status,
      data: response.data
    });
    
    console.log('🔍 Treater response details:', {
      dataType: typeof response.data,
      dataContent: response.data,
      dataJSON: JSON.stringify(response.data, null, 2)
    });
    
    // Handle the expected Vitabyte API response format
    const responseData = response.data as any;
    
    // Check for both boolean true and string "ok" status formats
    const isSuccess = response.status === 200 && 
                     (responseData.status === true || responseData.status === "ok") && 
                     responseData.result;
    
    if (isSuccess) {
      const treaterData = responseData.result;
      console.log('🎯 Successfully found treater:', treaterData);
      
      // Handle both direct provider number and object with provider field
      if (typeof treaterData === 'number') {
        return { provider: treaterData };
      } else if (typeof treaterData === 'object' && treaterData.provider) {
        return {
          provider: typeof treaterData.provider === 'string' ? parseInt(treaterData.provider) : treaterData.provider
        };
      } else {
        console.warn('⚠️ Unexpected treater data format:', treaterData);
        return null;
      }
    } else {
      console.warn('⚠️ Treater lookup failed or no treater found:', {
        status: response.status,
        responseStatus: responseData.status,
        hasResult: !!responseData.result,
        actualData: responseData
      });
      return null;
    }
  } catch (error) {
    console.error('❌ Error looking up treater:', error);
    // Return null instead of throwing to handle cases where patient has no assigned treater
    return null;
  }
};

/**
 * Gets all treaters/therapists for a patient (supports multiple treaters)
 * @param patid Patient ID
 * @returns Promise with array of treaters or null if none found
 */
export const getMultipleTreaters = async (patid: number): Promise<MultipleTreatersResponse | null> => {
  const apiClient = createApiClient('system');
  
  try {
    console.log('📡 Looking up multiple treaters for patient ID:', patid);
    
    // First try with getTreater to see if API returns multiple
    const payload = { patid };
    console.log('📤 Sending payload to getTreater:', payload);
    
    const response = await apiClient.post('/getTreater', payload);
    
    console.log('📥 Multiple treaters lookup response received:', {
      status: response.status,
      data: response.data
    });
    
    console.log('🔍 Multiple treaters response details:', {
      dataType: typeof response.data,
      dataContent: response.data,
      dataJSON: JSON.stringify(response.data, null, 2)
    });
    
    const responseData = response.data as any;
    
    // Check for success
    const isSuccess = response.status === 200 && 
                     (responseData.status === true || responseData.status === "ok") && 
                     responseData.result;
    
    if (isSuccess) {
      const treaterData = responseData.result;
      console.log('🎯 Successfully found treater data:', treaterData);
      
      // Handle different response formats
      let treaters: Treater[] = [];
      
      if (Array.isArray(treaterData)) {
        // If result is already an array
        treaters = treaterData.map((item: any) => {
          if (typeof item === 'number') {
            return { provider: item };
          } else if (typeof item === 'object' && item.provider) {
            return {
              provider: typeof item.provider === 'string' ? parseInt(item.provider) : item.provider,
              name: item.name,
              specialty: item.specialty
            };
          }
          return null;
        }).filter(Boolean);
      } else if (typeof treaterData === 'number') {
        // Single provider number
        treaters = [{ provider: treaterData }];
      } else if (typeof treaterData === 'object' && treaterData.provider) {
        // Single provider object
        treaters = [{
          provider: typeof treaterData.provider === 'string' ? parseInt(treaterData.provider) : treaterData.provider,
          name: treaterData.name,
          specialty: treaterData.specialty
        }];
      }
      
      if (treaters.length > 0) {
        console.log(`🎯 Found ${treaters.length} treater(s):`, treaters);
        
        // Try to get additional details for each treater
        const enrichedTreaters = await Promise.all(
          treaters.map(async (treater) => {
            try {
              const details = await getProviderDetails({ providerid: treater.provider });
              return {
                ...treater,
                name: details?.name || treater.name,
                specialty: details?.specialty || treater.specialty
              };
            } catch (error) {
              console.warn(`Could not get details for provider ${treater.provider}`);
              return treater;
            }
          })
        );
        
        return {
          treaters: enrichedTreaters,
          count: enrichedTreaters.length
        };
      }
    }
    
    // If no treaters found, try alternative endpoints
    console.log('🔍 Trying alternative endpoints for multiple treaters...');
    
    const alternativeEndpoints = [
      '/getTreaters',
      '/getProviders',
      '/getPatientProviders',
      '/getAssignedTreaters'
    ];
    
    for (const endpoint of alternativeEndpoints) {
      try {
        console.log(`🧪 Testing endpoint: ${endpoint}`);
        const altResponse = await apiClient.post(endpoint, payload);
        
        if (altResponse.status === 200 && altResponse.data) {
          console.log(`✅ Alternative endpoint ${endpoint} returned data:`, altResponse.data);
          
          // Process alternative response
          const altData = altResponse.data as any;
          if (altData.result && Array.isArray(altData.result)) {
            const treaters = altData.result.map((item: any) => ({
              provider: typeof item.provider === 'string' ? parseInt(item.provider) : item.provider,
              name: item.name,
              specialty: item.specialty
            })).filter((t: any) => t.provider);
            
            if (treaters.length > 0) {
              return {
                treaters,
                count: treaters.length
              };
            }
          }
        }
      } catch (error) {
        console.log(`❌ Endpoint ${endpoint} failed:`, error);
      }
    }
    
    console.warn('⚠️ No treaters found with any method');
    return null;
    
  } catch (error) {
    console.error('❌ Error looking up multiple treaters:', error);
    return null;
  }
};

/**
 * Gets existing appointments for a patient 
 * @param params Patient ID and optional filters
 * @returns Promise with appointment data from the API
 */
export const getAppointments = async (params?: any): Promise<any> => {
  const apiClient = createApiClient('agenda');
  
  try {
    console.log('📡 Testing /v1/agenda/getAppointments endpoint...');
    
    // Use the provided patid or default to documentation example
    const payload = { patid: params?.patid || 4031 };
    console.log('📤 Sending payload:', payload);
    
    const response = await apiClient.post('/getAppointments', payload);
    console.log('📥 getAppointments response received:', {
      status: response.status,
      data: response.data
    });
    
    const responseData = response.data;
    console.log('🔍 getAppointments response details:', {
      dataType: typeof responseData,
      dataContent: responseData,
      dataJSON: JSON.stringify(responseData, null, 2)
    });
    
    return responseData;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Test appointment creation using discovered Calendar ID 120
 * @param testParams Test parameters for appointment creation
 * @returns Promise with appointment creation test results
 */
export const testCreateAppointment = async (testParams?: {
  patid?: number;
  calendarId?: number;
  appointmentType?: string;
  date?: string;
  duration?: number;
  comment?: string;
}): Promise<any> => {
  const apiClient = createApiClient('agenda');
  
  try {
    // Default test parameters using discovered data
    const defaults = {
      patid: testParams?.patid || 27947, // Default to shem-lee@gmx.ch patient ID (TODO: verify correct ID)
      calendarId: testParams?.calendarId || 120, // Calendar ID for Dr. Sonja Sporer
      appointmentType: testParams?.appointmentType || 'Konsultation',
      duration: testParams?.duration || 50, // Standard therapy session duration
      comment: testParams?.comment || 'Test appointment - API testing'
    };

    // Calculate appointment time (next business day at 10:00 AM)
    const now = new Date();
    const appointmentDate = new Date(now);
    appointmentDate.setDate(now.getDate() + 1); // Tomorrow
    appointmentDate.setHours(10, 0, 0, 0); // 10:00 AM
    
    // Skip weekends
    if (appointmentDate.getDay() === 0) { // Sunday
      appointmentDate.setDate(appointmentDate.getDate() + 1);
    } else if (appointmentDate.getDay() === 6) { // Saturday
      appointmentDate.setDate(appointmentDate.getDate() + 2);
    }

    const endDate = new Date(appointmentDate);
    endDate.setMinutes(appointmentDate.getMinutes() + defaults.duration);

    // Format dates for API
    const formatDate = (date: Date) => {
      return date.toISOString().slice(0, 19).replace('T', ' ');
    };

    const appointmentData: BookAppointmentData = {
      date: testParams?.date || formatDate(appointmentDate),
      end: formatDate(endDate),
      calendar: defaults.calendarId,
      patid: defaults.patid,
      appointment: defaults.appointmentType,
      comment: defaults.comment
    };

    console.log('🧪 Testing appointment creation with parameters:', appointmentData);
    console.log('📋 Test context:', {
      patientInfo: 'Patient ID 27947 (shem-lee@gmx.ch)',
      calendarInfo: 'Calendar ID 120 (Dr. med. Sonja Sporer)',
      appointmentTime: appointmentData.date,
      duration: `${defaults.duration} minutes`,
      type: defaults.appointmentType
    });

    // Test different endpoints to find the correct one
    const testEndpoints = [
      '/createAppointment',
      '/v1/agenda/createAppointment', 
      '/v1/booking/createAppointment',
      '/booking/createAppointment'
    ];

    let lastError = null;
    const testResults = [];

    for (const endpoint of testEndpoints) {
      try {
        console.log(`🔍 Testing endpoint: ${endpoint}`);
        const response = await apiClient.post(endpoint, appointmentData);
        
        const result = {
          endpoint,
          success: true,
          status: response.status,
          data: response.data,
          method: 'POST'
        };
        
        console.log(`✅ ${endpoint} successful:`, result);
        testResults.push(result);
        
        // If we get a successful response, return immediately
        if ((response.data as any)?.status === true || response.status === 200) {
          return {
            success: true,
            workingEndpoint: endpoint,
            appointmentData,
            response: response.data,
            allResults: testResults
          };
        }
      } catch (error) {
        lastError = error;
        const errorResult = {
          endpoint,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: (error as any)?.response?.status,
          data: (error as any)?.response?.data
        };
        
        console.log(`❌ ${endpoint} failed:`, errorResult);
        testResults.push(errorResult);
      }
    }

    // If no endpoint worked, return detailed results
    return {
      success: false,
      message: 'No working appointment creation endpoint found',
      appointmentData,
      testResults,
      lastError: lastError instanceof Error ? lastError.message : 'Unknown error'
    };

  } catch (error) {
    console.error('🚨 Appointment creation test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      appointmentData: testParams
    };
  }
};

/**
 * Gets appointments for a specific patient
 * @param params Parameters for filtering appointments
 * @returns Promise with array of appointments
 */
export const getPatientAppointments = async (params: GetAppointmentsParams): Promise<Appointment[]> => {
  const apiClient = createApiClient('agenda');
  
  try {
    // Use the same format as the working getAppointments function
    const requestData: any = {
      patid: parseInt(params.patientId) // Use patid instead of customerId
    };
    
    console.log('📡 getPatientAppointments - sending request:', requestData);
    
    const response = await apiClient.post('/getAppointments', requestData);
    
    console.log('📥 getPatientAppointments response:', {
      status: response.status,
      data: response.data
    });
    
    // Handle the Vitabyte API response format
    const responseData = response.data as VitabyteApiResponse<any[]>;
    
    if (responseData?.status === true && Array.isArray(responseData.result)) {
      const appointments = responseData.result;
    return appointments.map((appointment: any) => ({
        id: appointment.id || appointment.appointmentId || `apt-${appointment.patid}-${appointment.date}`,
        dateTime: appointment.dateTime || appointment.date || appointment.start,
      duration: appointment.duration || 50,
      patientId: params.patientId,
        therapistId: appointment.therapistId || appointment.providerId || appointment.provider,
      status: appointment.status || 'scheduled',
      type: appointment.type || 'in-person',
        notes: appointment.notes || appointment.comment,
        metadata: appointment
    }));
    } else {
      console.log('📋 No appointments found or unexpected format:', responseData);
      return [];
    }
  } catch (error) {
    console.error('❌ getPatientAppointments error:', error);
    return handleApiError(error);
  }
};

// New function to get provider details directly
export const getProviderDetails = async (params: { providerid: number }): Promise<Therapist | null> => {
  const apiClient = createApiClient('system');
  try {
    const response = await apiClient.post('/getProvider', { provider: params.providerid });
    const data = response.data as any;

    // Enhanced logging to inspect the actual data structure
    console.log(`🔍 getProviderDetails - Raw response for provider ID ${params.providerid}:`, JSON.stringify(data, null, 2));

    if (data && (data.status === true || data.status === 'ok')) {
      const providerData = data.result && typeof data.result === 'object' ? data.result : data;
      
      // More detailed log of the object we are trying to extract from
      console.log(`🔍 getProviderDetails - Provider data being processed:`, JSON.stringify(providerData, null, 2));

      if (providerData.familyname || providerData.givenname) { // Check if essential name fields are present
        return {
          id: params.providerid.toString(),
          name: `${providerData.title || ''} ${providerData.givenname || ''} ${providerData.familyname || ''}`.trim(),
          specialty: providerData.specialization || 'General Practice',
        };
      } else {
        console.warn(`⚠️ getProviderDetails - Essential name fields (familyname, givenname) missing in providerData for ID ${params.providerid}. Data:`, providerData);
        return null;
      }
    } else if (typeof data.familyname !== 'undefined') { // Fallback for direct object response without status field (as seen in one log)
       console.log(`🔍 getProviderDetails - Processing direct object response for provider ID ${params.providerid}:`, JSON.stringify(data, null, 2));
       return {
          id: params.providerid.toString(),
          name: `${data.title || ''} ${data.givenname || ''} ${data.familyname || ''}`.trim(),
          specialty: data.specialization || 'General Practice',
        };
    }

    console.warn(`Failed to parse provider details or provider not found (status: ${data?.status}) for ID ${params.providerid}:`, data);
    return null;
  } catch (error) {
    console.error(`Error fetching provider details for ID ${params.providerid}:`, error);
    return handleApiError(error); // Or return null if preferred for non-critical errors
  }
};

// Renaming bookAppointment to createEpatAppointmentDirectly to avoid confusion 
// with appointmentService.bookAppointment and to match direct API payload structure.
export const createEpatAppointmentDirectly = async (payload: BookAppointmentData): Promise<{appointmentid: number} | null> => {
  const apiClient = createApiClient('agenda');
  try {
    console.log('Creating ePAT appointment with payload:', payload);
    const response = await apiClient.post('/createAppointment', payload);
    const data = response.data as any;

    if (data && (data.status === 'ok' || data.status === true) && data.result && Array.isArray(data.result) && data.result.length > 0 && data.result[0].appointmentid) {
      console.log('Successfully created appointment:', data.result[0]);
      return data.result[0];
    }
    if (data && (data.status === 'ok' || data.status === true) && data.result && data.result.appointmentid) { // Sometime result is not an array
      console.log('Successfully created appointment (non-array result):', data.result);
      return data.result;
    }
    console.error('Failed to create appointment, unexpected response:', data);
    throw new Error(data.msg || 'Failed to create appointment due to unexpected response format.');

  } catch (error) {
    console.error('Error in createEpatAppointmentDirectly:', error);
    return handleApiError(error);
  }
}; 