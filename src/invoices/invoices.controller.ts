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
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PayInvoiceDto } from './dto/pay-invoice.dto';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  create(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req) {
    return this.invoicesService.create(createInvoiceDto, req.user.id);
  }

  @Post('generate/:cardId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate monthly invoice for a card' })
  @ApiParam({ name: 'cardId', description: 'Card UUID' })
  @ApiResponse({ status: 201, description: 'Invoice generated successfully' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  generateMonthly(@Param('cardId') cardId: string, @Request() req) {
    return this.invoicesService.generateMonthlyInvoice(cardId, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices with optional filters' })
  @ApiQuery({ name: 'cardId', required: false, description: 'Filter by card UUID' })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'closed', 'paid', 'overdue'] })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-12-31' })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Request() req,
    @Query('cardId') cardId?: string,
    @Query('status') status?: 'open' | 'closed' | 'paid' | 'overdue',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.invoicesService.findAll(req.user.id, {
      cardId,
      status,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID with transactions' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.invoicesService.findOne(id, req.user.id);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Pay invoice (full or partial)' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Payment registered successfully' })
  @ApiResponse({ status: 400, description: 'Payment exceeds invoice total' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  pay(
    @Param('id') id: string,
    @Body() payInvoiceDto: PayInvoiceDto,
    @Request() req,
  ) {
    return this.invoicesService.payInvoice(
      id,
      payInvoiceDto.amount,
      req.user.id,
    );
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close invoice (no more charges can be added)' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Invoice closed successfully' })
  @ApiResponse({ status: 400, description: 'Only open invoices can be closed' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  close(@Param('id') id: string, @Request() req) {
    return this.invoicesService.closeInvoice(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update invoice' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Invoice updated successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @Request() req,
  ) {
    return this.invoicesService.update(id, updateInvoiceDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete invoice' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 204, description: 'Invoice deleted successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string, @Request() req) {
    return this.invoicesService.remove(id, req.user.id);
  }
}
