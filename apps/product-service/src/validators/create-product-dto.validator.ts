import { CreateProductDto } from '../dtos';

export function createProductDtoValidator(
  data: unknown
): data is CreateProductDto {
  if (!data || typeof data !== 'object') return false;
  const createProductDto = data as CreateProductDto;
  return (
    typeof createProductDto.title === 'string' &&
    createProductDto.title.length > 0 &&
    typeof createProductDto.description === 'string' &&
    typeof createProductDto.price === 'number' &&
    createProductDto.price >= 0 &&
    typeof createProductDto.count === 'number' &&
    createProductDto.count >= 0
  );
}
