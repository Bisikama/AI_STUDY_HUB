export type ExploreDocumentItem = {
  id: string;
  title: string;
  description: string | null;
  subject: {
    id: number;
    name: string;
    code: string;
  };
  fileUrl: string;
  previewUrl: string | null;
  fileType: string;
  fileSize: string;
  downloadCount: number;
  viewCount: number;
  quizCount: number;
  hasSummary: boolean;
  createdAt: Date;
};
