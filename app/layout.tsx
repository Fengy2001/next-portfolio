import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Fengs Portfolio!',
  description: 'Check out my cool portfolio!'
};

export const viewport: Viewport = {
  maximumScale: 1
};

function Header() {
  return (
    <header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-around">
        <div>Work</div>
        <div>In</div>
        <div>Progress</div>
      </div>
    </header>
  );
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-stretch justify-center">
          {children}
        </main>
      </body>
    </html>
  );
}