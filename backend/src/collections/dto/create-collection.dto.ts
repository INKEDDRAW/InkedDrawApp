import { IsString, IsOptional, IsEnum, IsBoolean, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCollectionDto {
  @ApiProperty({ description: 'Collection name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Collection description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Collection type',
    enum: ['cigar', 'wine', 'beer', 'mixed'],
    example: 'cigar'
  })
  @IsEnum(['cigar', 'wine', 'beer', 'mixed'])
  type: 'cigar' | 'wine' | 'beer' | 'mixed';

  @ApiPropertyOptional({ description: 'Whether collection is public', default: false })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsUrl()
  cover_image_url?: string;
}
