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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateCardTransactionDto } from './dto/create-card-transaction.dto';
import { InvoicesService } from '../invoices/invoices.service';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly invoicesService: InvoicesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createTransactionDto: CreateTransactionDto, @Request() req) {
    return this.transactionsService.create(createTransactionDto, req.user.id);
  }

  @Post('card')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a card transaction (auto-creates invoice if needed)' })
  @ApiResponse({ status: 201, description: 'Transaction created and added to invoice' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async createCardTransaction(
    @Body() createCardTransactionDto: CreateCardTransactionDto,
    @Request() req,
  ) {
    // Find or create invoice for this transaction
    const invoice = await this.invoicesService.findOrCreateInvoiceForTransaction(
      createCardTransactionDto.card_id,
      new Date(createCardTransactionDto.transaction_date),
      req.user.id,
    );

    // Create transaction linked to the invoice
    const transaction = await this.transactionsService.create(
      {
        description: createCardTransactionDto.description,
        type: 'expense',
        amount: createCardTransactionDto.amount,
        transaction_date: createCardTransactionDto.transaction_date,
        invoice_id: invoice.id,
        commitment_id: createCardTransactionDto.commitment_id,
        installment_number: createCardTransactionDto.installment_number,
        category: createCardTransactionDto.category,
        notes: createCardTransactionDto.notes,
      },
      req.user.id,
    );

    // Update invoice total
    await this.invoicesService.updateInvoiceTotal(invoice.id);

    return {
      transaction,
      invoice: {
        id: invoice.id,
        closing_date: invoice.closing_date,
        due_date: invoice.due_date,
        status: invoice.status,
      },
    };
  }

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import transactions from CSV file' })
  @ApiResponse({ status: 200, description: 'Transactions imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid CSV format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async importTransactions(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    return this.transactionsService.importFromCSV(file.buffer.toString(), req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions with optional filters' })
  @ApiQuery({ name: 'type', required: false, enum: ['expense', 'income', 'transfer'] })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-12-31' })
  @ApiQuery({ name: 'category', required: false, example: 'Alimentação' })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Request() req,
    @Query('type') type?: 'expense' | 'income' | 'transfer',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('category') category?: string,
  ) {
    return this.transactionsService.findAll(req.user.id, {
      type,
      startDate,
      endDate,
      category,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get transaction statistics for a period' })
  @ApiQuery({ name: 'startDate', required: true, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2025-12-31' })
  @ApiResponse({ status: 200, description: 'Transaction statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStatistics(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.transactionsService.getStatistics(
      req.user.id,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({ status: 200, description: 'Transaction details' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.transactionsService.findOne(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update transaction' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({ status: 200, description: 'Transaction updated successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Request() req,
  ) {
    return this.transactionsService.update(id, updateTransactionDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete transaction' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({ status: 204, description: 'Transaction deleted successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string, @Request() req) {
    return this.transactionsService.remove(id, req.user.id);
  }
}
