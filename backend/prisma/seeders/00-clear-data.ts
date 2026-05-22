import { PrismaClient } from '../../generated/prisma/client';

export async function clearAllData(prisma: PrismaClient): Promise<void> {
  console.log('🔄 Clearing existing data...');

  // Xóa theo thứ tự: con trước, cha sau để không vi phạm Foreign Key (Ràng buộc khóa ngoại)
  // Gói trong transaction đảm bảo nếu lỗi ở 1 bảng thì toàn bộ sẽ được rollback lại
  await prisma.$transaction([
    prisma.quiz.deleteMany(),
    prisma.summary.deleteMany(),
    prisma.document.deleteMany(),
    prisma.course.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('✅ Data cleared successfully\n');
}
