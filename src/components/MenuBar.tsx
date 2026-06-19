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

  const menuItems = [
    {
      title: 'Feed',
      Icon: GridFeedCards,
      route: '/feed',
    },
    {
      title: 'Discover',
      Icon: Search,
      route: '/discover',
    },
    ...(isLoggedIn
      ? [
          {
            title: 'Messages',
            Icon: Mail,
            route: '/messages',
          },
          {
            title: 'Notifications',
            Icon: NotificationBell,
            route: '/notifications',
            badge: notificationCount,
          },
          { title: 'My Profile', Icon: Profile, route: `/${username}` },
          {
            title: 'Logout',
            Icon: LogOutCircle,
            route: '/api/auth/signout',
          },
        ]
      : [
          {
            title: 'Join',
            Icon: LogInSquare,
            route: '/login',
          },
        ]),
  ];

  return (
    <div className="fixed bottom-0 z-[2] flex w-full bg-background/70 shadow-inner backdrop-blur-sm md:sticky md:top-0 md:h-screen md:w-[212px] md:flex-col md:items-start md:bg-inherit md:p-4 md:shadow-none md:backdrop-blur-none">
      <Link href="/" title="Home" className="mb-4 hidden items-center gap-2 md:flex">
        <Feather className="h-12 w-12 stroke-primary" />
        <LogoText className="text-3xl" />
      </Link>
      {menuItems.map((item) => (
        <MenuBarItem key={item.title} {...item}>
          {item.title}
        </MenuBarItem>
      ))}
      {isLoggedIn && (
        <>
          {/* Desktop: New Post button in sidebar */}
          <button
            type="button"
            onClick={handleNewPost}
            className="mt-4 hidden w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/80 md:flex"
          >
            <ActionsPlus className="h-5 w-5 fill-primary-foreground" />
            New Post
          </button>
          {/* Mobile: Floating action button above the bottom bar */}
          <button
            type="button"
            onClick={handleNewPost}
            className="fixed bottom-20 right-4 z-[3] flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 transition-transform active:scale-90 md:hidden"
            aria-label="New Post"
          >
            <ActionsPlus className="h-7 w-7 fill-primary-foreground" />
          </button>
        </>
      )}
    </div>
  );
}
