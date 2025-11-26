import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('cash-flow')
  @ApiOperation({ summary: 'Get cash flow report (Fluxo de Caixa)' })
  @ApiQuery({ name: 'startDate', required: true, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2025-12-31' })
  @ApiResponse({ status: 200, description: 'Cash flow report' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getCashFlow(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getCashFlowReport(
      req.user.id,
      startDate,
      endDate,
    );
  }

  @Get('accrual')
  @ApiOperation({ summary: 'Get accrual report (DRE - Demonstração do Resultado)' })
  @ApiQuery({ name: 'startDate', required: true, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2025-12-31' })
  @ApiResponse({ status: 200, description: 'Accrual report' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAccrual(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getAccrualReport(
      req.user.id,
      startDate,
      endDate,
    );
  }

  @Get('comparative')
  @ApiOperation({ summary: 'Get comparative report (Cash Flow vs Accrual)' })
  @ApiQuery({ name: 'startDate', required: true, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2025-12-31' })
  @ApiResponse({ status: 200, description: 'Comparative report' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getComparative(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getComparativeReport(
      req.user.id,
      startDate,
      endDate,
    );
  }

  @Get('projection')
  @ApiOperation({ summary: 'Get monthly expense projection based on commitments' })
  @ApiQuery({ name: 'months', required: false, example: 12, description: 'Number of months to project' })
  @ApiResponse({ status: 200, description: 'Monthly projection' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProjection(
    @Request() req,
    @Query('months') months?: number,
  ) {
    return this.reportsService.getMonthlyProjection(
      req.user.id,
      months ? Number(months) : 12,
    );
  }
}
