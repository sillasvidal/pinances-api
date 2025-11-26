import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({ example: 'Conta Corrente Nubank', description: 'Account name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ['checking', 'investment'], example: 'checking', description: 'Account type' })
  @IsEnum(['checking', 'investment'])
  type: 'checking' | 'investment';

  @ApiPropertyOptional({ example: 5000.00, description: 'Current balance' })
  @IsNumber()
  @IsOptional()
  current_balance?: number;

  @ApiPropertyOptional({ example: 0, description: 'Amount reserved for commitments (investment accounts only)' })
  @IsNumber()
  @IsOptional()
  commitment_reserve?: number;

  @ApiPropertyOptional({ example: 'Nubank', description: 'Financial institution name' })
  @IsString()
  @IsOptional()
  institution?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the account is active' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
