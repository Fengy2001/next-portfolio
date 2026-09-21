'use client';
import { useState } from 'react';
import DisplayScene from '@/components/display_scene';
import Blog from '@/scenes/blog';

const NAV_ITEMS = [
  { label: 'Home', sceneKey: 'mathBlackhole' },
  { label: 'About Me', sceneKey: 'aboutMe' },
  { label: 'Projects', sceneKey: 'projects' },
  { label: 'Blog', sceneKey: 'blog' },
];

export default function Page() {
  const [scene, setScene] = useState('mathBlackhole');
  const [menuOpen, setMenuOpen] = useState(false);
  const [blogTargetSlug, setBlogTargetSlug] = useState<string | null>(null);

  const selectScene = (key: string) => {
    setScene(key);
    setBlogTargetSlug(null);
    setMenuOpen(false);
  };

  const navigateToBlogPost = (slug: string) => {
    setScene('blog');
    setBlogTargetSlug(slug);
    setMenuOpen(false);
  };

  const availableItems = NAV_ITEMS.filter((item) => item.sceneKey !== scene);

  return (
    <>
      <header className="w-full relative z-50">
        <div className="hidden md:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 items-center justify-around">
          {availableItems.map((item) => (
            <div
              key={item.sceneKey}
              onClick={() => selectScene(item.sceneKey)}
              className="cursor-pointer text-white/60 hover:text-white transition-colors text-xl"
            >
              {item.label}
            </div>
          ))}
        </div>

        <div className="md:hidden px-4 py-4">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="w-9 h-9 flex flex-col justify-center items-start gap-1.5 relative z-50"
          >
            <span className={`block h-0.5 w-7 bg-white transition-transform duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 w-7 bg-white transition-opacity duration-300 ${menuOpen ? 'opacity-0' : 'opacity-100'}`} />
            <span className={`block h-0.5 w-7 bg-white transition-transform duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        <div
          className={`md:hidden fixed top-0 left-0 h-screen w-1/2 max-w-xs bg-black/95 backdrop-blur-md border-r border-white/10 z-50 transform transition-transform duration-300 ease-out ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col gap-6 pt-24 px-6">
            {availableItems.map((item) => (
              <div
                key={item.sceneKey}
                onClick={() => selectScene(item.sceneKey)}
                className="cursor-pointer text-lg text-white/60 hover:text-white transition-colors"
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {menuOpen && (
          <div
            onClick={() => setMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-black/40 z-40"
          />
        )}
      </header>

      {scene === 'blog' ? (
        <Blog initialSlug={blogTargetSlug} />
      ) : (
        <DisplayScene scenename={scene} onNavigate={navigateToBlogPost} />
      )}
    </>
  );
}