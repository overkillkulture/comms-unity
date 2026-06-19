import { CreatePostModalLauncher } from '@/components/CreatePostModalLauncher';
import { Posts } from '@/components/Posts';
import { PublicPosts } from '@/components/PublicPosts';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';
import { getServerUser } from '@/lib/getServerUser';

export const metadata = {
  title: 'Community | Feed',
};

export default async function Page() {
  const [user] = await getServerUser();
  return (
    <div className="px-2 pt-3 sm:px-4 sm:pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold sm:text-4xl">Feed</h1>
        <div>
          <ThemeSwitch />
        </div>
      </div>
      {user && <CreatePostModalLauncher />}
      {user ? (
        <Posts type="feed" userId={user.id} />
      ) : (
        <PublicPosts />
      )}
    </div>
  );
}
