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

    // 1. Random trạng thái cho thực tế (để UI có nhiều màu sắc khác nhau)
    const randomStatus = faker.helpers.arrayElement(['PRIVATE', 'PENDING', 'APPROVED']);

    // 2. Format lại chuẩn URL của Supabase
    const fakeSupabaseUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/documents/seed-${faker.string.uuid()}.pdf`;

    const document = await prisma.document.create({
      data: {
        title: template.title,
        description: template.description,
        subjectId: subject.id,
        uploadedBy: user.id,
        fileUrl: fakeSupabaseUrl,
        fileSize: fileSize,
        fileType: 'application/pdf',
        status: randomStatus, // Đã fix đúng chuẩn Schema mới
        rating: parseFloat(faker.number.float({ min: 3.5, max: 5.0 }).toFixed(1)),
        viewCount: faker.number.int({ min: 50, max: 2000 }),
        downloadCount: faker.number.int({ min: 10, max: 800 }),

        // [QUAN TRỌNG] Thêm text giả để lát nữa làm Task AI có cái cho Gemini đọc
        fullText: `Đây là nội dung học thuật giả lập cho môn học ${subject.code}. ${faker.lorem.paragraphs(3)}`,
      },
    });

    documents.push(document);

    console.log(
      `   ✓ Document: "${document.title}" (by ${user.fullName}, status: ${randomStatus})`,
    );
  }

  console.log(`✅ Created ${documents.length} documents\n`);

  return documents;
}
