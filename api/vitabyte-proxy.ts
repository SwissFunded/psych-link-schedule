// Vercel Serverless Function - Vitabyte API Proxy
// Handles CORS and authentication for Vitabyte API calls

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API type from header (system or agenda)
    const apiType = req.headers['x-api-type'] as string || 'system';
    
    // Get endpoint path from request body or URL
    const { endpoint, ...bodyData } = req.body;
    const endpointPath = endpoint || req.url?.replace('/api/vitabyte-proxy', '') || '';

    console.log('🔧 Proxy request:', {
      apiType,
      endpoint: endpointPath,
      bodyKeys: Object.keys(bodyData)
    });

    // Determine base URL based on API type
    const baseUrl = apiType === 'agenda' 
      ? 'https://psych.vitabyte.ch/v1/agenda'
      : 'https://psych.vitabyte.ch/v1';

    const fullUrl = `${baseUrl}${endpointPath}`;

    // Get credentials from environment variables (Vercel uses non-VITE_ prefixed vars)
    const username = process.env.VITABYTE_USERNAME || process.env.VITE_VITABYTE_USERNAME || 'Miro';
    const password = process.env.VITABYTE_PASSWORD || process.env.VITE_VITABYTE_PASSWORD || '#dCdGV;f8je,1Tj34nxo';
    
    // Create Basic Auth token
    const authToken = Buffer.from(`${username}:${password}`).toString('base64');

    console.log('📡 Forwarding to:', fullUrl);

    // Forward request to Vitabyte API
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(bodyData),
    });

    // Get response data
    const data = await response.json();

    console.log('📥 Vitabyte response:', {
      status: response.status,
      ok: response.ok,
      dataKeys: Object.keys(data)
    });

    // Forward the response
    return res.status(response.status).json(data);

  } catch (error: any) {
    console.error('❌ Proxy error:', error);
    
    return res.status(500).json({
      error: 'Proxy request failed',
      message: error.message,
      details: error.toString()
    });
  }
}

