import { 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsNumber, 
  IsArray, 
  IsBoolean, 
  IsUrl,
  IsDateString,
  Min,
  Max,
  IsUUID
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCollectionItemDto {
  @ApiProperty({ description: 'Collection ID' })
  @IsUUID()
  collection_id: string;

  @ApiProperty({ description: 'Item name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Brand name' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ 
    description: 'Item type',
    enum: ['cigar', 'wine', 'beer'],
    example: 'cigar'
  })
  @IsEnum(['cigar', 'wine', 'beer'])
  type: 'cigar' | 'wine' | 'beer';

  @ApiPropertyOptional({ description: 'Item description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Scan ID from AI scanner' })
  @IsOptional()
  @IsString()
  scan_id?: string;

  @ApiPropertyOptional({ description: 'AI confidence score (0.00 to 1.00)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1)
  confidence?: number;

  @ApiPropertyOptional({ description: 'Item image URL' })
  @IsOptional()
  @IsUrl()
  image_url?: string;

  @ApiPropertyOptional({ description: 'User rating (1-5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'User notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Purchase price' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Purchase date (ISO string)' })
  @IsOptional()
  @IsDateString()
  purchase_date?: string;

  @ApiPropertyOptional({ description: 'Location where purchased' })
  @IsOptional()
  @IsString()
  location_purchased?: string;

  @ApiPropertyOptional({ description: 'Tags array', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Mark as favorite', default: false })
  @IsOptional()
  @IsBoolean()
  is_favorite?: boolean;

  @ApiPropertyOptional({ description: 'Mark as wishlist item', default: false })
  @IsOptional()
  @IsBoolean()
  is_wishlist?: boolean;
}
