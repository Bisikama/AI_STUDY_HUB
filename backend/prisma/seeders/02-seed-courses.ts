import { PrismaClient } from '../../generated/prisma/client';

export async function seedCourses(prisma: PrismaClient) {
  console.log('📚 Creating courses...');

  const courses = await Promise.all([
    prisma.course.create({
      data: {
        code: 'SWE102',
        name: 'Web Development with NestJS',
      },
    }),
    prisma.course.create({
      data: {
        code: 'DBI202',
        name: 'Database Systems & SQL Optimization',
      },
    }),
    prisma.course.create({
      data: {
        code: 'PRJ301',
        name: 'Project Management & DevOps',
      },
    }),
    prisma.course.create({
      data: {
        code: 'AI101',
        name: 'Introduction to Machine Learning',
      },
    }),
  ]);

  console.log(`✅ Created ${courses.length} courses\n`);

  return courses;
}
