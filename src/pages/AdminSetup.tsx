import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shield, CheckCircle } from 'lucide-react';

export default function AdminSetup() {
  const [setupKey, setSetupKey] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupKey || !email || !password) return;
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('setup-admin', {
        body: { email, password, setupKey },
      });

      if (fnError) throw fnError;
      if (data?.error) {
        setError(data.error);
      } else {
        setSuccess(true);
        setMessage('Admin account created! You can now log in at /ctrl-access');
      }
    } catch (err: any) {
      setError(err.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="w-full max-w-sm px-6 animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-xl glass-card flex items-center justify-center">
            {success ? (
              <CheckCircle className="w-7 h-7 text-primary" />
            ) : (
              <Shield className="w-7 h-7 text-primary" />
            )}
          </div>
        </div>

        <h1 className="text-center text-sm font-mono text-muted-foreground tracking-widest uppercase mb-8">
          Admin Setup
        </h1>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              value={setupKey}
              onChange={(e) => setSetupKey(e.target.value)}
              placeholder="Setup Key"
              className="w-full h-12 px-4 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-mono"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin Email"
              className="w-full h-12 px-4 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className="w-full h-12 px-4 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all hover:brightness-110 disabled:opacity-40"
            >
              {loading ? 'Creating...' : 'Create Admin'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-sm text-primary font-mono">{message}</p>
            <a href="/ctrl-access" className="inline-block h-12 px-6 leading-[3rem] rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all hover:brightness-110">
              Go to Admin Login
            </a>
          </div>
        )}

        {error && (
          <p className="text-center text-destructive text-sm mt-4 font-mono animate-fade-in">{error}</p>
        )}
      </div>
    </div>
  );
}
