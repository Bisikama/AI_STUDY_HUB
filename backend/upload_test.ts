import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

async function testApi() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('❌ Please provide a file path to test. Example:');
    console.error('   npx tsx upload_test.ts path/to/document.pdf');
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ File not found at path: ${resolvedPath}`);
    process.exit(1);
  }

  const fileName = path.basename(resolvedPath);
  const fileStats = fs.statSync(resolvedPath);
  const fileBuffer = fs.readFileSync(resolvedPath);

  // 1. Get Subject and User from DB to associate
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  let user = await prisma.user.findFirst();
  let subject = await prisma.subject.findFirst();

  if (!user || !subject) {
    console.error('❌ Could not find a user or subject in database. Please run migrations/seed first.');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`👤 Found user for test: ${user.fullName} (ID: ${user.id})`);
  console.log(`📚 Found subject for test: ${subject.name} (ID: ${subject.id})`);
  await prisma.$disconnect();

  // 2. Prepare multipart form data using Node.js standard FormData (Node 18+)
  console.log(`\n📤 Uploading file "${fileName}" to http://localhost:3000/api/documents/upload ...`);
  const formData = new FormData();
  
  // Create a Blob from the file buffer to append to FormData
  const fileBlob = new Blob([fileBuffer]);
  formData.append('file', fileBlob, fileName);
  formData.append('title', `Kiểm thử: ${path.parse(fileName).name}`);
  formData.append('description', `Tài liệu tải lên từ kịch bản kiểm thử API`);
  formData.append('subjectId', subject.id.toString());
  formData.append('userId', user.id);

  try {
    // Make request to Upload Endpoint
    const uploadRes = await fetch('http://localhost:3000/api/documents/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'x-user-id': user.id,
      },
    });

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
      throw new Error(`Upload failed (${uploadRes.status}): ${JSON.stringify(uploadData)}`);
    }

    const documentId = uploadData.data.id;
    console.log(`✓ Upload successful! Document ID: ${documentId}`);
    console.log(`✓ Extracted Text Length: ${uploadData.data.fullText?.length || 0} characters.`);

    // 3. Trigger AI Analysis
    console.log(`\n🤖 Calling AI analysis endpoint http://localhost:3000/api/documents/${documentId}/analyze ...`);
    const analyzeRes = await fetch(`http://localhost:3000/api/documents/${documentId}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
    });

    const analyzeData = await analyzeRes.json();
    if (!analyzeRes.ok) {
      throw new Error(`AI Analysis failed (${analyzeRes.status}): ${JSON.stringify(analyzeData)}`);
    }

    console.log('🎉 AI Analysis completed successfully!');
    console.log('\n================== SUMMARY ==================');
    console.log(analyzeData.data.summary.summaryText);
    
    console.log('\n================ KEY POINTS =================');
    console.log(analyzeData.data.summary.keyPoints);

    console.log('\n================== QUIZZES ==================');
    const questions = analyzeData.data.quiz.questions;
    questions.forEach((q: any, i: number) => {
      console.log(`\nQuestion ${i + 1}: ${q.questionText}`);
      q.options.forEach((opt: any, optIdx: number) => {
        console.log(`  [${opt.isCorrect ? 'x' : ' '}] ${opt.optionText}`);
      });
    });

  } catch (error) {
    console.error('\n❌ API testing failed with error:', error instanceof Error ? error.message : error);
    console.log('💡 Note: Make sure the NestJS server is running on http://localhost:3000 (run: npm run start:dev)');
  }
}

testApi();
