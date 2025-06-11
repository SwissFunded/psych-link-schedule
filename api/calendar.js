// Vercel API route to proxy ICS calendar requests
export default async function handler(req, res) {
  console.log('📥 Calendar API route called:', req.method, req.url);
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const icsUrl = 'https://api.vitabyte.ch/calendar/?action=getics&cid=966541-462631-f1b699-977a3d&type=.ics';
    
    console.log('🗓️ Fetching Vitabyte ICS calendar from server-side:', icsUrl);
    
    const response = await fetch(icsUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PsychLinkSchedule/1.0)',
        'Accept': 'text/calendar, text/plain, */*',
      },
    });

    console.log('📡 Response status:', response.status, response.statusText);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('❌ Failed to fetch ICS:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: 'Failed to fetch calendar data',
        status: response.status,
        statusText: response.statusText,
        url: icsUrl
      });
    }

    const icsData = await response.text();
    console.log('✅ ICS data fetched successfully, length:', icsData.length);
    console.log('📄 First 200 chars of ICS data:', icsData.substring(0, 200));

    // Set appropriate headers for ICS content
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Return the ICS data
    console.log('✅ Returning ICS data to client');
    return res.status(200).send(icsData);

  } catch (error) {
    console.error('❌ Error in calendar API route:', error);
    console.error('❌ Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 