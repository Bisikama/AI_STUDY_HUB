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
      subjectCode: 'PRN212',
      title: 'C# and .NET Programming Notes',
      description:
        'Core syntax, object-oriented programming, collections, LINQ, and .NET application basics',
    },
    {
      subjectCode: 'PRJ301',
      title: 'Java Web MVC Study Guide',
      description:
        'Servlet, JSP, MVC pattern, session management, and database integration for Java web apps',
    },
    {
      subjectCode: 'SWR302',
      title: 'Software Requirements Specification Guide',
      description:
        'How to write functional requirements, non-functional requirements, use cases, and acceptance criteria',
    },
    {
      subjectCode: 'SWD391',
      title: 'Software Architecture and Design Patterns',
      description:
        'Architecture styles, layered architecture, design patterns, and system documentation',
    },
    {
      subjectCode: 'SDN301m',
      title: 'NodeJS Backend Development Notes',
      description:
        'Express/NestJS backend concepts, REST APIs, middleware, authentication, and database access',
    },

    {
      subjectCode: 'AIG201c',
      title: 'Artificial Intelligence Fundamentals',
      description:
        'Search algorithms, intelligent agents, knowledge representation, and reasoning basics',
    },
    {
      subjectCode: 'AIG202c',
      title: 'Applied AI Case Studies',
      description: 'Real-world AI use cases, applied models, and evaluation of AI solutions',
    },
    {
      subjectCode: 'MAI391',
      title: 'Machine Learning Fundamentals',
      description:
        'Supervised learning, unsupervised learning, model training, validation, and evaluation metrics',
    },
    {
      subjectCode: 'NLP301c',
      title: 'Natural Language Processing with Transformers',
      description:
        'Intro to tokenization, embeddings, attention, BERT, GPT, and transformer-based NLP',
    },
    {
      subjectCode: 'AIL302m',
      title: 'Deep Learning Neural Networks',
      description:
        'Neural network layers, backpropagation, CNNs, RNNs, and deep learning training strategies',
    },

    {
      subjectCode: 'DBI202',
      title: 'Database Systems and SQL Optimization',
      description: 'Database design, SQL queries, indexing, normalization, and query optimization',
    },
    {
      subjectCode: 'ISP392',
      title: 'Information Systems Project Planning',
      description: 'Planning, documenting, and evaluating an information systems project',
    },
    {
      subjectCode: 'ISM302',
      title: 'Information Systems Management',
      description:
        'Managing business information systems, process improvement, and organizational data',
    },
    {
      subjectCode: 'ISC301',
      title: 'Information Systems Control and Audit',
      description:
        'IT governance, controls, audit practices, and risk management in information systems',
    },
    {
      subjectCode: 'ITA301',
      title: 'IT Architecture Overview',
      description:
        'Enterprise architecture, IT infrastructure, system integration, and technology planning',
    },

    {
      subjectCode: 'ACC101',
      title: 'Accounting Principles Summary',
      description: 'Financial statements, journal entries, ledgers, and basic accounting concepts',
    },
    {
      subjectCode: 'MGT103',
      title: 'Principles of Management Notes',
      description:
        'Planning, organizing, leadership, control, and organizational behavior fundamentals',
    },
    {
      subjectCode: 'MKT101',
      title: 'Marketing Fundamentals Guide',
      description:
        'Market segmentation, targeting, positioning, marketing mix, and consumer behavior',
    },
    {
      subjectCode: 'FIN201',
      title: 'Corporate Finance Basics',
      description:
        'Financial analysis, time value of money, capital budgeting, and investment decisions',
    },
    {
      subjectCode: 'ECO102',
      title: 'Microeconomics Study Notes',
      description: 'Supply and demand, elasticity, market structures, and consumer choice theory',
    },

    {
      subjectCode: 'GDF102',
      title: 'Graphic Design Fundamentals',
      description: 'Design principles, composition, color theory, layout, and typography basics',
    },
    {
      subjectCode: 'VCM202',
      title: 'Visual Communication Design',
      description:
        'Visual storytelling, brand communication, design systems, and media presentation',
    },
    {
      subjectCode: 'WED201c',
      title: 'Web Design Principles',
      description:
        'Responsive layout, web typography, visual hierarchy, and user-friendly web design',
    },
    {
      subjectCode: 'DMA301m',
      title: 'Digital Media Arts Portfolio Guide',
      description: 'Digital content creation, creative workflows, and media production techniques',
    },
    {
      subjectCode: 'DMS301m',
      title: 'Digital Media Strategy Notes',
      description:
        'Digital campaign planning, channel strategy, content scheduling, and performance review',
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
        status: docStatus as any, // Đã fix đúng chuẩn Schema mới
        visibilityStatus: visibility as any,
        copyrightSourceType: faker.helpers.arrayElement([
          'OWN_ORIGINAL',
          'OPEN_LICENSE',
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
      `   ✓ Document: "${document.title}" (by ${user.fullName}, status: ${docStatus}, tags: ${selectedTags.map((t) => t.name).join(', ')})`,
    );
  }

  console.log(`✅ Created ${documents.length} documents\n`);

  return documents;
}
