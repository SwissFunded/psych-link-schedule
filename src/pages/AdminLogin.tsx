import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (login(password)) {
      toast.success('Erfolgreich angemeldet');
      navigate('/admin');
    } else {
      toast.error('Falsches Passwort');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-psychPurple/5 to-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-psychPurple/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-psychPurple" />
          </div>
          <CardTitle>Admin-Bereich</CardTitle>
          <CardDescription>Bitte geben Sie das Admin-Passwort ein</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <Button type="submit" className="w-full bg-psychPurple hover:bg-psychPurple/90">
              Anmelden
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

