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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createCategoryDto: CreateCategoryDto, @Request() req) {
    return this.categoriesService.create(createCategoryDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Request() req) {
    return this.categoriesService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category details' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.categoriesService.findOne(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot modify default categories' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Request() req,
  ) {
    return this.categoriesService.update(id, updateCategoryDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive category (soft delete)' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 204, description: 'Category archived successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete default categories' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string, @Request() req) {
    return this.categoriesService.remove(id, req.user.id);
  }
}
