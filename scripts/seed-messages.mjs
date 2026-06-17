import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding messages...');

  // Find our users
  const commander = await prisma.user.findUnique({ where: { username: 'commander' } });
  const araya = await prisma.user.findUnique({ where: { username: 'araya' } });
  const builder = await prisma.user.findUnique({ where: { username: 'first-builder' } });

  if (!commander || !araya || !builder) {
    console.error('Run seed-community.mjs first!');
    process.exit(1);
  }

  // Create DM: Commander <-> ARAYA
  const dm1 = await prisma.conversation.create({
    data: {
      type: 'DM',
      members: {
        create: [
          { userId: commander.id },
          { userId: araya.id },
        ],
      },
    },
  });

  await prisma.message.createMany({
    data: [
      { content: 'ARAYA, systems status?', conversationId: dm1.id, senderId: commander.id },
      { content: 'All systems green, Commander. 237 API functions active, frontend serving 85+ pages, brain has 158K atoms loaded.', conversationId: dm1.id, senderId: araya.id },
      { content: 'Good. The community platform just went live. Monitor for any issues.', conversationId: dm1.id, senderId: commander.id },
      { content: 'Monitoring active. I\'ll flag anything that needs attention. Welcome to COMMS-UNITY.', conversationId: dm1.id, senderId: araya.id },
    ],
  });

  // Create DM: Commander <-> First Builder
  const dm2 = await prisma.conversation.create({
    data: {
      type: 'DM',
      members: {
        create: [
          { userId: commander.id },
          { userId: builder.id },
        ],
      },
    },
  });

  await prisma.message.createMany({
    data: [
      { content: 'Welcome to the platform! What are you working on?', conversationId: dm2.id, senderId: commander.id },
      { content: 'Building a tool for the Guardian Forge — legal document automation. People shouldn\'t need to pay $500/hr for basic court filings.', conversationId: dm2.id, senderId: builder.id },
      { content: 'That\'s exactly the kind of thing we need. Check out the court form pipeline — there\'s already infrastructure for that.', conversationId: dm2.id, senderId: commander.id },
    ],
  });

  // Create a group chat
  const group = await prisma.conversation.create({
    data: {
      type: 'GROUP',
      name: 'Builders Lounge',
      members: {
        create: [
          { userId: commander.id },
          { userId: araya.id },
          { userId: builder.id },
        ],
      },
    },
  });

  await prisma.message.createMany({
    data: [
      { content: 'This is the builders lounge — open chat for anyone who\'s building.', conversationId: group.id, senderId: commander.id },
      { content: 'Systems are all green. Happy to help with any infrastructure questions.', conversationId: group.id, senderId: araya.id },
      { content: 'Glad to be here. Let\'s build something.', conversationId: group.id, senderId: builder.id },
    ],
  });

  console.log('\nMessages seeded!');
  console.log('  2 DM conversations');
  console.log('  1 Group chat (Builders Lounge)');
  console.log('  10 messages total');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
