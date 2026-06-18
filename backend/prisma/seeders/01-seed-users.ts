import { PrismaClient } from '../../generated/prisma/client';
import { Role } from '../../generated/prisma/enums';
import bcrypt from 'bcrypt';

export async function seedUsers(prisma: PrismaClient) {
  console.log('👤 Creating users...');

  // Tạo mật khẩu demo: password123
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    // Teachers (will be mapped to USER)
    prisma.user.create({
      data: {
        email: 'teacher.nguyen@example.com',
        password: hashedPassword,
        name: 'Nguyễn Văn A',
        avatarUrl: 'https://api.example.com/avatars/teacher1.jpg',
        role: Role.USER,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'teacher.tran@example.com',
        password: hashedPassword,
        name: 'Trần Thị B',
        avatarUrl: 'https://api.example.com/avatars/teacher2.jpg',
        role: Role.USER,
        isActive: true,
      },
    }),
    // Admin
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Lê Văn Admin',
        avatarUrl: 'https://api.example.com/avatars/admin.jpg',
        role: Role.ADMIN,
        isActive: true,
      },
    }),
    // Students (will be mapped to USER)
    prisma.user.create({
      data: {
        email: 'student.pham@example.com',
        password: hashedPassword,
        name: 'Phạm Thị D',
        role: Role.USER,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'student.hoang@example.com',
        password: hashedPassword,
        name: 'Hoàng Văn E',
        role: Role.USER,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'student.vu@example.com',
        password: hashedPassword,
        name: 'Vũ Thị F',
        role: Role.USER,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users\n`);

  return users;
}
