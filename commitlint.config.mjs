export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Thêm tính năng mới
        'fix',      // Sửa bug
        'docs',     // Cập nhật tài liệu (README...)
        'style',    // Format code (không đổi logic, ví dụ: CSS, khoảng trắng)
        'refactor', // Tối ưu lại code (không thêm tính năng, không sửa bug)
        'test',     // Thêm hoặc sửa test case
        'chore',    // Việc vặt (cập nhật thư viện, đổi config...)
        'revert',   // Rollback lại commit cũ
      ],
    ],
    'subject-case': [0, 'always'], // Tắt ép viết thường/viết hoa ở tin nhắn để anh em thoải mái gõ tiếng Việt
  },
};

