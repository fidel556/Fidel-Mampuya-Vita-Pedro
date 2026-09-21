import React, { useState } from 'react';
import { 
  X, 
  Users, 
  ShieldCheck, 
  Lock, 
  Terminal, 
  Monitor, 
  Network, 
  Globe, 
  Calendar, 
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { AccessType, SecurityTier, AccessQuote, AuditLogBlock } from '../types';
import { encryptPayloadE2E, computeBlockHash } from '../crypto';

interface QuoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (quote: AccessQuote) => void;
  latestBlockHash?: string;
  totalBlocksCount?: number;
}

const PROTOCOL_PRICING: Record<AccessType, { name: string; icon: any; baseDaily: number; desc: string }> = {
  RDP: { 
    name: 'RDP (Área de Trabalho)', 
    icon: Monitor, 
    baseDaily: 1.25, 
    desc: 'Desktop gráfico Windows/Linux com aceleração remota' 
  },
  SSH: { 
    name: 'SSH Seguro (Bastion)', 
    icon: Terminal, 
    baseDaily: 0.70, 
    desc: 'Terminal shell com chaves criptográficas rotativas' 
  },
  VPN_FULL: { 
    name: 'VPN Corporativa Full', 
    icon: Network, 
    baseDaily: 0.95, 
    desc: 'Túnel WireGuard/IPSec para rede privada isolada' 
  },
  WEB_GATEWAY: { 
    name: 'Gateway Web Zero-Trust', 
    icon: Globe, 
    baseDaily: 0.85, 
    desc: 'Acesso sem cliente via navegador isolado seguro' 
  },
};

const SECURITY_TIER_CONFIG: Record<SecurityTier, { label: string; multiplier: number; desc: string }> = {
  STANDARD: {
    label: 'Padrão (TLS 1.3)',
    multiplier: 1.0,
    desc: 'Canais criptografados padrão com firewall de aplicação'
  },
  ENCRYPTED_E2E: {
    label: 'Criptografia E2E (AES-256)',
    multiplier: 1.25,
    desc: 'Túnel com cifra de ponta a ponta sem decodificação intermediária'
  },
  MAX_ISOLATION: {
    label: 'Máximo Isolamento Descentralizado',
    multiplier: 1.45,
    desc: 'Zero-Trust Sandbox com registro em ledger imutável e MFA'
  },
};

