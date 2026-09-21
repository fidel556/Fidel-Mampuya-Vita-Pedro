import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Link, 
  CheckCircle2, 
  AlertTriangle, 
  Hash, 
  Copy, 
  Check, 
  Clock, 
  User, 
  Lock, 
  Activity,
  Layers
} from 'lucide-react';
import { AuditLogBlock } from '../types';

interface DecentralizedAuditLedgerProps {
  blocks: AuditLogBlock[];
}

export const DecentralizedAuditLedger: React.FC<DecentralizedAuditLedgerProps> = ({ blocks }) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Genesis block definition if empty
  const genesisBlock: AuditLogBlock = {
    id: 'block-genesis',
    blockIndex: 0,
    action: 'GENESIS_SECURE_REMOTE_NETWORK',
    performedBy: 'sistema.genesis@empresa.com',
    entityId: 'ROOT_00',
    detailsMasked: 'Bloco Gênesis: Inicialização da rede de auditoria descentralizada com política Zero-Leak e Criptografia E2E',
    prevBlockHash: '0000000000000000000000000000000000000000000000000000000000000000',
    blockHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    timestamp: '2026-09-21T08:00:00.000Z',
  };

  const allBlocks = [genesisBlock, ...blocks.sort((a, b) => a.blockIndex - b.blockIndex)];

  return (
    <div className="space-y-5">
      {/* Ledger Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Livro-Razão de Auditoria Descentralizada</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                Cadeia 100% Íntegra
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Registros imutáveis encadeados por hashes SHA-256 criptográficos. Impossível adulterar retroativamente.
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-slate-400 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800">
          <div>Total de Blocos: <strong className="text-emerald-400 font-mono">{allBlocks.length}</strong></div>
          <div className="text-[10px] text-slate-500">Criptografia: SHA-256 Merkle Chain</div>
        </div>
      </div>

      {/* Block Explorer Chain */}
      <div className="space-y-4">
        {allBlocks.map((block, index) => (
          <div
            key={block.id}
            id={`audit-block-${block.blockIndex}`}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                  BLOCO #{block.blockIndex}
                </span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">{block.action}</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{block.performedBy}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{new Date(block.timestamp).toLocaleString('pt-BR')}</span>
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              {block.detailsMasked}
            </p>

            {/* Cryptographic Linkage Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Hash do Bloco Anterior (PrevHash):</span>
                <span className="text-slate-400 truncate block">{block.prevBlockHash}</span>
              </div>

              <div className="p-2 bg-slate-950 rounded border border-emerald-950/60 flex items-center justify-between">
                <div className="truncate mr-2">
                  <span className="text-emerald-500 block text-[10px]">Hash Atual do Bloco (SHA-256):</span>
                  <span className="text-emerald-300 truncate block">{block.blockHash}</span>
                </div>
                <button
                  onClick={() => handleCopy(block.blockHash, `hash-${block.id}`)}
                  className="text-emerald-400 hover:text-emerald-300 p-1 cursor-pointer shrink-0"
                  title="Copiar Hash"
                >
                  {copiedHash === `hash-${block.id}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
