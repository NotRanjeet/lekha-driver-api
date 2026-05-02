import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsPhoneNumber,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Driver email address',
    example: 'driver@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Driver password',
    example: 'password123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'driver@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+61412345678' })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '1990-01-01', required: false })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Valid refresh token' })
  @IsString()
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'New password', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'driver@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Reset token received via email' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'New password', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
