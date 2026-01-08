import React, { useState, useCallback, useMemo } from 'react';
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
  Panel,
  ReactFlowProvider,
  Node,
  ConnectionMode
} from 'reactflow';

import EntityNode from './components/EntityNode';
import PropertyEditor from './components/PropertyEditor';
import { generateERDFromPrompt } from './geminiService';
import { ERDEntity } from './types';

const nodeTypes = {
  entity: EntityNode,
};

const initialNodes: Node[] = [
  {
    id: 'user',
    type: 'entity',
    data: { 
      id: 'user',
      name: 'Users', 
      attributes: [
        { id: '1', name: 'id', type: 'UUID', isPrimary: true, isNullable: false },
        { id: '2', name: 'email', type: 'VARCHAR', isPrimary: false, isNullable: false },
        { id: '3', name: 'created_at', type: 'TIMESTAMP', isPrimary: false, isNullable: false },
      ]
    },
    position: { x: 100, y: 100 },
  },
  {
    id: 'post',
    type: 'entity',
    data: { 
      id: 'post',
      name: 'Posts', 
      attributes: [
        { id: '1', name: 'id', type: 'UUID', isPrimary: true, isNullable: false },
        { id: '2', name: 'user_id', type: 'UUID', isPrimary: false, isNullable: false },
        { id: '3', name: 'title', type: 'VARCHAR', isPrimary: false, isNullable: false },
      ]
    },
    position: { x: 500, y: 150 },
  },
];

const initialEdges: Edge[] = [
  { 
    id: 'e-user-post', 
    source: 'user', 
    target: 'post', 
    label: '1:N',
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
  },
];

