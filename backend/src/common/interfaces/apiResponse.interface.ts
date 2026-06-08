export interface ApiResponse<TData = unknown, TMetadata = unknown> {
  statusCode: number;
  message: string;
  data: TData;
  metadata?: TMetadata;
  error?: string;
}
