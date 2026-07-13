import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const docs = await prisma.document.findMany({
    select: {
      id: true,
      title: true,
      fileHash: true,
      fileSize: true,
      visibilityStatus: true,
      status: true,
      uploadedBy: true,
    },
  });

  console.log('TOTAL DOCUMENTS IN DATABASE:', docs.length);
  console.log(JSON.stringify(docs, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
