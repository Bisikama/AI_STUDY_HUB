import { ValidateFilePipe } from './validate-file.pipe';
import { UnprocessableEntityException } from '@nestjs/common';

describe('ValidateFilePipe', () => {
  let pipe: ValidateFilePipe;

  beforeEach(() => {
    pipe = new ValidateFilePipe();
  });

  const createMockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => {
    return {
      fieldname: 'file',
      originalname: 'test.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('%PDF-1.4\n...'),
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
      ...overrides,
    };
  };

  it('should throw if no file is provided', () => {
    expect(() => pipe.transform(undefined as any)).toThrow(UnprocessableEntityException);
  });

  it('should throw if file size is 0 bytes', () => {
    const file = createMockFile({ size: 0 });
    expect(() => pipe.transform(file)).toThrow(UnprocessableEntityException);
  });

  it('should throw if file size exceeds 10MB', () => {
    const file = createMockFile({ size: 10 * 1024 * 1024 + 1 });
    expect(() => pipe.transform(file)).toThrow(UnprocessableEntityException);
  });

  it('should throw if originalname is empty or whitespace', () => {
    const file = createMockFile({ originalname: '   ' });
    expect(() => pipe.transform(file)).toThrow(UnprocessableEntityException);
  });

  it('should throw if filename contains only extension (.pdf, .zip)', () => {
    const file1 = createMockFile({ originalname: '.pdf' });
    const file2 = createMockFile({ originalname: '.zip' });
    expect(() => pipe.transform(file1)).toThrow(UnprocessableEntityException);
    expect(() => pipe.transform(file2)).toThrow(UnprocessableEntityException);
  });

  it('should throw for dangerous extensions', () => {
    const dangerous = ['.exe', '.msi', '.dll', '.bat', '.cmd', '.apk', '.scr', '.sh'];
    dangerous.forEach((ext) => {
      const file = createMockFile({ originalname: `virus${ext}` });
      expect(() => pipe.transform(file)).toThrow(UnprocessableEntityException);

      // check uppercase and whitespace bypass
      const fileUpper = createMockFile({ originalname: `virus${ext.toUpperCase()}  ` });
      expect(() => pipe.transform(fileUpper)).toThrow(UnprocessableEntityException);
    });
  });

  it('should throw if magic bytes do not match %PDF- for .pdf files', () => {
    const file = createMockFile({ originalname: 'test.pdf', buffer: Buffer.from('PK\x03\x04') });
    expect(() => pipe.transform(file)).toThrow(UnprocessableEntityException);
  });

  it('should throw if buffer is too short for .pdf files', () => {
    const file = createMockFile({ originalname: 'test.pdf', buffer: Buffer.from('PDF') });
    expect(() => pipe.transform(file)).toThrow(UnprocessableEntityException);
  });

  it('should pass valid PDF', () => {
    const file = createMockFile({ originalname: 'test.pdf', buffer: Buffer.from('%PDF-1.4') });
    expect(pipe.transform(file)).toBeDefined();
  });

  it('should pass TXT, DOCX, DOC files for storage safely', () => {
    const txtFile = createMockFile({
      originalname: 'notes.txt',
      buffer: Buffer.from('Hello world'),
    });
    const docxFile = createMockFile({
      originalname: 'lecture.final.docx',
      buffer: Buffer.from('PK...'),
    });
    const docFile = createMockFile({ originalname: 'old.doc', buffer: Buffer.from('D0CF...') });

    expect(pipe.transform(txtFile)).toBeDefined();
    expect(pipe.transform(docxFile)).toBeDefined();
    expect(pipe.transform(docFile)).toBeDefined();
  });

  it('should pass ZIP, XLSX, PNG files for storage safely', () => {
    const zipFile = createMockFile({ originalname: 'archive.zip', buffer: Buffer.from('PK...') });
    const xlsxFile = createMockFile({ originalname: 'data.xlsx', buffer: Buffer.from('PK...') });
    const pngFile = createMockFile({ originalname: 'image.png', buffer: Buffer.from('PNG...') });

    expect(pipe.transform(zipFile)).toBeDefined();
    expect(pipe.transform(xlsxFile)).toBeDefined();
    expect(pipe.transform(pngFile)).toBeDefined();
  });

  it('should pass extensionless files like "notes"', () => {
    const notesFile = createMockFile({ originalname: 'notes', buffer: Buffer.from('content') });
    const transformed = pipe.transform(notesFile);
    expect(transformed).toBeDefined();
    // It should keep the safe name
    expect(transformed.originalname).toBe('notes');
  });

  it('should pass and sanitize path traversal in filename while preserving original extension', () => {
    const file = createMockFile({ originalname: '../../../etc/passwd\x00.docx' });
    const result = pipe.transform(file);
    expect(result.originalname).toBe('passwd.docx');
  });
});
