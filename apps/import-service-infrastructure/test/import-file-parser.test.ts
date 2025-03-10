import { S3Event, S3EventRecord } from 'aws-lambda';
import { Readable } from 'stream';
import { ImportProductsObjectService } from '../src/application/import-products-object-service';
import { ImportProductsFileParsesService } from '../src/application/import-products-file-parses-service';
import { importFileParser } from '../src/presentation/import-file-parser';
import { Product } from '../src/domain';

jest.mock('@aws-sdk/client-s3');
jest.mock('../src/application/import-products-object-service');
jest.mock('../src/application/import-products-file-parses-service');

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

function createMockS3Event(recordsLength: number): S3Event {
  const records: S3EventRecord[] = [];

  for (let i = 0; i < recordsLength; i++) {
    const record = {
      eventName: 'ObjectCreated:Put',
      s3: {
        bucket: {
          name: 'test-bucket',
        },
        object: {
          key: `test-file-${i}.csv`,
        },
      },
    } as S3EventRecord;
    records.push(record);
  }

  return { Records: records };
}

describe('importFileParser', () => {
  const mockProducts: Product[] = [
    {
      title: 'Test Product 1',
      description: 'Test Description 1',
      price: 10,
      count: 5,
    },
    {
      title: 'Test Product 2',
      description: 'Test Description 2',
      price: 20,
      count: 10,
    },
  ];
  let getReadableObjectMock: jest.Mock;
  let putReadableObjectMock: jest.Mock;
  let deleteReadableObjectMock: jest.Mock;
  let parseFileMock: jest.Mock;

  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    getReadableObjectMock = ImportProductsObjectService.prototype
      .getReadableObject as jest.Mock;
    putReadableObjectMock = ImportProductsObjectService.prototype
      .copyObject as jest.Mock;
    deleteReadableObjectMock = ImportProductsObjectService.prototype
      .deleteObject as jest.Mock;
    parseFileMock = ImportProductsFileParsesService.prototype
      .parseFile as jest.Mock;
    jest.resetModules();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    jest.clearAllMocks();
  });

  it('should process S3 events and parse files successfully', async () => {
    const mockEvent = createMockS3Event(2);
    const mockReadableStream1 = {} as Readable;
    const mockReadableStream2 = {} as Readable;

    getReadableObjectMock
      .mockResolvedValueOnce(mockReadableStream1)
      .mockResolvedValueOnce(mockReadableStream2);

    parseFileMock
      .mockResolvedValueOnce(mockProducts)
      .mockResolvedValueOnce(mockProducts);

    putReadableObjectMock
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);

    deleteReadableObjectMock
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);

    await importFileParser(mockEvent);

    expect(getReadableObjectMock).toHaveBeenCalledTimes(2);
    expect(parseFileMock).toHaveBeenCalledTimes(2);
    expect(putReadableObjectMock).toHaveBeenCalledTimes(2);
    expect(deleteReadableObjectMock).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith('importFileParser | ', mockEvent);
    expect(console.log).toHaveBeenCalledWith(
      'importFileParser | Parsed products ',
      mockProducts
    );
    expect(console.log).toHaveBeenCalledTimes(3);
  });

  it('should handle errors when getting objects fails', async () => {
    const mockEvent = createMockS3Event(2);
    const mockReadableStream = {} as Readable;

    getReadableObjectMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockReadableStream);

    parseFileMock.mockResolvedValueOnce(mockProducts);

    putReadableObjectMock.mockResolvedValueOnce(true);

    deleteReadableObjectMock.mockResolvedValueOnce(true);

    await importFileParser(mockEvent);

    expect(getReadableObjectMock).toHaveBeenCalledTimes(2);
    expect(parseFileMock).toHaveBeenCalledTimes(1);
    expect(putReadableObjectMock).toHaveBeenCalledTimes(1);
    expect(deleteReadableObjectMock).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      'importFileParser | Failed to get object for record ',
      mockEvent.Records[0]
    );
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(
      'importFileParser | Parsed products ',
      mockProducts
    );
  });

  it('should handle errors when parsing files fails', async () => {
    const mockEvent = createMockS3Event(2);
    const mockReadableStream1 = {} as Readable;
    const mockReadableStream2 = {} as Readable;

    getReadableObjectMock
      .mockResolvedValueOnce(mockReadableStream1)
      .mockResolvedValueOnce(mockReadableStream2);
    parseFileMock
      .mockRejectedValueOnce(new Error('Parse error'))
      .mockResolvedValueOnce(mockProducts);

    putReadableObjectMock.mockResolvedValueOnce(true);

    deleteReadableObjectMock.mockResolvedValueOnce(true);

    await importFileParser(mockEvent);

    expect(getReadableObjectMock).toHaveBeenCalledTimes(2);
    expect(parseFileMock).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledTimes(2);
  });

  it('should handle errors when putReadableObject fails', async () => {
    const mockEvent = createMockS3Event(2);
    const mockReadableStream1 = {} as Readable;
    const mockReadableStream2 = {} as Readable;

    getReadableObjectMock
      .mockResolvedValueOnce(mockReadableStream1)
      .mockResolvedValueOnce(mockReadableStream2);

    parseFileMock
      .mockResolvedValueOnce(mockProducts)
      .mockResolvedValueOnce(mockProducts);

    putReadableObjectMock
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    deleteReadableObjectMock.mockResolvedValueOnce(true);

    await importFileParser(mockEvent);

    expect(getReadableObjectMock).toHaveBeenCalledTimes(2);
    expect(parseFileMock).toHaveBeenCalledTimes(2);
    expect(putReadableObjectMock).toHaveBeenCalledTimes(2);
    expect(deleteReadableObjectMock).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      'importFileParser | Failed to copy parsed object | ',
      mockEvent.Records[0]
    );
  });

  it('should handle errors when deleteReadableObject fails', async () => {
    const mockEvent = createMockS3Event(2);
    const mockReadableStream1 = {} as Readable;
    const mockReadableStream2 = {} as Readable;

    getReadableObjectMock
      .mockResolvedValueOnce(mockReadableStream1)
      .mockResolvedValueOnce(mockReadableStream2);

    parseFileMock
      .mockResolvedValueOnce(mockProducts)
      .mockResolvedValueOnce(mockProducts);

    putReadableObjectMock
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);

    deleteReadableObjectMock
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await importFileParser(mockEvent);

    expect(getReadableObjectMock).toHaveBeenCalledTimes(2);
    expect(parseFileMock).toHaveBeenCalledTimes(2);
    expect(putReadableObjectMock).toHaveBeenCalledTimes(2);
    expect(deleteReadableObjectMock).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledWith(
      'importFileParser | Failed to delete copied object | ',
      mockEvent.Records[0]
    );
  });

  it('should handle errors when the entire process fails', async () => {
    const mockEvent = createMockS3Event(1);
    const mockError = new Error('Something went wrong');
    const getReadableObjectMock = ImportProductsObjectService.prototype
      .getReadableObject as jest.Mock;
    getReadableObjectMock.mockRejectedValueOnce(mockError);

    await importFileParser(mockEvent);

    expect(getReadableObjectMock).toHaveBeenCalledTimes(1);
    expect(
      ImportProductsFileParsesService.prototype.parseFile
    ).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      'importFileParser | Failed to handle Record | ',
      mockError,
      mockEvent.Records[0]
    );
  });
});
