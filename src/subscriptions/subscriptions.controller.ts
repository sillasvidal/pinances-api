import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid plan or user already subscribed' })
  create(@Body() createSubscriptionDto: CreateSubscriptionDto, @Request() req) {
    return this.subscriptionsService.create(createSubscriptionDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user subscriptions' })
  @ApiResponse({ status: 200, description: 'List of subscriptions' })
  findAll(@Request() req) {
    return this.subscriptionsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription details' })
  @ApiResponse({ status: 200, description: 'Subscription details' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.subscriptionsService.findOne(id, req.user.id);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiResponse({ status: 200, description: 'Subscription canceled' })
  cancel(@Param('id') id: string, @Request() req) {
    return this.subscriptionsService.cancel(id, req.user.id);
  }
}
