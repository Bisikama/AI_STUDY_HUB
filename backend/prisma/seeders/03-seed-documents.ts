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
    {
      subjectCode: 'SWE102',
      title: 'Microservices Architecture with NestJS',
      description: 'Implementing event-driven microservices using NestJS and Redis',
    },
    {
      subjectCode: 'DBI202',
      title: 'Database Sharding and Replication',
      description: 'Strategies for scaling relational databases horizontally using sharding',
    },
    {
      subjectCode: 'PRJ301',
      title: 'Docker Containerization Guide',
      description: 'How to containerize multi-container applications using Docker Compose',
    },
    {
      subjectCode: 'AI101',
      title: 'Natural Language Processing with Transformers',
      description: 'Intro to BERT, GPT models, and self-attention mechanisms in NLP',
    },
    {
      subjectCode: 'WEB101',
      title: 'JavaScript Async Programming: Promises & Async/Await',
      description: 'Mastering asynchronous flows, event loop, and error handling in JavaScript',
    },
    {
      subjectCode: 'SEC101',
      title: 'OWASP Top 10 Web Vulnerabilities',
      description: 'A detailed breakdown of common web vulnerabilities like XSS, SQLi, and CSRF',
    },
    {
      subjectCode: 'SWE102',
      title: 'GraphQL API Implementation with NestJS',
      description: 'Building scalable GraphQL endpoints with resolvers, queries, and mutations',
    },
    {
      subjectCode: 'DBI202',
      title: 'NoSQL Databases Comparison',
      description:
        'Understanding the differences between MongoDB, Redis, and Cassandra for varied workloads',
    },
    {
      subjectCode: 'PRJ301',
      title: 'Kubernetes Orchestration Basics',
      description: 'Deploying, scaling, and managing containerized applications with Kubernetes',
    },
    {
      subjectCode: 'AI101',
      title: 'Computer Vision with Convolutional Neural Networks',
      description: 'Deep learning techniques for image classification and object detection',
    },
  ];

  const documents: any[] = [];
  const fileSize = BigInt(faker.number.int({ min: 1000000, max: 50000000 })); // 1MB - 50MB

  for (let i = 0; i < documentTemplates.length; i++) {
    const template = documentTemplates[i];
    const user = users[i % users.length];
    const subject = subjects.find((s) => s.code === template.subjectCode)!;

    // 1. Random trạng thái cho thực tế (để UI có nhiều màu sắc khác nhau)
    const randomVisibility = faker.helpers.arrayElement(['PRIVATE', 'PENDING_REVIEW', 'PUBLIC']);
    const randomStatus = faker.helpers.arrayElement(['ACTIVE', 'ACTIVE', 'ACTIVE', 'UNDER_REVIEW']);

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
        status: randomStatus as any, // Đã fix đúng chuẩn Schema mới
        visibilityStatus: randomVisibility as any,
        copyrightSourceType: faker.helpers.arrayElement([
          'OWN_ORIGINAL',
          'OPEN_LICENSE',
          'FPT_OFFICIAL',
          'UNKNOWN',
        ]) as any,
        copyrightAuthorName: faker.person.fullName(),
        copyrightSourceUrl: faker.internet.url(),
        copyrightLicense: faker.helpers.arrayElement(['CC BY 4.0', 'CC BY-NC 4.0', 'MIT', null]),
        copyrightAttribution: faker.lorem.sentence(),
        copyrightDeclaredAt: new Date(),
        copyrightDeclaredBy: user.id,
        averageRating: parseFloat(faker.number.float({ min: 3.5, max: 5.0 }).toFixed(1)),
        ratingCount: faker.number.int({ min: 1, max: 20 }),
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
