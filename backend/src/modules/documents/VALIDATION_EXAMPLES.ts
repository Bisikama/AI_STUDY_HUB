// // Ví dụ POST /api/documents/upload
// // Với validation đã cấu hình, các request sau sẽ bị reject:

// // ❌ INVALID - title quá dài
// POST /api/documents/upload
// {
//   "title": "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua... (quá 255 ký tự)",
//   "description": "Document description",
//   "subjectId": 1
// }
// // Response: 400 Bad Request - title must not exceed 255 characters

// // ❌ INVALID - thiếu title
// POST /api/documents/upload
// {
//   "description": "Document description",
//   "subjectId": 1
// }
// // Response: 400 Bad Request - Title is required

// // ❌ INVALID - subjectId không phải số
// POST /api/documents/upload
// {
//   "title": "Document Title",
//   "description": "Document description",
//   "subjectId": "abc"
// }
// // Response: 400 Bad Request - Subject ID must be a valid number

// // ❌ INVALID - subjectId âm
// POST /api/documents/upload
// {
//   "title": "Document Title",
//   "description": "Document description",
//   "subjectId": -5
// }
// // Response: 400 Bad Request - Subject ID must be a positive number

// // ❌ INVALID - file quá lớn (>10MB)
// POST /api/documents/upload
// Content-Type: multipart/form-data
// [file > 10MB]
// {
//   "title": "Document Title",
//   "description": "Document description",
//   "subjectId": 1
// }
// // Response: 400 Bad Request - File size must not exceed 10MB

// // ❌ INVALID - file format không được phép
// POST /api/documents/upload
// Content-Type: multipart/form-data
// [file.exe]
// {
//   "title": "Document Title",
//   "description": "Document description",
//   "subjectId": 1
// }
// // Response: 400 Bad Request - File type application/x-executable is not allowed

// // ❌ INVALID - ID không phải UUID
// POST /api/documents/123/analyze
// Headers:
//   x-user-id: user-123
// // Response: 400 Bad Request - Param id must be a UUID

// // ✅ VALID - Đầu đủ và đúng format
// POST /api/documents/upload
// Content-Type: multipart/form-data
// [file.pdf < 10MB]
// {
//   "title": "My Document",
//   "description": "A detailed description of my document",
//   "subjectId": 1
// }
// // Response: 201 Created - Document uploaded and parsed successfully

// // ✅ VALID - UUID format
// POST /api/documents/550e8400-e29b-41d4-a716-446655440000/analyze
// Headers:
//   x-user-id: user-123
// // Response: 201 Created - Analyze completed successfully
