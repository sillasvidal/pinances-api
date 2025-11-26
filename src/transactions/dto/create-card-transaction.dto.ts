import {
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCardTransactionDto {
  @ApiProperty({ example: 'uuid-card', description: 'Card UUID' })
  @IsUUID()
  card_id: string;

  @ApiProperty({ example: 'Compra no supermercado', description: 'Transaction description' })
  @IsString()
  description: string;

  @ApiProperty({ example: 150.50, description: 'Transaction amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2025-11-25', description: 'Transaction date (YYYY-MM-DD)' })
  @IsDateString()
  transaction_date: string;

  @ApiPropertyOptional({ example: 'uuid-commitment', description: 'Commitment UUID (for installments)' })
  @IsUUID()
  @IsOptional()
  commitment_id?: string;

  @ApiPropertyOptional({ example: 1, description: 'Installment number (if part of commitment)' })
  @IsInt()
  @IsOptional()
  installment_number?: number;

  @ApiPropertyOptional({ example: 'Alimentação', description: 'Transaction category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'Compra semanal', description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
