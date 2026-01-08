import React, { useState } from 'react';

interface AuthProps {
  view: 'login' | 'signup' | 'forgot';
  setView: (view: 'login' | 'signup' | 'forgot') => void;
  supabase: any;
}

const Auth: React.FC<AuthProps> = ({ view, setView, supabase }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (view === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email for the confirmation link.');
      } else if (view === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage('Password reset link sent to your email.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#0f172a] p-8 rounded-2xl border border-slate-800 shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          {view === 'login' ? 'Welcome Back' : view === 'signup' ? 'Create Account' : 'Reset Password'}
        </h1>
        <p className="text-slate-400 text-sm">Collaborative ERD Studio</p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {view !== 'forgot' && (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        )}

        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">{error}</div>}
        {message && <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-lg">{message}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
        >
          {loading ? 'Processing...' : view === 'login' ? 'Sign In' : view === 'signup' ? 'Sign Up' : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-6 flex justify-center gap-4 text-xs text-slate-500">
        {view === 'login' ? (
          <>
            <button onClick={() => setView('signup')} className="hover:text-blue-400 transition-colors">Create Account</button>
            <span className="opacity-20">|</span>
            <button onClick={() => setView('forgot')} className="hover:text-blue-400 transition-colors">Forgot Password?</button>
          </>
        ) : (
          <button onClick={() => setView('login')} className="hover:text-blue-400 transition-colors">Back to Sign In</button>
        )}
      </div>
    </div>
  );
};

export default Auth;