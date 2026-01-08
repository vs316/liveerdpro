import React, { useState, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import CollaborativeCanvas from './components/CollaborativeCanvas';
import DiagramSelector from './components/DiagramSelector';
import Auth from './components/Auth';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (Replace with your project credentials)
const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

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

  if (loading) return <div className="h-screen w-screen bg-[#0b0f1a] flex items-center justify-center text-slate-500">Loading...</div>;

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