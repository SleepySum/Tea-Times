import type { Metadata } from 'next';
import './global.css';
import { AestheticLoader } from '@/components/motion/AestheticLoader';
import { Header } from '@/components/layout/Header';
import { TickerTape } from '@/components/layout/TickerTape';
import { AuthFlow } from '@/components/features/AuthFlow';
import { ArticleDetail } from '@/components/features/ArticleDetail';

export const metadata: Metadata = {
  title: 'THE TEA TIMES // your daily tea',
  description: 'Cyberpunk neo-brutalist magazine featuring physics-driven liquid motion and AI intelligence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-accent selection:text-black">
        <AestheticLoader />
        <Header />
        <main className="pb-20">{children}</main>
        <TickerTape />
        <AuthFlow />
        <ArticleDetail />
      </body>
    </html>
  );
}
