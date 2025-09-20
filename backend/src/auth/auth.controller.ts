/**
 * Authentication Controller
 * Handles authentication endpoints
 */

import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { 
  SignUpDto, 
  SignInDto, 
  UpdateProfileDto, 
  AuthResponseDto, 
  ProfileResponseDto 
} from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Email or username already exists',
  })
  async signUp(@Body() signUpDto: SignUpDto): Promise<AuthResponseDto> {
    return this.authService.signUp(signUpDto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in existing user' })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully signed in',
    type: AuthResponseDto,
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials',
  })
  async signIn(@Body() signInDto: SignInDto): Promise<AuthResponseDto> {
    return this.authService.signIn(signInDto);
  }

  @Post('signout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sign out current user' })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully signed out',
  })
  async signOut(@Request() req: any) {
    return this.authService.signOut(req.user.id);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile retrieved successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Profile not found',
  })
  async getProfile(@Request() req: any): Promise<ProfileResponseDto> {
    return this.authService.getProfile(req.user.id);
  }

  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile updated successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Username already taken or validation error',
  })
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info (minimal)' })
  @ApiResponse({ 
    status: 200, 
    description: 'User info retrieved successfully',
  })
  async getCurrentUser(@Request() req: any) {
    return {
      id: req.user.id,
      email: req.user.email,
      subscriptionTier: req.user.subscriptionTier,
    };
  }
}
