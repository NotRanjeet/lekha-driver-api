import { ApiProperty } from '@nestjs/swagger';
import { DriverStatus } from '@prisma/client';

export class TokenPairDto {
  @ApiProperty({ description: 'JWT access token (expires in 15m)' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token (expires in 7d)' })
  refreshToken: string;
}

export class AuthDriverDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ enum: DriverStatus })
  status: DriverStatus;
}

export class AuthResponseDto {
  @ApiProperty({ type: TokenPairDto })
  tokens: TokenPairDto;

  @ApiProperty({ type: AuthDriverDto })
  driver: AuthDriverDto;
}

export class MessageResponseDto {
  @ApiProperty()
  message: string;
}
