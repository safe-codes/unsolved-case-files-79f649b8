import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceInfo } from '@/lib/device-info';
import { Lock, AlertTriangle } from 'lucide-react';

interface PasswordGateProps {
  onUnlock: () => void;
}

export default function PasswordGate({ onUnlock }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      // Fetch correct password
      const { data: config } = await supabase
        .from('site_config')
        .select('site_password')
        .limit(1)
        .single();

      const isCorrect = config?.site_password === password.trim();

      // Log attempt
      const deviceInfo = getDeviceInfo();
      await supabase.from('access_attempts').insert({
        password_tried: password.trim(),
        success: isCorrect,
        user_agent: navigator.userAgent,
        device_info: deviceInfo as any,
      });

      if (isCorrect) {
        setUnlocking(true);
        setTimeout(() => onUnlock(), 1200);
      } else {
        setError('ACCESS DENIED');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } catch {
      setError('SYSTEM ERROR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center overflow-hidden scanlines">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(38 70% 50% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(38 70% 50% / 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className={`relative z-10 w-full max-w-md px-6 ${unlocking ? 'animate-unlock' : 'animate-slide-up'}`}>
        {/* Lock icon */}
        <div className="flex justify-center mb-8">
          <div className={`w-20 h-20 rounded-2xl glass-card flex items-center justify-center glow-amber transition-all duration-500 ${unlocking ? 'scale-110 glow-amber-strong' : ''}`}>
            <Lock className="w-9 h-9 text-primary animate-pulse-slow" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-center font-mono text-sm tracking-[0.3em] uppercase text-muted-foreground mb-2">
          Classified
        </h1>
        <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground mb-10">
          Unsolved Case Files
        </h2>

        {/* Password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={`relative transition-transform ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
            style={shake ? { animation: 'shake 0.5s ease-in-out' } : {}}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter access code"
              className="w-full h-14 px-5 bg-input border border-border rounded-xl font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              autoFocus
              disabled={unlocking}
            />
          </div>

          <button
            type="submit"
            disabled={loading || unlocking || !password.trim()}
            className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-medium text-sm tracking-wide uppercase transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed glow-amber"
          >
            {loading ? 'Verifying...' : unlocking ? 'Access Granted' : 'Authenticate'}
          </button>
        </form>

        {/* Error message */}
        {error && (
          <div className="mt-4 flex items-center justify-center gap-2 text-destructive text-sm font-mono animate-fade-in">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-10 font-mono tracking-wider opacity-50">
          AUTHORIZED PERSONNEL ONLY
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
