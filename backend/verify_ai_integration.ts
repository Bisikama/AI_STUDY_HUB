import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DocumentsService } from './src/documents/documents.service';
import { PrismaService } from './src/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

async function verify() {
  console.log('🚀 Starting AI integration verification...');

  // 1. Initialize NestJS App Context
  const app = await NestFactory.createApplicationContext(AppModule);
  const documentsService = app.get(DocumentsService);
  const prisma = app.get(PrismaService);

  try {
    // 2. Ensure we have at least one User and one Subject in the DB
    let user = await prisma.user.findFirst();
    if (!user) {
      console.log('👤 No user found. Seeding a test user...');
      user = await prisma.user.create({
        data: {
          email: 'test_ai_user@example.com',
          passwordHash: 'dummyhash',
          fullName: 'Test AI User',
          role: 'STUDENT',
        },
      });
    }

    let subject = await prisma.subject.findFirst();
    if (!subject) {
      console.log('📚 No subject found. Seeding a test subject...');
      subject = await prisma.subject.create({
        data: {
          name: 'Test Artificial Intelligence',
          code: 'TAI101',
          description: 'Testing AI tools',
        },
      });
    }

    console.log(`👤 User: ${user.fullName} (${user.id})`);
    console.log(`📚 Subject: ${subject.name} (${subject.code})`);

    // =================================================================
    // TEST 1: Upload a short TXT document and analyze it
    // =================================================================
    console.log('\n--- TEST 1: Uploading and analyzing a small TXT document ---');
    const mockFileContent = `Cấu trúc dữ liệu và giải thuật là một trong những môn học nền tảng nhất của lập trình viên.
Môn học này cung cấp kiến thức về cách tổ chức dữ liệu (như mảng, danh sách liên kết, ngăn xếp, hàng đợi, cây, đồ thị) và các thuật toán giải quyết vấn đề hiệu quả (như tìm kiếm, sắp xếp, duyệt đồ thị, quy hoạch động).
Hiểu rõ cấu trúc dữ liệu giúp tối ưu tài nguyên lưu trữ bộ nhớ, trong khi thuật toán tốt giúp chương trình chạy nhanh hơn gấp nhiều lần.`;

    const mockFile: any = {
      buffer: Buffer.from(mockFileContent, 'utf-8'),
      originalname: 'data_structures_intro.txt',
      mimetype: 'text/plain',
      size: Buffer.from(mockFileContent, 'utf-8').length,
    };

    // Track document IDs for cleanup
    let createdDocId: string | undefined;
    let createdLongDocId: string | undefined;

    try {
      const doc = await documentsService.uploadAndParse(
        mockFile,
        'Cấu trúc dữ liệu cơ bản',
        'Giới thiệu về cấu trúc dữ liệu và giải thuật',
        subject.id,
        user.id,
      );
      createdDocId = doc.id;
      console.log(`✓ Document uploaded successfully: ID = ${doc.id}`);
      console.log(`✓ Cached fullText preview: "${doc.fullText.substring(0, 100)}..."`);

      console.log('Calling AI Analysis endpoint...');
      const analysisResult = await documentsService.analyze(doc.id, user.id);
      console.log('✓ AI Analysis completed successfully!');
      console.log('✓ Document Summary text length:', analysisResult.summary.summaryText.length);
      console.log('✓ Quiz Questions generated:', analysisResult.quiz.questions.length);
      analysisResult.quiz.questions.forEach((q: any, index: number) => {
        console.log(`  Question ${index + 1}: "${q.questionText}"`);
        q.options.forEach((opt: any) => {
          console.log(`    - [${opt.isCorrect ? 'x' : ' '}] ${opt.optionText}`);
        });
      });

      // Verify DB flag update
      const freshDoc = await prisma.document.findUnique({ where: { id: doc.id } });
      console.log(`✓ Document isAIGenerated flag: ${freshDoc?.isAIGenerated}`);
    } catch (err) {
      console.error('❌ Test 1 failed:', err);
      throw err;
    }

    // =================================================================
    // TEST 2: Verify Layer 1 (Length Defense)
    // =================================================================
    console.log('\n--- TEST 2: Verifying Layer 1 Defense (> 40000 characters) ---');
    const longContent = 'A'.repeat(45000); // 45,000 characters
    const longFile: any = {
      buffer: Buffer.from(longContent, 'utf-8'),
      originalname: 'too_long_document.txt',
      mimetype: 'text/plain',
      size: longContent.length,
    };

    try {
      const longDoc = await documentsService.uploadAndParse(
        longFile,
        'Tài liệu quá dài',
        'Kiểm thử giới hạn 40000 kí tự',
        subject.id,
        user.id,
      );
      createdLongDocId = longDoc.id;

      await documentsService.analyze(longDoc.id, user.id);
      console.error('❌ Failed: Layer 1 Defense did not block the document!');
    } catch (error) {
      if (error instanceof BadRequestException) {
        console.log(
          '✓ Passed: Layer 1 Defense blocked the document and threw BadRequestException!',
        );
        console.log(`  Error Message: "${error.message}"`);
      } else {
        console.error('❌ Failed: Threw unexpected error:', error);
        throw error;
      }
    }

    // Clean up test documents
    if (createdDocId || createdLongDocId) {
      const idsToDelete = [createdDocId, createdLongDocId].filter(Boolean) as string[];
      await prisma.document.deleteMany({
        where: { id: { in: idsToDelete } },
      });
      console.log('\n🧹 Cleaned up test data.');
    }
    console.log('🎉 Verification completed successfully!');
  } catch (error) {
    console.error('❌ Verification failed with error:', error);
  } finally {
    // Secondary safety cleanup in case error was thrown before main cleanup
    try {
      // We can query prisma using the specific title or subject to ensure no leftovers
      await prisma.document.deleteMany({
        where: {
          title: {
            in: ['Cấu trúc dữ liệu cơ bản', 'Tài liệu quá dài'],
          },
        },
      });
    } catch (cleanupErr) {
      console.error('Failed to run safety cleanup:', cleanupErr);
    }
    await app.close();
  }
}

verify();
