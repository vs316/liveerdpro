
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ERDAttribute } from '../types';

const EntityNode = ({ data, selected }: NodeProps) => {
  const { name, attributes } = data;

  return (
    <div className={`min-w-[240px] shadow-2xl rounded-xl overflow-hidden border transition-all duration-300 bg-[#141b2d] ${selected ? 'border-blue-500 ring-4 ring-blue-500/10 scale-[1.02]' : 'border-slate-800 hover:border-slate-700'}`}>
      {/* Header */}
      <div className="bg-[#1e293b]/50 px-4 py-3 flex items-center justify-between border-b border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded shadow-[0_0_8px_#3b82f6] bg-blue-500"></div>
          <h3 className="font-bold text-slate-100 text-sm tracking-tight truncate uppercase">{name}</h3>
        </div>
        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
      </div>

      {/* Attributes List */}
      <div className="p-0 bg-slate-900/40">
        <table className="w-full text-left text-[11px] border-collapse">
          <tbody>
            {attributes.map((attr: ERDAttribute, idx: number) => (
              <tr key={attr.id} className={`group border-b border-slate-800/30 hover:bg-blue-500/5 transition-colors ${idx % 2 === 0 ? 'bg-white/0' : 'bg-white/[0.02]'}`}>
                <td className="px-3 py-2 w-8 text-center align-middle">
                  {attr.isPrimary ? (
                    <span className="text-yellow-500 font-black drop-shadow-[0_0_3px_rgba(234,179,8,0.5)]" title="Primary Key">PK</span>
                  ) : attr.name.toLowerCase().endsWith('_id') ? (
                    <span className="text-blue-400 font-black" title="Foreign Key">FK</span>
                  ) : (
                    <span className="text-slate-700">•</span>
                  )}
                </td>
                <td className="px-2 py-2 font-semibold text-slate-200 group-hover:text-white">
                  {attr.name}
                </td>
                <td className="px-3 py-2 text-slate-500 text-[9px] uppercase font-mono text-right italic">
                  {attr.type}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} id="t" />
      <Handle type="source" position={Position.Bottom} id="b" />
      <Handle type="target" position={Position.Left} id="l" />
      <Handle type="source" position={Position.Right} id="r" />
    </div>
  );
};

export default memo(EntityNode);
