// Debug endpoint to check environment variables in Vercel
export default async function handler(req, res) {
  console.log('🧪 Debug environment variables endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const envInfo = {
      hasViteUsername: !!process.env.VITE_VITABYTE_USERNAME,
      hasVitePassword: !!process.env.VITE_VITABYTE_PASSWORD,
      hasApiKey: !!process.env.VITE_VITABYTE_API_KEY,
      hasApiSecret: !!process.env.VITE_VITABYTE_API_SECRET,
      usernameLength: process.env.VITE_VITABYTE_USERNAME?.length || 0,
      passwordLength: process.env.VITE_VITABYTE_PASSWORD?.length || 0,
      // TEMPORARILY EXPOSE VALUES FOR DEBUGGING (REMOVE AFTER TESTING)
      viteUsername: process.env.VITE_VITABYTE_USERNAME || 'NOT_SET',
      vitePassword: process.env.VITE_VITABYTE_PASSWORD || 'NOT_SET',
      apiUrl: process.env.VITE_EPAT_API_URL || 'NOT_SET',
      nodeEnv: process.env.NODE_ENV,
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('VITABYTE')),
      allEnvKeysEpat: Object.keys(process.env).filter(key => key.includes('EPAT')),
      vercelEnv: process.env.VERCEL_ENV,
      // Show first few chars for verification
      usernamePreview: process.env.VITE_VITABYTE_USERNAME?.substring(0, 3) || 'N/A',
      passwordPreview: process.env.VITE_VITABYTE_PASSWORD?.substring(0, 3) || 'N/A'
    };

    console.log('🧪 Environment info:', envInfo);
    
    return res.status(200).json({
      success: true,
      environment: envInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🧪 Debug error:', error);
    return res.status(500).json({ 
      error: 'Debug failed',
      message: error.message
    });
  }
} 