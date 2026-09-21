import React from 'react';
import { 
  Shield, 
  Users, 
  Activity, 
  FileText, 
  MessageSquare, 
  Database, 
  LogOut, 
  LogIn, 
  UserCheck, 
  Sparkles,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSessionsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, activeSessionsCount }) => {
  const { currentUser, userProfile, isAdmin, signOut, loginAsDemo, switchRoleForDemo } = useAuth();

  const navItems = [
    { id: 'quotation', label: 'Cotação & Solicitação', icon: Users },
    { id: 'realtime', label: 'Gestão Tempo Real', icon: Activity, badge: activeSessionsCount },
    { id: 'history', label: 'Histórico & Auditoria', icon: Database },
    { id: 'reports', label: 'Relatórios Automáticos', icon: FileText },
    { id: 'support', label: 'Suporte Técnico', icon: MessageSquare },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and system status */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-tight">SecureRemote</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Lock className="w-3 h-3 mr-1" />
                  E2E Encrypted
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Portal de Cotação e Acesso Remoto</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-inner'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User / Auth section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                {/* Switch role helper for easy testing of Admin and Solicitante */}
                <button
                  id="btn-switch-role"
                  title="Alternar Perfil para Teste Imediato"
                  onClick={() => switchRoleForDemo(isAdmin ? 'user' : 'admin')}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white cursor-pointer hover:border-emerald-500/40 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Modo: <strong className="text-emerald-300 uppercase">{userProfile?.role || (isAdmin ? 'admin' : 'user')}</strong></span>
                  <span className="text-[9px] text-slate-400">(Mudar)</span>
                </button>

                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-white leading-tight">
                    {userProfile?.displayName || currentUser.displayName || 'Usuário'}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <span>{isAdmin ? 'Administrador TI' : 'Solicitante'}</span>
                  </div>
                </div>

                <button
                  id="btn-logout"
                  onClick={signOut}
                  title="Encerrar Sessão"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-login-demo-admin"
                  onClick={() => loginAsDemo('admin')}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-sm flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Entrar como Admin</span>
                </button>
                <button
                  id="btn-login-demo-user"
                  onClick={() => loginAsDemo('user')}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                >
                  <span>Entrar Solicitante</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex items-center space-x-1 py-2 overflow-x-auto border-t border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="px-1 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
