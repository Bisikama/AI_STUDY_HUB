import { PrismaClient } from '../../generated/prisma/client';

export async function seedSubjects(prisma: PrismaClient) {
  console.log('📚 Creating subjects...');

  const subjects = await Promise.all([
    prisma.subject.create({
      data: {
        code: 'SWE102',
        name: 'Web Development with NestJS',
        description: 'Learn modern backend development using NestJS framework',
      },
    }),
    prisma.subject.create({
      data: {
        code: 'DBI202',
        name: 'Database Systems & SQL Optimization',
        description: 'Master database design and query optimization techniques',
      },
    }),
    prisma.subject.create({
      data: {
        code: 'PRJ301',
        name: 'Project Management & DevOps',
        description: 'Understand CI/CD pipelines and project management best practices',
      },
    }),
    prisma.subject.create({
      data: {
        code: 'AI101',
        name: 'Introduction to Machine Learning',
        description: 'Fundamentals of machine learning and neural networks',
      },
    }),
    prisma.subject.create({
      data: {
        code: 'WEB101',
        name: 'Web Technologies Fundamentals',
        description: 'HTML, CSS, JavaScript, and responsive design principles',
      },
    }),
    prisma.subject.create({
      data: {
        code: 'SEC101',
        name: 'Information Security & Cryptography',
        description: 'Security principles, encryption methods, and secure coding practices',
      },
    }),
  ]);

  console.log(`✅ Created ${subjects.length} subjects\n`);

  return subjects;
}
