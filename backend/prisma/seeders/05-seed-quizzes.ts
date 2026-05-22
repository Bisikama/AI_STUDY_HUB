import { PrismaClient } from '../../generated/prisma/client';

interface Document {
  id: string;
  title: string;
}

interface QuizItem {
  question: string;
  options: string[];
  correctAnswerIndex: number; // Index of correct answer (0-3)
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
      correctAnswerIndex: 0,
    },
    {
      question: '@Injectable() decorator trong NestJS dùng để làm gì?',
      options: [
        'Đánh dấu class là injectable (có thể inject vào service khác)',
        'Định nghĩa route HTTP',
        'Quản lý session',
        'Mã hóa mật khẩu',
      ],
      correctAnswerIndex: 0,
    },
    {
      question: 'Module trong NestJS có tác dụng gì?',
      options: [
        'Nhóm các providers, controllers, services liên quan với nhau',
        'Chỉ dùng để định nghĩa style',
        'Quản lý database migrations',
        'Chạy background jobs',
      ],
      correctAnswerIndex: 0,
    },
  ],
  'RESTful API Design Principles': [
    {
      question: 'REST API sử dụng HTTP method nào để tạo resource mới?',
      options: ['POST', 'GET', 'PUT', 'DELETE'],
      correctAnswerIndex: 0,
    },
    {
      question: 'HTTP status code 404 có nghĩa là gì?',
      options: [
        'Resource không tìm thấy',
        'Lỗi server',
        'Request được chấp nhận',
        'Redirect thành công',
      ],
      correctAnswerIndex: 0,
    },
    {
      question: 'HATEOAS trong REST là gì?',
      options: [
        'Hypermedia As The Engine Of Application State - response chứa links đến resources liên quan',
        'Một loại authentication',
        'Cache strategy',
        'Database normalization',
      ],
      correctAnswerIndex: 0,
    },
    {
      question: 'Nên sử dụng HTTP method nào để cập nhật toàn bộ resource?',
      options: ['PUT', 'PATCH', 'POST', 'GET'],
      correctAnswerIndex: 0,
    },
  ],
  'SQL Query Optimization and Indexing': [
    {
      question: 'Index nào được tạo tự động khi khai báo PRIMARY KEY?',
      options: ['B-Tree index', 'Hash index', 'GIN index', 'BRIN index'],
      correctAnswerIndex: 0,
    },
    {
      question: 'EXPLAIN ANALYZE dùng để làm gì trong PostgreSQL?',
      options: [
        'Phân tích và hiển thị execution plan của query',
        'Tạo backup database',
        'Xóa toàn bộ dữ liệu',
        'Đổi tên bảng',
      ],
      correctAnswerIndex: 0,
    },
    {
      question: 'Khi nào nên tạo index trên column?',
      options: [
        'Khi column thường xuyên được dùng trong WHERE clause, JOIN, ORDER BY',
        'Luôn luôn tạo index cho tất cả columns',
        'Không bao giờ cần index',
        'Chỉ khi database có > 1 triệu records',
      ],
      correctAnswerIndex: 0,
    },
    {
      question: 'Foreign Key constraint có ảnh hưởng gì tới performance?',
      options: [
        'Giảm performance INSERT/UPDATE/DELETE nhưng đảm bảo data integrity',
        'Tăng performance đáng kể',
        'Không có ảnh hưởng',
        'Chỉ ảnh hưởng SELECT queries',
      ],
      correctAnswerIndex: 0,
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
      correctAnswerIndex: 0,
    },
    {
      question: 'to_tsvector() function trong PostgreSQL dùng để làm gì?',
      options: [
        'Chuyển đổi text thành text search vector',
        'Mã hóa password',
        'Tính toán hash',
        'Nén dữ liệu',
      ],
      correctAnswerIndex: 0,
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
      correctAnswerIndex: 0,
    },
    {
      question: 'Workflow file trong GitHub Actions nên lưu ở đâu?',
      options: ['.github/workflows/ directory', '.gitignore', 'src/ folder', 'package.json'],
      correctAnswerIndex: 0,
    },
    {
      question: 'Khi nào workflow được trigger?',
      options: [
        'Trên các events như push, pull_request, schedule, manual',
        'Chỉ khi push code',
        'Không bao giờ tự động trigger',
        'Mỗi 1 giờ một lần',
      ],
      correctAnswerIndex: 0,
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
      correctAnswerIndex: 0,
    },
    {
      question: 'Overfitting trong ML có nghĩa là gì?',
      options: [
        'Model học quá tốt trên training data nhưng không generalize được trên test data',
        'Model không học được gì từ training data',
        'Model quá đơn giản',
        'Dữ liệu training quá ít',
      ],
      correctAnswerIndex: 0,
    },
    {
      question: 'Activation function ReLU là gì?',
      options: [
        'f(x) = max(0, x), giúp neural network học non-linear relationships',
        'f(x) = 1 / (1 + e^-x) - sigmoid function',
        'f(x) = x - linear function',
        'f(x) = x^2 - quadratic function',
      ],
      correctAnswerIndex: 0,
    },
    {
      question: 'Gradient descent dùng để làm gì?',
      options: [
        'Tối ưu hóa weights của model bằng cách giảm loss function',
        'Tạo random weights',
        'Xóa model weights',
        'Chuẩn hóa dữ liệu',
      ],
      correctAnswerIndex: 0,
    },
  ],
  'Responsive Web Design Techniques': [
    {
      question: 'Responsive design là gì?',
      options: [
        'Thiết kế web sao cho hiển thị tốt trên tất cả kích thước màn hình',
        'Thêm animation cho UI',
        'Tối ưu hóa tốc độ load',
        'Sử dụng framework CSS',
      ],
      correctAnswerIndex: 0,
    },
    {
      question: 'Mobile-first approach có nghĩa là gì?',
      options: [
        'Bắt đầu design cho mobile rồi scale up cho desktop',
        'Bắt đầu design cho desktop rồi scale down cho mobile',
        'Không cần thiết phải responsive',
        'Chỉ hỗ trợ mobile devices',
      ],
      correctAnswerIndex: 0,
    },
  ],
  'Cryptography and Data Encryption': [
    {
      question: 'Symmetric encryption là gì?',
      options: [
        'Sử dụng cùng 1 key cho cả encrypt và decrypt',
        'Sử dụng 2 keys khác nhau (public/private)',
        'Không cần key',
        'Chỉ dùng cho passwords',
      ],
      correctAnswerIndex: 0,
    },
    {
      question: 'Asymmetric encryption có lợi ích gì so với symmetric?',
      options: [
        'Có thể share public key an toàn mà không cần chia sẻ private key',
        'Tốc độ nhanh hơn',
        'Sử dụng ít tài nguyên',
        'Dễ sử dụng hơn',
      ],
      correctAnswerIndex: 0,
    },
  ],
};

