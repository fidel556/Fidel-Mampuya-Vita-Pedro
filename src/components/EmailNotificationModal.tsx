import React, { useState } from 'react';
import { 
  Mail, 
  CheckCircle2, 
  X, 
  Copy, 
  Check, 
  Shield, 
  Key, 
  ExternalLink,
  Send
} from 'lucide-react';
import { AccessQuote } from '../types';

interface EmailNotificationModalProps {
  quote: AccessQuote | null;
  isOpen: boolean;
  onClose: () => void;
  onSendConfirmation?: (quoteId: string) => void;
}

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  quote,
  isOpen,
  onClose,
  onSendConfirmation,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen || !quote) return null;

  const demoPassword = `Sec-${Math.random().toString(36).slice(-8)}!2026`;
  const accessGatewayUrl = `https://gateway.empresa.remoto:8443/connect?ticket=${quote.id}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSentSuccess(true);
      if (onSendConfirmation) {
        onSendConfirmation(quote.id);
      }
    }, 1200);
  };

  return (
    <div 
      id="email-notification-modal" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 text-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Notificação de Acesso Aprovado por E-mail</h3>
              <p className="text-xs text-slate-400">Disparo automático de credenciais seguras e instruções</p>
            </div>
          </div>
          <button 
            id="btn-close-email-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Header Preview */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400 font-medium">Destinatário:</span>
            <span className="text-sky-300 font-mono font-semibold">{quote.userEmail}</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400 font-medium">Assunto:</span>
            <span className="text-white font-semibold">
              [APROVADO] Suas Credenciais de Acesso Remoto - {quote.projectTitle}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Segurança:</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <Shield className="w-3.5 h-3.5" />
              Criptografado E2E (AES-256) | Hash Verificado
            </span>
          </div>
        </div>

        {/* Rendered Email Body Content */}
        <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/80 space-y-4 text-xs sm:text-sm text-slate-300">
          <p>
            Olá <strong className="text-white">{quote.userName || 'Colaborador'}</strong>,
          </p>
          <p>
            Temos o prazer de informar que a sua solicitação de cotação e acesso remoto para o projeto{' '}
            <strong className="text-emerald-400">{quote.projectTitle}</strong> para{' '}
            <strong className="text-white">{quote.peopleCount} pessoa(s)</strong> foi <strong className="text-emerald-400 uppercase">APROVADA</strong> com sucesso pela equipe de administração de TI.
          </p>

          {/* Credentials Box */}
          <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1 font-semibold">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Credenciais Provisórias Geradas:</span>
              </span>
              <button
                onClick={() => handleCopy(`Protocolo: ${quote.accessType} | Host: ${accessGatewayUrl} | Ticket: ${quote.id}`)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar Dados'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-500">Protocolo Liberado:</div>
                <div className="text-emerald-300 font-bold">{quote.accessType}</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-500">Duração / Validade:</div>
                <div className="text-slate-200">{quote.durationDays} dias (Até {(new Date(Date.now() + quote.durationDays * 86400000)).toLocaleDateString('pt-BR')})</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 sm:col-span-2">
                <div className="text-[10px] text-slate-500">URL do Gateway de Conexão Segura:</div>
                <div className="text-sky-300 truncate">{accessGatewayUrl}</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-950/30 rounded-lg border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-emerald-300">
              <Shield className="w-4 h-4" />
              <span>Aviso de Privacidade & Conformidade Estrita:</span>
            </div>
            <p className="text-slate-300">
              Reafirmamos que as {quote.peopleCount} conexões simultâneas serão contabilizadas para telemetria de rede e segurança, mas nenhum dado pessoal, telas ou comunicações privadas são monitorados ou vazados.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {sentSuccess ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Notificação enviada com sucesso para {quote.userEmail}!
              </span>
            ) : (
              <span>Notificação pronta para disparo automático</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-close-email-dialog"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer hover:bg-slate-800 transition-colors"
            >
              Fechar
            </button>
            <button
              id="btn-trigger-email-send"
              onClick={handleSendEmail}
              disabled={isSending || sentSuccess}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-all shadow-md flex items-center gap-1.5"
            >
              {isSending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : sentSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>E-mail Enviado</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Disparar E-mail Agora</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
