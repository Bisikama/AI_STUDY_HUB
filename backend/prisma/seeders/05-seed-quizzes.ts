import { PrismaClient } from '../../generated/prisma/client';

interface Document {
  id: string;
  title: string;
}

interface QuizItem {
  question: string;
  options: string[];
  correctAnswerIndex: number; // Chỉ mục đáp án đúng (0-3)
}

const quizTemplates: { [key: string]: QuizItem[] } = {
  'Introduction to NestJS Framework': [
    {
      question: 'NestJS là framework backend chạy trên môi trường nào?',
      options: ['Node.js', 'Python VM', 'JVM (Java)', '.NET Runtime'],
      correctAnswerIndex: 0,
    },
    {
      question: 'Decorator @Injectable() trong NestJS dùng để làm gì?',
      options: [
        'Định nghĩa một HTTP Route',
        'Đóng gói middleware',
        'Đánh dấu class có thể được inject thông qua Dependency Injection',
        'Cấu hình kết nối cơ sở dữ liệu',
      ],
      correctAnswerIndex: 2,
    },
    {
      question: 'Để gom nhóm các Controller và Provider có liên quan trong NestJS, ta dùng decorator nào?',
      options: ['@Controller()', '@Injectable()', '@Module()', '@Catch()'],
      correctAnswerIndex: 2,
    },
    {
      question: 'Controller trong NestJS đảm nhận vai trò gì?',
      options: [
        'Đón nhận các HTTP Request đầu vào và trả về HTTP Response tương ứng',
        'Truy vấn trực tiếp dữ liệu từ Database',
        'Biên dịch code TypeScript thành JavaScript',
        'Quản lý cấu hình môi trường (.env)',
      ],
      correctAnswerIndex: 0,
    },
    {
      question: 'Cú pháp CLI nào của NestJS dùng để tạo nhanh một Service mới?',
      options: ['nest new service', 'nest g service <name>', 'nest create service', 'nest make:service'],
      correctAnswerIndex: 1,
    },
  ],
  'RESTful API Design Principles': [
    {
      question: 'HTTP Method nào được khuyên dùng để tạo mới một tài nguyên (resource)?',
      options: ['GET', 'POST', 'PUT', 'PATCH'],
      correctAnswerIndex: 1,
    },
    {
      question: 'Mã trạng thái HTTP (Status Code) nào báo hiệu tài nguyên được tạo thành công?',
      options: ['200 OK', '201 Created', '204 No Content', '400 Bad Request'],
      correctAnswerIndex: 1,
    },
    {
      question: 'API Endpoint nào dưới đây được thiết kế chuẩn theo nguyên tắc RESTful để lấy danh sách sinh viên?',
      options: ['GET /getStudents', 'POST /students/list', 'GET /students', 'GET /students/all'],
      correctAnswerIndex: 2,
    },
    {
      question: 'HATEOAS trong thiết kế RESTful API cung cấp thông tin gì trong Response?',
      options: [
        'Thông tin cấu hình database',
        'Các đường link hypermedia dẫn đến các tài nguyên liên quan',
        'Mã hóa token bảo mật JWT',
        'Log vết lỗi hệ thống',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Khi muốn cập nhật một phần thuộc tính của tài nguyên, HTTP Method nào thích hợp nhất?',
      options: ['POST', 'PUT', 'PATCH', 'DELETE'],
      correctAnswerIndex: 2,
    },
  ],
  'SQL Query Optimization and Indexing': [
    {
      question: 'Loại index nào mặc định được tạo cho khóa chính (PRIMARY KEY) trong các RDBMS như PostgreSQL, MySQL?',
      options: ['Hash index', 'GIN index', 'B-Tree index', 'BRIN index'],
      correctAnswerIndex: 2,
    },
    {
      question: 'Lệnh nào trong SQL dùng để phân tích kế hoạch thực thi (Execution Plan) của một câu truy vấn?',
      options: ['EXPLAIN ANALYZE', 'SELECT PROFILE', 'SHOW QUERY PLAN', 'DESCRIBE EXECUTION'],
      correctAnswerIndex: 0,
    },
    {
      question: 'Chỉ mục Composite Index là gì?',
      options: [
        'Index tự động nén dữ liệu',
        'Index được tạo trên từ hai cột trở lên của một bảng',
        'Index chỉ chứa duy nhất một cột khóa chính',
        'Index dùng cho lưu trữ file nhị phân',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Độ Cardinality của một cột trong indexing có ý nghĩa gì?',
      options: [
        'Độ phân tách/Số lượng các giá trị duy nhất trong cột đó',
        'Số lượng bản ghi tối đa cột có thể lưu',
        'Kích thước dung lượng (byte) của cột',
        'Độ sâu của cây B-Tree',
      ],
      correctAnswerIndex: 0,
    },
    {
      question: 'Việc lạm dụng tạo quá nhiều index trên một bảng sẽ dẫn đến hậu quả gì?',
      options: [
        'Làm tăng tốc độ ghi dữ liệu',
        'Làm giảm hiệu năng của các tác vụ ghi (INSERT, UPDATE, DELETE)',
        'Làm cơ sở dữ liệu tự động bị crash',
        'Không có ảnh hưởng gì tới hệ thống',
      ],
      correctAnswerIndex: 1,
    },
  ],
  'PostgreSQL Full-Text Search': [
    {
      question: 'Hàm nào trong PostgreSQL dùng để chuyển đổi văn bản thường thành Vector tìm kiếm (tsvector)?',
      options: ['to_tsquery()', 'to_tsvector()', 'to_vector()', 'plainto_tsquery()'],
      correctAnswerIndex: 1,
    },
    {
      question: 'Loại index nào tối ưu nhất cho tìm kiếm toàn văn (Full-Text Search) trong PostgreSQL?',
      options: ['B-Tree index', 'Hash index', 'GIN index', 'BRIN index'],
      correctAnswerIndex: 2,
    },
    {
      question: 'Hàm to_tsquery() trong PostgreSQL dùng để làm gì?',
      options: [
        'Chuyển đổi văn bản tìm kiếm thành dạng truy vấn logic hỗ trợ các toán tử &, |, !',
        'Tính toán số từ xuất hiện trong văn bản',
        'Tạo ra một bảng dữ liệu tạm thời',
        'Mã hóa văn bản trước khi lưu trữ',
      ],
      correctAnswerIndex: 0,
    },
    {
      question: 'Trong PostgreSQL, ta dùng toán tử nào để kiểm tra sự khớp (match) giữa tsvector và tsquery?',
      options: ['LIKE', '@@', 'ILINK', '=='],
      correctAnswerIndex: 1,
    },
    {
      question: 'Hàm nào dùng để tính toán điểm số phù hợp (Relevance Ranking) của kết quả tìm kiếm toàn văn?',
      options: ['ts_rank()', 'score()', 'rank_search()', 'similarity()'],
      correctAnswerIndex: 0,
    },
  ],
  'CI/CD Pipeline with GitHub Actions': [
    {
      question: 'Các file cấu hình pipeline của GitHub Actions được lưu ở thư mục nào trong dự án?',
      options: ['.github/workflows/', '.github/pipelines/', 'scripts/actions/', 'config/github/'],
      correctAnswerIndex: 0,
    },
    {
      question: 'Định dạng file nào được sử dụng để viết workflow trong GitHub Actions?',
      options: ['JSON', 'XML', 'YAML', 'TOML'],
      correctAnswerIndex: 2,
    },
    {
      question: 'Trong GitHub Actions, thành phần nào chạy các câu lệnh build hoặc test thực tế?',
      options: ['Trigger', 'Workflow', 'Runner', 'Action Creator'],
      correctAnswerIndex: 2,
    },
    {
      question: 'Làm thế nào để lưu trữ thông tin nhạy cảm (như API Key, Password) an toàn trong GitHub Actions?',
      options: [
        'Khai báo trực tiếp vào file YAML',
        'Lưu trong file .env và push lên GitHub',
        'Sử dụng tính năng GitHub Secrets của Repository',
        'Mã hóa thủ công bằng tay',
      ],
      correctAnswerIndex: 2,
    },
    {
      question: 'Từ khóa nào dùng để định nghĩa các bước chạy tuần tự trong một job?',
      options: ['runs-on', 'steps', 'jobs', 'on-trigger'],
      correctAnswerIndex: 1,
    },
  ],
  'Machine Learning Fundamentals': [
    {
      question: 'Học máy có giám sát (Supervised Learning) là gì?',
      options: [
        'Học từ dữ liệu chưa được gắn nhãn',
        'Học từ dữ liệu đã được gán nhãn sẵn (nhãn mục tiêu)',
        'Học thông qua cơ chế phạt/thưởng',
        'Tự động gom cụm dữ liệu',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Hiện tượng Overfitting (quá khớp) xảy ra khi nào?',
      options: [
        'Mô hình học quá tốt trên tập huấn luyện nhưng dự đoán kém trên dữ liệu mới (tập kiểm thử)',
        'Mô hình không học được gì từ tập huấn luyện',
        'Mô hình chạy quá chậm',
        'Dữ liệu huấn luyện quá nhiều',
      ],
      correctAnswerIndex: 0,
    },
    {
      question: 'Hàm kích hoạt (Activation Function) nào phổ biến nhất trong các mạng nơ-ron sâu để tránh triệt tiêu gradient?',
      options: ['Sigmoid', 'Tanh', 'ReLU', 'Linear'],
      correctAnswerIndex: 2,
    },
    {
      question: 'Thuật toán tối ưu Gradient Descent làm gì để tối ưu hóa mô hình?',
      options: [
        'Tăng trọng số ngẫu nhiên',
        'Cập nhật trọng số ngược hướng với gradient của hàm mất mát',
        'Xóa bỏ bớt các nơ-ron dư thừa',
        'Tăng tốc độ xử lý phần cứng',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Đâu là thuật toán học máy phân loại phi tuyến phổ biến dựa trên cấu trúc cây quyết định?',
      options: ['Linear Regression', 'Logistic Regression', 'K-Means', 'Random Forest'],
      correctAnswerIndex: 3,
    },
  ],
  'Responsive Web Design Techniques': [
    {
      question: 'Thẻ meta nào bắt buộc phải khai báo trong phần <head> để trang web responsive đúng trên thiết bị di động?',
      options: [
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '<meta name="theme-color" content="#ffffff">',
        '<meta charset="UTF-8">',
        '<meta http-equiv="X-UA-Compatible" content="ie=edge">',
      ],
      correctAnswerIndex: 0,
    },
    {
      question: 'Cú pháp CSS nào dưới đây dùng để áp dụng các style khác nhau dựa trên kích thước màn hình?',
      options: ['@keyframes', '@media', '@import', '@supports'],
      correctAnswerIndex: 1,
    },
    {
      question: 'Triết lý Mobile-first trong Responsive Design có nghĩa là gì?',
      options: [
        'Thiết kế giao diện cho desktop trước, sau đó co nhỏ lại cho mobile',
        'Viết CSS cho màn hình nhỏ (mobile) trước, sau đó dùng Media Queries để scale lên màn hình lớn',
        'Chỉ thiết kế ứng dụng cho mobile chạy độc lập',
        'Không viết bất kỳ CSS nào cho máy tính',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Đơn vị đo lường nào được khuyên dùng để thiết kế Layout co giãn linh hoạt thay thế cho pixel?',
      options: ['px', 'pt', 'rem / em / %', 'in'],
      correctAnswerIndex: 2,
    },
    {
      question: 'Thuộc tính CSS nào biến một container thành Grid layout hai chiều?',
      options: ['display: flex', 'display: block', 'display: grid', 'display: inline'],
      correctAnswerIndex: 2,
    },
  ],
  'Cryptography and Data Encryption': [
    {
      question: 'Mã hóa đối xứng (Symmetric Encryption) sử dụng bao nhiêu khóa?',
      options: [
        'Sử dụng 1 khóa duy nhất để cả mã hóa và giải mã',
        'Sử dụng 2 khóa khác nhau (Public và Private Key)',
        'Sử dụng vô số khóa ngẫu nhiên',
        'Không cần sử dụng khóa nào',
      ],
      correctAnswerIndex: 0,
    },
    {
      question: 'Thuật toán nào dưới đây là thuật toán mã hóa bất đối xứng phổ biến nhất?',
      options: ['AES', 'DES', 'RSA', 'Blowfish'],
      correctAnswerIndex: 2,
    },
    {
      question: 'Hành vi băm dữ liệu (Hashing) có đặc điểm cốt lõi nào?',
      options: [
        'Dễ dàng giải mã ngược lại dữ liệu gốc',
        'Là hàm một chiều, không thể phục hồi dữ liệu gốc từ chuỗi băm',
        'Tăng dung lượng lưu trữ của dữ liệu gốc lên gấp đôi',
        'Chỉ hoạt động được trên các chuỗi văn bản tiếng Anh',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Chữ ký số (Digital Signature) giải quyết vấn đề gì trong bảo mật?',
      options: [
        'Mã hóa nội dung tệp tin',
        'Xác định danh tính người gửi, đảm bảo tính toàn vẹn dữ liệu và tính không thể chối bỏ',
        'Ngăn chặn virus xâm nhập',
        'Tăng tốc độ truyền file',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Giao thức bảo mật nào mã hóa dữ liệu truyền tải giữa Trình duyệt và Máy chủ Web?',
      options: ['HTTP', 'FTP', 'HTTPS / TLS', 'SMTP'],
      correctAnswerIndex: 2,
    },
  ],
  'Microservices Architecture with NestJS': [
    {
      question: 'Trong kiến trúc Microservices, các dịch vụ độc lập giao tiếp thông qua hình thức nào?',
      options: [
        'Gọi trực tiếp hàm từ service khác',
        'Chia sẻ chung một cơ sở dữ liệu tập trung',
        'Giao tiếp qua mạng bằng HTTP REST, gRPC, hoặc Message Broker',
        'Không thể giao tiếp với nhau',
      ],
      correctAnswerIndex: 2,
    },
    {
      question: 'NestJS cung cấp gói thư viện nào để hỗ trợ xây dựng Microservices?',
      options: ['@nestjs/core', '@nestjs/common', '@nestjs/microservices', '@nestjs/websockets'],
      correctAnswerIndex: 2,
    },
    {
      question: 'Đâu là một Message Broker phổ biến dùng để truyền tải thông điệp bất đồng bộ?',
      options: ['Redis Cache', 'RabbitMQ hoặc Apache Kafka', 'PostgreSQL', 'Nginx Web Server'],
      correctAnswerIndex: 1,
    },
    {
      question: 'API Gateway trong kiến trúc Microservices đóng vai trò gì?',
      options: [
        'Là cơ sở dữ liệu lưu trữ cấu hình hệ thống',
        'Là cổng vào duy nhất định tuyến các request đến các service tương ứng và xử lý auth',
        'Dùng để biên dịch mã nguồn của tất cả các service',
        'Ngăn chặn truy cập internet của lập trình viên',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Lợi ích lớn nhất của việc triển khai Microservices so với Monolith là gì?',
      options: [
        'Dễ phát triển và deploy cho các ứng dụng nhỏ',
        'Có thể scale độc lập từng service, tăng khả năng chịu lỗi và tự chủ công nghệ',
        'Codebase đơn giản và dễ quản lý hơn',
        'Tiết kiệm tài nguyên máy chủ tối đa',
      ],
      correctAnswerIndex: 1,
    },
  ],
  'Database Sharding and Replication': [
    {
      question: 'Cơ chế Database Replication hoạt động theo mô hình nào dưới đây?',
      options: ['Master-Slave (hoặc Primary-Secondary)', 'Peer-to-Peer hoàn toàn tự do', 'Một chiều tuyến tính', 'Không phân cấp node'],
      correctAnswerIndex: 0,
    },
    {
      question: 'Trong mô hình Replication Master-Slave, tác vụ ghi dữ liệu được thực hiện ở đâu?',
      options: [
        'Trên tất cả các node Slaves',
        'Chỉ thực hiện ghi ở node Master, sau đó dữ liệu được đồng bộ sang Slaves',
        'Có thể ghi ở bất kỳ node nào tùy ý',
        'Ghi trực tiếp lên cache',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Database Sharding là gì?',
      options: [
        'Tạo ra bản sao giống hệt của database',
        'Phân chia dữ liệu của một bảng lớn theo chiều ngang thành nhiều database nhỏ hơn',
        'Tối ưu hóa các câu lệnh SQL tự động',
        'Mã hóa toàn bộ bảng dữ liệu nhạy cảm',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Shard Key là gì?',
      options: [
        'Khóa dùng để mã hóa kết nối cơ sở dữ liệu',
        'Trường dữ liệu dùng để quyết định bản ghi sẽ được định tuyến lưu ở phân vùng sharding nào',
        'Mật khẩu truy cập database của Admin',
        'Khóa ngoại liên kết giữa hai bảng phân vùng',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Nhược điểm lớn nhất khi triển khai Sharding là gì?',
      options: [
        'Giảm dung lượng lưu trữ của ổ cứng',
        'Tăng độ phức tạp của việc truy vấn liên bảng JOIN và quản lý transaction đa phân vùng',
        'Làm database chạy chậm hơn ban đầu',
        'Không thể tương thích với ngôn ngữ SQL',
      ],
      correctAnswerIndex: 1,
    },
  ],
  'Docker Containerization Guide': [
    {
      question: 'Dockerfile dùng để làm gì?',
      options: [
        'Lưu trữ logs chạy của ứng dụng',
        'Định nghĩa các chỉ thị để tự động xây dựng một Docker Image',
        'Cấu hình tường lửa cho máy chủ web',
        'Quản lý phiên bản mã nguồn dự án',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Khác biệt cốt lõi giữa Docker Container và Virtual Machine (máy ảo) là gì?',
      options: [
        'Container chia sẻ chung nhân hệ điều hành của host giúp khởi động siêu nhanh và nhẹ',
        'Máy ảo chạy nhanh hơn container',
        'Container chiếm dụng nhiều dung lượng RAM hơn máy ảo',
        'Không có sự khác biệt nào về mặt kiến trúc',
      ],
      correctAnswerIndex: 0,
    },
    {
      question: 'Lệnh nào dùng để khởi chạy các dịch vụ được định nghĩa trong file docker-compose.yml ở chế độ chạy nền?',
      options: ['docker-compose run', 'docker-compose start', 'docker-compose up -d', 'docker-compose launch'],
      correctAnswerIndex: 2,
    },
    {
      question: 'Docker Volume dùng để làm gì?',
      options: [
        'Tăng âm lượng thông báo lỗi của docker',
        'Lưu trữ dữ liệu bền vững ngoài vòng đời của container (tránh mất dữ liệu khi restart)',
        'Giới hạn băng thông truyền mạng của container',
        'Mã hóa source code của ứng dụng',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Lệnh nào dùng để xem danh sách các container đang hoạt động trên máy?',
      options: ['docker ps', 'docker list', 'docker images', 'docker status'],
      correctAnswerIndex: 0,
    },
  ],
  'Natural Language Processing with Transformers': [
    {
      question: 'Cơ chế cốt lõi giúp kiến trúc Transformer xử lý ngữ cảnh tốt hơn các kiến trúc cũ (như RNN) là gì?',
      options: ['Recurrent connections', 'Self-Attention mechanism', 'Max Pooling layers', 'Sigmoid activation'],
      correctAnswerIndex: 1,
    },
    {
      question: 'Mô hình BERT được thiết kế chủ yếu dựa trên thành phần nào của kiến trúc Transformer?',
      options: ['Encoder', 'Decoder', 'Fully Connected Tầng', 'Convolutional Filter'],
      correctAnswerIndex: 0,
    },
    {
      question: 'Mô hình GPT được thiết kế chủ yếu dựa trên thành phần nào của kiến trúc Transformer?',
      options: ['Encoder', 'Decoder', 'Skip Connection', 'Max Pooling'],
      correctAnswerIndex: 1,
    },
    {
      question: 'Lợi ích chính của việc song song hóa trong Transformer là gì?',
      options: [
        'Làm mô hình nhẹ hơn',
        'Cho phép huấn luyện cực nhanh trên lượng dữ liệu khổng lồ bằng GPU',
        'Giúp mô hình tự giải thích kết quả',
        'Không cần nhãn dữ liệu',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Khái niệm Fine-tuning trong học sâu nghĩa là gì?',
      options: [
        'Xóa bỏ toàn bộ trọng số cũ để học lại từ đầu',
        'Lấy mô hình đã được pre-train lớn và huấn luyện thêm một lượng nhỏ dữ liệu của tác vụ cụ thể',
        'Chỉ dùng để giảm dung lượng file model',
        'Tăng độ sâu của mạng nơ-ron lên gấp đôi',
      ],
      correctAnswerIndex: 1,
    },
  ],
  'JavaScript Async Programming: Promises & Async/Await': [
    {
      question: 'Engine JavaScript xử lý các tác vụ bất đồng bộ thông qua cơ chế cốt lõi nào?',
      options: ['Multi-threading', 'Event Loop', 'Garbage Collector', 'Strict Mode'],
      correctAnswerIndex: 1,
    },
    {
      question: 'Trạng thái nào sau đây KHÔNG thuộc về một Promise?',
      options: ['Pending', 'Fulfilled', 'Rejected', 'Processing'],
      correctAnswerIndex: 3,
    },
    {
      question: 'Từ khóa await chỉ được sử dụng hợp lệ bên trong khối hàm nào?',
      options: [
        'Bất kỳ hàm JavaScript nào',
        'Hàm được khai báo kèm từ khóa async',
        'Hàm callback của setTimeout',
        'Trong file CSS',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Phương thức nào của Promise dùng để chạy song song nhiều Promise và chỉ hoàn thành khi tất cả thành công?',
      options: ['Promise.race()', 'Promise.all()', 'Promise.any()', 'Promise.resolve()'],
      correctAnswerIndex: 1,
    },
    {
      question: 'Khi một Promise bị reject, ta dùng khối lệnh nào để bắt và xử lý lỗi đó trong async/await?',
      options: ['if...else', 'try...catch', 'switch...case', 'throw...error'],
      correctAnswerIndex: 1,
    },
  ],
  'OWASP Top 10 Web Vulnerabilities': [
    {
      question: 'Lỗ hổng SQL Injection xảy ra do nguyên nhân chủ yếu nào?',
      options: [
        'Không có mật khẩu quản trị',
        'Nối trực tiếp dữ liệu đầu vào của người dùng vào câu truy vấn SQL mà không filter/parameterize',
        'Server bị mất kết nối internet',
        'Dữ liệu bảng quá nặng',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Lỗ hổng XSS (Cross-Site Scripting) tấn công vào đối tượng nào?',
      options: [
        'Hệ quản trị cơ sở dữ liệu backend',
        'Hệ điều hành của Server',
        'Trình duyệt của người dùng truy cập trang web',
        'Mạng nội bộ của công ty',
      ],
      correctAnswerIndex: 2,
    },
    {
      question: 'Biện pháp tốt nhất để phòng chống lỗ hổng Cross-Site Request Forgery (CSRF) là gì?',
      options: [
        'Sử dụng giao thức HTTPS',
        'Sử dụng mã CSRF Token ngẫu nhiên xác thực cho mỗi session/request ghi dữ liệu',
        'Mã hóa mật khẩu bằng Bcrypt',
        'Sử dụng tường lửa Cloudflare',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Lỗ hổng Broken Object Level Authorization (BOLA) là gì?',
      options: [
        'Người dùng truy cập trực tiếp tài nguyên của người khác bằng cách thay đổi ID/UUID trên URL/payload',
        'Không phân quyền Admin',
        'Lỗi tràn bộ nhớ đệm',
        'File upload quá nặng',
      ],
      correctAnswerIndex: 0,
    },
    {
      question: 'Tại sao việc lưu trữ mật khẩu dạng văn bản thuần (plain text) vi phạm tiêu chuẩn bảo mật nghiêm trọng?',
      options: [
        'Làm tốn dung lượng ổ cứng',
        'Rò rỉ database sẽ để lộ toàn bộ mật khẩu người dùng, cần băm mật khẩu kèm salt bằng thuật toán mạnh',
        'Làm ứng dụng đăng nhập chậm hơn',
        'Không thể khôi phục lại mật khẩu cũ',
      ],
      correctAnswerIndex: 1,
    },
  ],
  'GraphQL API Implementation with NestJS': [
    {
      question: 'Sự khác biệt chính giữa truy vấn REST và GraphQL là gì?',
      options: [
        'GraphQL nhanh hơn REST gấp 10 lần',
        'GraphQL cho phép client tự định nghĩa và yêu cầu chính xác các trường dữ liệu cần thiết',
        'GraphQL không hỗ trợ phương thức POST',
        'GraphQL chỉ dùng được với cơ sở dữ liệu NoSQL',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Trong GraphQL, thao tác nào tương đương với tác vụ lấy dữ liệu (GET) trong REST?',
      options: ['Query', 'Mutation', 'Subscription', 'Resolver'],
      correctAnswerIndex: 0,
    },
    {
      question: 'Trong GraphQL, thao tác nào tương đương với tác vụ ghi/sửa dữ liệu (POST/PUT/DELETE) trong REST?',
      options: ['Query', 'Mutation', 'Subscription', 'Resolver'],
      correctAnswerIndex: 1,
    },
    {
      question: 'Thành phần nào trong NestJS đảm nhận vai trò xử lý các yêu cầu Query và Mutation từ client?',
      options: ['Controller', 'Service', 'Resolver', 'Module'],
      correctAnswerIndex: 2,
    },
    {
      question: 'Code-first approach trong NestJS GraphQL hoạt động như thế nào?',
      options: [
        'Tự động sinh GraphQL schema từ các class TypeScript và decorator khai báo',
        'Viết file schema .graphql trước rồi sinh code TypeScript',
        'Sử dụng database để tự sinh API',
        'Không cần khai báo kiểu dữ liệu',
      ],
      correctAnswerIndex: 0,
    },
  ],
  'NoSQL Databases Comparison': [
    {
      question: 'MongoDB lưu trữ dữ liệu dưới dạng cấu trúc cốt lõi nào?',
      options: ['Bảng với các hàng và cột cố định', 'Documents dạng BSON/JSON linh hoạt', 'Cây nhị phân tìm kiếm', 'Cặp Key-Value đơn giản'],
      correctAnswerIndex: 1,
    },
    {
      question: 'NoSQL Database nào tối ưu nhất cho việc lưu trữ dữ liệu dạng Key-Value trong bộ nhớ RAM?',
      options: ['MongoDB', 'Cassandra', 'Redis', 'Neo4j'],
      correctAnswerIndex: 2,
    },
    {
      question: 'Định lý CAP phát biểu rằng một hệ thống phân tán chỉ có thể chọn tối đa bao nhiêu yếu tố trong 3 yếu tố?',
      options: ['1 yếu tố', '2 yếu tố', 'Cả 3 yếu tố', 'Không yếu tố nào'],
      correctAnswerIndex: 1,
    },
    {
      question: 'Neo4j là đại diện tiêu biểu cho nhóm cơ sở dữ liệu NoSQL nào?',
      options: ['Document-store', 'Key-Value store', 'Wide-Column store', 'Graph Database'],
      correctAnswerIndex: 3,
    },
    {
      question: 'Nhóm cơ sở dữ liệu Wide-Column (như Cassandra) thường phù hợp nhất cho bài toán nào?',
      options: [
        'Lưu trữ session người dùng ngắn hạn',
        'Ghi lượng dữ liệu cực lớn, liên tục trên kiến trúc phân tán diện rộng',
        'Lập biểu đồ mạng xã hội',
        'Làm database cho ứng dụng blog đơn giản',
      ],
      correctAnswerIndex: 1,
    },
  ],
  'Kubernetes Orchestration Basics': [
    {
      question: 'Đơn vị nhỏ nhất mà Kubernetes (K8s) có thể triển khai và quản lý là gì?',
      options: ['Container', 'Pod', 'Service', 'Node'],
      correctAnswerIndex: 1,
    },
    {
      question: 'Đối tượng nào trong Kubernetes chịu trách nhiệm quản lý số lượng bản sao (replicas) và thực hiện rolling update?',
      options: ['Deployment', 'Pod', 'Service', 'ConfigMap'],
      correctAnswerIndex: 0,
    },
    {
      question: 'Thành phần nào trong Kubernetes cung cấp một IP tĩnh và cơ chế cân bằng tải nội bộ cho một nhóm Pods?',
      options: ['Ingress', 'Service', 'ReplicaSet', 'Namespace'],
      correctAnswerIndex: 1,
    },
    {
      question: 'Pod trong Kubernetes có đặc điểm kiến trúc nào dưới đây?',
      options: [
        'Chỉ chứa tối đa 1 container duy nhất',
        'Có thể chứa một hoặc nhiều container chia sẻ chung không gian mạng và ổ đĩa lưu trữ',
        'Không thể kết nối internet',
        'Chạy trực tiếp trên phần cứng máy chủ không cần docker',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Kubelet là thành phần gì trong cụm Kubernetes?',
      options: [
        'Công cụ CLI để lập trình viên gõ lệnh',
        'Một agent chạy trên mỗi worker node để đảm bảo các container hoạt động đúng trạng thái thiết lập',
        'Trình load balancer phân phối tải bên ngoài',
        'Database của Kubernetes lưu cấu hình',
      ],
      correctAnswerIndex: 1,
    },
  ],
  'Computer Vision with Convolutional Neural Networks': [
    {
      question: 'Tầng tích chập (Convolutional Layer) trong mạng CNN thực hiện vai trò gì?',
      options: [
        'Phân loại nhãn ảnh',
        'Trích xuất các đặc trưng không gian của ảnh (như cạnh, góc, hoa văn) bằng các bộ lọc trập',
        'Nén dung lượng ảnh',
        'Tăng độ sáng của ảnh',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Tầng Max Pooling trong CNN được sử dụng nhằm mục đích gì?',
      options: [
        'Tăng độ phân giải cho ảnh',
        'Giảm kích thước không gian của bản đồ đặc trưng, giảm số lượng tham số tính toán và tránh overfitting',
        'Trích xuất màu sắc của ảnh',
        'Đảo ngược màu sắc',
      ],
      correctAnswerIndex: 1,
    },
    {
      question: 'Cấu trúc mạng CNN kinh điển nào đã giải quyết vấn đề triệt tiêu gradient khi mạng quá sâu nhờ skip connections?',
      options: ['AlexNet', 'VGG-16', 'ResNet', 'LeNet-5'],
      correctAnswerIndex: 2,
    },
    {
      question: 'Tầng kết nối đầy đủ (Fully Connected Layer) thường nằm ở vị trí nào trong CNN?',
      options: [
        'Ở ngay đầu mạng nhận ảnh thô',
        'Xen kẽ giữa các tầng tích chập',
        'Ở cuối mạng, dùng để tổng hợp đặc trưng và phân loại lớp nhãn',
        'Nằm ngoài mạng CNN',
      ],
      correctAnswerIndex: 3,
    },
    {
      question: 'Ứng dụng nào dưới đây KHÔNG phải là bài toán cốt lõi của Thị giác máy tính?',
      options: [
        'Phân loại hình ảnh (Image Classification)',
        'Phát hiện vật thể (Object Detection)',
        'Nhận diện giọng nói và chuyển đổi thành văn bản (Speech-to-Text)',
        'Phân đoạn hình ảnh (Image Segmentation)',
      ],
      correctAnswerIndex: 2,
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
    } else {
      console.log(`   ⚠️ Warning: No quiz template found for "${document.title}"`);
    }
  }

  console.log(
    `\n✅ Created ${totalQuizzes} quizzes, ${totalQuestions} questions, ${totalOptions} options\n`,
  );
}
