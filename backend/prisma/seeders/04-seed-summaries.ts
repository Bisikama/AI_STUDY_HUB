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
    'Microservices Architecture with NestJS': {
      summary:
        'Kiến trúc Microservices chia nhỏ ứng dụng lớn thành các dịch vụ độc lập giao tiếp qua TCP, Redis, gRPC hoặc Message Brokers (RabbitMQ, Kafka). NestJS cung cấp module @nestjs/microservices tích hợp sẵn để xây dựng kiến trúc phân tán hiệu quả, tăng khả năng mở rộng (scalability) và khả năng chịu lỗi (fault tolerance).',
      keyPoints:
        '• Chia nhỏ hệ thống thành các service độc lập và tự chủ\n• Giao tiếp bất đồng bộ qua Redis, RabbitMQ, Kafka\n• NestJS Microservices module hỗ trợ nhiều transport layers\n• Độc lập trong deploy và phát triển mã nguồn\n• Quản lý trạng thái và đồng bộ dữ liệu bằng event-driven architecture',
    },
    'Database Sharding and Replication': {
      summary:
        'Database Replication sao chép dữ liệu từ Master sang các node Slave để tăng hiệu năng đọc và đảm bảo an toàn dữ liệu. Database Sharding phân vùng dữ liệu theo chiều ngang để chia tải ghi lên nhiều máy chủ database khác nhau. Sự kết hợp giúp hệ thống xử lý được lượng truy cập khổng lồ.',
      keyPoints:
        '• Master-Slave Replication: Master ghi, Slaves đọc dữ liệu sao chép\n• Sharding: chia bảng lớn thành các database nhỏ hơn dựa trên Shard Key\n• Tăng khả năng chịu lỗi nhờ sao lưu dự phòng trên Slave\n• Giảm tải IOPS và tài nguyên cho một máy chủ database duy nhất\n• Phức tạp trong xử lý các liên kết transaction liên phân vùng',
    },
    'Docker Containerization Guide': {
      summary:
        'Docker giúp đóng gói mã nguồn và tất cả dependencies vào một container đồng nhất chạy trên mọi môi trường. Dockerfile định nghĩa các bước xây dựng Image. Docker Compose điều phối và chạy nhiều container cùng một lúc, thiết lập mạng nội bộ (network) và phân vùng lưu trữ (volume) chung.',
      keyPoints:
        '• Containerization: chạy ứng dụng độc lập không phụ thuộc hệ điều hành\n• Dockerfile: Build image từ base image, copy source, install deps\n• Docker Image: Khuôn mẫu tĩnh, Docker Container: Thực thể chạy động\n• Docker Compose: Quản lý multi-containers qua file cấu hình YAML\n• Volumes: Lưu trữ dữ liệu bền vững ngoài vòng đời của container',
    },
    'Natural Language Processing with Transformers': {
      summary:
        'Kiến trúc Transformer dựa trên cơ chế Self-Attention đã cách mạng hóa lĩnh vực NLP. Các mô hình nổi tiếng như BERT (tiền huấn luyện dạng Encoder) và GPT (tiền huấn luyện dạng Decoder) tự động nắm bắt mối quan hệ ngữ cảnh giữa các từ xa nhau trong câu mà không cần xử lý tuần tự dạng RNN.',
      keyPoints:
        '• Cơ chế Self-Attention tính toán trọng số quan hệ ngữ cảnh giữa các từ\n• Kiến trúc song song hóa tốt hơn hẳn RNN/LSTM trên GPU\n• BERT tối ưu cho các tác vụ hiểu ngôn ngữ, phân loại, tìm kiếm thông tin\n• GPT tối ưu cho các tác vụ sinh văn bản tự động và trò chuyện\n• Fine-tuning giúp chuyển giao tri thức từ mô hình lớn sang tác vụ cụ thể',
    },
    'JavaScript Async Programming: Promises & Async/Await': {
      summary:
        'Lập trình bất đồng bộ là cốt lõi của JavaScript nhờ cơ chế Single-threaded Event Loop. Promises cung cấp phương pháp quản lý các luồng bất đồng bộ thay thế cho Callback Hell. Async/Await là cú pháp giúp viết code bất đồng bộ trông giống như đồng bộ, cải thiện khả năng đọc và gỡ lỗi.',
      keyPoints:
        '• Event Loop quản lý Execution Stack và Callback Queue\n• Promise có 3 trạng thái: Pending, Fulfilled, Rejected\n• Cú pháp Async/Await được xây dựng trên nền tảng của Promises\n• Xử lý lỗi tập trung và trực quan hơn bằng khối lệnh Try-Catch\n• Sử dụng Promise.all để chạy song song tối ưu hóa thời gian xử lý',
    },
    'OWASP Top 10 Web Vulnerabilities': {
      summary:
        'OWASP Top 10 là tài liệu tiêu chuẩn về các mối đe dọa bảo mật ứng dụng web phổ biến nhất. Các lỗ hổng hàng đầu bao gồm SQL Injection, Broken Authentication, Cross-Site Scripting (XSS), và Security Misconfiguration. Việc hiểu và phòng chống các lỗ hổng này là bắt buộc đối với lập trình viên backend.',
      keyPoints:
        '• Injection: SQLi, NoSQLi xảy ra khi input không được sanitize đầy đủ\n• Broken Authentication: Quản lý session hoặc password yếu kém\n• Sensitive Data Exposure: Thiếu mã hóa dữ liệu nhạy cảm ở rest/transit\n• XSS (Cross-Site Scripting): Chèn mã script độc hại vào trình duyệt nạn nhân\n• CSRF (Cross-Site Request Forgery): Giả mạo yêu cầu từ người dùng đã xác thực',
    },
    'GraphQL API Implementation with NestJS': {
      summary:
        'GraphQL là ngôn ngữ truy vấn API cung cấp giải pháp thay thế RESTful. Nó cho phép client tự định nghĩa cấu trúc dữ liệu trả về mong muốn, tránh tình trạng thừa dữ liệu (over-fetching) hoặc thiếu dữ liệu (under-fetching). NestJS tích hợp GraphQL thông qua các bộ giải quyết Resolvers bằng Code-first hoặc Schema-first approach.',
      keyPoints:
        '• Single Endpoint: Tất cả các truy vấn đều đi qua một endpoint duy nhất\n• Schema & Types: Khai báo kiểu dữ liệu chặt chẽ giữa frontend và backend\n• Queries: Truy vấn lấy dữ liệu tương đương GET trong REST\n• Mutations: Thay đổi dữ liệu tương đương POST/PUT/DELETE trong REST\n• Code-first: NestJS tự động sinh GraphQL Schema từ các Class TypeScript',
    },
    'NoSQL Databases Comparison': {
      summary:
        'So sánh các hệ cơ sở dữ liệu NoSQL phổ biến: MongoDB (Document-store phù hợp dữ liệu linh hoạt dạng JSON), Redis (Key-Value bộ nhớ trong tối ưu cho caching/session), Cassandra (Wide-column tối ưu ghi lượng lớn dữ liệu phân tán), và Neo4j (Graph database tối ưu cho các mối quan hệ mạng lưới phức tạp).',
      keyPoints:
        '• Định lý CAP: Lựa chọn giữa Consistency, Availability và Partition Tolerance\n• MongoDB: Cấu trúc Schema linh hoạt dễ scale ngang\n• Redis: Tốc độ truy xuất cực nhanh nhờ lưu trữ hoàn toàn trên RAM\n• Cassandra: Kiến trúc phi tập trung (masterless) chịu lỗi cực cao\n• Phù hợp cho các bài toán dữ liệu phi cấu trúc hoặc lượng ghi siêu lớn',
    },
    'Kubernetes Orchestration Basics': {
      summary:
        'Kubernetes (K8s) là nền tảng nguồn mở để tự động hóa việc điều phối, quản lý và scale các containerized applications. Các thành phần cơ bản gồm Pods (đơn vị nhỏ nhất chứa container), Services (quản lý kết nối mạng và load balancing), và Deployments (quản lý bản sao ReplicaSets và cập nhật rolling update).',
      keyPoints:
        '• Pod: Chứa một hoặc nhiều container chia sẻ chung network/volume\n• Service: Cung cấp IP tĩnh và cơ chế cân bằng tải cho các Pods\n• Deployment: Định nghĩa trạng thái mong muốn của ứng dụng và tự sửa lỗi\n• Control Plane: Điều phối cụm cluster, Worker Nodes: Nơi chạy container thực tế\n• Auto-scaling: Tự động nhân bản Pod dựa trên tải CPU/RAM sử dụng',
    },
    'Computer Vision with Convolutional Neural Networks': {
      summary:
        'Mạng nơ-ron tích chập (CNN) là nền tảng của thị giác máy tính hiện đại. Bằng cách sử dụng các bộ lọc tích chập (convolutional filters), CNN tự động trích xuất các đặc trưng không gian từ ảnh như cạnh, góc, họa tiết, rồi đưa qua các tầng kết nối đầy đủ (Fully Connected) để phân loại hoặc phát hiện vật thể.',
      keyPoints:
        '• Convolutional Layer: Áp dụng bộ lọc trích xuất đặc trưng không gian của ảnh\n• Pooling Layer: Giảm kích thước ảnh (Max pooling) để giảm lượng tham số\n• Fully Connected Layer: Phân loại nhãn dựa trên các đặc trưng đã trích xuất\n• Các kiến trúc kinh điển: AlexNet, VGG, ResNet (giải quyết triệt để vấn đề mất mát gradient)\n• Ứng dụng: Nhận diện khuôn mặt, phân loại y khoa, xe tự hành',
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
