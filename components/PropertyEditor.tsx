
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
    const newAttr = { id: `attr_${Date.now()}`, name: 'new_col', type: 'VARCHAR' as AttributeType, isPrimary: false, isNullable: true };
    onUpdate(entity.id, { attributes: [...entity.attributes, newAttr] });
  };

  const removeAttribute = (attrId: string) => {
    onUpdate(entity.id, { attributes: entity.attributes.filter(a => a.id !== attrId) });
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] border-l border-slate-800 w-80 shadow-2xl animate-in slide-in-from-right duration-200">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="font-bold text-blue-400 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          Edit Table
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Table Name</label>
          <input
            type="text"
            value={entity.name}
            onChange={handleNameChange}
            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Columns</label>
            <button onClick={addAttribute} className="text-xs text-blue-400 hover:text-blue-300 font-medium">+ Add</button>
          </div>
          
          <div className="space-y-3">
            {entity.attributes.map((attr) => (
              <div key={attr.id} className="p-3 bg-[#1e293b] rounded-lg border border-slate-700/50 space-y-2 relative group">
                <button 
                  onClick={() => removeAttribute(attr.id)}
                  className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 p-1 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded transition-all"
                >
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
                <input
                  type="text"
                  value={attr.name}
                  onChange={(e) => updateAttribute(attr.id, { name: e.target.value })}
                  className="w-full bg-transparent border-none p-0 text-sm font-medium focus:outline-none focus:ring-0 text-slate-100"
                />
                <div className="flex gap-2">
                  <select
                    value={attr.type}
                    onChange={(e) => updateAttribute(attr.id, { type: e.target.value })}
                    className="flex-1 bg-[#0f172a] border border-slate-700 text-[10px] rounded px-1 py-1 text-slate-400"
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attr.isPrimary}
                      onChange={(e) => updateAttribute(attr.id, { isPrimary: e.target.checked })}
                      className="w-3 h-3 rounded bg-slate-900 border-slate-700"
                    />
                    <span className="text-[10px] text-slate-500 font-bold">PK</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-slate-900/50 border-t border-slate-800">
        <p className="text-[10px] text-slate-500 italic text-center">Changes are synced in real-time with the team.</p>
      </div>
    </div>
  );
};

export default PropertyEditor;
