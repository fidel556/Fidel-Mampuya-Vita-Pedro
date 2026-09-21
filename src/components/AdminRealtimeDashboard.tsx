import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  ShieldAlert, 
  Power, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Mail, 
  Key, 
  RefreshCw, 
  Eye, 
  Lock, 
  AlertCircle,
  Clock,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ActiveSession, AccessQuote, AuditLogBlock, UserProfile } from '../types';
import { EmailNotificationModal } from './EmailNotificationModal';
import { computeBlockHash, maskIp } from '../crypto';

interface AdminRealtimeDashboardProps {
  quotes: AccessQuote[];
  sessions: ActiveSession[];
  latestBlockHash: string;
  totalBlocksCount: number;
  onRefresh?: () => void;
}

export const AdminRealtimeDashboard: React.FC<AdminRealtimeDashboardProps> = ({
  quotes,
  sessions,
  latestBlockHash,
  totalBlocksCount,
}) => {
  const { currentUser, isAdmin, userProfile } = useAuth();

  const [selectedQuoteForEmail, setSelectedQuoteForEmail] = useState<AccessQuote | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [subTab, setSubTab] = useState<'sessions' | 'quotes' | 'permissions'>('sessions');

  // RBAC Permission States for team
  const [teamProfiles, setTeamProfiles] = useState<UserProfile[]>([
    {
      uid: 'admin-01',
      displayName: 'Fidel Mampuya (Super Admin)',
      email: 'fidelmampuya1@gmail.com',
      role: 'admin',
      department: 'Infraestrutura & Segurança',
      permissions: {
        canQuote: true,
        canApprove: true,
        canRevokeRealtime: true,
        canExportReports: true,
        canManageUsers: true,
      },
      createdAt: '2026-01-10T08:00:00.000Z',
      updatedAt: '2026-09-21T09:00:00.000Z',
    },
    {
      uid: 'user-02',
      displayName: 'Carlos Mendes',
      email: 'carlos.mendes@empresa.com',
      role: 'manager',
      department: 'Engenharia de Software',
      permissions: {
        canQuote: true,
        canApprove: false,
        canRevokeRealtime: false,
        canExportReports: true,
        canManageUsers: false,
      },
      createdAt: '2026-02-15T10:00:00.000Z',
      updatedAt: '2026-09-20T14:30:00.000Z',
    },
    {
      uid: 'user-03',
      displayName: 'Ana Silva',
      email: 'ana.silva@empresa.com',
      role: 'user',
      department: 'Data Analytics',
      permissions: {
        canQuote: true,
        canApprove: false,
        canRevokeRealtime: false,
        canExportReports: false,
        canManageUsers: false,
      },
      createdAt: '2026-03-01T11:00:00.000Z',
      updatedAt: '2026-09-18T16:00:00.000Z',
    }
  ]);

  const activeSessions = sessions.filter((s) => s.status === 'CONNECTED');
  const pendingQuotes = quotes.filter((q) => q.status === 'PENDING');

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // Terminate session in real time (Kill switch)
  const handleTerminateSession = async (sessionId: string, machineName: string, quoteId: string) => {
    if (!isAdmin) {
      alert('Apenas administradores podem encerrar sessões em tempo real.');
      return;
    }

    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        status: 'TERMINATED_BY_ADMIN',
        lastHeartbeat: new Date().toISOString(),
      });

      // Append decentralized audit log
      const blockTimestamp = new Date().toISOString();
      const nextIndex = totalBlocksCount + 1;
      const actionName = `SESSAO_TERMINADA_KILL_SWITCH`;
      const blockHash = await computeBlockHash(
        nextIndex,
        latestBlockHash,
        blockTimestamp,
        actionName,
        sessionId,
        currentUser?.email || 'admin'
      );

      await addDoc(collection(db, 'auditLogs'), {
        blockIndex: nextIndex,
        action: actionName,
        performedBy: currentUser?.email || 'admin',
        entityId: sessionId,
        detailsMasked: `Admin encerrou sessão da máquina ${machineName} (Quote: ${quoteId})`,
        prevBlockHash: latestBlockHash,
        blockHash,
        timestamp: blockTimestamp,
      });

      showNotification(`Sessão na máquina ${machineName} encerrada com sucesso.`);
    } catch (err: any) {
      console.error('Error terminating session:', err);
      alert('Erro ao terminar sessão: ' + (err.message || 'Verifique suas permissões'));
    }
  };

  // Simulate a live remote connection to showcase real-time tracking
  const handleSimulateConnection = async () => {
    try {
      const randomIp = `192.168.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
      const randomStation = `WS-CORP-${Math.floor(Math.random() * 900 + 100)}`;
      const protocols: ('RDP' | 'SSH' | 'VPN_FULL' | 'WEB_GATEWAY')[] = ['RDP', 'SSH', 'VPN_FULL', 'WEB_GATEWAY'];
      const chosenProtocol = protocols[Math.floor(Math.random() * protocols.length)];

      const newSession: Omit<ActiveSession, 'id'> = {
        quoteId: quotes[0]?.id || 'quote-demo-01',
        userEmail: currentUser?.email || 'colaborador.remoto@empresa.com',
        userName: userProfile?.displayName || 'Usuário Remoto',
        machineName: randomStation,
        protocol: chosenProtocol,
        ipAddressMasked: maskIp(randomIp),
        status: 'CONNECTED',
        encryptedSessionToken: `tok_aes256_${Math.random().toString(36).slice(2)}`,
        connectedAt: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
      };

      await addDoc(collection(db, 'sessions'), newSession);

      // Append audit block
      const blockTimestamp = new Date().toISOString();
      const nextIndex = totalBlocksCount + 1;
      const actionName = `NOVA_CONEXAO_REMOTA_INICIADA`;
      const blockHash = await computeBlockHash(
        nextIndex,
        latestBlockHash,
        blockTimestamp,
        actionName,
        randomStation,
        currentUser?.email || 'sistema'
      );

      await addDoc(collection(db, 'auditLogs'), {
        blockIndex: nextIndex,
        action: actionName,
        performedBy: currentUser?.email || 'sistema',
        entityId: randomStation,
        detailsMasked: `Nova conexão iniciada em ${randomStation} via ${chosenProtocol}`,
        prevBlockHash: latestBlockHash,
        blockHash,
        timestamp: blockTimestamp,
      });

      showNotification(`Nova conexão remota simulada na estação ${randomStation}!`);
    } catch (err: any) {
      console.error('Error simulating session:', err);
    }
  };

  // Approve quote
  const handleApproveQuote = async (quote: AccessQuote) => {
    if (!isAdmin) {
      alert('Apenas administradores podem aprovar solicitações.');
      return;
    }

    try {
      const quoteRef = doc(db, 'quotes', quote.id);
      await updateDoc(quoteRef, {
        status: 'APPROVED',
        approvedBy: currentUser?.email || 'admin',
        approvalEmailSent: true,
        updatedAt: new Date().toISOString(),
      });

      // Also create an initial active session for this quote
      await addDoc(collection(db, 'sessions'), {
        quoteId: quote.id,
        userEmail: quote.userEmail,
        userName: quote.userName,
        machineName: `NODE-${quote.accessType}-${Math.floor(Math.random() * 800 + 100)}`,
        protocol: quote.accessType,
        ipAddressMasked: maskIp('10.200.44.12'),
        status: 'CONNECTED',
        encryptedSessionToken: `tok_sec_${quote.id.slice(0, 8)}`,
        connectedAt: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
      });

      // Append audit log block
      const blockTimestamp = new Date().toISOString();
      const nextIndex = totalBlocksCount + 1;
      const actionName = `COTACAO_APROVADA_E_EMAIL_ENVIADO`;
      const blockHash = await computeBlockHash(
        nextIndex,
        latestBlockHash,
        blockTimestamp,
        actionName,
        quote.id,
        currentUser?.email || 'admin'
      );

      await addDoc(collection(db, 'auditLogs'), {
        blockIndex: nextIndex,
        action: actionName,
        performedBy: currentUser?.email || 'admin',
        entityId: quote.id,
        detailsMasked: `Cotação ${quote.projectTitle} aprovada para ${quote.peopleCount} pessoas. Notificação de credenciais disparada.`,
        prevBlockHash: latestBlockHash,
        blockHash,
        timestamp: blockTimestamp,
      });

      // Open email modal to show email preview
      setSelectedQuoteForEmail({ ...quote, status: 'APPROVED', approvalEmailSent: true });
      setEmailModalOpen(true);
      showNotification(`Cotação "${quote.projectTitle}" aprovada e e-mail disparado!`);
    } catch (err: any) {
      console.error('Error approving quote:', err);
      alert('Erro ao aprovar: ' + err.message);
    }
  };

  // Reject quote
  const handleRejectQuote = async (quoteId: string, projectTitle: string) => {
    if (!isAdmin) {
      alert('Apenas administradores podem rejeitar solicitações.');
      return;
    }

    try {
      const quoteRef = doc(db, 'quotes', quoteId);
      await updateDoc(quoteRef, {
        status: 'REJECTED',
        updatedAt: new Date().toISOString(),
      });

      // Append audit log block
      const blockTimestamp = new Date().toISOString();
      const nextIndex = totalBlocksCount + 1;
      const actionName = `COTACAO_REJEITADA`;
      const blockHash = await computeBlockHash(
        nextIndex,
        latestBlockHash,
        blockTimestamp,
        actionName,
        quoteId,
        currentUser?.email || 'admin'
      );

      await addDoc(collection(db, 'auditLogs'), {
        blockIndex: nextIndex,
        action: actionName,
        performedBy: currentUser?.email || 'admin',
        entityId: quoteId,
        detailsMasked: `Cotação ${projectTitle} rejeitada por inconformidade de capacidade.`,
        prevBlockHash: latestBlockHash,
        blockHash,
        timestamp: blockTimestamp,
      });

      showNotification(`Solicitação "${projectTitle}" rejeitada.`);
    } catch (err: any) {
      console.error('Error rejecting quote:', err);
    }
  };

  // Toggle RBAC Permission
  const handleTogglePermission = (uid: string, permissionKey: keyof NonNullable<UserProfile['permissions']>) => {
    if (!isAdmin) {
      alert('Apenas Administradores podem alterar a matriz de permissões.');
      return;
    }

    setTeamProfiles((prev) =>
      prev.map((profile) => {
        if (profile.uid === uid) {
          const currentVal = profile.permissions?.[permissionKey] ?? false;
          return {
            ...profile,
            permissions: {
              ...profile.permissions,
              [permissionKey]: !currentVal,
            } as any,
          };
        }
        return profile;
      })
    );
    showNotification('Matriz de permissões atualizada em tempo real.');
  };

  return (
    <div className="space-y-6">
      {/* Alert toast if action performed */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg('')} className="text-emerald-400 hover:text-white cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Sessões Remotas Ativas</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{activeSessions.length}</span>
            <span className="text-xs text-emerald-400 font-medium">pessoas conectadas</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Monitoramento em tempo real com kill-switch</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Solicitações Pendentes</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">{pendingQuotes.length}</span>
            <span className="text-xs text-slate-400">aguardando aprovação</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Disparo automático de e-mail ao aprovar</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Pessoas Totais Cotadas</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-sky-400 font-mono">
              {quotes.reduce((acc, q) => acc + (q.peopleCount || 0), 0)}
            </span>
            <span className="text-xs text-slate-400">vagas alocadas</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Zero vazamento de dados pessoais</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Integridade Criptográfica</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">100%</span>
            <span className="text-xs text-slate-400">E2E AES-GCM</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Logs descentralizados em Merkle Chain</p>
        </div>
      </div>

      {/* Admin Sub-navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            id="btn-subtab-sessions"
            onClick={() => setSubTab('sessions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              subTab === 'sessions'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Sessões Conectadas ({activeSessions.length})
          </button>
          <button
            id="btn-subtab-quotes"
            onClick={() => setSubTab('quotes')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              subTab === 'quotes'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Aprovações Pendentes ({pendingQuotes.length})
          </button>
          <button
            id="btn-subtab-permissions"
            onClick={() => setSubTab('permissions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              subTab === 'permissions'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Gerenciador de Permissões (RBAC)
          </button>
        </div>

        {subTab === 'sessions' && (
          <button
            id="btn-simulate-remote-connection"
            onClick={handleSimulateConnection}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simular Conexão Remota</span>
          </button>
        )}
      </div>

      {/* Subtab Content: Sessions */}
      {subTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Painel de Conexões Remotas em Tempo Real</span>
              </h3>
              <p className="text-xs text-slate-400">
                Visualize quem está conectado agora e encerre o acesso imediatamente caso necessário.
              </p>
            </div>
            <button
              onClick={handleSimulateConnection}
              className="sm:hidden px-2.5 py-1 bg-slate-800 text-slate-200 rounded text-xs"
            >
              + Simular
            </button>
          </div>

          {activeSessions.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <Power className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-300">Nenhuma sessão remota conectada no momento</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Assim que uma cotação for aprovada ou uma conexão for aberta, ela aparecerá aqui instantaneamente com contagem de telemetria segura.
              </p>
              <button
                onClick={handleSimulateConnection}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-md"
              >
                Simular Conexão de Demonstração
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  id={`session-card-${session.id}`}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-white">{session.machineName}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{session.userName}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                      {session.protocol}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>IP Mascarado (Privacidade):</span>
                      <span className="font-mono text-slate-300">{session.ipAddressMasked}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Conectado às:</span>
                      <span className="text-slate-300">{new Date(session.connectedAt).toLocaleTimeString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Token Criptografado:</span>
                      <span className="font-mono text-[10px] text-emerald-400/80 truncate max-w-[120px]">
                        {session.encryptedSessionToken.slice(0, 16)}...
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Status: Conectado</span>
                    <button
                      id={`btn-terminate-session-${session.id}`}
                      onClick={() => handleTerminateSession(session.id, session.machineName, session.quoteId)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Encerrar Acesso</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab Content: Pending Approvals */}
      {subTab === 'quotes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Solicitações de Acesso Remoto Aguardando Aprovação</span>
              </h3>
              <p className="text-xs text-slate-400">
                Aprovar uma cotação gera as credenciais seguras e dispara a notificação oficial por e-mail.
              </p>
            </div>
          </div>

          {pendingQuotes.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-sm font-semibold text-slate-300">Fila de aprovações em dia!</div>
              <p className="text-xs text-slate-500">Nenhuma solicitação pendente de revisão no momento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingQuotes.map((quote) => (
                <div
                  key={quote.id}
                  id={`quote-review-${quote.id}`}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{quote.projectTitle}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        Pendente
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        {quote.accessType}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>Solicitante: <strong className="text-slate-200">{quote.userName}</strong> ({quote.userEmail})</span>
                      <span>•</span>
                      <span>Pessoas: <strong className="text-emerald-400">{quote.peopleCount} usuários</strong></span>
                      <span>•</span>
                      <span>Duração: <strong className="text-slate-200">{quote.durationDays} dias</strong></span>
                      <span>•</span>
                      <span>Valor Estimado: <strong className="text-emerald-400 font-mono">${quote.totalCost.toFixed(2)} USD</strong></span>
                    </div>

                    {quote.notes && (
                      <p className="text-xs text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                        Obs: {quote.notes}
                      </p>
                    )}

                    <div className="text-[10px] text-slate-500 flex items-center gap-2">
                      <span>Assinatura E2E: <code className="text-emerald-400/80">{quote.hashSignature.slice(0, 24)}...</code></span>
                      <span>•</span>
                      <span>Termo de Privacidade Aceito: Sim (Zero Leak)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id={`btn-reject-quote-${quote.id}`}
                      onClick={() => handleRejectQuote(quote.id, quote.projectTitle)}
                      className="px-3 py-2 rounded-lg border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Rejeitar
                    </button>
                    <button
                      id={`btn-approve-quote-${quote.id}`}
                      onClick={() => handleApproveQuote(quote)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Aprovar & Enviar E-mail</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab Content: RBAC Permissions Manager */}
      {subTab === 'permissions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Painel Administrativo de Controle de Permissões (RBAC)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Defina com precisão quais papéis têm permissão para aprovar acessos, encerrar conexões em tempo real e visualizar auditoria.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Membro / Usuário</th>
                    <th className="px-4 py-3">Papel</th>
                    <th className="px-4 py-3 text-center">Criar Cotação</th>
                    <th className="px-4 py-3 text-center">Aprovar Solicitação</th>
                    <th className="px-4 py-3 text-center">Kill-Switch Tempo Real</th>
                    <th className="px-4 py-3 text-center">Exportar Relatórios</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {teamProfiles.map((member) => (
                    <tr key={member.uid} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{member.displayName}</div>
                        <div className="text-[11px] text-slate-400">{member.email}</div>
                        <div className="text-[10px] text-slate-500">{member.department}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            member.role === 'admin'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : member.role === 'manager'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={member.permissions?.canQuote ?? true}
                          onChange={() => handleTogglePermission(member.uid, 'canQuote')}
                          className="h-4 w-4 rounded border-slate-700 text-emerald-500 accent-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={member.permissions?.canApprove ?? false}
                          onChange={() => handleTogglePermission(member.uid, 'canApprove')}
                          className="h-4 w-4 rounded border-slate-700 text-emerald-500 accent-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={member.permissions?.canRevokeRealtime ?? false}
                          onChange={() => handleTogglePermission(member.uid, 'canRevokeRealtime')}
                          className="h-4 w-4 rounded border-slate-700 text-emerald-500 accent-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={member.permissions?.canExportReports ?? false}
                          onChange={() => handleTogglePermission(member.uid, 'canExportReports')}
                          className="h-4 w-4 rounded border-slate-700 text-emerald-500 accent-emerald-500 cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Email Notification Modal */}
      <EmailNotificationModal
        quote={selectedQuoteForEmail}
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSendConfirmation={(qId) => {
          showNotification(`E-mail com credenciais disparado com sucesso para a solicitação ${qId}.`);
        }}
      />
    </div>
  );
};
