import { VercelRequest, VercelResponse } from '@vercel/node';

// API proxy for Vitabyte ePAD API to handle CORS issues
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
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
    // Extract the endpoint from the query
    const { endpoint } = req.query;
    
    if (!endpoint || Array.isArray(endpoint)) {
      return res.status(400).json({ error: 'Endpoint parameter is required and must be a string' });
    }

    // Forward the request to the Vitabyte API
    const apiUrl = `https://dev.vitabyte.ch/v1/${endpoint}`;
    
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

    // Set request options
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': process.env.VITE_VITABYTE_API_KEY || '',
        'X-API-Secret': process.env.VITE_VITABYTE_API_SECRET || '',
      },
    };

    // Add body for non-GET requests
    if (req.method !== 'GET' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    // Make the API request
    const response = await fetch(fullUrl, fetchOptions);
    const data = await response.json();

    // Return the API response
    res.status(response.status).json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 