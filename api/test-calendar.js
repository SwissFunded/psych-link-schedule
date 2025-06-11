// Simple test endpoint to check calendar API connectivity
export default async function handler(req, res) {
  console.log('🧪 Test calendar API route called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const icsUrl = 'https://api.vitabyte.ch/calendar/?action=getics&cid=966541-462631-f1b699-977a3d&type=.ics';
    
    console.log('🧪 Testing connection to:', icsUrl);
    
    const response = await fetch(icsUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PsychLinkSchedule/1.0)',
        'Accept': 'text/calendar, text/plain, */*',
      },
    });

    const result = {
      url: icsUrl,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      success: response.ok
    };

    if (response.ok) {
      const data = await response.text();
      result.dataLength = data.length;
      result.preview = data.substring(0, 300);
    } else {
      result.errorBody = await response.text();
    }

    console.log('🧪 Test result:', result);
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('🧪 Test error:', error);
    return res.status(500).json({ 
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    });
  }
} 