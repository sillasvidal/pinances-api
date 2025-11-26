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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@ApiTags('cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new credit card' })
  @ApiResponse({ status: 201, description: 'Card created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createCardDto: CreateCardDto, @Request() req) {
    return this.cardsService.create(createCardDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active credit cards' })
  @ApiResponse({ status: 200, description: 'List of cards' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Request() req) {
    return this.cardsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get card by ID' })
  @ApiParam({ name: 'id', description: 'Card UUID' })
  @ApiResponse({ status: 200, description: 'Card details' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.cardsService.findOne(id, req.user.id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get card summary with limit and usage' })
  @ApiParam({ name: 'id', description: 'Card UUID' })
  @ApiResponse({ status: 200, description: 'Card summary' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getSummary(@Param('id') id: string, @Request() req) {
    return this.cardsService.getCardSummary(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update card' })
  @ApiParam({ name: 'id', description: 'Card UUID' })
  @ApiResponse({ status: 200, description: 'Card updated successfully' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(
    @Param('id') id: string,
    @Body() updateCardDto: UpdateCardDto,
    @Request() req,
  ) {
    return this.cardsService.update(id, updateCardDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete card (set active=false)' })
  @ApiParam({ name: 'id', description: 'Card UUID' })
  @ApiResponse({ status: 204, description: 'Card deleted successfully' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string, @Request() req) {
    return this.cardsService.remove(id, req.user.id);
  }
}
