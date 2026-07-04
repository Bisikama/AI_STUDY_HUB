import { PrismaClient } from '../../generated/prisma/client';

export async function clearAllData(prisma: PrismaClient): Promise<void> {
  console.log('🔄 Clearing existing data...');

  // Xóa theo thứ tự: con trước, cha sau để không vi phạm Foreign Key (Ràng buộc khóa ngoại)
  // Gói trong transaction đảm bảo nếu lỗi ở 1 bảng thì toàn bộ sẽ được rollback lại
  await prisma.$transaction([
    prisma.userQuizAttempt.deleteMany(),
    prisma.quizOption.deleteMany(),
    prisma.quizQuestion.deleteMany(),
    prisma.quiz.deleteMany(),
    prisma.documentSummary.deleteMany(),
    prisma.uploadStatus.deleteMany(),
    prisma.document.deleteMany(),
    prisma.personalFolder.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.majorSubject.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.major.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('✅ Data cleared successfully\n');
}
