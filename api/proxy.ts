import { VercelRequest, VercelResponse } from '@vercel/node';

// API proxy for Vitabyte ePAD API to handle CORS issues
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Extract the endpoint from the query parameter
    const { endpoint } = req.query;
    
    if (!endpoint || Array.isArray(endpoint)) {
      return res.status(400).json({ error: 'Endpoint parameter is required and must be a string' });
    }

    // Get the path from the request URL (everything after /api/proxy)
    const requestPath = req.url?.split('?')[0]?.replace('/api/proxy', '') || '';
    
    // Construct the full API URL: https://psych.vitabyte.ch/v1/{endpoint}{path}
    // For example: endpoint=system, path=/getCustomerByMail -> https://psych.vitabyte.ch/v1/system/getCustomerByMail
    const apiUrl = `https://psych.vitabyte.ch/v1/${endpoint}${requestPath}`;
    
    console.log('🔧 Proxy URL construction:', {
      originalUrl: req.url,
      endpoint,
      requestPath,
      finalApiUrl: apiUrl,
      method: req.method,
      hasBody: !!req.body,
      bodyContent: req.body
    });
    
    // Get query parameters except 'endpoint'
    const queryParams = new URLSearchParams();
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== 'endpoint' && value !== undefined) {
        if (Array.isArray(value)) {
          // If the value is an array, use the first element
          queryParams.append(key, value[0] as string);
        } else {
          queryParams.append(key, value as string);
        }
      }
    });

    // Append query parameters to API URL
    const queryString = queryParams.toString();
    const fullUrl = queryString ? `${apiUrl}?${queryString}` : apiUrl;

    // Get Basic Auth credentials from environment
    const username = process.env.VITE_VITABYTE_USERNAME || '';
    const password = process.env.VITE_VITABYTE_PASSWORD || '';
    
    if (!username || !password) {
      console.error('Missing Vitabyte credentials');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create Basic Auth header
    const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
    
    console.log('🔧 Proxy forwarding headers:', { 
      authorization: '[REDACTED]', 
      contentType: req.headers['content-type'] 
    });

    // Set request options
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
      },
    };

    // Add body for non-GET requests
    if (req.method !== 'GET' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    // Make the API request
    console.log('🚀 Making request to:', fullUrl);
    const response = await fetch(fullUrl, fetchOptions);
    
    console.log('📥 Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    const data = await response.json();
    console.log('📄 Response data:', data);

    // Return the API response
    res.status(response.status).json(data);
  } catch (error) {
    console.error('🚨 API proxy error:', error);
    console.error('🚨 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
} 