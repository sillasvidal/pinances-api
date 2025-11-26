import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() createAccountDto: CreateAccountDto, @Request() req) {
    return this.accountsService.create(createAccountDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active accounts' })
  @ApiResponse({ status: 200, description: 'List of accounts' })
  findAll(@Request() req) {
    return this.accountsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account details' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.accountsService.findOne(id, req.user.id);
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get account balance and commitment reserve' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Balance information' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  getBalance(@Param('id') id: string, @Request() req) {
    return this.accountsService.getBalance(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update account' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto, @Request() req) {
    return this.accountsService.update(id, updateAccountDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete account (set active=false)' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 204, description: 'Account deleted successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  remove(@Param('id') id: string, @Request() req) {
    return this.accountsService.remove(id, req.user.id);
  }
}
