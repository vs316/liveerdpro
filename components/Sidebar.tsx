import React, { useState, useEffect } from 'react';
import { ERDEntity } from '../types';

interface SidebarProps {
  mode: 'inspect' | 'code';
  selectedEntity?: ERDEntity;
  relationships?: any[];
  code?: string;
  onClose: () => void;
  onUpdateEntity: (id: string, updates: Partial<ERDEntity>) => void;
  currentUser?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ mode, selectedEntity, relationships, code, onClose, onUpdateEntity, currentUser }) => {
  const [tab, setTab] = useState<'details' | 'relations' | 'comments'>('details');
  const [newComment, setNewComment] = useState('');
  const [localDescription, setLocalDescription] = useState('');

  // Sync local description with entity when selection changes
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

  return (
    <div className="w-[450px] bg-[#080c14] border-l border-slate-800 flex flex-col animate-fade-in shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-50">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0f172a]/50">
        <h2 className="text-[10px] font-black uppercase tracking-[3px] text-slate-500">
          {mode === 'code' ? 'MySQL Live Synchronizer' : `Inspecting: ${selectedEntity?.name}`}
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
            {tab === 'details' && (
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Description</label>
                  <textarea 
                    className="w-full h-32 bg-[#1e293b]/50 rounded-xl p-3 text-xs text-slate-300 focus:outline-none border border-slate-800 focus:border-blue-500/50 transition-colors placeholder:text-slate-600"
                    placeholder="Describe the purpose of this table..."
                    value={localDescription}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    onBlur={handleDescriptionBlur}
                  />
                  <p className="text-[9px] text-slate-500 mt-1 text-right italic">Saved on blur</p>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Columns</label>
                  <div className="space-y-2">
                    {selectedEntity?.attributes.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-slate-800 rounded-lg">
                        <span className="text-xs font-bold text-slate-200">{a.name}</span>
                        <span className="text-[9px] font-mono text-slate-500">{a.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'relations' && (
              <div className="space-y-4">
                {relationships?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No direct relationships found.</p>
                ) : (
                  relationships?.map(r => (
                    <div key={r.id} className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center gap-4">
                      <div className="bg-blue-600/20 p-2 rounded-lg"><svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg></div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{r.label || 'Connected'}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Relation ID: {r.id}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'comments' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 space-y-4 overflow-y-auto mb-4 min-h-[100px]">
                  {(selectedEntity?.comments || []).length === 0 && (
                    <p className="text-xs text-slate-500 italic text-center py-4">No comments yet.</p>
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