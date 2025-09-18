import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCollectionItemDto } from './create-collection-item.dto';

export class UpdateCollectionItemDto extends PartialType(
  OmitType(CreateCollectionItemDto, ['collection_id'] as const)
) {}
