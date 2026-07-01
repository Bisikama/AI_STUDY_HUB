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
  copyrightSourceType?: string | null;
  copyrightAuthorName?: string | null;
  copyrightSourceUrl?: string | null;
  copyrightLicense?: string | null;
  copyrightAttribution?: string | null;
};
