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
  console.log('📄 Creating high-quality documents...');

  const documentTemplates = [
    {
      subjectCode: 'SDN301m',
      title: 'Introduction to NestJS Framework',
      description: 'Kiến trúc modular, cơ chế Dependency Injection, Controllers, Providers và các CLI của NestJS.',
      fullText: `NestJS là một framework phát triển mã nguồn mở chạy trên nền tảng Node.js, được thiết kế đặc biệt nhằm hỗ trợ việc xây dựng các ứng dụng phía máy chủ (backend) có khả năng mở rộng tốt, đáng tin cậy và dễ dàng bảo trì. Điểm nổi bật nhất của NestJS là kiến trúc thiết kế rõ ràng và nhất quán, lấy cảm hứng mạnh mẽ từ triết lý của Angular. NestJS sử dụng TypeScript làm ngôn ngữ lập trình chính thống, mang đến khả năng kiểm tra kiểu tĩnh mạnh mẽ và giúp lập trình viên phát hiện lỗi sớm ngay trong quá trình phát triển dự án.

Cấu trúc cốt lõi của ứng dụng NestJS xoay quanh ba khái niệm cơ bản: Modules, Controllers và Providers. Modules đóng vai trò gom nhóm các thành phần logic liên quan mật thiết với nhau thành một đơn vị chức năng độc lập. Mọi ứng dụng NestJS đều bắt đầu với một Module gốc (Root Module). Controllers chịu trách nhiệm trực tiếp trong việc tiếp nhận các yêu cầu HTTP (HTTP Requests) từ phía máy khách (client), xử lý dữ liệu đầu vào và trả về các phản hồi thích hợp (HTTP Responses). Các decorator như @Controller(), @Get(), @Post() giúp định nghĩa các tuyến đường (routing) một cách tường minh và tinh gọn.

Trong khi đó, Providers chịu trách nhiệm thực thi các tác vụ xử lý logic nghiệp vụ phức tạp hoặc truy vấn cơ sở dữ liệu. Điểm đặc sắc là các lớp được đánh dấu bằng decorator @Injectable() sẽ trở thành một Provider và có thể được quản lý tự động bởi cơ chế Dependency Injection (DI) của NestJS. Điều này giúp mã nguồn giảm thiểu sự phụ thuộc lẫn nhau, tăng cường tính mô-đun hóa và hỗ trợ tối đa cho việc viết các bài kiểm thử đơn vị (Unit Tests).

Để bảo mật ứng dụng, NestJS cung cấp cơ chế Guards dùng để xác thực và phân quyền truy cập, hoạt động trước khi yêu cầu đi vào controller. Pipes đóng vai trò xác thực dữ liệu đầu vào và chuyển đổi kiểu dữ liệu một cách an sau. Trong khi đó, Interceptors cho phép can thiệp vào vòng đời của request và response để ghi log, biến đổi dữ liệu trả về hoặc xử lý lỗi tập trung. Framework này cũng hỗ trợ cấu hình đa dạng các thư viện ORM phổ biến như Prisma và TypeORM, giúp đơn giản hóa quá trình tương tác với cơ sở dữ liệu SQL hay NoSQL, đồng thời tích hợp mượt mà với các kiến trúc tiên tiến khác như Microservices, GraphQL và WebSockets. CLI (Command Line Interface) của NestJS giúp tăng năng suất vượt trội khi tạo nhanh các module mới thông qua câu lệnh đơn giản. Nhờ sự kết hợp chặt chẽ của các thành phần này, NestJS trở thành sự lựa chọn hàng đầu cho các dự án phát triển phần mềm doanh nghiệp hiện đại.`,
    },
    {
      subjectCode: 'DBI202',
      title: 'SQL Query Optimization and Indexing',
      description: 'Tối ưu hóa truy vấn SQL thông qua chỉ mục (Index) B-Tree, phân tích kế hoạch thực thi EXPLAIN.',
      fullText: `Tối ưu hóa câu lệnh SQL và thiết lập chỉ mục (indexing) là một trong những nhiệm vụ quan trọng nhất đối với quản trị viên cơ sở dữ liệu và nhà phát triển phần mềm để đảm bảo hiệu năng hoạt động của hệ thống, đặc biệt là khi làm việc với các cơ sở dữ liệu lớn. Nếu không được tối ưu, một câu truy vấn có thể mất hàng phút để quét toàn bộ bảng dữ liệu lớn, gây quá tải CPU và nghẽn băng thông hệ thống.

Chỉ mục (Index) hoạt động tương tự như mục lục của một cuốn sách. Thay vì phải đọc từng trang để tìm kiếm thông tin mong muốn (quét toàn bộ bảng - Table Scan), hệ quản trị cơ sở dữ liệu (RDBMS) có thể nhanh chóng xác định vị trí của bản ghi cần tìm thông qua chỉ mục. Loại chỉ mục phổ biến nhất là B-Tree Index, được tự động tạo ra khi chúng ta khai báo khóa chính (Primary Key). Cấu trúc cây tự cân bằng này giúp giảm độ phức tạp tìm kiếm từ O(N) xuống O(log N). Ngoài ra, chúng ta có thể tạo thêm Composite Index (chỉ mục tổ hợp) trên nhiều cột để tối ưu cho các câu truy vấn lọc thông tin dựa trên nhiều điều kiện WHERE đồng thời.

Tuy nhiên, việc lạm dụng chỉ mục sẽ mang lại tác dụng ngược. Mỗi khi có thao tác ghi dữ liệu như INSERT, UPDATE hoặc DELETE, hệ thống sẽ phải cập nhật lại cấu trúc cây index tương ứng, làm giảm đáng kể hiệu năng ghi dữ liệu. Do đó, việc chọn lựa cột nào để tạo index cần dựa trên tần suất xuất hiện trong điều kiện lọc và độ phân tách (cardinality) của dữ liệu. Cột có độ phân tách thấp (như giới tính) thì việc lập index sẽ không mang lại hiệu quả cao.

Để phân tích hiệu năng của câu lệnh SQL, công cụ EXPLAIN ANALYZE là vũ khí đắc lực. Lệnh này hiển thị chi tiết kế hoạch thực thi (Execution Plan) của RDBMS, bao gồm chi phí tính toán (cost), số lượng bản ghi dự kiến và thời gian thực thi thực tế ở từng bước. Qua đó, chúng ta có thể biết liệu câu truy vấn có đang sử dụng đúng index hay không, từ đó điều chỉnh lại cách viết JOIN hoặc tối ưu cấu trúc cơ sở dữ liệu. Bên cạnh việc lập chỉ mục, lập trình viên cần tránh sử dụng truy vấn SELECT * để giảm tải băng thông mạng, thay vào đó chỉ lấy các cột thực sự cần thiết. Việc sử dụng các câu lệnh JOIN phức tạp hoặc các truy vấn con (subqueries) không tối ưu cũng có thể được thay thế bằng Common Table Expressions (CTE) để tăng tính tường minh và hỗ trợ bộ tối ưu hóa của database thực hiện tối ưu tốt hơn.`,
    },
    {
      subjectCode: 'MAI391',
      title: 'Machine Learning Fundamentals',
      description: 'Tổng quan học máy giám sát và không giám sát, cấu trúc mạng nơ-ron và thuật toán tối ưu Gradient Descent.',
      fullText: `Học máy (Machine Learning) là một lĩnh vực con của Trí tuệ nhân tạo (AI), tập trung vào việc xây dựng các hệ thống thuật toán có khả năng tự động học hỏi và cải thiện hiệu suất từ dữ liệu thực tế mà không cần lập trình các quy tắc logic một cách cứng nhắc. Nhờ sự bùng nổ của dữ liệu lớn (Big Data) và năng lực tính toán của các phần cứng hiện đại như GPU, Học máy đã phát triển mạnh mẽ và thay đổi sâu sắc nhiều ngành công nghiệp.

Học máy thường được chia thành hai nhóm chính: Học máy có giám sát (Supervised Learning) và Học máy không giám sát (Unsupervised Learning). Học máy có giám sát yêu cầu dữ liệu huấn luyện phải được gán nhãn sẵn (lặp lại quan hệ giữa đầu vào X và đầu ra Y). Thuật toán sẽ học cách ánh xạ từ đầu vào sang đầu ra để đưa ra các dự đoán cho dữ liệu mới. Các bài toán phổ biến của nhóm này là Phân loại (Classification - ví dụ lọc thư rác) và Hồi quy (Regression - ví dụ dự báo giá nhà đất). Ngược lại, Học máy không giám sát làm việc với dữ liệu chưa được gán nhãn. Mục tiêu của nó là tự động tìm ra các cấu trúc ẩn hoặc gom nhóm các điểm dữ liệu có tính chất tương tự nhau (Clustering - ví dụ phân khúc khách hàng).

Mạng nơ-ron nhân tạo (Artificial Neural Networks - ANN) là một trong những mô hình học máy mô phỏng cấu trúc sinh học của não người. Cấu trúc cơ bản của mạng nơ-ron gồm có tầng đầu vào (Input Layer), một hoặc nhiều tầng ẩn (Hidden Layers) và tầng đầu ra (Output Layer). Mỗi nơ-ron trong mạng sẽ nhận tín hiệu từ các nơ-ron tầng trước, nhân với các trọng số (weights), cộng thêm sai số (bias) và đi qua một hàm kích hoạt (Activation Function) để quyết định tín hiệu truyền đi tiếp. Hàm kích hoạt như ReLU (Rectified Linear Unit) hoặc Sigmoid đóng vai trò đưa tính phi tuyến vào mô hình, cho phép mạng nơ-ron học các mối quan hệ phức tạp.

Quá trình huấn luyện mô hình học máy thực chất là việc đi tìm bộ trọng số tối ưu để giảm thiểu giá trị của hàm mất mát (Loss Function). Thuật toán tối ưu phổ biến nhất là Gradient Descent (Cực tiểu hóa độ dốc). Thuật toán này hoạt động bằng cách tính toán đạo hàm của hàm mất mát theo từng trọng số (gradient), sau đó cập nhật các trọng số ngược hướng với vector gradient theo một tỷ lệ nhất định gọi là tốc độ học (Learning Rate). Nhờ cơ chế lan truyền ngược (Backpropagation), sai số từ tầng đầu ra được truyền ngược lại các tầng trước để cập nhật trọng số một cách hiệu quả, giúp mô hình ngày càng chính xác qua từng lượt huấn luyện.`,
    },
    {
      subjectCode: 'WED201c',
      title: 'Responsive Web Design Techniques',
      description: 'Thiết kế giao diện tương thích đa thiết bị bằng CSS Flexbox, Grid, Media Queries và triết lý Mobile-first.',
      fullText: `Thiết kế web đáp ứng (Responsive Web Design - RWD) là một phương pháp tiếp cận thiết kế và phát triển trang web sao cho giao diện có khả năng tự động điều chỉnh hiển thị một cách mượt mà và tương thích tốt trên mọi kích thước màn hình thiết bị, từ điện thoại di động thông minh, máy tính bảng cho đến màn hình máy tính để bàn có độ phân giải lớn. Với sự đa dạng vượt trội của các thiết bị truy cập internet ngày nay, việc phát triển một website responsive là tiêu chuẩn bắt buộc để tối ưu trải nghiệm người dùng và nâng cao thứ hạng SEO của website.

Kỹ thuật cốt lõi đầu tiên của thiết kế responsive là khai báo thẻ meta viewport trong phần đầu của trang HTML. Thẻ này thông báo cho trình duyệt di động biết cách kiểm soát kích thước và tỷ lệ thu phóng của trang web dựa trên chiều rộng thực tế của màn hình thiết bị, ngăn chặn việc hiển thị giao diện máy tính thu nhỏ trên điện thoại. Tiếp theo là việc sử dụng lưới linh hoạt (Fluid Grids) và hình ảnh linh hoạt (Flexible Images). Thay vì sử dụng các kích thước cố định bằng pixel (px), lập trình viên sẽ ưu tiên sử dụng các đơn vị đo lường tương đối như phần trăm (%), rem hoặc em cho bố cục và đặt thuộc tính 'max-width: 100%' cho hình ảnh để chúng tự co giãn theo container chứa.

Về mặt CSS, hai công cụ layout hiện đại là CSS Flexbox và CSS Grid đóng vai trò cách mạng hóa cách xây dựng bố cục web. Flexbox tối ưu cho việc sắp xếp các phần tử theo một chiều (hàng hoặc cột) và tự động phân bổ không gian trống, trong khi CSS Grid cho phép xây dựng các bố cục hai chiều phức tạp với các cột và hàng được định nghĩa sẵn. Ngoài ra, Media Queries là công cụ không thể thiếu để áp dụng các khối lệnh CSS khác nhau dựa trên các điểm dừng (breakpoints) cụ thể của chiều rộng màn hình.

Triết lý thiết kế 'Mobile-first' (Ưu tiên di động) là một chiến lược thiết kế khuyên lập trình viên nên xây dựng giao diện và viết CSS cho phiên bản màn hình di động nhỏ nhất trước, sau đó mới dùng Media Queries để bổ sung kiểu dáng cho màn hình lớn hơn. Cách tiếp cận này giúp giảm thiểu dung lượng tải mã nguồn, tối ưu hóa hiệu năng tải trang trên mạng di động và đảm bảo nội dung cốt lõi của website luôn được ưu tiên hiển thị trước. Việc liên tục kiểm thử trên các thiết bị thực tế hoặc các công cụ giả lập của trình duyệt sẽ giúp phát hiện sớm các lỗi tràn dòng hay bố cục bị vỡ, mang lại sản phẩm web hoàn hảo nhất.`,
    },
    {
      subjectCode: 'ISC301',
      title: 'Cryptography and Data Encryption',
      description: 'Mã hóa đối xứng AES, mã hóa bất đối xứng RSA, hàm băm SHA-256, chữ ký số và giao thức bảo mật TLS/HTTPS.',
      fullText: `Mật mã học (Cryptography) và mã hóa dữ liệu (Data Encryption) là nền tảng cốt lõi của an ninh thông tin trong kỷ nguyên số, đóng vai trò bảo vệ dữ liệu nhạy cảm khỏi sự truy cập và can thiệp trái phép khi lưu trữ cũng như khi truyền tải trên mạng internet. Mục tiêu cơ bản của mật mã học bao gồm việc đảm bảo tính bảo mật (confidentiality), tính toàn vẹn (integrity), tính xác thực (authenticity) và tính không thể chối bỏ (non-repudiation) của thông tin.

Mã hóa được chia thành hai nhánh chính: Mã hóa đối xứng (Symmetric Encryption) và Mã hóa bất đối xứng (Asymmetric Encryption). Mã hóa đối xứng sử dụng duy nhất một khóa dùng chung cho cả hai quá trình mã hóa dữ liệu gốc và giải mã bản mã. Thuật toán phổ biến nhất trong nhóm này là AES (Advanced Encryption Standard), được sử dụng rộng rãi trên toàn cầu nhờ tốc độ xử lý nhanh và độ bảo mật cực kỳ cao. Tuy nhiên, thách thức lớn nhất của mã hóa đối xứng là làm sao để truyền tải khóa dùng chung này đến bên nhận một cách an toàn. Để giải quyết vấn đề đó, mã hóa bất đối xứng ra đời, sử dụng một cặp khóa đi liền nhau gồm Khóa công khai (Public Key) dùng để mã hóa và Khóa bí mật (Private Key) dùng để giải mã. Thuật toán kinh duyệt RSA là đại diện tiêu biểu của phương pháp này.

Hàm băm (Hash Functions) là một thành phần quan trọng khác của mật mã học. Hàm băm là hàm một chiều, chuyển đổi một lượng dữ liệu đầu vào có độ dài bất kỳ thành một chuỗi ký tự có độ dài cố định gọi là giá trị băm (hash value). Thuật toán băm tiêu chuẩn như SHA-256 đảm bảo rằng chỉ cần dữ liệu gốc thay đổi dù chỉ một ký tự thì giá trị băm trả về sẽ hoàn toàn khác biệt, giúp xác minh tính toàn vẹn của tệp tin. Kết hợp giữa hàm băm và mã hóa bất đối xứng tạo nên Chữ ký số (Digital Signature), cho phép xác thực danh tính người gửi và đảm bảo dữ liệu không bị thay đổi trong quá trình truyền.

Trong các ứng dụng thực tế, giao thức TLS (Transport Layer Security) kết hợp cả mã hóa đối xứng, bất đối xứng và chữ ký số để bảo vệ thông tin truyền tải giữa trình duyệt web và máy chủ (giao thức HTTPS). Quá trình bắt tay (Handshake) TLS sử dụng mã hóa bất đối xứng để thiết lập khóa phiên (Session Key) chung một cách an toàn, sau đó toàn bộ dữ liệu trao đổi thực tế sẽ được mã hóa bằng mã hóa đối xứng để tối ưu hóa hiệu năng đường truyền. Nhờ hệ thống mật mã phức tạp này, thông tin người dùng như mật khẩu, tài khoản ngân hàng luôn được giữ an toàn trên internet.`,
    },
    {
      subjectCode: 'SWD391',
      title: 'Docker Containerization Guide',
      description: 'Đóng gói ứng dụng bền vững bằng Docker, tối ưu Dockerfile, phối hợp multi-containers bằng Docker Compose.',
      fullText: `Docker và công nghệ container hóa (containerization) đã thay đổi hoàn toàn cách thức phát triển, thử nghiệm và triển khai các ứng dụng phần mềm hiện đại. Trước khi có container, lỗi 'chạy tốt trên máy tôi nhưng lỗi trên server' luôn là nỗi ám ảnh lớn của lập trình viên do sự khác biệt về hệ điều hành, thư viện hoặc cấu hình môi trường. Docker giải quyết triệt để vấn đề này bằng cách đóng gói toàn bộ mã nguồn cùng các thư viện phụ thuộc thành một container đồng nhất chạy độc lập trên mọi môi trường.

Điểm khác biệt cốt lõi giữa Docker Container và Máy ảo (Virtual Machine - VM) nằm ở cấu trúc kiến trúc phần cứng giả lập. Trong khi mỗi máy ảo yêu cầu một hệ điều hành khách (Guest OS) riêng chạy trên phần mềm quản lý hypervisor, tiêu tốn rất nhiều RAM và ổ cứng thì các Docker Container chia sẻ chung nhân hệ điều hành của máy chủ vật lý (Host OS). Nhờ vậy, container khởi động chỉ trong vài mili giây, cực kỳ nhẹ và tối ưu hóa tài nguyên phần cứng máy chủ tối đa.

Quy trình làm việc với Docker bắt đầu bằng việc viết một Dockerfile - một tệp cấu hình dạng văn bản chứa các chỉ thị từng bước để xây dựng một Docker Image (ảnh tĩnh). Docker Image hoạt động như một khuôn mẫu cố định, chứa mã nguồn và môi trường chạy cần thiết. Khi khởi chạy image, chúng ta sẽ thu được một thực thể động gọi là Docker Container. Lập trình viên có thể đẩy các image lên kho lưu trữ Docker Hub để chia sẻ và deploy dễ dàng.

Để quản lý một ứng dụng phức tạp gồm nhiều container khác nhau hoạt động cùng lúc (ví dụ: một container chạy code backend Node.js, một container chạy cơ sở dữ liệu PostgreSQL và một container chạy cache Redis), công cụ Docker Compose là lựa chọn tối ưu. Thông qua file cấu hình 'docker-compose.yml' viết bằng YAML, chúng ta có thể định nghĩa và khởi chạy toàn bộ dịch vụ chỉ bằng một câu lệnh duy nhất 'docker-compose up -d'. Docker Compose cũng tự động thiết lập mạng nội bộ (network) giúp các container giao tiếp an toàn và quản lý phân vùng ổ đĩa (volumes) để lưu trữ dữ liệu bền vững ngoài vòng đời của container.`,
    },
    {
      subjectCode: 'NLP301c',
      title: 'Natural Language Processing with Transformers',
      description: 'Kiến trúc Transformer, cơ chế Self-Attention, sự khác biệt BERT/GPT và quy trình huấn luyện Fine-tuning.',
      fullText: `Xử lý ngôn ngữ tự nhiên (Natural Language Processing - NLP) là một nhánh nghiên cứu quan trọng của Trí tuệ nhân tạo, tập trung vào việc giúp máy tính có thể hiểu, phân tích và sinh ra ngôn ngữ tự nhiên của con người. Trong suốt nhiều năm, các mô hình tuần tự như RNN hoặc LSTM là tiêu chuẩn cho các bài toán NLP, tuy nhiên chúng gặp hạn chế lớn về tốc độ tính toán do phải xử lý tuần tự từng từ và gặp khó khăn khi học ngữ cảnh của các câu dài.

Sự xuất hiện của kiến trúc Transformer vào năm 2017 với cơ chế Tự chú ý (Self-Attention) đã tạo ra một bước ngoặt vĩ đại cho NLP. Cơ chế Self-Attention cho phép mô hình tính toán mối liên kết ngữ cảnh giữa tất cả các từ trong một câu cùng một lúc, không phụ thuộc vào khoảng cách vật lý giữa chúng. Điều này không chỉ giúp mô hình hiểu ngữ cảnh sâu sắc hơn và còn cho phép song song hóa quá trình tính toán trên GPU, giúp huấn luyện các mô hình ngôn ngữ khổng lồ một cách nhanh chóng.

Kiến trúc Transformer cơ bản gồm hai thành phần: Encoder (Bộ mã hóa) và Decoder (Bộ giải mã). Từ nền tảng này, hai dòng mô hình tiền huấn luyện (pre-trained models) nổi tiếng đã ra đời và thống trị NLP. Mô hình BERT (được phát triển dựa trên Encoder) tối ưu cho việc hiểu ngữ cảnh hai chiều của câu, rất phù hợp cho các tác vụ như phân loại văn bản, phân tích cảm xúc hoặc tìm kiếm thông tin. Ngược lại, mô hình GPT (dựa trên Decoder) hoạt động theo cơ chế sinh từ tự hồi quy (autoregressive) một chiều, tối ưu cho việc sinh văn bản tự động, dịch thuật và xây dựng trợ lý ảo đàm thoại thông minh.

Quy trình áp dụng các mô hình ngôn ngữ lớn này vào thực tế thường gồm hai giai đoạn: Tiền huấn luyện (Pre-training) và Tinh chỉnh (Fine-tuning). Trong giai đoạn pre-training, mô hình được huấn luyện trên một lượng dữ liệu văn bản khổng lồ chưa gán nhãn từ internet để tích lũy tri thức ngôn ngữ nền tảng. Sau đó, ở giai đoạn fine-tuning, mô hình được tiếp tục huấn luyện trên một tập dữ liệu nhỏ hơn đã được gán nhãn cho một tác vụ cụ thể của doanh nghiệp. Quá trình chuyển giao tri thức này giúp tiết kiệm thời gian huấn luyện và mang lại hiệu quả vượt trội cho các ứng dụng NLP thực tế.`,
    },
    {
      subjectCode: 'AIL302m',
      title: 'Computer Vision with Convolutional Neural Networks',
      description: 'Mạng nơ-ron tích chập (CNN), vai trò tích chập và pooling, cấu trúc skip-connection của ResNet.',
      fullText: `Thị giác máy tính (Computer Vision) là lĩnh vực khoa học máy tính hướng tới việc giúp hệ thống máy móc có thể thu nhận, xử lý và hiểu thông tin từ hình ảnh hoặc video kỹ thuật số tương tự như khả năng thị giác của con người. Trọng tâm của sự phát triển vượt bậc trong thị giác máy tính những năm gần đây là cấu trúc Mạng nơ-ron tích chập (Convolutional Neural Networks - CNN), một loại kiến trúc học sâu được thiết kế chuyên biệt để xử lý dữ liệu có dạng lưới hai chiều như hình ảnh.

Một mạng CNN cơ bản bao gồm ba loại tầng chính xếp chồng lên nhau: Tầng tích chập (Convolutional Layer), Tầng gộp (Pooling Layer) và Tầng kết nối đầy đủ (Fully Connected Layer). Tầng tích chập đóng vai trò quan trọng nhất, sử dụng các bộ lọc (kernels) trượt qua ảnh gốc để thực hiện phép toán tích chập, giúp trích xuất các đặc trưng không gian của hình ảnh như cạnh, góc, họa tiết. Các tầng tích chập ở đầu mạng thường học các đặc trưng hình học cơ bản, trong khi các tầng ở sâu hơn sẽ kết hợp chúng để nhận diện các đặc trưng phức tạp hơn như hình dáng đồ vật hoặc khuôn mặt.

Tầng gộp (thường là Max Pooling) hoạt động bằng cách giảm kích thước không gian (chiều rộng và chiều cao) của bản đồ đặc trưng thu được sau tầng tích chập. Việc này giúp giảm số lượng tham số tính toán trong mạng, tránh hiện tượng quá khớp (overfitting) và tăng tính bất biến cục bộ của đặc trưng đối với các phép dịch chuyển ảnh nhỏ. Cuối cùng, bản đồ đặc trưng sẽ được làm phẳng (flatten) và đưa vào các tầng kết nối đầy đủ (tương tự mạng ANN truyền thống) để tổng hợp thông tin và đưa ra dự đoán lớp nhãn ảnh (phân loại hình ảnh).

Trong quá trình phát triển, các nhà nghiên cứu nhận thấy việc tăng độ sâu (số tầng) của mạng CNN giúp cải thiện độ chính xác, nhưng lại dẫn đến hiện tượng triệt tiêu gradient (vanishing gradient) khiến mô hình không thể hội tụ. Kiến trúc ResNet (Residual Network) ra đời đã giải quyết triệt để vấn đề này nhờ cơ chế 'Kết nối tắt' (Skip Connections). Cơ chế này cho phép luồng gradient truyền trực tiếp qua một số tầng mà không bị suy giảm, giúp huấn luyện thành công các mạng nơ-ron sâu đến hàng trăm tầng. Hiện nay, CNN và các biến thể của nó đang là nhân tố cốt lõi trong các ứng dụng xe tự hành, nhận diện khuôn mặt và phân tích hình ảnh y khoa.`,
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

    // Thiết lập trạng thái public và ready để đáp ứng điều kiện hiển thị
    const visibility = 'PUBLIC';
    const docStatus = 'ACTIVE';

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
        extractionStatus: 'READY',
        aiStatus: 'READY',
        deletionStatus: 'ACTIVE',
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
        fullText: template.fullText,
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