export async function seedQuizzes(prisma: PrismaClient, documents: Document[]): Promise<void> {
  console.log('❓ Creating quizzes and questions...');

  let totalQuizzes = 0;
  let totalQuestions = 0;
  let totalOptions = 0;

  for (const document of documents) {
    const quizItems = quizTemplates[document.title] || [];

    if (quizItems.length > 0) {
      // Tạo Quiz cho document
      const quiz = await prisma.quiz.create({
        data: {
          documentId: document.id,
          title: `${document.title} - Quiz`,
        },
      });

      totalQuizzes++;

      // Tạo các QuizQuestion cho Quiz
      for (const item of quizItems) {
        const question = await prisma.quizQuestion.create({
          data: {
            quizId: quiz.id,
            questionText: item.question,
          },
        });

        totalQuestions++;

        // Tạo các QuizOption cho Question
        const optionPromises = item.options.map((optionText, index) =>
          prisma.quizOption.create({
            data: {
              questionId: question.id,
              optionText: optionText,
              isCorrect: index === item.correctAnswerIndex,
            },
          }),
        );

        await Promise.all(optionPromises);
        totalOptions += item.options.length;
      }

      console.log(`   ✓ "${document.title}": 1 quiz, ${quizItems.length} questions`);
    }
  }

  console.log(
    `✅ Created ${totalQuizzes} quizzes, ${totalQuestions} questions, ${totalOptions} options\n`,
  );
}
