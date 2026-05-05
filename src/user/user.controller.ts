import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { DriverJwtAuthGuard } from '../auth/guards/driver-jwt-auth.guard';
import {
  DriverPortalGuard,
  getDriverFromReq,
} from '../guards/driver-portal.guard';
import { GetUserId } from '../auth/decorators/user.decorator';
import { UserService } from './user.service';
import {
  AcceptInviteDto,
  AcceptInviteResponseDto,
  DriverProfileResponse,
} from './dto/user.dto';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(DriverJwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  // ── POST /api/user/accept-invite ──────────────────────────────────────────
  // No DriverPortalGuard — driver is not yet linked when this is called

  @Post('accept-invite')
  @ApiCreatedResponse({ type: AcceptInviteResponseDto })
  @ApiBadRequestResponse({ description: 'Token has expired' })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  @ApiNotFoundResponse({ description: 'Token not found / already used' })
  @ApiConflictResponse({
    description: 'Driver already linked, or caller already linked',
  })
  acceptInvite(
    @GetUserId() userId: string,
    @Body() dto: AcceptInviteDto,
  ): Promise<AcceptInviteResponseDto> {
    return this.service.acceptInvite(userId, dto.token);
  }

  // ── GET /api/user ─────────────────────────────────────────────────────────

  @Get()
  @UseGuards(DriverPortalGuard)
  @ApiOkResponse({ type: DriverProfileResponse })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  @ApiNotFoundResponse({ description: 'Driver record not found' })
  getProfile(@Req() req: Request): Promise<DriverProfileResponse> {
    const driver = getDriverFromReq(req as any);
    return this.service.getProfile(driver.id);
  }
}
