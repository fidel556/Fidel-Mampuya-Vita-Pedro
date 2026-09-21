import React, { useState } from 'react';
import { ShieldCheck, Lock, EyeOff, Info, CheckCircle2, ChevronRight, X } from 'lucide-react';

export const PrivacyBanner: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div 
        id="privacy-banner"
        className="w-full bg-slate-900 border-b border-emerald-500/30 text-slate-100 px-4 py-2.5 transition-all"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex items-center gap-1.5 font-medium text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Conformidade de Privacidade & Proteção de Dados:</span>
            </div>
            <p className="text-slate-300">
              As pessoas são contabilizadas para telemetria de capacidade, mas <strong className="text-white underline decoration-emerald-500 underline-offset-2">nenhum dado pessoal é vazado ou exposto</strong>.
            </p>
          </div>

          <button
            id="btn-open-privacy-details"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors shrink-0 underline cursor-pointer"
          >
            <span>Ver Termos e Garantias Criptográficas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Full Privacy Modal */}
      {modalOpen && (
        <div 
          id="privacy-terms-modal" 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 text-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Termos de Privacidade e Não-Vazamento</h3>
                  <p className="text-xs text-slate-400">Certificado Zero-Knowledge Telemetry v2.4</p>
                </div>
              </div>
              <button 
                id="btn-close-privacy-modal"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-300 max-h-[60vh] overflow-y-auto pr-2">
              <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-300">Contagem de Pessoas Sem Violação de Privacidade</h4>
                  <p className="mt-1 text-slate-300 leading-relaxed">
                    O sistema quantifica em tempo real a quantidade de colaboradores e estações remotas ativas exclusivamente para fins de balanceamento de carga, cálculo de cotas e segurança de rede. Nenhum conteúdo de tela, conversas, arquivos ou identificadores biométricos são inspecionados ou salvos.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-100 font-semibold">
                    <EyeOff className="w-4 h-4 text-sky-400" />
                    <span>Mascaramento de IP & PII</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Os endereços IP são mascarados (ex.: 192.168.***.***) e os e-mails são anonimizados nos relatórios públicos para evitar qualquer rastreabilidade pessoal.
                  </p>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-100 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Criptografia E2E Nativa</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Todas as solicitações utilizam algoritmos AES-GCM 256 bits e assinatura SHA-256. Apenas as partes autorizadas conseguem validar as permissões.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-100 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <span>Auditoria Descentralizada e Imutável</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cada aprovação, alteração de status ou desconexão de usuário gera um bloco criptografado vinculado ao hash do bloco anterior, impedindo alterações retroativas nos logs de auditoria corporativa.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                id="btn-understand-privacy"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                Compreendido e De Acordo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
