// API proxy for Vitabyte ePAD API to handle CORS issues
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Extract the endpoint and path from the query parameters
    const { endpoint, path } = req.query;
    
    if (!endpoint || Array.isArray(endpoint)) {
      return res.status(400).json({ error: 'Endpoint parameter is required and must be a string' });
    }

    // Use the path parameter if provided, otherwise try to extract from URL
    let requestPath = '';
    if (path && !Array.isArray(path)) {
      requestPath = path;
    } else {
      // Fallback: Get the path from the request URL (everything after /api/proxy)
      requestPath = req.url?.split('?')[0]?.replace('/api/proxy', '') || '';
    }
    
    // Ensure path starts with / if not empty
    if (requestPath && !requestPath.startsWith('/')) {
      requestPath = '/' + requestPath;
    }
    
    // Construct the full API URL: https://psych.vitabyte.ch/v1/{endpoint}{path}
    // For example: endpoint=system, path=/verify -> https://psych.vitabyte.ch/v1/system/verify
    const apiUrl = `https://psych.vitabyte.ch/v1/${endpoint}${requestPath}`;
    
    console.log('🔧 Proxy URL construction:', {
      originalUrl: req.url,
      endpoint,
      pathParam: path,
      requestPath,
      finalApiUrl: apiUrl,
      method: req.method,
      hasBody: !!req.body,
      bodyContent: req.body,
      queryParams: req.query,
      authHeader: req.headers.authorization ? '[REDACTED]' : 'Missing'
    });
    
    // Get query parameters except 'endpoint' and 'path'
    const queryParams = new URLSearchParams();
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== 'endpoint' && key !== 'path' && value !== undefined) {
        if (Array.isArray(value)) {
          // If the value is an array, use the first element
          queryParams.append(key, value[0]);
        } else {
          queryParams.append(key, value);
        }
      }
    });

    // Append query parameters to API URL
    const queryString = queryParams.toString();
    const fullUrl = queryString ? `${apiUrl}?${queryString}` : apiUrl;

    // Create headers - prioritize client headers, fallback to hardcoded auth
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; PsychLink/1.0)',
    };

    // Use client's authorization header if present, otherwise use fallback
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
      console.log('🔧 Using client authorization header');
    } else {
      // Fallback to hardcoded credentials
      const username = process.env.VITE_VITABYTE_USERNAME || 'miro';
      const password = process.env.VITE_VITABYTE_PASSWORD || 'Mu%zN.^(?gA{@2rbF#Ke';
      const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
      console.log('🔧 Using fallback authorization');
    }

    // Forward content-type from client if present
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    }
    
    console.log('🔧 Proxy forwarding headers:', { 
      authorization: '[REDACTED]', 
      contentType: headers['Content-Type']
    });

    // Set request options
    const fetchOptions = {
      method: req.method,
      headers,
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