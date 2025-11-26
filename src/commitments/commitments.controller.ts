import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommitmentsService } from './commitments.service';
import { CreateCommitmentDto } from './dto/create-commitment.dto';
import { UpdateCommitmentDto } from './dto/update-commitment.dto';

@ApiTags('commitments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/commitments')
export class CommitmentsController {
  constructor(private readonly commitmentsService: CommitmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new commitment (installment purchase)' })
  @ApiResponse({ status: 201, description: 'Commitment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Card or account not found' })
  create(@Body() createCommitmentDto: CreateCommitmentDto, @Request() req) {
    return this.commitmentsService.create(createCommitmentDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all commitments with optional filters' })
  @ApiQuery({ name: 'type', required: false, enum: ['expense', 'income'] })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'category', required: false })
  @ApiResponse({ status: 200, description: 'List of commitments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Request() req,
    @Query('type') type?: 'expense' | 'income',
    @Query('active') active?: boolean,
    @Query('category') category?: string,
  ) {
    return this.commitmentsService.findAll(req.user.id, {
      type,
      active,
      category,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get commitment by ID with transactions' })
  @ApiParam({ name: 'id', description: 'Commitment UUID' })
  @ApiResponse({ status: 200, description: 'Commitment details' })
  @ApiResponse({ status: 404, description: 'Commitment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.commitmentsService.findOne(id, req.user.id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get commitment summary with payment progress' })
  @ApiParam({ name: 'id', description: 'Commitment UUID' })
  @ApiResponse({ status: 200, description: 'Commitment summary' })
  @ApiResponse({ status: 404, description: 'Commitment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getSummary(@Param('id') id: string, @Request() req) {
    return this.commitmentsService.getCommitmentSummary(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update commitment' })
  @ApiParam({ name: 'id', description: 'Commitment UUID' })
  @ApiResponse({ status: 200, description: 'Commitment updated successfully' })
  @ApiResponse({ status: 404, description: 'Commitment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(
    @Param('id') id: string,
    @Body() updateCommitmentDto: UpdateCommitmentDto,
    @Request() req,
  ) {
    return this.commitmentsService.update(id, updateCommitmentDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete commitment (releases reserved funds)' })
  @ApiParam({ name: 'id', description: 'Commitment UUID' })
  @ApiResponse({ status: 204, description: 'Commitment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Commitment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string, @Request() req) {
    return this.commitmentsService.remove(id, req.user.id);
  }
}
