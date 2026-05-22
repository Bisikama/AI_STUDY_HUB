import { PrismaClient, Role } from '../../generated/prisma/client';

export async function seedUsers(prisma: PrismaClient) {
  console.log('👤 Creating users...');

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Nguyễn Văn A',
        email: 'nguyen.van.a@example.com',
        username: 'vanA',
        hash_password: 'hashed_password_demo_123',
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Trần Thị B',
        email: 'tran.thi.b@example.com',
        username: 'thiB',
        hash_password: 'hashed_password_demo_456',
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Lê Văn C',
        email: 'le.van.c@example.com',
        username: 'vanC',
        hash_password: 'hashed_password_demo_789',
        role: Role.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Phạm Thị D',
        email: 'pham.thi.d@example.com',
        username: 'thiD',
        hash_password: 'hashed_password_demo_000',
        role: Role.USER,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users\n`);

  return users;
}
