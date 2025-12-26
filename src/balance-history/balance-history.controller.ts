import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BalanceHistoryService } from './balance-history.service';

@ApiTags('balance-history')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/balance-history')
export class BalanceHistoryController {
    constructor(private readonly balanceHistoryService: BalanceHistoryService) { }

    @Get('evolution')
    @ApiOperation({ summary: 'Get wealth evolution history' })
    @ApiResponse({ status: 200, description: 'List of monthly wealth balances' })
    getEvolution(@Request() req, @Query('months') months?: number) {
        return this.balanceHistoryService.getEvolution(req.user.id, months || 6);
    }
}
