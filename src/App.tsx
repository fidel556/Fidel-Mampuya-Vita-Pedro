import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc 
} from 'firebase/firestore';
import { db, testConnection } from './firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { PrivacyBanner } from './components/PrivacyBanner';
import { QuoteFormModal } from './components/QuoteFormModal';
import { AdminRealtimeDashboard } from './components/AdminRealtimeDashboard';
import { QuoteHistory } from './components/QuoteHistory';
import { AutomatedReports } from './components/AutomatedReports';
import { SupportChat } from './components/SupportChat';
import { DecentralizedAuditLedger } from './components/DecentralizedAuditLedger';
import { AccessQuote, ActiveSession, AuditLogBlock } from './types';
import { 
  Plus, 
  ShieldCheck, 
  Users, 
  Activity, 
  Database, 
  FileText, 
  MessageSquare, 
  Layers, 
  Sparkles,
  Lock,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { maskIp } from './crypto';

// Default initial data to seed if collection is completely fresh
const DEFAULT_INITIAL_QUOTES: AccessQuote[] = [
  {
    id: 'quote-seed-01',
    userId: 'demo-user-01',
    userEmail: 'fidelmampuya1@gmail.com',
    userName: 'Fidel Mampuya',
    projectTitle: 'Infraestrutura Cloud & Acesso Remoto DevOps',
    peopleCount: 12,
    accessType: 'VPN_FULL',
    durationDays: 30,
    securityTier: 'ENCRYPTED_E2E',
    unitPricePerPerson: 25.65,
    totalCost: 307.80,
    currency: 'USD',
    privacyTermsAccepted: true,
    privacyNoticeVersion: '2026.1-ZERO-LEAK',
    status: 'ACTIVE',
    encryptedPayload: 'eyJwcm9qZWN0IjoiSW5mcmFFc3RydXR1cmEgQ2xvdWQiLCJtYXNrZWQiOnRydWV9',
    hashSignature: '8f4c2e6b1a9d3f5e7c8b0a2d4f6e8a1c3b5d7f9e0a2c4e6b8d0f2a4c6e8b0a2d',
    notes: 'Acesso prioritário para engenheiros de infraestrutura com MFA mandatório.',
    approvedBy: 'fidelmampuya1@gmail.com',
    approvalEmailSent: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'quote-seed-02',
    userId: 'demo-user-02',
    userEmail: 'consultoria.externa@empresa.com',
    userName: 'Carlos Mendes',
    projectTitle: 'Squad de Auditoria Financeira & Compliance',
    peopleCount: 5,
    accessType: 'RDP',
    durationDays: 15,
    securityTier: 'MAX_ISOLATION',
    unitPricePerPerson: 27.18,
    totalCost: 135.90,
    currency: 'USD',
    privacyTermsAccepted: true,
    privacyNoticeVersion: '2026.1-ZERO-LEAK',
    status: 'PENDING',
    encryptedPayload: 'eyJwcm9qZWN0IjoiU3F1YWQgZGUgQXVkaXRvcmlhIiwibWFza2VkIjp0cnVlfQ==',
    hashSignature: '4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b',
    notes: 'Necessidade de isolamento RDP com bloqueio de transferência de arquivos locais.',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  }
];

const DEFAULT_INITIAL_SESSIONS: ActiveSession[] = [
  {
    id: 'sess-01',
    quoteId: 'quote-seed-01',
    userEmail: 'dev.remoto1@empresa.com',
    userName: 'Lucas Prado',
    machineName: 'WS-DEV-CLOUD-01',
    protocol: 'VPN_FULL',
    ipAddressMasked: '192.168.***.***',
    status: 'CONNECTED',
    encryptedSessionToken: 'tok_e2e_wireguard_8832a',
    connectedAt: new Date(Date.now() - 7200000).toISOString(),
    lastHeartbeat: new Date().toISOString(),
  },
  {
    id: 'sess-02',
    quoteId: 'quote-seed-01',
    userEmail: 'dev.remoto2@empresa.com',
    userName: 'Mariana Costa',
    machineName: 'WS-DEV-CLOUD-04',
    protocol: 'SSH',
    ipAddressMasked: '10.140.***.***',
    status: 'CONNECTED',
    encryptedSessionToken: 'tok_e2e_bastion_9921b',
    connectedAt: new Date(Date.now() - 3600000).toISOString(),
    lastHeartbeat: new Date().toISOString(),
  }
];

function MainContent() {
  const { currentUser, isAdmin, loginAsDemo } = useAuth();

  const [activeTab, setActiveTab] = useState('quotation');
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  const [quotes, setQuotes] = useState<AccessQuote[]>(DEFAULT_INITIAL_QUOTES);
  const [sessions, setSessions] = useState<ActiveSession[]>(DEFAULT_INITIAL_SESSIONS);
  const [auditBlocks, setAuditBlocks] = useState<AuditLogBlock[]>([]);

  // Firestore listeners
  useEffect(() => {
    // 1. Mandatory connection test as required by skill
    testConnection();

    // 2. Listen to quotes
    try {
      const qQuotes = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
      const unsubQuotes = onSnapshot(
        qQuotes,
        (snapshot) => {
          const list: AccessQuote[] = [];
          snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as AccessQuote));
          if (list.length > 0) {
            setQuotes(list);
          }
        },
        (err) => console.warn('Quotes snapshot local fallback:', err)
      );

      // 3. Listen to active sessions
      const qSessions = query(collection(db, 'sessions'));
      const unsubSessions = onSnapshot(
        qSessions,
        (snapshot) => {
          const list: ActiveSession[] = [];
          snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as ActiveSession));
          if (list.length > 0) {
            setSessions(list);
          }
        },
        (err) => console.warn('Sessions snapshot local fallback:', err)
      );

      // 4. Listen to audit logs
      const qAudit = query(collection(db, 'auditLogs'), orderBy('blockIndex', 'asc'));
      const unsubAudit = onSnapshot(
        qAudit,
        (snapshot) => {
          const list: AuditLogBlock[] = [];
          snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as AuditLogBlock));
          if (list.length > 0) {
            setAuditBlocks(list);
          }
        },
        (err) => console.warn('Audit logs snapshot local fallback:', err)
      );

      return () => {
        unsubQuotes();
        unsubSessions();
        unsubAudit();
      };
    } catch (err) {
      console.warn('Realtime listeners fallback:', err);
    }
  }, []);

  const latestBlockHash =
    auditBlocks.length > 0
      ? auditBlocks[auditBlocks.length - 1].blockHash
      : '0000000000000000000000000000000000000000000000000000000000000000';

  const activeSessionsCount = sessions.filter((s) => s.status === 'CONNECTED').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Privacy Terms Notification Banner */}
      <PrivacyBanner />

      {/* Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSessionsCount={activeSessionsCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Welcome and Quick Action bar if in quotation tab */}
        {activeTab === 'quotation' && (
          <div className="space-y-6">
            {/* Hero Card with Quotation CTA */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Cotação Inteligente de Pessoas para Acesso Remoto Web</span>
                  </div>
                  
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Dimensione e Cotize Acessos Remotos com Segurança Criptográfica Total
                  </h1>
                  
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Calcule custos sob medida por quantidade de colaboradores e estações remotas. Conexões auditadas em tempo real com <strong className="text-emerald-300">garantia absoluta de privacidade e zero vazamento de dados pessoais</strong>.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
                  <button
                    id="btn-hero-new-quote"
                    onClick={() => setIsQuoteModalOpen(true)}
                    className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm cursor-pointer transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Fazer Nova Cotação</span>
                  </button>

                  <button
                    id="btn-hero-view-realtime"
                    onClick={() => setActiveTab('realtime')}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs cursor-pointer transition-colors flex items-center justify-center gap-2"
                  >
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Ver Gestão em Tempo Real ({activeSessionsCount})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick KPI Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Pessoas Cotadas Ativas</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-white font-mono">
                  {quotes.reduce((acc, q) => acc + (q.peopleCount || 0), 0)} vagas
                </div>
                <p className="text-[11px] text-slate-500">Contabilização com IP anonimizado</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Protocolos Suportados</span>
                  <Cpu className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-sm font-bold text-slate-200">
                  RDP • SSH Bastion • WireGuard VPN • Web Zero-Trust
                </div>
                <p className="text-[11px] text-slate-500">Criptografia AES-GCM de 256 bits</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Auditoria Descentralizada</span>
                  <Layers className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                  {auditBlocks.length + 1} blocos
                </div>
                <p className="text-[11px] text-slate-500">Encadeamento por hash imutável</p>
              </div>
            </div>

            {/* Recent Quotes Section */}
            <QuoteHistory
              quotes={quotes}
              onOpenNewQuoteModal={() => setIsQuoteModalOpen(true)}
            />
          </div>
        )}

        {/* Real-time Management Tab */}
        {activeTab === 'realtime' && (
          <AdminRealtimeDashboard
            quotes={quotes}
            sessions={sessions}
            latestBlockHash={latestBlockHash}
            totalBlocksCount={auditBlocks.length}
          />
        )}

        {/* Quote History & Audit Tab */}
        {activeTab === 'history' && (
          <div className="space-y-8">
            <QuoteHistory
              quotes={quotes}
              onOpenNewQuoteModal={() => setIsQuoteModalOpen(true)}
            />

            <DecentralizedAuditLedger blocks={auditBlocks} />
          </div>
        )}

        {/* Automated Reports Tab */}
        {activeTab === 'reports' && (
          <AutomatedReports
            quotes={quotes}
            sessions={sessions}
          />
        )}

        {/* Support Chat Tab */}
        {activeTab === 'support' && (
          <SupportChat />
        )}
      </main>

      {/* New Quotation Modal */}
      <QuoteFormModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        latestBlockHash={latestBlockHash}
        totalBlocksCount={auditBlocks.length}
        onSuccess={(newQuote) => {
          setQuotes((prev) => [newQuote, ...prev]);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 space-y-1">
        <p>Sistema de Cotação de Pessoas e Gestão de Acesso Remoto Seguro • Zero-Knowledge Telemetry</p>
        <p className="text-[11px] text-slate-600">
          Criptografia E2E AES-256 • Auditoria Descentralizada em Cadeia Merkle • Total conformidade com Termos de Privacidade
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
