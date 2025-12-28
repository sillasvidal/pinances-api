import { IsString, IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class ImportTransactionRowDto {
  @IsDateString()
  date: string;

  @IsString()
  description: string;

  @IsEnum(['expense', 'income', 'transfer'])
  type: 'expense' | 'income' | 'transfer';

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  account?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ImportResultDto {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  transactions: any[];
}
