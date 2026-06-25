import {
  Document,
  DocumentSummary,
  Quiz,
  QuizQuestion,
  QuizOption,
  VisibilityStatus,
  DeletionStatus,
  ExtractionStatus,
  AIStatus,
} from '../../../../generated/prisma/client';

export interface MyDocumentListItem {
  id: string;
  title: string;
  description: string | null;
  subjectId: number;
  fileType: string;
  visibilityStatus: VisibilityStatus;
  deletionStatus: DeletionStatus;
  extractionStatus: ExtractionStatus;
  aiStatus: AIStatus;
  pageCount: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SanitizedDocument = Omit<Document, 'fileSize'> & {
  fileSize: number;
  isOwner?: boolean;
  isFollowed?: boolean;
};

export interface SanitizedQuizQuestion extends QuizQuestion {
  options: QuizOption[];
}

export interface SanitizedQuiz extends Quiz {
  questions: SanitizedQuizQuestion[];
}

export interface SanitizedDocumentDetails extends SanitizedDocument {
  summary: DocumentSummary | null;
  quizzes: SanitizedQuiz[];
}

export interface AnalyzeResult {
  summary: DocumentSummary;
  quiz: SanitizedQuiz;
  document: SanitizedDocument;
}
