'use client';

import { ActionsPlus, Feather, GridFeedCards, LogInSquare, LogOutCircle, Mail, NotificationBell, Profile, Search } from '@/svg_components';
import { useSessionUserData } from '@/hooks/useSessionUserData';
import { useNotificationsCountQuery } from '@/hooks/queries/useNotificationsCountQuery';
import { useCreatePostModal } from '@/hooks/useCreatePostModal';
import Link from 'next/link';
import { useCallback } from 'react';
import { LogoText } from './LogoText';
import { MenuBarItem } from './MenuBarItem';

export function MenuBar() {
  const [user] = useSessionUserData();
  const isLoggedIn = !!user;
  const username = user?.username || 'user-not-found';
  const { data: notificationCount } = useNotificationsCountQuery();
  const { launchCreatePost } = useCreatePostModal();

  const handleNewPost = useCallback(() => {
    launchCreatePost({});
  }, [launchCreatePost]);

  // Mobile bottom bar: always exactly 5 items
  const mobileItems = isLoggedIn
    ? [
        { title: 'Feed', Icon: GridFeedCards, route: '/feed' },
        { title: 'Discover', Icon: Search, route: '/discover' },
        { title: 'Messages', Icon: Mail, route: '/messages' },
        { title: 'Notifications', Icon: NotificationBell, route: '/notifications', badge: notificationCount },
        { title: 'Profile', Icon: Profile, route: `/${username}` },
      ]
    : [
        { title: 'Feed', Icon: GridFeedCards, route: '/feed' },
        { title: 'Discover', Icon: Search, route: '/discover' },
        { title: 'Join', Icon: LogInSquare, route: '/login' },
      ];

  // Desktop sidebar: full menu
  const desktopItems = [
    { title: 'Feed', Icon: GridFeedCards, route: '/feed' },
    { title: 'Discover', Icon: Search, route: '/discover' },
    ...(isLoggedIn
      ? [
          { title: 'Messages', Icon: Mail, route: '/messages' },
          { title: 'Notifications', Icon: NotificationBell, route: '/notifications', badge: notificationCount },
          { title: 'My Profile', Icon: Profile, route: `/${username}` },
          { title: 'Logout', Icon: LogOutCircle, route: '/api/auth/signout' },
        ]
      : [
          { title: 'Join', Icon: LogInSquare, route: '/login' },
        ]),
  ];

  return (
    <>
      {/* Mobile bottom bar — 5 icons, always visible */}
      <div className="fixed bottom-0 z-[2] flex w-full border-t border-border/30 bg-background/80 backdrop-blur-md md:hidden">
        {mobileItems.map((item) => (
          <MenuBarItem key={item.title} {...item}>
            {item.title}
          </MenuBarItem>
        ))}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-[212px] md:flex-col md:items-start md:p-4">
        <Link href="/feed" title="Home" className="mb-4 flex items-center gap-2">
          <Feather className="h-12 w-12 stroke-primary" />
          <LogoText className="text-3xl" />
        </Link>
        {desktopItems.map((item) => (
          <MenuBarItem key={item.title} {...item}>
            {item.title}
          </MenuBarItem>
        ))}
        {isLoggedIn && (
          <button
            type="button"
            onClick={handleNewPost}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
          >
            <ActionsPlus className="h-5 w-5 fill-primary-foreground" />
            New Post
          </button>
        )}
        <a
          href="https://conciousnessrevolution.io"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary-accent/30 hover:text-foreground"
        >
          ← Main Site
        </a>
      </div>

      {/* Mobile: Floating action button for new post */}
      {isLoggedIn && (
        <button
          type="button"
          onClick={handleNewPost}
          className="fixed bottom-16 right-4 z-[3] flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 transition-transform active:scale-90 md:hidden"
          aria-label="New Post"
        >
          <ActionsPlus className="h-7 w-7 fill-primary-foreground" />
        </button>
      )}
    </>
  );
}
