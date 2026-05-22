import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { clearAllData } from './seeders/00-clear-data';
import { seedUsers } from './seeders/01-seed-users';
import { seedCourses } from './seeders/02-seed-courses';
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

    // Bước 2: Seed Users (cha)
    const users = await seedUsers(prisma);

    // Bước 3: Seed Courses (cha)
    const courses = await seedCourses(prisma);

    // Bước 4: Seed Documents (phụ thuộc Users, Courses)
    const documents = await seedDocuments(prisma, users, courses);

    // Bước 5: Seed Summaries (phụ thuộc Documents)
    await seedSummaries(prisma, documents);

    // Bước 6: Seed Quizzes (phụ thuộc Documents)
    await seedQuizzes(prisma, documents);

    console.log('🎉 Database seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
