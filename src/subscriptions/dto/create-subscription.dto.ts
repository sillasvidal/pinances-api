import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'ID of the plan to subscribe to' })
  @IsString()
  @IsNotEmpty()
  plan_id: string;

  @ApiProperty({ description: 'Payment method ID from gateway (optional for trial)', required: false })
  @IsString()
  @IsOptional()
  payment_method_id?: string;
}
