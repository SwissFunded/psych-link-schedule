import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testVitabyteConnection } from '@/services/vitabyteTestApi';

export default function VitabyteTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    setResults(null);
    
    const result = await testVitabyteConnection();
    setResults(result);
    setTesting(false);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Vitabyte API Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runTest} 
            disabled={testing}
            className="mb-4"
          >
            {testing ? 'Testing...' : 'Run API Test'}
          </Button>

          {results && (
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2">Results:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>

              {results.services && (
                <div>
                  <h3 className="font-bold text-lg mb-2">📋 Services & Calendars:</h3>
                  {results.services.map((service: any) => (
                    <div key={service.serviceid} className="border p-3 rounded mb-2">
                      <p><strong>Name:</strong> {service.name}</p>
                      <p><strong>Duration:</strong> {service.duration} min</p>
                      <p><strong>Providers:</strong> {JSON.stringify(service.providers)}</p>
                      <p className="text-green-600"><strong>Calendars:</strong> {JSON.stringify(service.calendars)}</p>
                    </div>
                  ))}
                </div>
              )}

              {results.providers && (
                <div>
                  <h3 className="font-bold text-lg mb-2">👥 Providers:</h3>
                  {results.providers.map((provider: any) => (
                    <div key={provider.userid} className="border p-3 rounded mb-2">
                      <p><strong>Name:</strong> {provider.title} {provider.givenname} {provider.familyname}</p>
                      <p className="text-blue-600"><strong>User ID:</strong> {provider.userid}</p>
                      <p><strong>Specialization:</strong> {provider.specialization || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded">
            <p className="text-sm text-gray-700">
              <strong>Hinweis:</strong> Öffnen Sie die Browser Console (F12) um detaillierte Logs zu sehen.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

