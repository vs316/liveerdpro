import React from 'react';
import { ERDEntity, AttributeType } from '../types';

interface PropertyEditorProps {
  entity: ERDEntity | null;
  onUpdate: (id: string, updates: Partial<ERDEntity>) => void;
  onClose: () => void;
}

const TYPES: AttributeType[] = ['INT', 'VARCHAR', 'BOOLEAN', 'TIMESTAMP', 'UUID', 'TEXT', 'DECIMAL', 'JSON'];

const PropertyEditor: React.FC<PropertyEditorProps> = ({ entity, onUpdate, onClose }) => {
  if (!entity) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(entity.id, { name: e.target.value });
  };

  const updateAttribute = (attrId: string, updates: any) => {
    const newAttrs = entity.attributes.map(a => a.id === attrId ? { ...a, ...updates } : a);
    onUpdate(entity.id, { attributes: newAttrs });
  };

  const addAttribute = () => {
    const newAttr = { 
      id: `attr_${Date.now()}`, 
      name: 'new_column', 
      type: 'VARCHAR' as AttributeType, 
      isPrimary: false, 
      isNullable: true 
    };
    onUpdate(entity.id, { attributes: [...entity.attributes, newAttr] });
  };

  const removeAttribute = (attrId: string) => {
    onUpdate(entity.id, { attributes: entity.attributes.filter(a => a.id !== attrId) });
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a]/95 backdrop-blur-xl border border-slate-800 w-80 shadow-[0_30px_60px_rgba(0,0,0,0.8)] rounded-2xl animate-fade-in overflow-hidden">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
             <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </div>
          <h2 className="font-bold text-slate-100 text-sm tracking-tight">Configure Table</h2>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px]">Identifier</label>
          <input
            type="text"
            value={entity.name}
            onChange={handleNameChange}
            placeholder="Table Name"
            className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-slate-600 text-white"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px]">Properties</label>
            <button 
              onClick={addAttribute} 
              className="text-[10px] px-3 py-1 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 rounded-full font-bold uppercase tracking-wider transition-all border border-blue-500/20"
            >
              + Add Property
            </button>
          </div>
          
          <div className="space-y-3">
            {entity.attributes.map((attr) => (
              <div key={attr.id} className="p-4 bg-white/[0.02] rounded-xl border border-slate-800/50 space-y-3 relative group hover:border-slate-700/50 transition-all">
                <button 
                  onClick={() => removeAttribute(attr.id)}
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                >
                   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
                
                <input
                  type="text"
                  value={attr.name}
                  onChange={(e) => updateAttribute(attr.id, { name: e.target.value })}
                  className="w-full bg-transparent border-none p-0 text-xs font-bold focus:outline-none focus:ring-0 text-slate-200"
                />
                
                <div className="flex gap-3 items-center">
                  <select
                    value={attr.type}
                    onChange={(e) => updateAttribute(attr.id, { type: e.target.value })}
                    className="flex-1 bg-[#0f172a] border border-slate-700 text-[10px] rounded-lg px-2 py-1.5 text-slate-400 font-mono focus:border-blue-500/50 focus:outline-none"
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer group/label">
                      <input
                        type="checkbox"
                        checked={attr.isPrimary}
                        onChange={(e) => updateAttribute(attr.id, { isPrimary: e.target.checked })}
                        className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500/30"
                      />
                      <span className="text-[10px] text-slate-500 font-bold group-hover/label:text-amber-400 transition-colors">PK</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group/label">
                      <input
                        type="checkbox"
                        checked={attr.isNullable}
                        onChange={(e) => updateAttribute(attr.id, { isNullable: e.target.checked })}
                        className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500/30"
                      />
                      <span className="text-[10px] text-slate-500 font-bold group-hover/label:text-slate-300 transition-colors">NULL</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-5 bg-slate-900/40 border-t border-slate-800">
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
          <p className="text-[9px] text-slate-500 italic leading-relaxed">
            Changes are propagated to all connected team members in real-time. Code previews update instantly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PropertyEditor;