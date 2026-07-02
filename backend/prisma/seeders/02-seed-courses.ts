import { PrismaClient } from '../../generated/prisma/client';

export async function seedSubjects(prisma: PrismaClient) {
  console.log('📚 Creating majors and subjects...');

  // 1. Create Majors
  const se = await prisma.major.create({
    data: {
      code: 'SE',
      name: 'Software Engineering',
      isActive: true,
    },
  });

  const ai = await prisma.major.create({
    data: {
      code: 'AI',
      name: 'Artificial Intelligence',
      isActive: true,
    },
  });

  const is = await prisma.major.create({
    data: {
      code: 'IS',
      name: 'Information Systems',
      isActive: true,
    },
  });

  // 2. Create Subjects and link to Majors
  const subjects = await Promise.all([
    // SE Subjects
    prisma.subject.create({
      data: {
        code: 'SWE102',
        name: 'Web Development with NestJS',
        description: 'Learn modern backend development using NestJS framework',
        isSystem: true,
        majors: {
          create: [{ majorId: se.id }],
        },
      },
    }),
    prisma.subject.create({
      data: {
        code: 'PRJ301',
        name: 'Project Management & DevOps',
        description: 'Understand CI/CD pipelines and project management best practices',
        isSystem: true,
        majors: {
          create: [{ majorId: se.id }, { majorId: is.id }],
        },
      },
    }),
    prisma.subject.create({
      data: {
        code: 'WEB101',
        name: 'Web Technologies Fundamentals',
        description: 'HTML, CSS, JavaScript, and responsive design principles',
        isSystem: true,
        majors: {
          create: [{ majorId: se.id }],
        },
      },
    }),

    // IS Subjects
    prisma.subject.create({
      data: {
        code: 'DBI202',
        name: 'Database Systems & SQL Optimization',
        description: 'Master database design and query optimization techniques',
        isSystem: true,
        majors: {
          create: [{ majorId: is.id }, { majorId: se.id }],
        },
      },
    }),
    prisma.subject.create({
      data: {
        code: 'SEC101',
        name: 'Information Security & Cryptography',
        description: 'Security principles, encryption methods, and secure coding practices',
        isSystem: true,
        majors: {
          create: [{ majorId: is.id }, { majorId: se.id }],
        },
      },
    }),

    // AI Subjects
    prisma.subject.create({
      data: {
        code: 'AI101',
        name: 'Introduction to Machine Learning',
        description: 'Fundamentals of machine learning and neural networks',
        isSystem: true,
        majors: {
          create: [{ majorId: ai.id }],
        },
      },
    }),
  ]);

  console.log(`✅ Created 3 majors and ${subjects.length} subjects\n`);

  return subjects;
}
