import { faker } from '@faker-js/faker';
import { PrismaClient } from '../../generated/prisma/client';

interface User {
  id: string;
  fullName: string;
}

interface Subject {
  id: number;
  code: string;
  name: string;
}

export async function seedDocuments(
  prisma: PrismaClient,
  users: User[],
  subjects: Subject[],
): Promise<any[]> {
  console.log('📄 Creating documents...');

  const documentTemplates = [
    {
      subjectCode: 'SWE102',
      title: 'Introduction to NestJS Framework',
      description: 'A comprehensive guide to NestJS decorators, dependency injection, and modules',
    },
    {
      subjectCode: 'SWE102',
      title: 'RESTful API Design Principles',
      description:
        'Best practices for designing REST APIs with proper HTTP methods and status codes',
    },
    {
      subjectCode: 'DBI202',
      title: 'SQL Query Optimization and Indexing',
      description:
        'Advanced techniques for optimizing database queries and creating effective indexes',
    },
    {
      subjectCode: 'DBI202',
      title: 'PostgreSQL Full-Text Search',
      description: 'Implementing full-text search capabilities in PostgreSQL databases',
    },
    {
      subjectCode: 'PRJ301',
      title: 'CI/CD Pipeline with GitHub Actions',
      description: 'Automating testing and deployment workflows using GitHub Actions',
    },
    {
      subjectCode: 'AI101',
      title: 'Machine Learning Fundamentals',
      description: 'Core concepts of supervised learning, neural networks, and model training',
    },
    {
      subjectCode: 'WEB101',
      title: 'Responsive Web Design Techniques',
      description: 'Creating responsive and mobile-friendly web applications with modern CSS',
    },
    {
      subjectCode: 'SEC101',
      title: 'Cryptography and Data Encryption',
      description: 'Understanding encryption algorithms and secure data transmission methods',
    },
  ];

  const documents: any[] = [];
  const fileSize = BigInt(faker.number.int({ min: 1000000, max: 50000000 })); // 1MB - 50MB

  for (let i = 0; i < documentTemplates.length; i++) {
    const template = documentTemplates[i];
    const user = users[i % users.length];
    const subject = subjects.find((s) => s.code === template.subjectCode)!;

    const document = await prisma.document.create({
      data: {
        title: template.title,
        description: template.description,
        subjectId: subject.id,
        uploadedBy: user.id,
        fileUrl: `https://cdn.example.com/documents/${faker.string.uuid()}.pdf`,
        fileSize: fileSize,
        fileType: 'application/pdf',
        status: 'AVAILABLE',
      },
    });

    documents.push(document);

    console.log(
      `   ✓ Document: "${document.title}" (by ${user.fullName}, subject: ${subject.code})`,
    );
  }

  console.log(`✅ Created ${documents.length} documents\n`);

  return documents;
}
