import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { AcceptInviteResponseDto, DriverProfileResponse } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Accept Invite ─────────────────────────────────────────────────────────

  async acceptInvite(
    userId: string,
    token: string,
  ): Promise<AcceptInviteResponseDto> {
    const driver = await this.prisma.drivers.findFirst({
      where: { invite_token: token },
    });

    if (!driver) {
      throw new NotFoundException('Invite token not found or already used');
    }

    if (driver.auth_user_id !== null) {
      throw new ConflictException(
        'This driver account is already linked to a user',
      );
    }

    if (
      driver.invite_token_expires_at &&
      driver.invite_token_expires_at < new Date()
    ) {
      throw new BadRequestException('Invite token has expired');
    }

    const existing = await this.prisma.drivers.findFirst({
      where: { auth_user_id: userId },
    });
    if (existing) {
      throw new ConflictException(
        'Your user account is already linked to another driver',
      );
    }

    await this.prisma.drivers.update({
      where: { id: driver.id },
      data: {
        auth_user_id: userId,
        invite_token: null,
        invite_token_expires_at: null,
      },
    });

    return { driver_id: driver.id };
  }

  // ─── Profile ───────────────────────────────────────────────────────────────

  async getProfile(driverId: string): Promise<DriverProfileResponse> {
    const driver = await this.prisma.drivers.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return {
      id: driver.id,
      first_name: driver.first_name,
      last_name: driver.last_name,
      email: driver.email ?? null,
      mobile: driver.mobile ?? null,
      dob: driver.dob ?? null,
      license_number: driver.license_number ?? null,
      license_expiry: driver.license_expiry ?? null,
      license_state: driver.license_state ?? null,
      license_country: driver.license_country ?? null,
      address_line_one: driver.address_line_one ?? null,
      address_line_two: driver.address_line_two ?? null,
      address_suburb: driver.address_suburb ?? null,
      address_state: driver.address_state ?? null,
      address_post_code: driver.address_post_code ?? null,
      address_country: driver.address_country ?? null,
      emergency_name: driver.emergency_name ?? null,
      emergency_phone: driver.emergency_phone ?? null,
      emergency_relation: driver.emergency_relation ?? null,
      business_name: driver.business_name ?? null,
      business_abn: driver.business_abn ?? null,
      card_last_four: driver.card_last_four ?? null,
      card_expiry_month: driver.card_expiry_month ?? null,
      card_expiry_year: driver.card_expiry_year ?? null,
      created_at: driver.created_at,
    };
  }
}
