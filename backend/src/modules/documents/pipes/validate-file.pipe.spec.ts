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

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should throw UnprocessableEntityException if no file is provided', () => {
    expect(() => pipe.transform(undefined as any)).toThrow(UnprocessableEntityException);
  });

  it('should throw if file size exceeds 10MB', () => {
    const file = createMockFile({ size: 10 * 1024 * 1024 + 1 });
    expect(() => pipe.transform(file)).toThrow(UnprocessableEntityException);
  });

  it('should throw if mimetype is not application/pdf (e.g. JPG)', () => {
    const file = createMockFile({ mimetype: 'image/jpeg', originalname: 'test.jpg' });
    expect(() => pipe.transform(file)).toThrow(UnprocessableEntityException);
  });

  it('should throw if extension is not .pdf despite correct mimetype', () => {
    const file = createMockFile({ originalname: 'test.txt' });
    expect(() => pipe.transform(file)).toThrow(UnprocessableEntityException);
  });

  it('should throw if magic bytes do not match %PDF-', () => {
    const file = createMockFile({ buffer: Buffer.from('PK\x03\x04') }); // Zip/Docx magic bytes
    expect(() => pipe.transform(file)).toThrow(UnprocessableEntityException);
  });

  it('should throw if buffer is too short', () => {
    const file = createMockFile({ buffer: Buffer.from('PDF') });
    expect(() => pipe.transform(file)).toThrow(UnprocessableEntityException);
  });

  it('should pass and sanitize valid PDF with path traversal in filename', () => {
    const file = createMockFile({ originalname: '../../../etc/passwd\x00.pdf' });
    const result = pipe.transform(file);
    expect(result.originalname).toBe('passwd.pdf');
    expect(result).toBeDefined();
  });

  it('should reject filename that is empty or just .pdf safely', () => {
    const file = createMockFile({ originalname: '.pdf' });
    try {
      pipe.transform(file);
      fail('Expected UnprocessableEntityException to be thrown');
    } catch (e: any) {
      expect(e).toBeInstanceOf(UnprocessableEntityException);
      expect(e.getStatus()).toBe(422);
      expect(e.getResponse()).toEqual(
        expect.objectContaining({
          code: 'DOCUMENT_INVALID_FILE',
        })
      );
    }
  });

  it('should pass valid PDF', () => {
    const file = createMockFile();
    expect(pipe.transform(file)).toBe(file);
  });
});
