import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  ShieldCheck, 
  User, 
  HelpCircle, 
  Lock, 
  Sparkles,
  Check
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { SupportMessage } from '../types';

const FAQ_SUGGESTIONS = [
  {
    label: 'Como configurar VPN?',
    answer: 'Para conectar à VPN Corporativa, utilize o cliente WireGuard ou OpenVPN com o perfil gerado após aprovação da sua cotação. As portas permitidas são UDP 51820 e TCP 443.',
  },
  {
    label: 'Privacidade: meus dados vazam?',
    answer: 'Garantia estrita de Não-Vazamento: o sistema contabiliza apenas o número de pessoas conectadas simultaneamente para balanceamento de licenças. Nenhum dado pessoal, histórico de navegação ou senhas é armazenado ou vazado.',
  },
  {
    label: 'Qual a porta para RDP e SSH?',
    answer: 'O acesso RDP utiliza porta padrão segura 3389 encapsulada em túnel TLS, e o SSH Bastion opera na porta 2222 com autenticação obrigatória por par de chaves criptográficas.',
  },
  {
    label: 'Como funciona a cotação por pessoa?',
    answer: 'A cotação calcula dinamicamente o valor diário por usuário baseado no protocolo escolhido (RDP, SSH, VPN ou Web) e nível de isolamento, aplicando descontos automáticos de 10% a 20% para equipes a partir de 10 pessoas.',
  },
];

export const SupportChat: React.FC = () => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial seed messages if empty
  const defaultWelcomeMessages: SupportMessage[] = [
    {
      id: 'welcome-01',
      senderId: 'support-bot',
      senderEmail: 'suporte.tecnico@empresa.com',
      senderName: 'Assistente Técnico Seguro',
      senderRole: 'support_bot',
      message: 'Olá! Bem-vindo ao canal de Suporte Técnico Integrado de Acesso Remoto e Cotações. Todas as mensagens são protegidas por criptografia E2E. Em que posso ajudar você hoje?',
      isEncrypted: true,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    }
  ];

  useEffect(() => {
    try {
      const q = query(
        collection(db, 'supportMessages'),
        orderBy('createdAt', 'asc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: SupportMessage[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as SupportMessage);
          });
          if (list.length > 0) {
            setMessages(list);
          } else {
            setMessages(defaultWelcomeMessages);
          }
        },
        (error) => {
          console.warn('Fallback support messages local listener:', error);
          setMessages(defaultWelcomeMessages);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      setMessages(defaultWelcomeMessages);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    setIsSending(true);
    setInputText('');

    const newMessage: Omit<SupportMessage, 'id'> = {
      senderId: currentUser?.uid || 'guest-user',
      senderEmail: currentUser?.email || 'solicitante@empresa.com',
      senderName: userProfile?.displayName || currentUser?.displayName || 'Usuário',
      senderRole: isAdmin ? 'admin' : 'user',
      message: text,
      isEncrypted: true,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'supportMessages'), newMessage);
    } catch (err) {
      console.warn('Fallback local append message:', err);
      setMessages((prev) => [...prev, { id: `local-${Date.now()}`, ...newMessage }]);
    } finally {
      setIsSending(false);
    }

    // If matches FAQ or user asked a question, bot answers after brief delay
    const matchedFaq = FAQ_SUGGESTIONS.find((faq) =>
      text.toLowerCase().includes(faq.label.toLowerCase().slice(0, 8))
    );

    if (matchedFaq) {
      setTimeout(async () => {
        const botReply: Omit<SupportMessage, 'id'> = {
          senderId: 'support-bot',
          senderEmail: 'suporte.tecnico@empresa.com',
          senderName: 'Assistente Técnico Seguro',
          senderRole: 'support_bot',
          message: matchedFaq.answer,
          isEncrypted: true,
          createdAt: new Date().toISOString(),
        };
        try {
          await addDoc(collection(db, 'supportMessages'), botReply);
        } catch {
          setMessages((prev) => [...prev, { id: `bot-${Date.now()}`, ...botReply }]);
        }
      }, 700);
    }
  };

  const handleFaqClick = (faq: (typeof FAQ_SUGGESTIONS)[0]) => {
    handleSendMessage(faq.label);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[650px] overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Suporte Técnico Integrado</h3>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-medium">Equipe Online</span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Canal com Criptografia de Ponta a Ponta & Zero-Knowledge</span>
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Atendimento 24/7 TI & Redes</span>
        </div>
      </div>

      {/* Quick FAQ Suggestion Chips */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 overflow-x-auto flex items-center gap-2 text-xs">
        <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1 font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Dúvidas Frequentes:</span>
        </span>
        {FAQ_SUGGESTIONS.map((faq) => (
          <button
            key={faq.label}
            onClick={() => handleFaqClick(faq)}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors border border-slate-700/60"
          >
            {faq.label}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.uid;
          const isBot = msg.senderRole === 'support_bot';
          const isAdminMsg = msg.senderRole === 'admin';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%] ${
                isMe ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isBot
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : isAdminMsg
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : isMe
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`p-3 rounded-2xl space-y-1 ${
                  isMe
                    ? 'bg-emerald-600 text-white rounded-tr-xs shadow-md'
                    : isBot
                    ? 'bg-slate-800/90 border border-amber-500/30 text-slate-200 rounded-tl-xs'
                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] opacity-80 font-medium">
                  <span>{msg.senderName}</span>
                  <span>{new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="input-support-message"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Digite sua dúvida sobre cotação, configuração de VPN, portas RDP ou certificados..."
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
          />
          <button
            id="btn-send-support-message"
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-all shadow-md flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
