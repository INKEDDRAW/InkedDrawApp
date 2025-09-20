/**
 * Authentication DTOs
 * Data Transfer Objects for authentication endpoints
 */

import { IsEmail, IsString, IsOptional, IsArray, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'cigar_connoisseur' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  displayName: string;
}

export class SignInDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  password: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'new_username' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username?: string;

  @ApiPropertyOptional({ example: 'John Smith' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  displayName?: string;

  @ApiPropertyOptional({ example: 'Passionate about premium cigars and fine wines.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'San Francisco, CA' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({ example: 'https://mywebsite.com' })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiPropertyOptional({ example: ['medium', 'full'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCigarStrength?: string[];

  @ApiPropertyOptional({ example: ['IPA', 'Stout', 'Belgian Ale'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredBeerStyles?: string[];

  @ApiPropertyOptional({ example: ['Cabernet Sauvignon', 'Chardonnay', 'Pinot Noir'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredWineTypes?: string[];

  @ApiPropertyOptional({ example: 'public', enum: ['public', 'friends', 'private'] })
  @IsOptional()
  @IsString()
  profileVisibility?: 'public' | 'friends' | 'private';

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showLocation?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  showRealName?: boolean;
}

export class AuthResponseDto {
  @ApiProperty()
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    subscriptionTier?: string;
  };

  @ApiProperty()
  accessToken: string;
}

export class ProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  displayName: string;

  @ApiPropertyOptional()
  bio?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional()
  websiteUrl?: string;

  @ApiProperty()
  preferredCigarStrength: string[];

  @ApiProperty()
  preferredBeerStyles: string[];

  @ApiProperty()
  preferredWineTypes: string[];

  @ApiProperty()
  profileVisibility: 'public' | 'friends' | 'private';

  @ApiProperty()
  showLocation: boolean;

  @ApiProperty()
  showRealName: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional()
  user?: {
    email: string;
    subscription_tier: string;
    created_at: string;
    last_seen_at: string;
  };
}
