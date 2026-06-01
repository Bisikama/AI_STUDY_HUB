import { IsEnum, IsUUID } from 'class-validator';

export enum DocumentApprovalStatus {
  AVAILABLE = 'AVAILABLE',
  FAILED = 'FAILED',
}

export class ApproveDocumentDto {
  @IsUUID()
  documentId: string;

  @IsEnum(DocumentApprovalStatus)
  status: DocumentApprovalStatus;
}
