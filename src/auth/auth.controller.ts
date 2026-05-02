import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ChangePasswordDto } from './dto/auth.dto';
import {
  AuthResponseDto,
  TokenPairDto,
  MessageResponseDto,
} from './dto/auth-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentDriver } from '../common/decorators/current-driver.decorator';
import { JwtRefreshGuard } from '../common/guards/jwt-refresh.guard';
import { Driver } from '@prisma/client';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new driver account' })
  @ApiResponse({
    status: 201,
    description: 'Driver registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email or phone already registered',
  })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    type: TokenPairDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@CurrentDriver() driver: Driver): Promise<TokenPairDto> {
    return this.authService.refreshTokens(driver);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    type: MessageResponseDto,
  })
  async logout(
    @CurrentDriver('id') driverId: string,
  ): Promise<MessageResponseDto> {
    await this.authService.logout(driverId);
    return { message: 'Logged out successfully' };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change driver password' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  async changePassword(
    @CurrentDriver('id') driverId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    await this.authService.changePassword(driverId, dto);
    return { message: 'Password changed successfully' };
  }
}
