import {
  IsString,
  IsEnum,
  IsNumber,
  IsInt,
  IsDateString,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommitmentDto {
  @ApiProperty({ example: 'Notebook Dell', description: 'Commitment description' })
  @IsString()
  description: string;

  @ApiProperty({ enum: ['expense', 'income'], example: 'expense', description: 'Commitment type' })
  @IsEnum(['expense', 'income'])
  type: 'expense' | 'income';

  @ApiProperty({ example: 3000.00, description: 'Total commitment amount (impacts accrual)' })
  @IsNumber()
  @Min(0.01)
  total_amount: number;

  @ApiProperty({ example: 12, description: 'Number of installments' })
  @IsInt()
  @Min(1)
  installments_count: number;

  @ApiProperty({ example: 250.00, description: 'Amount per installment (impacts cash flow)' })
  @IsNumber()
  @Min(0.01)
  installment_amount: number;

  @ApiProperty({ example: '2025-11-25', description: 'Date when commitment was assumed (accrual date)' })
  @IsDateString()
  accrual_date: string;

  @ApiProperty({ example: '2025-12-05', description: 'Date of first installment payment' })
  @IsDateString()
  first_installment_date: string;

  @ApiProperty({ enum: ['monthly', 'weekly', 'annual'], example: 'monthly', description: 'Payment frequency' })
  @IsEnum(['monthly', 'weekly', 'annual'])
  frequency: 'monthly' | 'weekly' | 'annual';

  @ApiPropertyOptional({ example: 'uuid-card', description: 'Card UUID (if paid with credit card)' })
  @IsUUID()
  @IsOptional()
  card_id?: string;

  @ApiPropertyOptional({ example: 'uuid-account', description: 'Source account UUID (if paid from account)' })
  @IsUUID()
  @IsOptional()
  source_account_id?: string;

  @ApiPropertyOptional({ example: 'Eletrônicos', description: 'Commitment category' })
  @IsString()
  @IsOptional()
  category?: string;
}
