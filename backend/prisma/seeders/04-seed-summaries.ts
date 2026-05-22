import { PrismaClient } from '../../generated/prisma/client';

interface Document {
  id: string;
  title: string;
}

export async function seedSummaries(prisma: PrismaClient, documents: Document[]): Promise<any[]> {
  console.log('📝 Creating summaries...');

  const summaryTemplates: { [key: string]: string[] } = {
    'Introduction to NestJS Framework': [
      'NestJS là framework Node.js sử dụng TypeScript cho backend development',
      'Kiến trúc modular giúp code organized và dễ maintain',
      'Dependency Injection giúp quản lý dependencies một cách elegant',
      'Decorators (@Controller, @Injectable, etc.) làm code clean hơn',
      'Hỗ trợ TypeORM, Prisma cho database integration',
    ],
    'RESTful API Design Principles': [
      'REST là architectural style sử dụng HTTP methods (GET, POST, PUT, DELETE)',
      'Status codes quan trọng: 200 (OK), 201 (Created), 404 (Not Found), 500 (Error)',
      'HATEOAS (Hypermedia As The Engine Of Application State) cho better API design',
      'Versioning API: /v1/users, /v2/users để maintain backward compatibility',
      'Documentation với OpenAPI/Swagger giúp developers hiểu API dễ hơn',
    ],
    'SQL Query Optimization and Indexing': [
      'Indexing là key tối ưu performance, nhất là với large datasets',
      'B-Tree index được tạo tự động cho PRIMARY KEY',
      'EXPLAIN ANALYZE giúp analyze query execution plan',
      'Composite indexes cho queries với multiple WHERE conditions',
      'Cardinality important: index trên low-cardinality columns ít hiệu quả',
    ],
    'PostgreSQL Full-Text Search': [
      'PostgreSQL hỗ trợ full-text search native, không cần external tool',
      'to_tsvector() chuyển text thành text search vector',
      'GIN (Generalized Inverted Index) tối ưu cho full-text search queries',
      'Phrase search, prefix search được hỗ trợ',
      'Performance tốt khi sử dụng indexed columns',
    ],
    'CI/CD Pipeline with GitHub Actions': [
      'GitHub Actions tự động hóa workflows: build, test, deploy',
      'Workflow files nằm trong .github/workflows/ directory',
      'Trigger events: push, pull_request, schedule, manual dispatch',
      'Jobs chạy parallel hoặc sequential tùy cấu hình',
      'Secrets giúp manage sensitive data như API keys, passwords',
    ],
    'Machine Learning Fundamentals': [
      'Supervised Learning: model học từ labeled data (X, y)',
      'Unsupervised Learning: model tìm patterns từ unlabeled data',
      'Neural Networks gồm layers: input, hidden, output',
      'Activation functions: ReLU, Sigmoid, Tanh quyết định non-linearity',
      'Gradient Descent tối ưu weights bằng cách minimize loss function',
    ],
  };

  const summaries: any[] = [];

  for (const document of documents) {
    const content = summaryTemplates[document.title] || [
      `Tài liệu: ${document.title}`,
      'Phần 1: Khái niệm cơ bản',
      'Phần 2: Ứng dụng thực tế',
      'Phần 3: Best practices',
      'Phần 4: Kết luận',
    ];

    const summary = await prisma.summary.create({
      data: {
        documentId: document.id,
        content: content,
      },
    });

    summaries.push(summary);
    console.log(`   ✓ Summary for: "${document.title}"`);
  }

  console.log(`✅ Created ${summaries.length} summaries\n`);

  return summaries;
}
