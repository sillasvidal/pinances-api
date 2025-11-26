import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({ example: 'uuid-card', description: 'Card UUID' })
  @IsUUID()
  card_id: string;

  @ApiProperty({ example: '2025-11-15', description: 'Invoice closing date' })
  @IsDateString()
  closing_date: string;

  @ApiProperty({ example: '2025-11-25', description: 'Invoice due date' })
  @IsDateString()
  due_date: string;

  @ApiPropertyOptional({ example: 0, description: 'Total invoice amount' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  total_amount?: number;

  @ApiPropertyOptional({ example: 0, description: 'Amount already paid' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  paid_amount?: number;

  @ApiPropertyOptional({
    enum: ['open', 'closed', 'paid', 'overdue'],
    example: 'open',
    description: 'Invoice status',
  })
  @IsEnum(['open', 'closed', 'paid', 'overdue'])
  @IsOptional()
  status?: 'open' | 'closed' | 'paid' | 'overdue';
}
