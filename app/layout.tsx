import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Fengs Portfolio!',
  description: 'Check out my cool portfolio!'
};

// function Header() {
//   return (
//     <header>
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-around">
//         <div>Home</div>
//         <div>About Me</div>
//         <div>Blog</div>
//       </div>
//     </header>
//   );
// }

export const viewport: Viewport = {
  maximumScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-full flex flex-col">
        <main className="flex-1 flex flex-col min-h-0">
          {children}
        </main>
      </body>
    </html>
  );
}