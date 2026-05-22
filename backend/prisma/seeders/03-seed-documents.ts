import { faker } from '@faker-js/faker';
import { PrismaClient } from '../../generated/prisma/client';

interface User {
  id: string;
  name: string;
}

interface Course {
  id: string;
  code: string;
}

export async function seedDocuments(
  prisma: PrismaClient,
  users: User[],
  courses: Course[],
): Promise<any[]> {
  console.log('📄 Creating documents...');

  const documentTemplates = [
    {
      courseCode: 'SWE102',
      title: 'Introduction to NestJS Framework',
      topic: 'NestJS, decorators, dependency injection, modules',
    },
    {
      courseCode: 'SWE102',
      title: 'RESTful API Design Principles',
      topic: 'REST, HTTP methods, status codes, best practices',
    },
    {
      courseCode: 'DBI202',
      title: 'SQL Query Optimization and Indexing',
      topic: 'Database indexing, query optimization, execution plans',
    },
    {
      courseCode: 'DBI202',
      title: 'PostgreSQL Full-Text Search',
      topic: 'Full-text search, text vectors, GIN indexes, query syntax',
    },
    {
      courseCode: 'PRJ301',
      title: 'CI/CD Pipeline with GitHub Actions',
      topic: 'GitHub Actions, automated testing, deployment, release workflow',
    },
    {
      courseCode: 'AI101',
      title: 'Machine Learning Fundamentals',
      topic: 'Supervised learning, unsupervised learning, neural networks, model training',
    },
  ];

  const documents: any[] = [];

  for (let i = 0; i < documentTemplates.length; i++) {
    const template = documentTemplates[i];
    const user = users[i % users.length];
    const course = courses.find((c) => c.code === template.courseCode)!;

    const document = await prisma.document.create({
      data: {
        userId: user.id,
        courseId: course.id,
        title: template.title,
        fileUrl: `https://cdn.example.com/documents/${faker.string.uuid()}.pdf`,
        fullText: faker.lorem.paragraphs(8),
      },
    });

    documents.push(document);

    console.log(`   ✓ Document: "${document.title}" (by ${user.name}, course: ${course.code})`);
  }

  console.log(`✅ Created ${documents.length} documents\n`);

  return documents;
}
