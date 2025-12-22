import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('plans')
@Controller('api/v1/plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new plan' })
  @ApiResponse({ status: 201, description: 'The plan has been successfully created.' })
  create(@Body() createPlanDto: CreatePlanDto) {
    return this.plansService.create(createPlanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all plans' })
  @ApiResponse({ status: 200, description: 'Return all plans.' })
  findAll(@Query('active') active?: string) {
    // If active query param is present, parse it, otherwise default to true for public listing
    const isActive = active === 'false' ? false : true;
    return this.plansService.findAll(isActive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a plan by id' })
  @ApiResponse({ status: 200, description: 'Return the plan.' })
  @ApiResponse({ status: 404, description: 'Plan not found.' })
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a plan' })
  @ApiResponse({ status: 200, description: 'The plan has been successfully updated.' })
  update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.plansService.update(id, updatePlanDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a plan' })
  @ApiResponse({ status: 204, description: 'The plan has been successfully deactivated.' })
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }
}
