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

  // Tạo các tags mặc định cho hệ thống
  console.log('🏷️ Creating system tags...');
  const tagsData = [
    { name: 'NestJS', slug: 'nestjs', isSystem: true },
    { name: 'SQL Query', slug: 'sql-query', isSystem: true },
    { name: 'CI/CD Pipeline', slug: 'cicd-pipeline', isSystem: true },
    { name: 'Machine Learning', slug: 'machine-learning', isSystem: true },
    { name: 'Web Responsive', slug: 'web-responsive', isSystem: true },
    { name: 'Cryptography', slug: 'cryptography', isSystem: true },
    { name: 'Microservices', slug: 'microservices', isSystem: true },
    { name: 'Docker Containers', slug: 'docker-containers', isSystem: true },
    { name: 'NLP & Transformers', slug: 'nlp-transformers', isSystem: true },
    { name: 'GraphQL', slug: 'graphql', isSystem: true },
  ];
  const tags = await Promise.all(
    tagsData.map((t) =>
      prisma.tag.create({
        data: t,
      }),
    ),
  );
  console.log(`✅ Created ${tags.length} system tags`);

  // Tạo thư mục cá nhân (PersonalFolder) cho các users
  console.log('📁 Creating personal folders for users...');
  const personalFolders: { ownerId: string; folderId: string }[] = [];
  for (const user of users) {
    const rootFolder = await prisma.personalFolder.create({
      data: {
        ownerId: user.id,
        name: 'Tài Liệu Của Tôi',
      },
    });

    const subFolder = await prisma.personalFolder.create({
      data: {
        ownerId: user.id,
        name: 'Kỳ 5 - Tài Liệu Chuyên Ngành',
        parentId: rootFolder.id,
      },
    });

    personalFolders.push({ ownerId: user.id, folderId: subFolder.id });
  }
  console.log(`✅ Created personal folders for ${users.length} users`);

  const documents: any[] = [];
  const fileSize = BigInt(faker.number.int({ min: 1000000, max: 50000000 })); // 1MB - 50MB

  for (let i = 0; i < documentTemplates.length; i++) {
    const template = documentTemplates[i];
    const user = users[i % users.length];
    const subject = subjects.find((s) => s.code === template.subjectCode)!;

    // Lấy personalFolderId cho 1/3 số tài liệu ngẫu nhiên của user
    const userFolder = personalFolders.find((f) => f.ownerId === user.id);
    const personalFolderId = userFolder && i % 3 === 0 ? userFolder.folderId : null;

    // Phân bổ trạng thái hiển thị của tài liệu để phục vụ việc kiểm thử các luồng hoạt động:
    // - 12 tài liệu mặc định hiển thị PUBLIC (để xem trên explore, dashboard)
    // - 3 tài liệu ở trạng thái PENDING_REVIEW (để admin kiểm thử luồng Approve/Reject)
    // - 3 tài liệu ở trạng thái PRIVATE (để user kiểm thử luồng gửi yêu cầu public)
    let visibility: 'PUBLIC' | 'PENDING_REVIEW' | 'PRIVATE' = 'PUBLIC';
    if (i >= 12 && i <= 14) {
      visibility = 'PENDING_REVIEW';
    } else if (i >= 15 && i <= 17) {
      visibility = 'PRIVATE';
    }

    const docStatus = 'ACTIVE';

    // 2. Format lại chuẩn URL của Supabase
    const uuid = faker.string.uuid();
    const fakeSupabaseUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/documents/seed-${uuid}.pdf`;
    const storagePath = `documents/seed-${uuid}.pdf`;

    const document = await prisma.document.create({
      data: {
        title: template.title,
        description: template.description,
        subjectId: subject.id,
        personalFolderId: personalFolderId,
        uploadedBy: user.id,
        fileUrl: fakeSupabaseUrl,
        storagePath: storagePath, // QUAN TRỌNG: Phải có storagePath để API getDetails không báo lỗi 404
        fileSize: fileSize,
        fileType: 'application/pdf',
        status: randomStatus as any, // Đã fix đúng chuẩn Schema mới
        visibilityStatus: randomVisibility as any,
        copyrightSourceType: faker.helpers.arrayElement([
          'OWN_ORIGINAL', 'OPEN_LICENSE', 'UNKNOWN'
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

    // Tạo liên kết DocumentTag
    const selectedTags = faker.helpers.arrayElements(tags, { min: 1, max: 3 });
    for (const tag of selectedTags) {
      await prisma.documentTag.create({
        data: {
          documentId: document.id,
          tagId: tag.id,
        },
      });
    }

    documents.push(document);

    console.log(
      `   ✓ Document: "${document.title}" (by ${user.fullName}, status: ${docStatus}, tags: ${selectedTags.map(t => t.name).join(', ')})`,
    );
  }

  console.log(`✅ Created ${documents.length} documents\n`);

  return documents;
}
