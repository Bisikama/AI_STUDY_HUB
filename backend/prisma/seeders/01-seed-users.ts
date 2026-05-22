import { PrismaClient, UserRole } from '../../generated/prisma/client';
import bcrypt from 'bcrypt';

export async function seedUsers(prisma: PrismaClient) {
  console.log('👤 Creating users...');

  // Tạo mật khẩu demo: password123
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    // Teachers
    prisma.user.create({
      data: {
        email: 'teacher.nguyen@example.com',
        passwordHash: hashedPassword,
        fullName: 'Nguyễn Văn A',
        avatarUrl: 'https://api.example.com/avatars/teacher1.jpg',
        role: UserRole.TEACHER,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'teacher.tran@example.com',
        passwordHash: hashedPassword,
        fullName: 'Trần Thị B',
        avatarUrl: 'https://api.example.com/avatars/teacher2.jpg',
        role: UserRole.TEACHER,
        isActive: true,
      },
    }),
    // Admin
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash: hashedPassword,
        fullName: 'Lê Văn Admin',
        avatarUrl: 'https://api.example.com/avatars/admin.jpg',
        role: UserRole.ADMIN,
        isActive: true,
      },
    }),
    // Students
    prisma.user.create({
      data: {
        email: 'student.phạm@example.com',
        passwordHash: hashedPassword,
        fullName: 'Phạm Thị D',
        role: UserRole.STUDENT,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'student.hoàng@example.com',
        passwordHash: hashedPassword,
        fullName: 'Hoàng Văn E',
        role: UserRole.STUDENT,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'student.vũ@example.com',
        passwordHash: hashedPassword,
        fullName: 'Vũ Thị F',
        role: UserRole.STUDENT,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users\n`);

  return users;
}
