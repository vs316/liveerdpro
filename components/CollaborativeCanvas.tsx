import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  Connection, 
  Edge,
  MarkerType,
  Node,
  ConnectionMode
} from 'reactflow';
import EntityNode from './EntityNode';
import Sidebar from './Sidebar';
import { generateERDFromPrompt } from '../geminiService';
import { ERDEntity, ERDRelationship } from '../types';

const nodeTypes = { entity: EntityNode };

const CollaborativeCanvas = ({ supabase, user, diagramId, onBack }: any) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  
  // History State for Undo/Redo
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Fetch initial diagram data
  useEffect(() => {
    const fetchDiagram = async () => {
      const { data, error } = await supabase
        .from('diagrams')
        .select('*')
        .eq('id', diagramId)
        .single();
      
      if (data && data.data) {
        setNodes(data.data.nodes || []);
        setEdges(data.data.edges || []);
      }
    };
    fetchDiagram();
  }, [diagramId]);

  // Presence channel
  useEffect(() => {
    const channel = supabase.channel(`room:${diagramId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        // Flatten presence state
        const users = Object.values(newState).flat();
        setActiveUsers(users);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user: user.email, online_at: new Date().toISOString() });
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [diagramId, user.email]);

  // Real-time synchronization
  const saveDiagram = useCallback(async (newNodes: any, newEdges: any) => {
    await supabase
      .from('diagrams')
      .update({ data: { nodes: newNodes, edges: newEdges }, updated_at: new Date().toISOString() })
      .eq('id', diagramId);
  }, [diagramId]);

  const recordHistory = useCallback((newNodes: any, newEdges: any) => {
    const entry = JSON.stringify({ nodes: newNodes, edges: newEdges });
    // If we are in the middle of history, discard future
    const newHistory = [...history.slice(0, historyIndex + 1), entry];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleNodesChangeWithHistory = useCallback((changes: any) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  const undo = () => {
    if (historyIndex > 0) {
      const prev = JSON.parse(history[historyIndex - 1]);
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setHistoryIndex(historyIndex - 1);
      saveDiagram(prev.nodes, prev.edges);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = JSON.parse(history[historyIndex + 1]);
      setNodes(next.nodes);
      setEdges(next.edges);
      setHistoryIndex(historyIndex + 1);
      saveDiagram(next.nodes, next.edges);
    }
  };

  const handleUpdateEntity = useCallback((id: string, updates: Partial<ERDEntity>) => {
    setNodes((nds) => {
      const newNodes = nds.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, ...updates } };
        }
        return n;
      });
      saveDiagram(newNodes, edges);
      recordHistory(newNodes, edges);
      return newNodes;
    });
  }, [edges, saveDiagram, recordHistory, setNodes]);

  const mysqlCode = useMemo(() => {
    return nodes.map(n => {
      const d = n.data as ERDEntity;
      const cols = d.attributes.map(a => {
        let sql = `  \`${a.name}\` ${a.type}`;
        if (a.type === 'VARCHAR') sql += '(255)';
        if (!a.isNullable) sql += ' NOT NULL';
        if (a.autoIncrement) sql += ' AUTO_INCREMENT';
        if (a.isPrimary) sql += ' PRIMARY KEY';
        return sql;
      }).join(',\n');
      return `CREATE TABLE \`${d.name.toLowerCase()}\` (\n${cols}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
    }).join('\n\n');
  }, [nodes]);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => {
      const newEdges = addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' } }, eds);
      saveDiagram(nodes, newEdges);
      recordHistory(nodes, newEdges);
      return newEdges;
    });
  }, [nodes, saveDiagram, recordHistory]);

  const exportJson = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `erd_export_${Date.now()}.json`;
    a.click();
  };

  const importJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const content = JSON.parse(ev.target?.result as string);
          setNodes(content.nodes || []);
          setEdges(content.edges || []);
          saveDiagram(content.nodes, content.edges);
          recordHistory(content.nodes, content.edges);
        } catch (err) { alert("Invalid JSON format"); }
      };
      reader.readAsText(file);
    }
  };

  const selectedEntity = useMemo(() => 
    nodes.find(n => n.id === selectedNodeId)?.data
  , [nodes, selectedNodeId]);

  return (
    <div className="flex h-screen w-screen bg-[#0b0f1a] overflow-hidden text-slate-100">
      {/* Workspace Sidebar */}
      <aside className="w-80 bg-[#0f172a] border-r border-slate-800 flex flex-col z-30 shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
           <button onClick={onBack} className="text-slate-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg> Dashboard
           </button>
           <div className="flex gap-2">
             <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded-lg">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l5 5m-5-5l5-5"/></svg>
             </button>
             <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded-lg">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2m18-10l-5 5m5-5l-5-5"/></svg>
             </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8">
           <section className="space-y-4">
             <div className="flex justify-between items-center">
               <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Team</h2>
               <span className="text-[10px] text-green-400 bg-green-900/20 px-2 py-0.5 rounded-full border border-green-900/30">{activeUsers.length} Online</span>
             </div>
             <div className="flex -space-x-2 overflow-hidden py-1">
               {activeUsers.map((u: any, i) => (
                 <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-[#0f172a] bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase" title={u.user}>
                   {u.user?.[0] || 'U'}
                 </div>
               ))}
             </div>
           </section>

           <section className="space-y-4">
             <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Weaver</h2>
             <textarea 
               value={prompt} onChange={(e) => setPrompt(e.target.value)}
               className="w-full h-24 bg-[#1e293b]/50 rounded-xl p-3 text-xs focus:outline-none border border-slate-800 placeholder:text-slate-600"
               placeholder="Describe your model..."
             />
             <button onClick={async () => {
               setIsGenerating(true);
               const result = await generateERDFromPrompt(prompt);
               const newNodes = result.entities.map((ent: any, idx: number) => ({
                id: ent.id || `ent-${idx}`,
                type: 'entity',
                data: { ...ent, id: ent.id || `ent-${idx}` },
                position: { x: 100 + (idx * 300), y: 150 + (idx % 2 * 200) },
               }));
               const newEdges = result.relationships.map((rel: any, idx: number) => ({
                id: rel.id || `rel-${idx}`,
                source: rel.source,
                target: rel.target,
                label: rel.cardinality || '1:N',
                animated: true,
                style: { stroke: '#3b82f6', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
               }));
               setNodes(newNodes);
               setEdges(newEdges);
               saveDiagram(newNodes, newEdges);
               recordHistory(newNodes, newEdges);
               setIsGenerating(false);
             }} className="w-full py-2 bg-blue-600 rounded-lg text-xs font-bold shadow-lg shadow-blue-600/10 hover:bg-blue-500 transition-all">
                {isGenerating ? 'Weaving...' : 'Generate Schema'}
             </button>
           </section>

           <section className="space-y-4">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data Operations</h2>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={exportJson} className="bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-700 transition-colors">Export JSON</button>
                <label className="bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-700 text-center cursor-pointer transition-colors">
                  Import JSON
                  <input type="file" className="hidden" accept=".json" onChange={importJson} />
                </label>
              </div>
              <button onClick={() => setShowCodePreview(!showCodePreview)} className="w-full py-2 bg-slate-800/50 border border-slate-800 rounded-lg text-xs font-bold text-blue-400 hover:text-white transition-colors">
                 {showCodePreview ? 'Close MySQL Panel' : 'View MySQL Code'}
              </button>
           </section>
        </div>
      </aside>

      <main className="flex-1 relative flex">
        <div className={`flex-1 transition-all ${showCodePreview || selectedNodeId ? 'w-1/2' : 'w-full'}`}>
          <ReactFlow
            nodes={nodes} edges={edges} onNodesChange={handleNodesChangeWithHistory} onEdgesChange={onEdgesChange}
            onConnect={onConnect} nodeTypes={nodeTypes} onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)} fitView
          >
            <Background color="#1e293b" />
            <Controls />
          </ReactFlow>
        </div>

        {(showCodePreview || selectedNodeId) && (
          <Sidebar 
            mode={selectedNodeId ? 'inspect' : 'code'}
            selectedEntity={selectedEntity}
            relationships={edges.filter(e => e.source === selectedNodeId || e.target === selectedNodeId)}
            code={mysqlCode}
            onClose={() => { setSelectedNodeId(null); setShowCodePreview(false); }}
            onUpdateEntity={handleUpdateEntity}
            currentUser={user.email}
          />
        )}
      </main>
    </div>
  );
};

export default CollaborativeCanvas;