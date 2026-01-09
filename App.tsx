import React, { useState, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import CollaborativeCanvas from './components/CollaborativeCanvas';
import DiagramSelector from './components/DiagramSelector';
import Auth from './components/Auth';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
// NOTE: Use the "Publishable Key" from your Supabase settings.
// WARNING: NEVER use the "Secret Key" (service_role) in this file. It is for backend servers only.
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'your-publishable-key';
const supabase = createClient(supabaseUrl, supabaseKey);

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentDiagramId(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0b0f1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen w-screen bg-[#0b0f1a] flex items-center justify-center p-6">
        <Auth 
          view={authView} 
          setView={setAuthView} 
          supabase={supabase} 
        />
      </div>
    );
  }

  if (!currentDiagramId) {
    return (
      <DiagramSelector 
        supabase={supabase} 
        user={session.user}
        onSelect={setCurrentDiagramId} 
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <ReactFlowProvider>
      <CollaborativeCanvas 
        supabase={supabase} 
        user={session.user}
        diagramId={currentDiagramId} 
        onBack={() => setCurrentDiagramId(null)}
      />
    </ReactFlowProvider>
  );
};

export default App;