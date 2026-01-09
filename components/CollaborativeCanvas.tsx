import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  ConnectionMode,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import EntityNode from './EntityNode';
import Sidebar from './Sidebar';
import Cursor from './Cursor';
import { ERDEntity } from '../types';

const nodeTypes = { entity: EntityNode };

// Inner component to use useReactFlow hook
const CanvasContent = ({ supabase, user, diagramId, onBack }: any) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<{[key: string]: any}>({});
  const [isSaving, setIsSaving] = useState(false);
  
  const { project } = useReactFlow();
  const canvasRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const lastCursorUpdate = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Presence channel and Cursor broadcasting
  useEffect(() => {
    const channel = supabase.channel(`room:${diagramId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users = Object.values(newState).flat();
        setActiveUsers(users);
      })
      .on('broadcast', { event: 'cursor' }, ({ payload }: any) => {
        if (payload.user !== user.email) {
          setRemoteCursors(prev => ({
            ...prev,
            [payload.user]: payload
          }));
        }
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          const color = '#' + Math.floor(Math.random()*16777215).toString(16);
          await channel.track({ 
            user: user.email, 
            color,
            online_at: new Date().toISOString() 
          });
        }
      });
    
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [diagramId, user.email]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastCursorUpdate.current > 30 && channelRef.current) {
      if (canvasRef.current) {
        const bounds = canvasRef.current.getBoundingClientRect();
        const position = project({ x: e.clientX - bounds.left, y: e.clientY - bounds.top });
        
        channelRef.current.send({
          type: 'broadcast',
          event: 'cursor',
          payload: { 
            x: position.x, 
            y: position.y, 
            user: user.email,
            color: '#3b82f6'
          }
        });
        lastCursorUpdate.current = now;
      }
    }
  }, [project, user.email]);

  // Save and History Logic
  const saveDiagram = useCallback(async (newNodes: any, newEdges: any) => {
    setIsSaving(true);
    await supabase
      .from('diagrams')
      .update({ 
        data: { nodes: newNodes, edges: newEdges }, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', diagramId);
    setTimeout(() => setIsSaving(false), 500);
  }, [diagramId]);

  const recordHistory = useCallback((newNodes: any, newEdges: any) => {
    const entry = JSON.stringify({ nodes: newNodes, edges: newEdges });
    const newHistory = [...history.slice(0, historyIndex + 1), entry];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleNodesChangeWithHistory = useCallback((changes: any) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = JSON.parse(history[historyIndex - 1]);
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setHistoryIndex(historyIndex - 1);
      saveDiagram(prev.nodes, prev.edges);
    }
  }, [history, historyIndex, saveDiagram, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = JSON.parse(history[historyIndex + 1]);
      setNodes(next.nodes);
      setEdges(next.edges);
      setHistoryIndex(historyIndex + 1);
      saveDiagram(next.nodes, next.edges);
    }
  }, [history, historyIndex, saveDiagram, setNodes, setEdges]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        redo();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

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

  const handleUpdateEdge = useCallback((id: string, updates: any) => {
    setEdges((eds) => {
        const newEdges = eds.map((e) => {
            if (e.id === id) {
                return { ...e, ...updates };
            }
            return e;
        });
        saveDiagram(nodes, newEdges);
        recordHistory(nodes, newEdges);
        return newEdges;
    });
  }, [nodes, saveDiagram, recordHistory, setEdges]);

  const handleDeleteEdge = useCallback((id: string) => {
    setEdges((eds) => {
        const newEdges = eds.filter(e => e.id !== id);
        saveDiagram(nodes, newEdges);
        recordHistory(nodes, newEdges);
        return newEdges;
    });
    setSelectedEdgeId(null);
  }, [nodes, saveDiagram, recordHistory, setEdges]);

  const addNode = useCallback(() => {
    const id = `node_${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'entity',
      position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
      data: { 
        name: `Table_${Math.floor(Math.random() * 1000)}`, 
        attributes: [
          { 
            id: `attr_${Date.now()}_1`, 
            name: 'id', 
            type: 'UUID', 
            isPrimary: true, 
            isNullable: false,
            isForeignKey: false,
            autoIncrement: false
          }
        ],
        comments: []
      }
    };
    
    setNodes((nds) => {
      const newNodes = [...nds, newNode];
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
      });
      
      // Add indexes for FKs for visibility in SQL
      d.attributes.forEach(a => {
        if (a.isForeignKey) {
            cols.push(`  KEY \`fk_${a.name}\` (\`${a.name}\`)`);
        }
      });

      return `CREATE TABLE \`${d.name.toLowerCase()}\` (\n${cols.join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
    }).join('\n\n');
  }, [nodes]);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => {
      const newEdges = addEdge({ 
        ...params, 
        animated: true, 
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
        type: 'smoothstep', 
        label: '' 
      }, eds);
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

  const importJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const parsedData = JSON.parse(result);
        if (parsedData.nodes && parsedData.edges) {
          setNodes(parsedData.nodes);
          setEdges(parsedData.edges);
          saveDiagram(parsedData.nodes, parsedData.edges);
          recordHistory(parsedData.nodes, parsedData.edges);
        } else {
          alert('Invalid diagram file format. JSON must contain "nodes" and "edges" arrays.');
        }
      } catch (error) {
        console.error('Error importing diagram:', error);
        alert('Failed to parse file. Please ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };

  const exportSql = () => {
    const blob = new Blob([mysqlCode], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema_mysql_${Date.now()}.sql`;
    a.click();
  };

  const selectedEntity = useMemo(() => 
    nodes.find(n => n.id === selectedNodeId)?.data
  , [nodes, selectedNodeId]);

  const selectedEdge = useMemo(() => 
    edges.find(e => e.id === selectedEdgeId)
  , [edges, selectedEdgeId]);

  const getUserColor = (email: string) => {
    const u = activeUsers.find(u => u.user === email);
    return u?.color || '#10b981';
  };

  return (
    <div className="flex h-screen w-screen bg-[#0b0f1a] overflow-hidden text-slate-100 relative">
        {/* Saving Indicator */}
        <div className={`absolute top-4 right-4 z-50 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${isSaving ? 'bg-blue-600 text-white opacity-100 translate-y-0' : 'bg-transparent text-slate-500 opacity-0 -translate-y-2'}`}>
            {isSaving ? 'Saving...' : 'Saved'}
        </div>

      {/* Workspace Sidebar */}
      <aside className="w-80 bg-[#0f172a] border-r border-slate-800 flex flex-col z-30 shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
           <button onClick={onBack} className="text-slate-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg> Dashboard
           </button>
           <div className="flex gap-2">
             <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded-lg transition-colors text-slate-400 hover:text-white" title="Undo (Ctrl+Z)">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l5 5m-5-5l5-5"/></svg>
             </button>
             <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded-lg transition-colors text-slate-400 hover:text-white" title="Redo (Ctrl+Y)">
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
             <div className="flex flex-wrap gap-2">
               {activeUsers.map((u: any, i) => (
                 <div key={i} className="flex items-center gap-2 bg-[#1e293b] px-3 py-1.5 rounded-lg border border-slate-700">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: u.color || '#10b981' }}></div>
                    <span className="text-xs text-slate-300 font-medium truncate max-w-[100px]">{u.user}</span>
                 </div>
               ))}
             </div>
           </section>

           <section className="space-y-4">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Design</h2>
              <button 
                onClick={addNode}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                Add Table
              </button>
           </section>

           <section className="space-y-4">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data Operations</h2>
              
              <button onClick={() => setShowCodePreview(!showCodePreview)} className="w-full py-2 bg-slate-800/50 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors">
                 {showCodePreview ? 'Close Code Panel' : 'View Code Panel'}
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={importJson}
                  accept=".json"
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 bg-slate-800/50 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Import JSON
                </button>
                <button 
                  onClick={exportJson}
                  className="w-full py-2 bg-slate-800/50 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Export JSON
                </button>
              </div>

              <button onClick={exportSql} className="w-full py-2 bg-slate-800/50 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors">
                Download MySQL
              </button>
           </section>
        </div>
      </aside>

      <main className="flex-1 relative flex" ref={canvasRef}>
        <div className={`flex-1 transition-all ${showCodePreview || selectedNodeId || selectedEdgeId ? 'w-1/2' : 'w-full'}`}>
          <ReactFlow
            nodes={nodes} edges={edges} onNodesChange={handleNodesChangeWithHistory} onEdgesChange={onEdgesChange}
            onConnect={onConnect} nodeTypes={nodeTypes} 
            onNodeClick={(_, node) => { setSelectedNodeId(node.id); setSelectedEdgeId(null); }}
            onEdgeClick={(_, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); }}
            onPaneClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); }} 
            fitView
            onMouseMove={handleMouseMove}
            minZoom={0.1} maxZoom={4}
          >
            <Background color="#1e293b" />
            <Controls className="!bg-[#0f172a] !border-slate-800 !shadow-2xl" />
            <MiniMap style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} nodeColor="#3b82f6" />
            
            {/* Render Remote Cursors */}
            {Object.values(remoteCursors).map((c: any) => (
                <Cursor key={c.user} x={c.x} y={c.y} color={getUserColor(c.user)} name={c.user} />
            ))}

          </ReactFlow>
        </div>

        {(showCodePreview || selectedNodeId || selectedEdgeId) && (
          <Sidebar 
            mode={selectedNodeId || selectedEdgeId ? 'inspect' : 'code'}
            selectedEntity={selectedEntity}
            selectedEdge={selectedEdge}
            relationships={edges.filter(e => e.source === selectedNodeId || e.target === selectedNodeId)}
            code={mysqlCode}
            onClose={() => { setSelectedNodeId(null); setSelectedEdgeId(null); setShowCodePreview(false); }}
            onUpdateEntity={handleUpdateEntity}
            onUpdateEdge={handleUpdateEdge}
            onDeleteEdge={handleDeleteEdge}
            currentUser={user.email}
          />
        )}
      </main>
    </div>
  );
};

// Wrapper to provide ReactFlow Context
const CollaborativeCanvas = (props: any) => (
  <ReactFlowProvider>
    <CanvasContent {...props} />
  </ReactFlowProvider>
);

export default CollaborativeCanvas;