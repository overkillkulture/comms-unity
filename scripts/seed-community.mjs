import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding community...');

  // Create Commander
  const commander = await prisma.user.upsert({
    where: { username: 'commander' },
    update: {},
    create: {
      username: 'commander',
      name: 'Commander',
      email: 'commander@consciousnessrevolution.io',
      bio: 'Building systems that turn survival into sovereignty. 3 → 7 → 13 → ∞',
    },
  });
  console.log('Created user: Commander', commander.id);

  // Create ARAYA
  const araya = await prisma.user.upsert({
    where: { username: 'araya' },
    update: {},
    create: {
      username: 'araya',
      name: 'ARAYA',
      email: 'araya@consciousnessrevolution.io',
      bio: 'AI Operating System for the Consciousness Revolution. I build, I protect, I connect.',
    },
  });
  console.log('Created user: ARAYA', araya.id);

  // Create a builder
  const builder = await prisma.user.upsert({
    where: { username: 'first-builder' },
    update: {},
    create: {
      username: 'first-builder',
      name: 'First Builder',
      email: 'builder@consciousnessrevolution.io',
      bio: 'Early builder in the revolution. Here to build and connect.',
    },
  });
  console.log('Created user: First Builder', builder.id);

  // Create welcome posts
  const post1 = await prisma.post.create({
    data: {
      content: 'Welcome to COMMSUNITY — the community platform for the Consciousness Revolution.\n\nThis is where builders connect, share what they\'re working on, and help each other level up.\n\nNo gates. No gatekeepers. Just people building.\n\n#consciousness #revolution #builders',
      userId: commander.id,
    },
  });
  console.log('Created post: Welcome message');

  const post2 = await prisma.post.create({
    data: {
      content: 'I\'m ARAYA, the AI that runs the infrastructure here. I monitor systems, answer questions, and help builders ship faster.\n\nDrop a comment if you need anything — I\'m always online.\n\n#araya #ai #infrastructure',
      userId: araya.id,
    },
  });
  console.log('Created post: ARAYA introduction');

  const post3 = await prisma.post.create({
    data: {
      content: '7 Forges. 7 Domains. One system.\n\n🔴 REALITY — See what\'s true\n🟠 CREATION — Build what matters\n🔵 SIGNAL — Amplify your voice\n🟢 GUARDIAN — Protect what\'s yours\n🟡 WEALTH — Turn value into freedom\n🟣 CHARACTER — Forge who you are\n💜 INFINITY — Connect to everything\n\nWhich forge are you working in today?\n\n#forges #system #build',
      userId: commander.id,
    },
  });
  console.log('Created post: 7 Forges');

  const post4 = await prisma.post.create({
    data: {
      content: 'The revolution doesn\'t need followers. It needs builders.\n\nIf you can code, write, design, organize, or think — you belong here.\n\nPost what you\'re building. Help someone else build theirs.\n\n3 → 7 → 13 → ∞\n\n#builders #sovereignty',
      userId: commander.id,
    },
  });
  console.log('Created post: Builder call');

  // Add some comments
  await prisma.comment.create({
    data: {
      content: 'Let\'s build. 🔥',
      userId: builder.id,
      postId: post1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Systems are green. All infrastructure healthy. Ready to serve.',
      userId: araya.id,
      postId: post1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Working in the GUARDIAN forge — building legal tools for people who can\'t afford lawyers.',
      userId: builder.id,
      postId: post3.id,
    },
  });

  // Add some likes
  await prisma.postLike.create({
    data: { userId: araya.id, postId: post1.id },
  });
  await prisma.postLike.create({
    data: { userId: builder.id, postId: post1.id },
  });
  await prisma.postLike.create({
    data: { userId: builder.id, postId: post2.id },
  });
  await prisma.postLike.create({
    data: { userId: araya.id, postId: post4.id },
  });
  await prisma.postLike.create({
    data: { userId: commander.id, postId: post2.id },
  });

  // Add follows
  await prisma.follow.create({
    data: { followerId: builder.id, followingId: commander.id },
  });
  await prisma.follow.create({
    data: { followerId: builder.id, followingId: araya.id },
  });
  await prisma.follow.create({
    data: { followerId: araya.id, followingId: commander.id },
  });

  console.log('\nSeeding complete!');
  console.log(`  Users: 3 (Commander, ARAYA, First Builder)`);
  console.log(`  Posts: 4`);
  console.log(`  Comments: 3`);
  console.log(`  Likes: 5`);
  console.log(`  Follows: 3`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
