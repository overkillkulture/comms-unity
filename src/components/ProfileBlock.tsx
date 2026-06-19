import Link from 'next/link';
import { ProfilePhoto } from './ui/ProfilePhoto';

export default function ProfileBlock({
  type = 'post',
  username,
  name,
  time,
  photoUrl,
}: {
  type?: 'post' | 'comment';
  name: string;
  username: string;
  time: string;
  photoUrl: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="h-10 w-10 flex-shrink-0 sm:h-12 sm:w-12">
        <ProfilePhoto photoUrl={photoUrl} username={username} name={name} />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1 sm:gap-3">
          <h2 className="cursor-pointer text-base font-semibold text-muted-foreground sm:text-lg">
            <Link href={`/${username}`} className="link">
              {name}
            </Link>
          </h2>
          {type === 'comment' && <h2 className="text-sm text-muted-foreground/90">{time} ago</h2>}
        </div>
        {type === 'post' && <h2 className="text-sm text-muted-foreground/90">{time} ago</h2>}
      </div>
    </div>
  );
}
