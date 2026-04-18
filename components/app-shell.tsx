'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Profile } from '@/lib/supabase/types';
import { Avatar } from '@/components/ui/avatar';
import { IconButton } from '@/components/ui/button';
import {
  IconMessageSquare, IconUsers, IconNotes, IconCircle, IconUser, IconSun, IconMoon,
  IconLogout, IconHome, IconBell, IconSearch, Logomark, VerifyBadge,
} from '@/components/icons';
import { useTheme } from '@/components/theme-provider';
import { createClient } from '@/lib/supabase/client';

const ProfileCtx = createContext<Profile | null>(null);
export function useMe() {
  const p = useContext(ProfileCtx);
  if (!p) throw new Error('useMe must be used inside AppShell');
  return p;
}

const navItems = [
  { id: 'chats', label: 'Chats', href: '/chats', icon: IconMessageSquare },
  { id: 'posts', label: 'Feed', href: '/posts', icon: IconHome },
  { id: 'stories', label: 'Stories', href: '/stories', icon: IconCircle },
  { id: 'notes', label: 'Notes', href: '/notes', icon: IconNotes },
  { id: 'groups', label: 'Groups', href: '/groups', icon: IconUsers },
  { id: 'search', label: 'Search', href: '/search', icon: IconSearch },
  { id: 'profile', label: 'Profile', href: '/profile', icon: IconUser },
];

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [width, setWidth] = useState(1024);

  useEffect(() => {
    const on = () => setWidth(window.innerWidth);
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  return (
    <ProfileCtx.Provider value={profile}>
      <div className="h-screen w-screen flex overflow-hidden" style={{ background: 'var(--bg)' }}>
        {/* Desktop sidebar */}
        {!isMobile && !isTablet && (
          <aside className="w-[280px] flex-shrink-0 h-full flex flex-col border-r border-[var(--border)]"
            style={{ background: 'var(--bg-2)' }}>
            <div className="px-5 py-[18px] flex items-center gap-2.5">
              <Logomark size={24} />
              <span className="font-semibold text-[15px] tracking-tight">Callhub</span>
            </div>

              <Link href="/profile"
              className="ch-hover flex items-center gap-3 mx-3 my-1 px-3 py-2.5 rounded-xl transition-colors">
              <Avatar user={profile} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold truncate">{profile.display_name}</span>
                </div>
                <div className="text-[12.5px] text-[var(--text-2)] mt-0.5">@{profile.username}</div>
              </div>
            </Link>

            <nav className="px-3 flex flex-col gap-0.5 mt-2">
              {navItems.map((it) => {
                const active = pathname.startsWith(it.href);
                const Icon = it.icon;
                return (
                  <Link key={it.id} href={it.href}
                    className="ch-nav-item flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all"
                    style={{
                      color: active ? 'var(--accent)' : 'var(--text)',
                      background: active ? 'color-mix(in oklab, var(--accent) 10%, transparent)' : 'transparent',
                    }}>
                    <Icon size={18} /><span>{it.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex-1" />
            <div className="p-3 border-t border-[var(--border)] flex items-center gap-2">
              <button onClick={toggle}
                className="ch-hover flex-1 flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13px] transition-all">
                {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
                <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </button>
              <IconButton title="Log out" onClick={signOut}><IconLogout size={18} /></IconButton>
            </div>
          </aside>
        )}

        {/* Tablet rail */}
        {isTablet && (
          <aside className="w-16 flex-shrink-0 h-full border-r border-[var(--border)] flex flex-col items-center py-3.5 gap-0.5"
            style={{ background: 'var(--bg-2)' }}>
            <div className="mb-2.5"><Logomark size={24} /></div>
            {navItems.map((it) => {
              const active = pathname.startsWith(it.href);
              const Icon = it.icon;
              return (
                <Link key={it.id} href={it.href} title={it.label}
                  className="w-10 h-10 rounded-[10px] inline-flex items-center justify-center transition-all"
                  style={{
                    color: active ? 'var(--accent)' : 'var(--text-2)',
                    background: active ? 'color-mix(in oklab, var(--accent) 10%, transparent)' : 'transparent',
                  }}>
                  <Icon size={18} />
                </Link>
              );
            })}
            <div className="flex-1" />
            <IconButton onClick={toggle}>{theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}</IconButton>
            <IconButton onClick={signOut}><IconLogout size={18} /></IconButton>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 h-full flex flex-col">
          {isMobile && <MobileHeader theme={theme} toggle={toggle} />}
          <div className="flex-1 min-h-0 overflow-hidden flex">{children}</div>
          {isMobile && <MobileNav pathname={pathname} />}
        </main>
      </div>
    </ProfileCtx.Provider>
  );
}

function MobileHeader({ theme, toggle }: { theme: string; toggle: () => void }) {
  const pathname = usePathname();
  const title =
    pathname.startsWith('/chats') ? 'Messages' :
    pathname.startsWith('/notes') ? 'Notes' :
    pathname.startsWith('/posts') ? 'Feed' :
    pathname.startsWith('/stories') ? 'Stories' :
    pathname.startsWith('/groups') ? 'Groups' :
    pathname.startsWith('/search') ? 'Search' :
    pathname.startsWith('/profile') ? 'Profile' :
    pathname.startsWith('/settings') ? 'Settings' : 'Callhub';

  return (
    <header className="px-4 pt-3.5 pb-3 border-b border-[var(--border)] flex items-center gap-2.5 relative z-[2]"
      style={{ background: 'color-mix(in oklab, var(--bg) 80%, transparent)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center gap-2 flex-1">
        <Logomark size={22} />
        <h1 className="text-lg font-semibold tracking-tight m-0">{title}</h1>
      </div>
      <IconButton onClick={toggle}>{theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}</IconButton>
    </header>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  const items = [
    { id: 'chats', href: '/chats', icon: IconMessageSquare, label: 'Chats' },
    { id: 'posts', href: '/posts', icon: IconHome, label: 'Feed' },
    { id: 'stories', href: '/stories', icon: IconCircle, label: 'Stories' },
    { id: 'notes', href: '/notes', icon: IconNotes, label: 'Notes' },
    { id: 'profile', href: '/profile', icon: IconUser, label: 'Profile' },
  ];
  return (
    <nav className="border-t border-[var(--border)] flex px-1.5 pt-2 pb-3 relative z-[2]"
      style={{ background: 'color-mix(in oklab, var(--bg) 88%, transparent)', backdropFilter: 'blur(14px)' }}>
      {items.map((it) => {
        const active = pathname.startsWith(it.href);
        const Icon = it.icon as any;
        return (
          <Link key={it.id} href={it.href}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-[10px] transition-colors"
            style={{ color: active ? 'var(--accent)' : 'var(--text-2)' }}>
            <Icon size={20} stroke={active ? 2 : 1.75} />
            <span className="text-[10.5px]" style={{ fontWeight: active ? 600 : 500 }}>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
