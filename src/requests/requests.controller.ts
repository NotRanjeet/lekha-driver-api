import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { DriverJwtAuthGuard } from '../auth/guards/driver-jwt-auth.guard';
import {
  DriverPortalGuard,
  getDriverFromReq,
} from '../guards/driver-portal.guard';
import { RequestsService } from './requests.service';
import {
  CreateDriverRequestDto,
  AddCommentDto,
  DriverRequestCategoryResponseDto,
  DriverRequestSummaryDto,
  DriverRequestDetailDto,
  DriverRequestCommentDto,
} from './dto/request.dto';

@ApiTags('Requests')
@ApiBearerAuth()
@UseGuards(DriverJwtAuthGuard, DriverPortalGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly service: RequestsService) {}

  // ── GET /api/requests/categories ──────────────────────────────────────────

  @Get('categories')
  @ApiOkResponse({ type: [DriverRequestCategoryResponseDto] })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  listCategories(
    @Req() req: Request,
  ): Promise<DriverRequestCategoryResponseDto[]> {
    const driver = getDriverFromReq(req as any);
    return this.service.listCategories(driver.owner_company_id);
  }

  // ── POST /api/requests ────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: DriverRequestSummaryDto })
  @ApiBadRequestResponse({ description: 'Category is inactive' })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  @ApiNotFoundResponse({
    description: 'category_id not found for this company',
  })
  createRequest(
    @Req() req: Request,
    @Body() dto: CreateDriverRequestDto,
  ): Promise<DriverRequestSummaryDto> {
    const driver = getDriverFromReq(req as any);
    return this.service.createRequest(driver.owner_company_id, driver.id, dto);
  }

  // ── GET /api/requests ─────────────────────────────────────────────────────

  @Get()
  @ApiOkResponse({ type: [DriverRequestSummaryDto] })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  listRequests(@Req() req: Request): Promise<DriverRequestSummaryDto[]> {
    const driver = getDriverFromReq(req as any);
    return this.service.listRequests(driver.owner_company_id, driver.id);
  }

  // ── GET /api/requests/:id ─────────────────────────────────────────────────

  @Get(':id')
  @ApiOkResponse({ type: DriverRequestDetailDto })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  @ApiNotFoundResponse({
    description: 'Request not found or belongs to another driver',
  })
  getRequestDetail(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<DriverRequestDetailDto> {
    const driver = getDriverFromReq(req as any);
    return this.service.getRequestDetail(
      driver.owner_company_id,
      id,
      driver.id,
    );
  }

  // ── POST /api/requests/:id/comments ───────────────────────────────────────

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: DriverRequestCommentDto })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  @ApiNotFoundResponse({
    description: 'Request not found or belongs to another driver',
  })
  addComment(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AddCommentDto,
  ): Promise<DriverRequestCommentDto> {
    const driver = getDriverFromReq(req as any);
    return this.service.addDriverComment(
      driver.owner_company_id,
      id,
      driver.id,
      dto,
    );
  }
}
