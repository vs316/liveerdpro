import React, { useState, useEffect } from 'react';
import { ERDEntity, AttributeType } from '../types';

interface SidebarProps {
  mode: 'inspect' | 'code';
  selectedEntity?: ERDEntity;
  selectedEdge?: any;
  relationships?: any[];
  code?: string;
  onClose: () => void;
  onUpdateEntity: (id: string, updates: Partial<ERDEntity>) => void;
  onUpdateEdge?: (id: string, updates: any) => void;
  onDeleteEdge?: (id: string) => void;
  currentUser?: string;
}

const TYPES: AttributeType[] = ['INT', 'VARCHAR', 'BOOLEAN', 'TIMESTAMP', 'UUID', 'TEXT', 'DECIMAL', 'JSON', 'BIGINT', 'DATETIME'];

const Sidebar: React.FC<SidebarProps> = ({ 
  mode, 
  selectedEntity, 
  selectedEdge,
  relationships, 
  code, 
  onClose, 
  onUpdateEntity, 
  onUpdateEdge,
  onDeleteEdge,
  currentUser 
}) => {
  const [tab, setTab] = useState<'details' | 'relations' | 'comments'>('details');
  const [newComment, setNewComment] = useState('');
  const [localDescription, setLocalDescription] = useState('');

  // Sync local description
  useEffect(() => {
    if (selectedEntity) {
      setLocalDescription(selectedEntity.description || '');
    }
  }, [selectedEntity?.id, selectedEntity?.description]);

  const handleDescriptionBlur = () => {
    if (selectedEntity && localDescription !== selectedEntity.description) {
      onUpdateEntity(selectedEntity.id, { description: localDescription });
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedEntity) {
        onUpdateEntity(selectedEntity.id, { name: e.target.value });
    }
  };

  const updateAttribute = (attrId: string, updates: any) => {
    if (!selectedEntity) return;
    const newAttrs = selectedEntity.attributes.map(a => a.id === attrId ? { ...a, ...updates } : a);
    onUpdateEntity(selectedEntity.id, { attributes: newAttrs });
  };

  const addAttribute = () => {
    if (!selectedEntity) return;
    const newAttr = { 
      id: `attr_${Date.now()}`, 
      name: 'new_column', 
      type: 'VARCHAR' as AttributeType, 
      isPrimary: false, 
      isForeignKey: false,
      isNullable: true 
    };
    onUpdateEntity(selectedEntity.id, { attributes: [...selectedEntity.attributes, newAttr] });
  };

  const removeAttribute = (attrId: string) => {
    if (!selectedEntity) return;
    onUpdateEntity(selectedEntity.id, { attributes: selectedEntity.attributes.filter(a => a.id !== attrId) });
  };

  const handlePostComment = () => {
    if (!newComment.trim() || !selectedEntity) return;
    
    const comment = {
      id: `c_${Date.now()}`,
      author: currentUser || 'Anonymous',
      text: newComment,
      timestamp: Date.now()
    };

    const updatedComments = [...(selectedEntity.comments || []), comment];
    onUpdateEntity(selectedEntity.id, { comments: updatedComments });
    setNewComment('');
  };

  // Render Edge Editor if an edge is selected
  if (selectedEdge && !selectedEntity && mode !== 'code') {
    return (
      <div className="w-[450px] bg-[#080c14] border-l border-slate-800 flex flex-col animate-fade-in shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-50">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0f172a]/50">
          <h2 className="text-[10px] font-black uppercase tracking-[3px] text-slate-500">
            Relationship
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Label</label>
            <input
              type="text"
              value={selectedEdge.label || ''}
              onChange={(e) => onUpdateEdge?.(selectedEdge.id, { label: e.target.value })}
              placeholder="e.g. has many, belongs to"
              className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-slate-600 text-white"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Type (Line Style)</label>
            <select
                value={selectedEdge.type || 'smoothstep'}
                onChange={(e) => onUpdateEdge?.(selectedEdge.id, { type: e.target.value })}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
                <option value="smoothstep">Step (Orthogonal)</option>
                <option value="default">Bezier (Curved)</option>
                <option value="straight">Straight</option>
            </select>
          </div>
          <div className="pt-4 border-t border-slate-800">
             <button 
                onClick={() => onDeleteEdge?.(selectedEdge.id)}
                className="w-full py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg text-xs font-bold transition-all border border-red-500/20"
             >
                Delete Relationship
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[450px] bg-[#080c14] border-l border-slate-800 flex flex-col animate-fade-in shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-50">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0f172a]/50">
        <h2 className="text-[10px] font-black uppercase tracking-[3px] text-slate-500">
          {mode === 'code' ? 'MySQL Live Synchronizer' : 'Table Properties'}
        </h2>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      {mode === 'code' ? (
        <pre className="flex-1 p-6 overflow-auto text-[13px] text-blue-400/80 font-mono leading-relaxed bg-[#0b0f1a] selection:bg-blue-500/20">
          {code}
        </pre>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-800 bg-[#0f172a]/30">
            {['details', 'relations', 'comments'].map((t) => (
              <button 
                key={t} onClick={() => setTab(t as any)}
                className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-widest transition-all ${tab === t ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-400' : 'text-slate-600 hover:text-slate-300'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {tab === 'details' && selectedEntity && (
              <div className="space-y-6">
                <div>
                   <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Table Name</label>
                   <input
                        type="text"
                        value={selectedEntity.name}
                        onChange={handleNameChange}
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-slate-600 text-white"
                   />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Description</label>
                  <textarea 
                    className="w-full h-24 bg-[#1e293b]/50 rounded-xl p-3 text-xs text-slate-300 focus:outline-none border border-slate-800 focus:border-blue-500/50 transition-colors placeholder:text-slate-600HX resize-none"
                    placeholder="Describe the purpose of this table..."
                    value={localDescription}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    onBlur={handleDescriptionBlur}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                     <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Columns</label>
                     <button onClick={addAttribute} className="text-[10px] text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500 px-2 py-1 rounded transition-all font-bold">+ Add Column</button>
                  </div>
                  <div className="space-y-2">
                    {selectedEntity.attributes.map(attr => (
                      <div key={attr.id} className="p-3 bg-white/[0.02] border border-slate-800 rounded-lg group hover:border-slate-700 transition-colors relative">
                        <button 
                            onClick={() => removeAttribute(attr.id)}
                            className="absolute -right-2 -top-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                            title="Remove Column"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={attr.name}
                                onChange={(e) => updateAttribute(attr.id, { name: e.target.value })}
                                className="flex-1 bg-transparent border-none p-0 text-xs font-bold focus:outline-none focus:ring-0 text-slate-200 placeholder:text-slate-600"
                                placeholder="Column Name"
                            />
                            <select
                                value={attr.type}
                                onChange={(e) => updateAttribute(attr.id, { type: e.target.value })}
                                className="bg-[#0f172a] border border-slate-700 text-[9px] rounded px-1.5 py-0.5 text-blue-400 font-mono focus:border-blue-500 focus:outline-none"
                            >
                                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-4 flex-wrap">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={attr.isPrimary}
                                    onChange={(e) => updateAttribute(attr.id, { isPrimary: e.target.checked })}
                                    className="w-3 h-3 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                                />
                                <span className={`text-[9px] font-bold ${attr.isPrimary ? 'text-amber-400' : 'text-slate-500'}`}>PK</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={attr.isForeignKey}
                                    onChange={(e) => updateAttribute(attr.id, { isForeignKey: e.target.checked })}
                                    className="w-3 h-3 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                                />
                                <span className={`text-[9px] font-bold ${attr.isForeignKey ? 'text-pink-400' : 'text-slate-500'}`}>FK</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={attr.isNullable}
                                    onChange={(e) => updateAttribute(attr.id, { isNullable: e.target.checked })}
                                    className="w-3 h-3 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                                />
                                <span className="text-[9px] font-bold text-slate-500">Nullable</span>
                            </label>
                             <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={attr.autoIncrement}
                                    onChange={(e) => updateAttribute(attr.id, { autoIncrement: e.target.checked })}
                                    className="w-3 h-3 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                                />
                                <span className="text-[9px] font-bold text-slate-500">AI</span>
                            </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'relations' && selectedEntity && (
              <div className="space-y-4">
                {relationships?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No direct relationships found.</p>
                ) : (
                  relationships?.map(r => (
                    <div key={r.id} className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center gap-4">
                      <div className="bg-blue-600/20 p-2 rounded-lg"><svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg></div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{r.label || 'Connected'}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Target: {r.target}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'comments' && selectedEntity && (
              <div className="flex flex-col h-full">
                <div className="flex-1 space-y-4 overflow-y-auto mb-4 min-h-[100px]">
                  {(selectedEntity?.comments || []).length === 0 && (
                    <p className="text-xs text-slate-500 italic text-center py-4">No comments yet. Start the discussion.</p>
                  )}
                  {(selectedEntity?.comments || []).map(c => (
                    <div key={c.id} className="space-y-1 animate-fade-in">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-blue-400">{c.author}</span>
                        <span className="text-[9px] text-slate-600">{new Date(c.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-slate-300 bg-white/5 p-3 rounded-lg border border-slate-800/50">{c.text}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-800 mt-auto">
                  <textarea 
                    className="w-full h-20 bg-[#1e293b] border border-slate-700 rounded-lg p-3 text-xs mb-2 focus:outline-none focus:border-blue-500 text-slate-200 resize-none"
                    placeholder="Type a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
                  />
                  <button 
                    onClick={handlePostComment}
                    disabled={!newComment.trim()}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;