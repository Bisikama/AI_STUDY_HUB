import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { clearAllData } from './seeders/00-clear-data';
import { seedUsers } from './seeders/01-seed-users';
import { seedSubjects } from './seeders/02-seed-courses';
import { seedDocuments } from './seeders/03-seed-documents';
import { seedSummaries } from './seeders/04-seed-summaries';
import { seedQuizzes } from './seeders/05-seed-quizzes';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('\n🚀 Starting database seeding...\n');

  try {
    // Bước 1: Xóa dữ liệu cũ
    await clearAllData(prisma);

    // Bước 2: Seed Users
    const users = await seedUsers(prisma);

    // Bước 3: Seed Subjects
    const subjects = await seedSubjects(prisma);

    // Bước 4: Seed Documents (phụ thuộc Users, Subjects)
    const documents = await seedDocuments(prisma, users, subjects);

    // Bước 5: Seed Document Summaries (phụ thuộc Documents)
    await seedSummaries(prisma, documents);

    // Bước 6: Seed Quizzes (phụ thuộc Documents)
    await seedQuizzes(prisma, documents);

    // Bước 7: Seed User Document Views (Lịch sử xem)
    console.log('👀 Seeding document views history...');
    const approvedDocs = documents.filter((doc) => doc.visibilityStatus === 'PUBLIC');
    if (approvedDocs.length > 0) {
      const student = users.find((u) => u.email.startsWith('student.phạm'));
      if (student) {
        // Cho student xem 3 tài liệu gần nhất
        const docsToView = approvedDocs.slice(0, 3);
        for (let j = 0; j < docsToView.length; j++) {
          await prisma.userDocumentView.create({
            data: {
              userId: student.id,
              documentId: docsToView[j].id,
              viewedAt: new Date(Date.now() - j * 60 * 60 * 1000), // Xem cách nhau 1 giờ
            },
          });
        }
      }
    }

    console.log('🎉 Database seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
