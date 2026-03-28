import type {Metadata} from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'UndanganKita - Layanan Undangan Online',
  description: 'Platform pembuatan undangan digital interaktif dengan fitur RSVP, Galeri, dan Pembayaran Otomatis.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id">
      <body suppressHydrationWarning className="antialiased">
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
