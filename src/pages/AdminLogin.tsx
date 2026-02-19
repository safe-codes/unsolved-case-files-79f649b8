import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      // Check if user is admin
      const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (!adminData) {
        await supabase.auth.signOut();
        setError('Unauthorized');
        return;
      }

      navigate('/ctrl-panel');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="w-full max-w-sm px-6 animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-xl glass-card flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary" />
          </div>
        </div>

        <h1 className="text-center text-sm font-mono text-muted-foreground tracking-widest uppercase mb-8">
          Admin Access
        </h1>

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full h-12 px-4 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full h-12 px-4 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all hover:brightness-110 disabled:opacity-40"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {error && (
          <p className="text-center text-destructive text-sm mt-4 font-mono animate-fade-in">{error}</p>
        )}
      </div>
    </div>
  );
}
