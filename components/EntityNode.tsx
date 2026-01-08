import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ERDAttribute } from '../types';

const EntityNode = ({ data, selected }: NodeProps) => {
  const { name, attributes } = data;

  return (
    <div className={`min-w-[260px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden border transition-all duration-500 bg-[#0f172a] ${selected ? 'border-blue-500 ring-4 ring-blue-500/10 scale-[1.03]' : 'border-slate-800 hover:border-slate-700'}`}>
      {/* Table Header */}
      <div className="bg-[#1e293b]/80 px-4 py-3.5 flex items-center justify-between border-b border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]"></div>
          <h3 className="font-bold text-slate-100 text-xs tracking-[0.05em] uppercase truncate">{name}</h3>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
        </div>
      </div>

      {/* Attributes List */}
      <div className="bg-slate-900/60 p-1">
        <table className="w-full text-left text-[11px] border-separate border-spacing-y-0.5">
          <tbody>
            {attributes.map((attr: ERDAttribute, idx: number) => (
              <tr key={attr.id} className="group transition-colors">
                <td className="pl-3 py-2 w-8 align-middle">
                  {attr.isPrimary ? (
                    <span className="text-amber-400 font-black text-[9px] drop-shadow-[0_0_5px_rgba(251,191,36,0.3)]" title="Primary Key">PK</span>
                  ) : attr.name.toLowerCase().endsWith('_id') ? (
                    <span className="text-blue-400 font-bold text-[9px]" title="Foreign Key">FK</span>
                  ) : (
                    <span className="text-slate-700 opacity-40">•</span>
                  )}
                </td>
                <td className="px-2 py-2 font-semibold text-slate-300 group-hover:text-white transition-colors truncate">
                  {attr.name}
                </td>
                <td className="pr-3 py-2 text-slate-500 text-[9px] uppercase font-mono text-right font-medium tracking-tight">
                  {attr.type}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-blue-500 !border-2 !border-slate-900" id="t" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-blue-500 !border-2 !border-slate-900" id="b" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-blue-500 !border-2 !border-slate-900" id="l" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-blue-500 !border-2 !border-slate-900" id="r" />
    </div>
  );
};

export default memo(EntityNode);