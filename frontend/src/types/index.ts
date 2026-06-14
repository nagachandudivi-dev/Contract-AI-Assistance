export interface User {
  id: number;
  fullName: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface DocumentDto {
  id: number;
  name: string;
  fileType: string;
  originalFileName: string;
  uploadDate: string;
  status: 'Processing' | 'Ready' | 'Failed';
  totalPages: number;
  errorMessage?: string;
  chunkCount: number;
}

export interface ChunkDto {
  id: number;
  documentId: number;
  chunkTitle: string;
  chunkText: string;
  pageNumber: number;
  rowNumber?: number;
  hasEmbedding: boolean;
  createdAt: string;
}

export interface CitationDto {
  documentId: number;
  sourceDocument: string;
  sectionTitle: string;
  pageNumber: number;
  rowNumber?: number;
  chunkText: string;
}

export interface AskResponse {
  answer: string;
  confidence: 'High' | 'Medium' | 'Low';
  confidenceScore: number;
  citations: CitationDto[];
  questionId: number;
  answerId: number;
}

export interface ComparisonField {
  fieldName: string;
  values: { documentId: number; documentName: string; value: string }[];
  difference: string;
}

export interface CompareResponse {
  fields: ComparisonField[];
  citations: CitationDto[];
}

export interface QuestionHistoryDto {
  id: number;
  questionText: string;
  createdAt: string;
  answers: AnswerHistoryDto[];
}

export interface AnswerHistoryDto {
  id: number;
  answerText: string;
  confidence: string;
  createdAt: string;
  citations: CitationHistoryDto[];
}

export interface CitationHistoryDto {
  sourceDocument: string;
  sectionTitle: string;
  pageNumber: number;
  rowNumber?: number;
}

export interface AnalyticsSummaryDto {
  totalDocuments: number;
  processedDocuments: number;
  failedDocuments: number;
  totalChunks: number;
  totalQuestions: number;
  totalAnswers: number;
  documentsByType_PDF: number;
  documentsByType_DOCX: number;
  documentsByType_CSV: number;
  recentQuestions: { id: number; questionText: string; createdAt: string }[];
}
