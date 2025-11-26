import {
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCardDto {
  @ApiProperty({ example: 'Nubank Ultravioleta', description: 'Card name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Mastercard', description: 'Card brand (Visa, Mastercard, etc.)' })
  @IsString()
  brand: string;

  @ApiProperty({ example: '1234', description: 'Last 4 digits of the card' })
  @IsString()
  @Length(4, 4)
  last_digits: string;

  @ApiPropertyOptional({ example: 5000.00, description: 'Total credit limit' })
  @IsNumber()
  @IsOptional()
  total_limit?: number;

  @ApiProperty({ example: 15, description: 'Closing day (1-31)' })
  @IsInt()
  @Min(1)
  @Max(31)
  closing_day: number;

  @ApiProperty({ example: 25, description: 'Due day (1-31)' })
  @IsInt()
  @Min(1)
  @Max(31)
  due_day: number;

  @ApiPropertyOptional({ example: true, description: 'Whether the card is active' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
