import { PrismaClient } from '../../generated/prisma/client';

interface Document {
  id: string;
  title: string;
}

export async function seedSummaries(prisma: PrismaClient, documents: Document[]): Promise<any[]> {
  console.log('📝 Creating document summaries...');

  const summaryTemplates: { [key: string]: { summary: string; keyPoints: string } } = {
    'Introduction to NestJS Framework': {
      summary:
        'NestJS là framework Node.js sử dụng TypeScript cho backend development. Kiến trúc modular giúp code organized và dễ maintain. Dependency Injection giúp quản lý dependencies một cách elegant. Decorators (@Controller, @Injectable, etc.) làm code clean hơn. Hỗ trợ TypeORM, Prisma cho database integration.',
      keyPoints:
        '• NestJS sử dụng TypeScript và architecture pattern từ Angular\n• Dependency Injection container quản lý dependencies tự động\n• Decorators giúp khai báo metadata cho classes và methods\n• Modules tổ chức code thành các logical units\n• Middleware, Guards, Interceptors cho request/response processing',
    },
    'RESTful API Design Principles': {
      summary:
        'REST là architectural style sử dụng HTTP methods (GET, POST, PUT, DELETE). Status codes quan trọng: 200 (OK), 201 (Created), 404 (Not Found), 500 (Error). HATEOAS (Hypermedia As The Engine Of Application State) cho better API design. Versioning API: /v1/users, /v2/users để maintain backward compatibility. Documentation với OpenAPI/Swagger giúp developers hiểu API dễ hơn.',
      keyPoints:
        '• Sử dụng HTTP methods đúng cách cho CRUD operations\n• Status codes chuẩn cho các tình huống khác nhau\n• HATEOAS: response chứa links đến related resources\n• API versioning strategy cho backward compatibility\n• Request validation và error handling consistent',
    },
    'SQL Query Optimization and Indexing': {
      summary:
        'Indexing là key tối ưu performance, nhất là với large datasets. B-Tree index được tạo tự động cho PRIMARY KEY. EXPLAIN ANALYZE giúp analyze query execution plan. Composite indexes cho queries với multiple WHERE conditions. Cardinality important: index trên low-cardinality columns ít hiệu quả.',
      keyPoints:
        '• B-Tree indexes tự động cho PRIMARY KEY\n• EXPLAIN ANALYZE hiển thị execution plan\n• Composite indexes cho multiple columns\n• Cardinality ảnh hưởng đến hiệu quả index\n• Đo performance trước/sau index creation',
    },
    'PostgreSQL Full-Text Search': {
      summary:
        'PostgreSQL hỗ trợ full-text search native, không cần external tool. to_tsvector() chuyển text thành text search vector. GIN (Generalized Inverted Index) tối ưu cho full-text search queries. Phrase search, prefix search được hỗ trợ. Performance tốt khi sử dụng indexed columns.',
      keyPoints:
        '• to_tsvector() và to_tsquery() cho text search\n• GIN indexes tối ưu cho full-text search\n• Phrase search với quoted terms\n• Prefix search với phù hợp operators\n• Ranking results bằng ts_rank()',
    },
    'CI/CD Pipeline with GitHub Actions': {
      summary:
        'GitHub Actions tự động hóa workflows: build, test, deploy. Workflow files nằm trong .github/workflows/ directory. Trigger events: push, pull_request, schedule, manual dispatch. Jobs chạy parallel hoặc sequential tùy cấu hình. Secrets giúp manage sensitive data như API keys, passwords.',
      keyPoints:
        '• Workflow files YAML format trong .github/workflows/\n• Trigger events: push, pull_request, schedule, workflow_dispatch\n• Jobs chạy parallel by default\n• Secrets an toàn cho API keys, tokens\n• Artifacts lưu build outputs giữa jobs',
    },
    'Machine Learning Fundamentals': {
      summary:
        'Supervised Learning: model học từ labeled data (X, y). Unsupervised Learning: model tìm patterns từ unlabeled data. Neural Networks gồm layers: input, hidden, output. Activation functions: ReLU, Sigmoid, Tanh quyết định non-linearity. Gradient Descent tối ưu weights bằng cách minimize loss function.',
      keyPoints:
        '• Supervised Learning: classification, regression\n• Unsupervised Learning: clustering, dimensionality reduction\n• Neural Networks: layers, neurons, weights\n• Activation functions: ReLU, Sigmoid, Tanh\n• Backpropagation tối ưu weights, Gradient Descent minimize loss',
    },
    'Responsive Web Design Techniques': {
      summary:
        'Responsive design sử dụng fluid grids, flexible images, media queries. Mobile-first approach: bắt đầu design cho mobile rồi scale up. CSS Flexbox và Grid cho flexible layouts. Viewport meta tag quan trọng cho mobile rendering. Testing trên multiple devices đảm bảo compatibility.',
      keyPoints:
        '• Fluid grids: % width instead of px\n• Flexible images: max-width: 100%\n• Media queries cho different breakpoints\n• Mobile-first approach\n• CSS Flexbox và CSS Grid layouts',
    },
    'Cryptography and Data Encryption': {
      summary:
        'Symmetric encryption: 1 key cho encrypt/decrypt (AES, DES). Asymmetric encryption: public/private key pairs (RSA, ECC). Hashing: one-way function (SHA-256, MD5). Digital signatures: verify authenticity và integrity. TLS/SSL protocol: secure communication trên internet.',
      keyPoints:
        '• Symmetric encryption: AES, DES algorithms\n• Asymmetric encryption: RSA, Elliptic Curve\n• Hashing: SHA-256, SHA-512 (one-way)\n• Digital Signatures: verify sender authenticity\n• Key management: storage, rotation practices',
    },
  };

  const summaries: any[] = [];

  for (const document of documents) {
    const template = summaryTemplates[document.title] || {
      summary: `Tài liệu: ${document.title}\n\nPhần 1: Khái niệm cơ bản\nPhần 2: Ứng dụng thực tế\nPhần 3: Best practices\nPhần 4: Kết luận`,
      keyPoints: `• Khái niệm chính\n• Ứng dụng thực tế\n• Best practices\n• Kết luận chính`,
    };

    const summary = await prisma.documentSummary.create({
      data: {
        documentId: document.id,
        summaryText: template.summary,
        keyPoints: template.keyPoints,
        status: 'COMPLETED',
      },
    });

    summaries.push(summary);
    console.log(`   ✓ Summary for: "${document.title}"`);
  }

  console.log(`✅ Created ${summaries.length} document summaries\n`);

  return summaries;
}
