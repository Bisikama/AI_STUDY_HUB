export class ApiResponsePayload<TData, TMetadata = unknown> {
  constructor(
    readonly data: TData,
    readonly metadata: TMetadata,
  ) {}
}

export function withMetadata<TData, TMetadata>(
  data: TData,
  metadata: TMetadata,
): ApiResponsePayload<TData, TMetadata> {
  return new ApiResponsePayload(data, metadata);
}
