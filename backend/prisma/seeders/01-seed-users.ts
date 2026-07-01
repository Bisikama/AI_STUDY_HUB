import { PrismaClient } from '../../generated/prisma/client';
import { UserRole } from '../../generated/prisma/enums';
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
        storageUsage: { create: { quotaBytes: 1073741824n, usedBytes: 0n, reservedBytes: 0n, trashBytes: 0n } },
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
        storageUsage: { create: { quotaBytes: 1073741824n, usedBytes: 0n, reservedBytes: 0n, trashBytes: 0n } },
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
        storageUsage: { create: { quotaBytes: 1073741824n, usedBytes: 0n, reservedBytes: 0n, trashBytes: 0n } },
      },
    }),
    // Students
    prisma.user.create({
      data: {
        email: 'student.pham@example.com',
        passwordHash: hashedPassword,
        fullName: 'Phạm Thị D',
        role: UserRole.STUDENT,
        isActive: true,
        storageUsage: { create: { quotaBytes: 1073741824n, usedBytes: 0n, reservedBytes: 0n, trashBytes: 0n } },
      },
    }),
    prisma.user.create({
      data: {
        email: 'student.hoang@example.com',
        passwordHash: hashedPassword,
        fullName: 'Hoàng Văn E',
        role: UserRole.STUDENT,
        isActive: true,
        storageUsage: { create: { quotaBytes: 1073741824n, usedBytes: 0n, reservedBytes: 0n, trashBytes: 0n } },
      },
    }),
    prisma.user.create({
      data: {
        email: 'student.vu@example.com',
        passwordHash: hashedPassword,
        fullName: 'Vũ Thị F',
        role: UserRole.STUDENT,
        isActive: true,
        storageUsage: { create: { quotaBytes: 1073741824n, usedBytes: 0n, reservedBytes: 0n, trashBytes: 0n } },
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users\n`);

  return users;
}
