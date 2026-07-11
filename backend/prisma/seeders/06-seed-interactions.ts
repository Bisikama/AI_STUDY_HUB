import { faker } from '@faker-js/faker';
import { PrismaClient } from '../../generated/prisma/client';
import {
  ReportReason,
  ReportStatus,
  ReservationStatus,
  UploadProgressStatus,
} from '../../generated/prisma/enums';

interface User {
  id: string;
  fullName: string;
  role: string;
}

interface Document {
  id: string;
  title: string;
  uploadedBy: string;
}

export async function seedInteractions(
  prisma: PrismaClient,
  users: User[],
  documents: Document[],
): Promise<void> {
  console.log('🔗 Seeding document interactions and user activity...');

  const students = users.filter((u) => u.role === 'STUDENT');
  const admins = users.filter((u) => u.role === 'ADMIN');
  const quizzes = await prisma.quiz.findMany();

  if (students.length === 0 || documents.length === 0) {
    console.log('⚠️ Missing students or documents, skipping interactions seed.');
    return;
  }

  // 1. Seed UserDocumentView & UserFollowedDocument & DocumentRating
  console.log('   👀 Seeding views, follows, and ratings...');
  for (const doc of documents) {
    // Mỗi tài liệu sẽ có 2-4 lượt xem bởi học sinh ngẫu nhiên
    const viewingStudents = faker.helpers.arrayElements(students, { min: 2, max: 4 });

    for (let idx = 0; idx < viewingStudents.length; idx++) {
      const student = viewingStudents[idx];

      // Tạo lượt xem
      await prisma.userDocumentView
        .create({
          data: {
            userId: student.id,
            documentId: doc.id,
            viewedAt: faker.date.recent({ days: 30 }),
          },
        })
        .catch(() => {
          // Bỏ qua nếu trùng lặp unique constraint
        });

      // 50% khả năng học sinh sẽ follow tài liệu này
      if (faker.datatype.boolean(0.5)) {
        await prisma.userFollowedDocument
          .create({
            data: {
              userId: student.id,
              documentId: doc.id,
              followedAt: faker.date.recent({ days: 15 }),
            },
          })
          .catch(() => {
            // Bỏ qua nếu trùng lặp unique constraint
          });
      }

      // 60% khả năng học sinh sẽ đánh giá (Rating) tài liệu
      if (faker.datatype.boolean(0.6)) {
        await prisma.documentRating
          .create({
            data: {
              userId: student.id,
              documentId: doc.id,
              rating: faker.number.int({ min: 3, max: 5 }),
              comment: faker.helpers.arrayElement([
                'Tài liệu rất hay và chi tiết!',
                'Giúp ích cho mình rất nhiều trong kỳ thi.',
                'Nội dung ngắn gọn dễ hiểu.',
                'Khá đầy đủ thông tin, cảm ơn tác giả.',
                'Trình bày đẹp mắt, dễ theo dõi.',
                null,
              ]),
              createdAt: faker.date.recent({ days: 10 }),
            },
          })
          .catch(() => {
            // Bỏ qua nếu trùng lặp unique constraint
          });
      }
    }
  }

  // 2. Seed UserQuizAttempt
  if (quizzes.length > 0) {
    console.log('   📝 Seeding quiz attempts...');
    for (const quiz of quizzes) {
      // Mỗi quiz có 1-3 lượt làm bài
      const attemptStudents = faker.helpers.arrayElements(students, { min: 1, max: 3 });
      for (const student of attemptStudents) {
        await prisma.userQuizAttempt.create({
          data: {
            userId: student.id,
            quizId: quiz.id,
            score: faker.number.int({ min: 60, max: 100 }), // Điểm từ 60 đến 100
            completedAt: faker.date.recent({ days: 7 }),
          },
        });
      }
    }
  }

  // 3. Seed DocumentReport
  console.log('   ⚠️ Seeding document reports...');
  // Chọn ngẫu nhiên 2 tài liệu để báo cáo vi phạm
  const reportedDocs = faker.helpers.arrayElements(documents, 2);
  const reasons: ReportReason[] = ['FILE_ERROR', 'INCORRECT_CONTENT', 'LOW_QUALITY'];
  const admin = admins[0];

  for (let idx = 0; idx < reportedDocs.length; idx++) {
    const doc = reportedDocs[idx];
    const reporter = students[idx % students.length];

    if (idx === 0) {
      // Báo cáo đã xử lý (RESOLVED) bởi admin
      await prisma.documentReport.create({
        data: {
          documentId: doc.id,
          reporterId: reporter.id,
          reason: reasons[0],
          description: 'Không tải được tệp PDF này, báo lỗi đường truyền.',
          status: ReportStatus.RESOLVED,
          reviewedBy: admin?.id || null,
          reviewedAt: new Date(),
          adminNote: 'Đã cập nhật lại link Supabase storage, hoạt động bình thường.',
        },
      });
    } else {
      // Báo cáo đang chờ duyệt (PENDING)
      await prisma.documentReport.create({
        data: {
          documentId: doc.id,
          reporterId: reporter.id,
          reason: reasons[1],
          description: 'Nội dung có một vài công thức toán học bị hiển thị sai.',
          status: ReportStatus.PENDING,
        },
      });
    }
  }

  // 4. Seed StorageReservation
  console.log('   💾 Seeding storage reservations...');
  for (const student of students) {
    // Mỗi học sinh có 1 đặt trước bộ nhớ hết hạn và 1 đang hoạt động
    await prisma.storageReservation.create({
      data: {
        userId: student.id,
        bytes: BigInt(faker.number.int({ min: 5000000, max: 15000000 })),
        status: ReservationStatus.RELEASED,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Hôm qua
        releasedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      },
    });

    await prisma.storageReservation.create({
      data: {
        userId: student.id,
        bytes: BigInt(faker.number.int({ min: 5000000, max: 15000000 })),
        status: ReservationStatus.PENDING,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 giờ tới
      },
    });
  }

  // 5. Seed DocumentChunk (phục vụ RAG)
  console.log('   🧩 Seeding document chunks for AI search...');
  for (const doc of documents) {
    // Chia tài liệu thành 2 chunk
    await prisma.documentChunk.create({
      data: {
        documentId: doc.id,
        chunkIndex: 0,
        content: `[Phần 1] Nội dung nghiên cứu chi tiết liên quan đến ${doc.title}. Phân tích kiến trúc, các thành phần cốt lõi và phương pháp luận áp dụng thực tế để tối ưu hóa hệ thống.`,
        charStart: 0,
        charEnd: 150,
      },
    });

    await prisma.documentChunk.create({
      data: {
        documentId: doc.id,
        chunkIndex: 1,
        content: `[Phần 2] Các kịch bản thử nghiệm, kết quả đánh giá thực tế và bài học kinh nghiệm rút ra khi vận hành ${doc.title} trong môi trường production thực tế.`,
        charStart: 151,
        charEnd: 320,
      },
    });
  }

  // 6. Seed UploadStatus
  console.log('   📤 Seeding upload progress status logs...');
  for (const student of students) {
    // 1 upload thành công
    await prisma.uploadStatus.create({
      data: {
        userId: student.id,
        fileName: `study-note-${faker.string.alphanumeric(5)}.pdf`,
        fileSize: BigInt(faker.number.int({ min: 2000000, max: 8000000 })),
        status: UploadProgressStatus.COMPLETED,
        progress: 100,
        createdAt: faker.date.recent({ days: 3 }),
      },
    });

    // 1 upload bị lỗi
    await prisma.uploadStatus.create({
      data: {
        userId: student.id,
        fileName: `outdated-spec-${faker.string.alphanumeric(5)}.pdf`,
        fileSize: BigInt(faker.number.int({ min: 12000000, max: 20000000 })),
        status: UploadProgressStatus.FAILED,
        progress: 45,
        errorMessage: 'Network timeout during chunks upload to Supabase storage.',
        createdAt: faker.date.recent({ days: 2 }),
      },
    });
  }

  console.log('✅ Interactions seeding completed!\n');
}