const AppContent = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);

  const selectedEntity = useMemo(() => {
    const node = nodes.find(n => n.id === selectedNodeId);
    return node ? (node.data as ERDEntity) : null;
  }, [nodes, selectedNodeId]);

  const liveSql = useMemo(() => {
    return nodes.map(n => {
      const d = n.data as ERDEntity;
      const cols = d.attributes.map(a => `  ${a.name} ${a.type}${a.isPrimary ? ' PRIMARY KEY' : ''}${!a.isNullable ? ' NOT NULL' : ''}`).join(',\n');
      return `CREATE TABLE ${d.name.toLowerCase()} (\n${cols}\n);`;
    }).join('\n\n');
  }, [nodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ 
        ...params, 
        label: '1:N', 
        animated: true, 
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
      }, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handleUpdateEntity = useCallback((id: string, updates: Partial<ERDEntity>) => {
    setNodes(nds => nds.map(n => {
      if (n.id === id) {
        return { ...n, data: { ...n.data, ...updates } };
      }
      return n;
    }));
  }, [setNodes]);

  const handleGenerateAI = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setSelectedNodeId(null);
    try {
      const result = await generateERDFromPrompt(prompt);
      const newNodes = result.entities.map((ent: any, idx: number) => ({
        id: ent.id || `ent-${idx}`,
        type: 'entity',
        data: { ...ent, id: ent.id || `ent-${idx}` },
        position: { x: 100 + (idx * 300), y: 100 + (idx % 2 * 150) },
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
      setPrompt('');
    } catch (err) {
      console.error(err);
      alert("AI Generation failed. Check prompt quality.");
    } finally {
      setIsGenerating(false);
    }
  };

  const addNewEntity = () => {
    const id = `entity_${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'entity',
      data: { 
        id,
        name: 'NewTable', 
        attributes: [{ id: '1', name: 'id', type: 'UUID', isPrimary: true, isNullable: false }] 
      },
      position: { x: 250, y: 250 },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(id);
  };

  const exportData = (format: 'sql' | 'prisma' | 'mermaid') => {
    let content = '';
    let fileName = `schema.${format === 'mermaid' ? 'mmd' : format}`;

    if (format === 'sql') content = liveSql;
    else if (format === 'prisma') {
      content = "// Generated by LiveERD Pro\n\n" + nodes.map(n => {
        const d = n.data as ERDEntity;
        const fields = d.attributes.map(a => `  ${a.name} ${a.type === 'VARCHAR' ? 'String' : a.type === 'UUID' ? 'String @id @default(uuid())' : a.type === 'INT' ? 'Int' : a.type === 'BOOLEAN' ? 'Boolean' : 'String'}${!a.isPrimary && a.isNullable ? '?' : ''}`).join('\n');
        return `model ${d.name} {\n${fields}\n}`;
      }).join('\n\n');
    } else if (format === 'mermaid') {
      content = "erDiagram\n" + nodes.map(n => {
        const d = n.data as ERDEntity;
        const attrs = d.attributes.map(a => `    ${a.type} ${a.name} ${a.isPrimary ? 'PK' : ''}`).join('\n');
        return `  ${d.name} {\n${attrs}\n  }`;
      }).join('\n');
      content += '\n' + edges.map(e => `  ${nodes.find(n => n.id === e.source)?.data.name} ||--o{ ${nodes.find(n => n.id === e.target)?.data.name} : "${e.label}"`).join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    setShowExportMenu(false);
  };

  return (
    <div className="flex h-screen w-screen bg-[#0b0f1a] overflow-hidden text-slate-100">
      <aside className="w-80 bg-[#0f172a] border-r border-slate-800 flex flex-col z-30 shadow-2xl relative overflow-hidden">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 bg-[#141b2d]">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <h1 className="text-lg font-bold tracking-tight">LiveERD Pro</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8">
          <section className="space-y-4">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Architect</h2>
            <div className="bg-[#1e293b]/50 rounded-xl p-4 border border-slate-800 space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your system (e.g. 'An e-commerce app')..."
                className="w-full h-28 bg-transparent text-sm text-slate-200 resize-none focus:outline-none placeholder:text-slate-600 leading-relaxed"
              />
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating || !prompt}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-blue-900/10"
              >
                {isGenerating ? "Weaving..." : "Generate Schema"}
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Workspace</h2>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={addNewEntity} className="flex items-center justify-between w-full px-4 py-3 bg-slate-800/40 hover:bg-slate-700 rounded-xl text-sm transition-all border border-slate-800">
                <span className="flex items-center gap-3">New Table</span>
                <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">T</kbd>
              </button>
              <button onClick={() => setShowCodePreview(!showCodePreview)} className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm transition-all border ${showCodePreview ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-slate-800/40 border-slate-800'}`}>
                Code Preview
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center justify-between w-full px-4 py-3 bg-slate-800/40 hover:bg-slate-700 rounded-xl text-sm transition-all border border-slate-800"
                >
                  Export Project
                </button>
                {showExportMenu && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-50">
                    <button onClick={() => exportData('sql')} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 rounded-lg">SQL (Postgres)</button>
                    <button onClick={() => exportData('prisma')} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 rounded-lg">Prisma Schema</button>
                    <button onClick={() => exportData('mermaid')} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 rounded-lg">Mermaid</button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-[#0b0f1a]">
        <header className="h-14 bg-[#0f172a]/90 backdrop-blur-lg border-b border-slate-800 flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
             <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Session
             </span>
             <span>|</span>
             <span>Project Weaver Alpha</span>
          </div>
          <button className="text-[11px] font-bold text-blue-400 bg-blue-400/10 px-4 py-1.5 rounded-full hover:bg-blue-400/20 transition-all border border-blue-400/20">
            Share Project
          </button>
        </header>

        <div className="flex-1 relative flex">
          <div className={`flex-1 relative transition-all duration-300 ${showCodePreview ? 'w-1/2' : 'w-full'}`}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onNodeClick={onNodeClick}
              onPaneClick={() => setSelectedNodeId(null)}
              fitView
              snapToGrid
              snapGrid={[10, 10]}
              connectionMode={ConnectionMode.Loose}
              defaultEdgeOptions={{ 
                type: 'smoothstep', 
                style: { stroke: '#3b82f6', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
              }}
            >
              <Background color="#1e293b" gap={20} size={1} />
              <Controls className="!bg-[#0f172a] !border-slate-800 !shadow-2xl" />
              <MiniMap 
                style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} 
                nodeColor="#3b82f6"
              />
            </ReactFlow>
          </div>

          {showCodePreview && (
            <div className="w-1/2 bg-[#080c14] border-l border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
               <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live SQL Preview</span>
                  <button onClick={() => setShowCodePreview(false)} className="text-slate-500 hover:text-white">&times;</button>
               </div>
               <pre className="flex-1 p-6 overflow-auto text-[13px] text-blue-400/90 font-mono leading-relaxed bg-[#0b0f1a]">
                 {liveSql}
               </pre>
            </div>
          )}
          
          {selectedNodeId && (
            <div className="absolute top-0 right-0 h-full z-40">
              <PropertyEditor 
                entity={selectedEntity} 
                onUpdate={handleUpdateEntity} 
                onClose={() => setSelectedNodeId(null)}
              />
            </div>
          )}
        </div>

        <footer className="h-8 bg-[#0f172a] border-t border-slate-800 flex items-center justify-between px-6 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
           <div className="flex gap-6">
              <span>Nodes: {nodes.length}</span>
              <span>Edges: {edges.length}</span>
           </div>
           <span>v2.4.0 • Live Weaver</span>
        </footer>
      </main>
    </div>
  );
};

const App = () => (
  <ReactFlowProvider>
    <AppContent />
  </ReactFlowProvider>
);

export default App;