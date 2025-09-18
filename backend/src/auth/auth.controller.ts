import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new user account' })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully created',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
          },
        },
        access_token: { type: 'string' },
        refresh_token: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully authenticated',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
          },
        },
        access_token: { type: 'string' },
        refresh_token: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signIn(@Request() req, @Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Get('test')
  @ApiOperation({ summary: 'Test Supabase connection' })
  async testConnection() {
    try {
      // Test basic Supabase connection
      const result = await this.authService.testSupabaseConnection();
      return { message: 'Auth service is working', timestamp: new Date().toISOString(), supabase: result };
    } catch (error) {
      return { message: 'Error testing connection', error: error.message };
    }
  }

  @Post('test-signup')
  @ApiOperation({ summary: 'Test Supabase signup directly' })
  async testSignup(@Body() body: { email: string; password: string; name?: string }) {
    try {
      const result = await this.authService.testDirectSignup(body.email, body.password, body.name);
      return { message: 'Direct signup test', result };
    } catch (error) {
      return { message: 'Error in direct signup', error: error.message };
    }
  }

  @Get('test-token')
  @ApiOperation({ summary: 'Generate test JWT token for Vision API testing' })
  async getTestToken() {
    try {
      const token = await this.authService.generateTestToken();
      return {
        message: 'Test token generated',
        access_token: token,
        instructions: 'Use this token in Authorization header: Bearer ' + token
      };
    } catch (error) {
      return { message: 'Error generating test token', error: error.message };
    }
  }

  // TODO: Implement refresh and logout endpoints
}