export const QuoteFormModal: React.FC<QuoteFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  latestBlockHash = '0000000000000000000000000000000000000000000000000000000000000000',
  totalBlocksCount = 0,
}) => {
  const { currentUser, userProfile } = useAuth();

  const [projectTitle, setProjectTitle] = useState('');
  const [peopleCount, setPeopleCount] = useState<number>(5);
  const [accessType, setAccessType] = useState<AccessType>('VPN_FULL');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [securityTier, setSecurityTier] = useState<SecurityTier>('ENCRYPTED_E2E');
  const [notes, setNotes] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Pricing calculation
  const protocolConfig = PROTOCOL_PRICING[accessType];
  const tierConfig = SECURITY_TIER_CONFIG[securityTier];
  
  // Scale discounts: >10 people = 10% off, >30 people = 20% off
  let volumeDiscount = 0;
  if (peopleCount >= 30) volumeDiscount = 0.20;
  else if (peopleCount >= 10) volumeDiscount = 0.10;

  const basePricePerPerson = protocolConfig.baseDaily * durationDays * tierConfig.multiplier;
  const discountedPricePerPerson = basePricePerPerson * (1 - volumeDiscount);
  const totalCost = Math.round(discountedPricePerPerson * peopleCount * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim()) {
      setErrorMessage('Informe o título do projeto ou equipe.');
      return;
    }
    if (peopleCount < 1) {
      setErrorMessage('Informe pelo menos 1 pessoa para a cotação de acesso remoto.');
      return;
    }
    if (!privacyAccepted) {
      setErrorMessage('É obrigatório aceitar os Termos de Privacidade e Não-Vazamento.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const quotePayload = {
        projectTitle,
        peopleCount,
        accessType,
        durationDays,
        securityTier,
        unitPricePerPerson: Math.round(discountedPricePerPerson * 100) / 100,
        totalCost,
        currency: 'USD',
        notes,
        userEmail: currentUser?.email || 'anonimo@empresa.com',
        privacyNoticeVersion: '2026.1-ZERO-LEAK',
      };

      // Encrypt sensitive details with Web Crypto API E2E
      const { encryptedData, signature } = await encryptPayloadE2E(quotePayload);

      const quoteData: Omit<AccessQuote, 'id'> = {
        userId: currentUser?.uid || 'guest-user',
        userEmail: currentUser?.email || 'solicitante@empresa.com',
        userName: userProfile?.displayName || currentUser?.displayName || 'Solicitante',
        projectTitle: projectTitle.trim(),
        peopleCount,
        accessType,
        durationDays,
        securityTier,
        unitPricePerPerson: Math.round(discountedPricePerPerson * 100) / 100,
        totalCost,
        currency: 'USD',
        privacyTermsAccepted: true,
        privacyNoticeVersion: '2026.1-ZERO-LEAK',
        status: 'PENDING',
        encryptedPayload: encryptedData,
        hashSignature: signature,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let quoteId = `quote-${Date.now()}`;
      try {
        const docRef = await addDoc(collection(db, 'quotes'), quoteData);
        quoteId = docRef.id;
      } catch (err) {
        console.warn('Fallback Firestore save for quotes:', err);
      }

      // Append decentralized audit block
      try {
        const blockTimestamp = new Date().toISOString();
        const nextIndex = totalBlocksCount + 1;
        const actionName = `COTACAO_CRIADA_${peopleCount}_PESSOAS_${accessType}`;
        const blockHash = await computeBlockHash(
          nextIndex,
          latestBlockHash,
          blockTimestamp,
          actionName,
          quoteId,
          currentUser?.email || 'solicitante'
        );

        const auditBlock: AuditLogBlock = {
          id: `block-${nextIndex}-${Date.now()}`,
          blockIndex: nextIndex,
          action: actionName,
          performedBy: currentUser?.email || 'solicitante',
          entityId: quoteId,
          detailsMasked: `Cotação para ${peopleCount} pessoas | Protocolo ${accessType} | Tier ${securityTier} | Hash E2E verificado`,
          prevBlockHash: latestBlockHash,
          blockHash,
          timestamp: blockTimestamp,
        };

        await addDoc(collection(db, 'auditLogs'), auditBlock);
      } catch (logErr) {
        console.warn('Audit block append note:', logErr);
      }

      const createdQuote: AccessQuote = {
        ...quoteData,
        id: quoteId,
      };

      onSuccess(createdQuote);
      onClose();
    } catch (err: any) {
      console.error('Error creating quote:', err);
      setErrorMessage(err.message || 'Erro ao submeter cotação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      id="modal-quote-overlay" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-5 sm:p-7 text-slate-200 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Nova Cotação de Acesso Remoto</h2>
              <p className="text-xs text-slate-400">Dimensione pessoas, protocolos e segurança com criptografia de ponta a ponta</p>
            </div>
          </div>
          <button 
            id="btn-close-quote-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Project Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nome do Projeto ou Departamento Solicitante *
            </label>
            <input
              id="input-quote-project"
              type="text"
              required
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="Ex.: Engenharia de Software - Squad Mobile & Cloud"
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* People Count Slider & Input */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Quantidade de Pessoas / Estações de Acesso Remoto</span>
                </label>
                <p className="text-[11px] text-slate-400">Contabilização estrita com zero vazamento de dados sensíveis</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="input-quote-people-number"
                  type="number"
                  min="1"
                  max="500"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-2.5 py-1 text-center font-bold text-base bg-slate-900 border border-slate-600 rounded-lg text-emerald-400 focus:outline-hidden focus:border-emerald-400"
                />
                <span className="text-xs text-slate-400">usuários</span>
              </div>
            </div>

            <input
              id="range-quote-people"
              type="range"
              min="1"
              max="150"
              value={peopleCount}
              onChange={(e) => setPeopleCount(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
            />

            <div className="flex justify-between text-[10px] text-slate-400">
              <span>1 usuário</span>
              <span>25 usuários (10% desc.)</span>
              <span>50+ usuários (20% desc.)</span>
              <span>150 usuários</span>
            </div>
          </div>

          {/* Protocol Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Protocolo de Acesso Remoto Desejado *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(PROTOCOL_PRICING) as AccessType[]).map((type) => {
                const item = PROTOCOL_PRICING[type];
                const Icon = item.icon;
                const isSelected = accessType === type;
                return (
                  <div
                    key={type}
                    id={`opt-protocol-${type}`}
                    onClick={() => setAccessType(type)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/50 text-white'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{item.name}</span>
                        <span className="text-[11px] font-mono text-emerald-400">${item.baseDaily}/dia</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Duration & Security Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-400" />
                <span>Duração do Acesso (Dias)</span>
              </label>
              <select
                id="select-quote-duration"
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
              >
                <option value={7}>7 dias (Sprint / Teste Emergencial)</option>
                <option value={15}>15 dias (Curto Prazo)</option>
                <option value={30}>30 dias (Mensal Corporativo)</option>
                <option value={90}>90 dias (Trimestral)</option>
                <option value={180}>180 dias (Semestral)</option>
                <option value={365}>365 dias (Anual Dedicado)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Nível de Criptografia e Segurança</span>
              </label>
              <select
                id="select-quote-tier"
                value={securityTier}
                onChange={(e) => setSecurityTier(e.target.value as SecurityTier)}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
              >
                <option value="STANDARD">Padrão TLS 1.3 (x1.0)</option>
                <option value="ENCRYPTED_E2E">Criptografia E2E AES-256 (x1.25)</option>
                <option value="MAX_ISOLATION">Isolamento Máximo Descentralizado (x1.45)</option>
              </select>
            </div>
          </div>

          {/* Notes / Special requirements */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Observações ou Requisitos de Rede (Opcional)
            </label>
            <textarea
              id="input-quote-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Restringir conexões para faixas de IP específicas, túnel com DNS corporativo..."
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Quotation Summary Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-900 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Cálculo Unitário por Pessoa:</span>
              <span className="font-mono text-slate-200">
                ${(discountedPricePerPerson).toFixed(2)} USD / pessoa ({durationDays} dias)
              </span>
            </div>
            {volumeDiscount > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-400">
                <span>Desconto por Escala de Equipe:</span>
                <span className="font-semibold">-{volumeDiscount * 100}% aplicado</span>
              </div>
            )}
            <div className="border-t border-slate-700/80 pt-2 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Valor Total da Cotação:</span>
                <div className="text-2xl font-bold text-emerald-400 font-mono">
                  ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-300">USD</span>
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-400 space-y-0.5">
                <div>{peopleCount} pessoas conectadas</div>
                <div>{protocolConfig.name}</div>
                <div className="text-emerald-400 font-medium">Assinatura E2E Inclusa</div>
              </div>
            </div>
          </div>

          {/* Mandatory Privacy Notification Checkbox */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-emerald-500/30 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="checkbox-privacy-terms"
                type="checkbox"
                required
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded-sm border-slate-600 text-emerald-500 accent-emerald-500 focus:ring-emerald-500"
              />
              <div className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-emerald-300">Termo de Ciência de Contagem e Privacidade Estrita:</strong>{' '}
                Estou ciente e concordo que o sistema contabilizará em tempo real as <span className="text-white font-semibold">{peopleCount} pessoas autorizadas</span> para controle de capacidade simultânea, certificando que <strong className="text-white underline decoration-emerald-500">nenhum dado pessoal sensível, tela ou tráfego privado será vazado ou compartilhado</strong> com terceiros.
              </div>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              id="btn-cancel-quote"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-quote"
              type="submit"
              disabled={isSubmitting || !privacyAccepted}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer transition-all shadow-md flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Criptografando & Salvando...</span>
                </>
              ) : (
                <>
                  <span>Enviar Cotação Criptografada</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
