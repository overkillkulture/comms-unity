import Link from 'next/link';
import { UserAuthForm } from '../UserAuthForm';

export const metadata = {
  title: 'Community | Join',
};

export default function Page() {
  return (
    <>
      <h1 className="mb-5 text-5xl font-bold">Join the Community</h1>
      <p className="mb-4 text-lg text-muted-foreground">Type your name and you&apos;re in</p>
      <UserAuthForm mode="login" />
    </>
  );
}
