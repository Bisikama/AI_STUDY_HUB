import { PrismaClient } from '../../generated/prisma/client';

interface Document {
  id: string;
  title: string;
}

interface QuizItem {
  question: string;
  options: string[];
  correctAnswer: string;
}

const quizTemplates: { [key: string]: QuizItem[] } = {
  'Introduction to NestJS Framework': [
    {
      question: 'NestJS là framework gì?',
      options: [
        'Framework backend Node.js sử dụng TypeScript',
        'Framework frontend React',
        'Thư viện CSS',
        'Công cụ linting',
      ],
      correctAnswer: 'A',
    },
    {
      question: '@Injectable() decorator trong NestJS dùng để làm gì?',
      options: [
        'Đánh dấu class là injectable (có thể inject vào service khác)',
        'Định nghĩa route HTTP',
        'Quản lý session',
        'Mã hóa mật khẩu',
      ],
      correctAnswer: 'A',
    },
    {
      question: 'Module trong NestJS có tác dụng gì?',
      options: [
        'Nhóm các providers, controllers, services liên quan với nhau',
        'Chỉ dùng để định nghĩa style',
        'Quản lý database migrations',
        'Chạy background jobs',
      ],
      correctAnswer: 'A',
    },
  ],
  'RESTful API Design Principles': [
    {
      question: 'REST API sử dụng HTTP method nào để tạo resource mới?',
      options: ['POST', 'GET', 'PUT', 'DELETE'],
      correctAnswer: 'A',
    },
    {
      question: 'HTTP status code 404 có nghĩa là gì?',
      options: [
        'Resource không tìm thấy',
        'Lỗi server',
        'Request được chấp nhận',
        'Redirect thành công',
      ],
      correctAnswer: 'A',
    },
    {
      question: 'HATEOAS trong REST là gì?',
      options: [
        'Hypermedia As The Engine Of Application State - response chứa links đến resources liên quan',
        'Một loại authentication',
        'Cache strategy',
        'Database normalization',
      ],
      correctAnswer: 'A',
    },
    {
      question: 'Nên sử dụng HTTP method nào để cập nhật toàn bộ resource?',
      options: ['PUT', 'PATCH', 'POST', 'GET'],
      correctAnswer: 'A',
    },
  ],
  'SQL Query Optimization and Indexing': [
    {
      question: 'Index nào được tạo tự động khi khai báo PRIMARY KEY?',
      options: ['B-Tree index', 'Hash index', 'GIN index', 'BRIN index'],
      correctAnswer: 'A',
    },
    {
      question: 'EXPLAIN ANALYZE dùng để làm gì trong PostgreSQL?',
      options: [
        'Phân tích và hiển thị execution plan của query',
        'Tạo backup database',
        'Xóa toàn bộ dữ liệu',
        'Đổi tên bảng',
      ],
      correctAnswer: 'A',
    },
    {
      question: 'Khi nào nên tạo index trên column?',
      options: [
        'Khi column thường xuyên được dùng trong WHERE clause, JOIN, ORDER BY',
        'Luôn luôn tạo index cho tất cả columns',
        'Không bao giờ cần index',
        'Chỉ khi database có > 1 triệu records',
      ],
      correctAnswer: 'A',
    },
    {
      question: 'Foreign Key constraint có ảnh hưởng gì tới performance?',
      options: [
        'Giảm performance INSERT/UPDATE/DELETE nhưng đảm bảo data integrity',
        'Tăng performance đáng kể',
        'Không có ảnh hưởng',
        'Chỉ ảnh hưởng SELECT queries',
      ],
      correctAnswer: 'A',
    },
    {
      question: 'Normalization bậc 3NF là gì?',
      options: [
        'Loại bỏ transitive dependencies, mỗi non-key attribute phụ thuộc vào candidate key',
        'Chỉ loại bỏ duplicate rows',
        'Không có ràng buộc nào',
        'Tất cả columns phải có cùng type',
      ],
      correctAnswer: 'A',
    },
  ],
  'PostgreSQL Full-Text Search': [
    {
      question: 'GIN index trong PostgreSQL thường dùng để tối ưu gì?',
      options: [
        'Full-text search, JSON queries, array operations',
        'Simple WHERE clauses',
        'LIMIT queries',
        'JOIN operations',
      ],
      correctAnswer: 'A',
    },
    {
      question: 'to_tsvector() function trong PostgreSQL dùng để làm gì?',
      options: [
        'Chuyển đổi text thành text search vector',
        'Mã hóa password',
        'Tính toán hash',
        'Nén dữ liệu',
      ],
      correctAnswer: 'A',
    },
  ],
  'CI/CD Pipeline with GitHub Actions': [
    {
      question: 'GitHub Actions là gì?',
      options: [
        'Dịch vụ CI/CD tích hợp sẵn trong GitHub để tự động hóa workflows',
        'Một loại version control',
        'Text editor',
        'Database management tool',
      ],
      correctAnswer: 'A',
    },
    {
      question: 'Workflow file trong GitHub Actions nên lưu ở đâu?',
      options: ['.github/workflows/ directory', '.gitignore', 'src/ folder', 'package.json'],
      correctAnswer: 'A',
    },
    {
      question: 'Khi nào workflow được trigger?',
      options: [
        'Trên các events như push, pull_request, schedule, manual',
        'Chỉ khi push code',
        'Không bao giờ tự động trigger',
        'Mỗi 1 giờ một lần',
      ],
      correctAnswer: 'A',
    },
  ],
  'Machine Learning Fundamentals': [
    {
      question: 'Supervised learning là gì?',
      options: [
        'Học từ dữ liệu có label (ground truth)',
        'Học từ dữ liệu không có label',
        'Tự tối ưu hoá mô hình',
        'Không liên quan tới machine learning',
      ],
      correctAnswer: 'A',
    },
    {
      question: 'Overfitting trong ML có nghĩa là gì?',
      options: [
        'Model học quá tốt trên training data nhưng không generalize được trên test data',
        'Model không học được gì từ training data',
        'Model quá đơn giản',
        'Dữ liệu training quá ít',
      ],
      correctAnswer: 'A',
    },
    {
      question: 'Activation function ReLU là gì?',
      options: [
        'f(x) = max(0, x), giúp neural network học non-linear relationships',
        'f(x) = 1 / (1 + e^-x) - sigmoid function',
        'f(x) = x - linear function',
        'f(x) = x^2 - quadratic function',
      ],
      correctAnswer: 'A',
    },
    {
      question: 'Gradient descent dùng để làm gì?',
      options: [
        'Tối ưu hóa weights của model bằng cách giảm loss function',
        'Tạo random weights',
        'Xóa model weights',
        'Chuẩn hóa dữ liệu',
      ],
      correctAnswer: 'A',
    },
  ],
};

export async function seedQuizzes(prisma: PrismaClient, documents: Document[]): Promise<void> {
  console.log('❓ Creating quizzes...');

  let totalQuizzes = 0;

  for (const document of documents) {
    const quizzes = quizTemplates[document.title] || [];

    if (quizzes.length > 0) {
      await prisma.quiz.createMany({
        data: quizzes.map((quiz) => ({
          documentId: document.id,
          question: quiz.question,
          options: quiz.options,
          correctAnswer: quiz.correctAnswer,
        })),
      });

      totalQuizzes += quizzes.length;
      console.log(`   ✓ "${document.title}": ${quizzes.length} quizzes`);
    }
  }

  console.log(`✅ Created ${totalQuizzes} quizzes\n`);
}
