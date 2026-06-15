import {
  Document,
  DocumentSummary,
  Quiz,
  QuizQuestion,
  QuizOption,
} from '../../../../generated/prisma/client';

export type SanitizedDocument = Omit<Document, 'fileSize'> & {
  fileSize: number;
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
