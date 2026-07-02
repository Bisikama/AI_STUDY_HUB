export const mapDocumentError = (error: any): string => {
  const code = error?.response?.data?.code || error?.response?.data?.message || error?.message;

  switch (code) {
    case 'DOCUMENT_INVALID_FILE':
      return 'File PDF không hợp lệ. Vui lòng kiểm tra lại.';
    case 'STORAGE_OPERATION_FAILED':
      return 'Không thể lưu file lúc này. Vui lòng thử lại sau.';
    case 'ACCOUNT_LOCKED':
      return 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.';
    case 'DOCUMENT_PUBLIC_SUBJECT_REQUIRED':
      return 'Chỉ System Subject mới có thể gửi duyệt công khai.';
    case 'DOCUMENT_INVALID_STATE':
      return 'Trạng thái tài liệu đã thay đổi hoặc không hợp lệ. Vui lòng tải lại trang.';
    case 'DOCUMENT_NOT_ACTIVE':
      return 'Tài liệu không còn hoạt động hoặc đã bị xoá.';
    case 'STORAGE_QUOTA_EXCEEDED':
      return 'Dung lượng lưu trữ của bạn đã đầy (1 GiB). Vui lòng xoá bớt tài liệu cũ để tiếp tục.';
    default:
      if (error?.response?.status === 401) {
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      }
      if (error?.response?.status === 403) {
        return 'Bạn không có quyền thực hiện hành động này.';
      }
      return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
  }
};
