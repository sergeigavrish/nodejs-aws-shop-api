import { APIGatewayEvent, Callback, Context } from 'aws-lambda';
import { ImportProductsService } from '../src/application/import-products-service';
import { importProductsFile } from '../src/presentation/import-products-file';

jest.mock('@aws-sdk/client-s3');
jest.mock('../src/application/import-products-service');

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('importProductsFile Lambda', () => {
  let event: APIGatewayEvent;
  let context: Context;
  let callback: Callback;

  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    event = { queryStringParameters: null } as APIGatewayEvent;
    context = {} as Context;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    callback = () => {};
    jest.resetModules();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    jest.clearAllMocks();
  });

  it('should return signed URL when file name is provided', async () => {
    const fileName = 'test-file.csv';
    event.queryStringParameters = { name: fileName };
    const mockSignedUrl = 'https://signed-url.com/test-file.csv';
    const getSignedUrlMock = ImportProductsService.prototype
      .getSignedUrl as jest.Mock;
    getSignedUrlMock.mockResolvedValue(mockSignedUrl);

    const result = await importProductsFile(event, context, callback);

    expect(result).toBeTruthy();
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(mockSignedUrl);
    expect(getSignedUrlMock).toHaveBeenCalledWith(fileName);
  });

  it('should return 400 error when file name is not provided', async () => {
    const result = await importProductsFile(event, context, callback);

    expect(result).toBeTruthy();
    expect(result.statusCode).toBe(400);
    expect(result.body).toBe('File name is required');
    expect(ImportProductsService.prototype.getSignedUrl).not.toHaveBeenCalled();
  });

  it('should return 500 error when getSignedUrl throws an error', async () => {
    const fileName = 'test-file.csv';
    event.queryStringParameters = { name: fileName };
    const getSignedUrlMock = ImportProductsService.prototype
      .getSignedUrl as jest.Mock;
    getSignedUrlMock.mockRejectedValue(new Error('S3 service error'));

    const result = await importProductsFile(event, context, callback);

    expect(result).toBeTruthy();
    expect(result.statusCode).toBe(500);
    expect(result.body).toBe('Internal server error');
    expect(getSignedUrlMock).toHaveBeenCalledWith(fileName);
  });
});
