export type ExploreDocumentItem = {
  id: string;
  title: string;
  description: string | null;
  subject: {
    id: number;
    name: string;
    code: string;
  };
  fileType: string;
  fileSize: string;
  downloadCount: number;
  viewCount: number;
  quizCount: number;
  hasSummary: boolean;
  uploader: {
    id: string;
    fullName: string;
    role: string;
    isTeacher: boolean;
  };
  createdAt: Date;
};
