import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Helper function to convert BigInt to Number/String in objects to prevent serialization crashes.
   */
  private sanitizeData<T>(data: unknown): T {
    if (data === null || data === undefined) return data as unknown as T;
    if (typeof data === 'bigint') return Number(data) as unknown as T;
    if (Array.isArray(data)) {
      return data.map((item: unknown) => this.sanitizeData<unknown>(item)) as unknown as T;
    }
    if (typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      const copy: Record<string, unknown> = {};
      for (const key of Object.keys(obj)) {
        copy[key] = this.sanitizeData<unknown>(obj[key]);
      }
      return copy as unknown as T;
    }
    return data as T;
  }

  /**
   * Approve or reject a document by updating its status
   * @param documentId - The ID of the document to update
   * @param status - The new status: 'AVAILABLE' or 'FAILED'
   */
  async approveOrRejectDoc(
    documentId: string,
    status: 'AVAILABLE' | 'FAILED',
  ) {
    try {
      // Find the document by ID
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new NotFoundException(`Document with ID ${documentId} not found`);
      }

      // Update the document status
      const updatedDocument = await this.prisma.document.update({
        where: { id: documentId },
        data: { status },
      });

      return this.sanitizeData(updatedDocument);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to update document status',
      );
    }
  }
}
