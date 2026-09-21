import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  ShieldCheck, 
  Key, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Lock, 
  FileCode, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Plus
} from 'lucide-react';
import { AccessQuote, QuoteStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { EmailNotificationModal } from './EmailNotificationModal';
import { decryptPayloadE2E } from '../crypto';

interface QuoteHistoryProps {
  quotes: AccessQuote[];
  onOpenNewQuoteModal: () => void;
}

export const QuoteHistory: React.FC<QuoteHistoryProps> = ({ quotes, onOpenNewQuoteModal }) => {
  const { currentUser, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [decryptedPayloads, setDecryptedPayloads] = useState<Record<string, string>>({});
  const [selectedQuoteForEmail, setSelectedQuoteForEmail] = useState<AccessQuote | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Filter based on role (admins see all, normal users see their own)
  const userFiltered = isAdmin
    ? quotes
    : quotes.filter((q) => q.userId === currentUser?.uid || q.userEmail === currentUser?.email);

  const filteredQuotes = userFiltered.filter((quote) => {
    const matchesSearch =
      quote.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.accessType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleExpand = async (quote: AccessQuote) => {
    if (expandedQuoteId === quote.id) {
      setExpandedQuoteId(null);
    } else {
      setExpandedQuoteId(quote.id);
      if (!decryptedPayloads[quote.id] && quote.encryptedPayload) {
        const decrypted = await decryptPayloadE2E(quote.encryptedPayload);
        setDecryptedPayloads((prev) => ({ ...prev, [quote.id]: decrypted }));
      }
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aprovado
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pendente
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Rejeitado
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Ativo
          </span>
        );
      case 'REVOKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Revogado
          </span>
        );
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <span>Histórico de Cotações & Solicitações de Acesso</span>
          </h2>
          <p className="text-xs text-slate-400">
            Registros criptografados ponta a ponta com verificação de integridade e comprovante de privacidade.
          </p>
        </div>

        <button
          id="btn-new-quote-from-history"
          onClick={onOpenNewQuoteModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Cotação</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            id="input-search-quotes"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por projeto, solicitante, protocolo (RDP, SSH, VPN)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            id="select-filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">Todos os Status ({userFiltered.length})</option>
            <option value="PENDING">Pendentes</option>
            <option value="APPROVED">Aprovados</option>
            <option value="ACTIVE">Ativos</option>
            <option value="REJECTED">Rejeitados</option>
            <option value="REVOKED">Revogados</option>
          </select>
        </div>
      </div>

      {/* Quotes List Table / Cards */}
      {filteredQuotes.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <Database className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-slate-300">Nenhuma solicitação encontrada</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Crie sua primeira cotação de pessoas para acesso remoto e acompanhe o fluxo de aprovação e auditoria.
          </p>
          <button
            onClick={onOpenNewQuoteModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-md"
          >
            Fazer Cotação Agora
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuotes.map((quote) => {
            const isExpanded = expandedQuoteId === quote.id;
            return (
              <div
                key={quote.id}
                id={`quote-item-${quote.id}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition-all shadow-sm"
              >
                {/* Main Card Row */}
                <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">{quote.projectTitle}</span>
                      {getStatusBadge(quote.status)}
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        {quote.accessType}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {quote.securityTier}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span>
                        Pessoas: <strong className="text-emerald-400">{quote.peopleCount}</strong>
                      </span>
                      <span>•</span>
                      <span>Duração: {quote.durationDays} dias</span>
                      <span>•</span>
                      <span>
                        Valor: <strong className="text-slate-200 font-mono">${quote.totalCost.toFixed(2)} USD</strong>
                      </span>
                      <span>•</span>
                      <span>Data: {new Date(quote.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* Right side actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {quote.status === 'APPROVED' && (
                      <button
                        id={`btn-view-credentials-${quote.id}`}
                        onClick={() => setSelectedQuoteForEmail(quote)}
                        className="px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Ver Credenciais</span>
                      </button>
                    )}

                    <button
                      id={`btn-toggle-crypto-details-${quote.id}`}
                      onClick={() => toggleExpand(quote)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isExpanded ? 'Ocultar E2E' : 'Inspecionar E2E'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Cryptographic Inspection Area */}
                {isExpanded && (
                  <div className="bg-slate-950 p-4 border-t border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                        <FileCode className="w-4 h-4" />
                        <span>Inspeção Criptográfica de Ponta a Ponta (Zero-Knowledge)</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Algoritmo: AES-GCM 256-bit + SHA-256</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Assinatura Digital SHA-256:</span>
                          <button
                            onClick={() => handleCopy(quote.hashSignature, `hash-${quote.id}`)}
                            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[10px] cursor-pointer"
                          >
                            {copiedToken === `hash-${quote.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>Copiar</span>
                          </button>
                        </div>
                        <div className="text-[11px] text-emerald-300 break-all bg-slate-950 p-2 rounded">
                          {quote.hashSignature || 'Assinatura criptografada gerada'}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Payload Decifrado no Cliente:</span>
                          <span className="text-[10px] text-emerald-400 font-semibold">Garantia Sem Vazamento</span>
                        </div>
                        <div className="text-[11px] text-slate-300 max-h-24 overflow-y-auto bg-slate-950 p-2 rounded whitespace-pre-wrap">
                          {decryptedPayloads[quote.id] || 'Decifrando chave local...'}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Termos de Privacidade cumpridos: As {quote.peopleCount} pessoas são auditadas para controle de simultaneidade, com dados pessoais mantidos isolados e protegidos.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Credentials and Email Modal */}
      <EmailNotificationModal
        quote={selectedQuoteForEmail}
        isOpen={!!selectedQuoteForEmail}
        onClose={() => setSelectedQuoteForEmail(null)}
      />
    </div>
  );
};
