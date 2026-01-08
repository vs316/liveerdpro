import React, { useState, useEffect } from 'react';

interface DiagramSelectorProps {
  supabase: any;
  user: any;
  onSelect: (id: string) => void;
  onSignOut: () => void;
}

const DiagramSelector: React.FC<DiagramSelectorProps> = ({ supabase, user, onSelect, onSignOut }) => {
  const [diagrams, setDiagrams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDiagramName, setNewDiagramName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDiagrams();
  }, []);

  const fetchDiagrams = async () => {
    const { data, error } = await supabase
      .from('diagrams')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (data) setDiagrams(data);
    setLoading(false);
  };

  const createDiagram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiagramName.trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from('diagrams')
      .insert([{ 
        name: newDiagramName, 
        owner_id: user.id,
        data: { nodes: [], edges: [] }
      }])
      .select()
      .single();

    if (data) {
      setDiagrams([data, ...diagrams]);
      setNewDiagramName('');
      onSelect(data.id);
    }
    setCreating(false);
  };

  return (
    <div className="h-screen w-screen bg-[#0b0f1a] flex flex-col overflow-hidden">
      <header className="h-16 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>
          </div>
          <h1 className="font-bold text-white text-lg tracking-tight">LiveERD Pro</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400">{user.email}</span>
          <button onClick={onSignOut} className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            Sign Out
          </button>
        </div>
      </header>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white">Your Diagrams</h2>
            <form onSubmit={createDiagram} className="flex gap-2">
              <input
                type="text"
                value={newDiagramName}
                onChange={(e) => setNewDiagramName(e.target.value)}
                placeholder="New Diagram Name"
                className="bg-[#1e293b] border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <button 
                type="submit"
                disabled={creating || !newDiagramName}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : '+ Create'}
              </button>
            </form>
          </div>

          {loading ? (
            <div className="text-center text-slate-500 py-20">Loading workspaces...</div>
          ) : diagrams.length === 0 ? (
            <div className="text-center py-20 bg-[#0f172a] rounded-2xl border border-slate-800 border-dashed">
              <p className="text-slate-400 mb-4">No diagrams found.</p>
              <p className="text-sm text-slate-600">Create one above to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {diagrams.map((diagram) => (
                <div 
                  key={diagram.id}
                  onClick={() => onSelect(diagram.id)}
                  className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-600 group-hover:text-white text-blue-400 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(diagram.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{diagram.name}</h3>
                  <p className="text-xs text-slate-500">{diagram.data?.nodes?.length || 0} Tables • {diagram.data?.edges?.length || 0} Relations</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagramSelector;