import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import FloatingChatWidget from '@/components/chat/FloatingChatWidget';

export const metadata: Metadata = {
  title: 'Clinique SantéPlus | Plateforme de Gestion Médicale & IA',
  description: 'Système complet de gestion de clinique avec dossiers patients, agenda médical, ordonnances et assistant IA clinique.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <ChatProvider>
            {children}
            <FloatingChatWidget />
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

