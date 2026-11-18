'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ChatAppointmentInfo, ChatMessage, User } from '@/types';

/**
 * Returns a personalized welcome message based on the authenticated user's role and profile.
 */
function getInitialWelcomeMessage(user: User | null): ChatMessage {
  if (!user) {
    return {
      id: 'welcome-guest',
      role: 'assistant',
      content:
        "👋 Bonjour ! Je suis l'assistant IA médical de la Clinique Santé+, propulsé par Gemini.\n\nJe suis à votre disposition pour :\n• 📅 **Prendre un rendez-vous directement** (avec un médecin, une spécialité et la date de votre choix)\n• 🩺 **Orientation médicale & analyse de vos symptômes**\n• 👨‍⚕️ **Renseignements sur l'équipe médicale et les disponibilités**\n• 💡 **Questions générales de santé, prévention et bien-être**\n\nComment puis-je vous aider aujourd'hui ?",
      timestamp: new Date().toISOString(),
    };
  }

  const isMedecin = user.roles.includes('ROLE_MEDECIN');
  const isAdmin = user.roles.includes('ROLE_ADMIN');
  const isSecretaire = user.roles.includes('ROLE_SECRETAIRE');

  if (isMedecin) {
    return {
      id: `welcome-medecin-${user.id}`,
      role: 'assistant',
      content: `👨‍⚕️ **Bonjour Dr. ${user.nom} !**\n\nJe suis votre copilote clinique intelligent. Votre espace de conversation est **strictement privé et réservé à votre profil praticien**.\n\nJe peux vous assister pour :\n• 📅 **Consulter vos créneaux et vos rendez-vous programmés**\n• 💊 **Vérifier les contre-indications et posologies pour une prescription**\n• 📝 **Rédiger ou structurer des comptes-rendus de consultation (format SOAP)**\n• 🔬 **Synthèse rapide sur une pathologie ou protocole de soins**\n\nSur quoi souhaitez-vous travailler ?`,
      timestamp: new Date().toISOString(),
    };
  }

  if (isAdmin || isSecretaire) {
    return {
      id: `welcome-staff-${user.id}`,
      role: 'assistant',
      content: `👋 **Bonjour ${user.prenom} (${isAdmin ? 'Administrateur' : 'Secrétariat'}) !**\n\nJe suis votre assistant clinique et administratif. Cet historique de chat est **personnel à votre compte staff**.\n\nJe peux vous aider à :\n• 📅 **Rechercher le prochain créneau disponible pour un praticien**\n• 🏥 **Enregistrer ou planifier un rendez-vous patient sans conflit d'horaire**\n• 📊 **Vérifier l'affluence et les statistiques du jour**\n\nComment puis-je vous aider ?`,
      timestamp: new Date().toISOString(),
    };
  }

  // Patient
  return {
    id: `welcome-patient-${user.id}`,
    role: 'assistant',
    content: `👋 **Bonjour ${user.prenom} !**\n\nRavi de vous retrouver sur votre espace santé personnel. Cet historique de discussion est **confidentiel et rattaché à votre compte patient**.\n\nJe peux vous assister pour :\n• 📅 **Prendre un rendez-vous directement** avec un médecin de la clinique\n• 🩺 **Vous orienter selon vos symptômes du moment**\n• 📋 **Poser des questions sur vos ordonnances et recommandations de santé**\n\nComment vous sentez-vous aujourd'hui ?`,
    timestamp: new Date().toISOString(),
  };
}

interface ChatContextType {
  messages: ChatMessage[];
  loading: boolean;
  isFloatingOpen: boolean;
  userStorageKey: string;
  setIsFloatingOpen: (open: boolean) => void;
  sendMessage: (text: string) => Promise<void>;
  resetChat: () => void;
  openWithPrompt: (prompt: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Unique partition key per authenticated user (or guest)
  const userKey = useMemo(() => {
    if (!user) return 'guest';
    const safeEmail = user.email.replace(/[^a-zA-Z0-9]/g, '_');
    return `user_${user.id}_${safeEmail}`;
  }, [user]);

  const storageKey = useMemo(() => `clinique_chat_history_v3_${userKey}`, [userKey]);
  const syncEventName = useMemo(() => `clinique_chat_sync_${userKey}`, [userKey]);

  const defaultWelcomeMessage = useMemo(() => [getInitialWelcomeMessage(user)], [user]);

  const [messages, setMessages] = useState<ChatMessage[]>(defaultWelcomeMessage);
  const [loading, setLoading] = useState(false);
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);

  // Load user-specific history on mount or whenever the user changes (login / logout)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch (e) {
      console.error(`Failed to load chat history for ${userKey}`, e);
    }
    // If no history exists yet for this specific user, start fresh with their personal welcome message
    setMessages(defaultWelcomeMessage);
  }, [storageKey, userKey, defaultWelcomeMessage]);

  // Sync state changes across tabs & components for this specific user
  const persistAndNotify = useCallback(
    (newMessages: ChatMessage[]) => {
      setMessages(newMessages);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newMessages));
        window.dispatchEvent(new CustomEvent(syncEventName, { detail: newMessages }));
      } catch (e) {
        console.error('Failed to persist chat history', e);
      }
    },
    [storageKey, syncEventName]
  );

  // Listen for sync events scoped to this user
  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setMessages(e.detail);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setMessages(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener(syncEventName, handleSync);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(syncEventName, handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, [storageKey, syncEventName]);

  const sendMessage = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: cleanText,
      timestamp: new Date().toISOString(),
    };

    const aiMsgId = String(Date.now() + 1);
    const initialAiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      appointment: null,
    };

    const updatedWithUser = [...messages, userMsg];
    const withPlaceholder = [...updatedWithUser, initialAiMsg];
    setMessages(withPlaceholder);
    setLoading(true);

    let accumulatedContent = '';
    let appointmentInfo: ChatAppointmentInfo | null = null;

    try {
      const history = updatedWithUser
        .filter((m) => !m.id.startsWith('welcome'))
        .map((m) => ({ role: m.role, content: m.content }));

      // Try streaming first
      await api.streamChatMessage(
        cleanText,
        history,
        (token) => {
          accumulatedContent += token;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? { ...m, content: accumulatedContent }
                : m
            )
          );
        },
        (apt) => {
          appointmentInfo = apt;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? { ...m, appointment: apt }
                : m
            )
          );
        }
      );

      // Finalize and persist for this user
      const finalized = withPlaceholder.map((m) =>
        m.id === aiMsgId
          ? {
              ...m,
              content: accumulatedContent || 'Demande traitée.',
              appointment: appointmentInfo,
            }
          : m
      );
      persistAndNotify(finalized);
    } catch (streamErr) {
      console.warn('Streaming failed, falling back to sync chat:', streamErr);
      try {
        const history = updatedWithUser
          .filter((m) => !m.id.startsWith('welcome'))
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await api.sendChatMessage(cleanText, history);
        const finalized = withPlaceholder.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                content: res.response,
                appointment: res.appointment || null,
              }
            : m
        );
        persistAndNotify(finalized);
      } catch (err: any) {
        const errMsg: ChatMessage = {
          id: aiMsgId,
          role: 'assistant',
          content: `Désolé, une erreur est survenue lors de la communication avec l'assistant (${err.message || 'serveur inaccessible'}).`,
          timestamp: new Date().toISOString(),
        };
        const finalized = withPlaceholder.map((m) => (m.id === aiMsgId ? errMsg : m));
        persistAndNotify(finalized);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    const reset = defaultWelcomeMessage;
    persistAndNotify(reset);
  };

  const openWithPrompt = (prompt: string) => {
    setIsFloatingOpen(true);
    sendMessage(prompt);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        loading,
        isFloatingOpen,
        userStorageKey: userKey,
        setIsFloatingOpen,
        sendMessage,
        resetChat,
        openWithPrompt,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
