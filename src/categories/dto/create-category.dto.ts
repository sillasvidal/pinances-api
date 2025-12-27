import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Alimentação', description: 'Category name' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '🍔', description: 'Emoji icon', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;

  @ApiProperty({ example: '#f59e0b', description: 'Hex color code', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiProperty({ 
    example: 'expense', 
    description: 'Category type',
    enum: ['expense', 'income', 'both']
  })
  @IsEnum(['expense', 'income', 'both'])
  type: 'expense' | 'income' | 'both';
}
