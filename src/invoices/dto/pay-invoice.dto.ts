import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PayInvoiceDto {
  @ApiProperty({ example: 1500.00, description: 'Payment amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;
}
