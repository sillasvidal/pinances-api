import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlanInterval } from '../../entities/plan.entity';

export class CreatePlanDto {
  @ApiProperty({ description: 'Name of the plan' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description of the plan', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Price in cents', minimum: 0 })
  @IsNumber()
  @Min(0)
  price_in_cents: number;

  @ApiProperty({ description: 'Currency code', default: 'BRL' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ enum: PlanInterval, default: PlanInterval.MONTHLY })
  @IsEnum(PlanInterval)
  @IsOptional()
  interval?: PlanInterval;

  @ApiProperty({ description: 'List of features enabled for this plan' })
  @IsObject()
  @IsOptional()
  features?: Record<string, any>;

  @ApiProperty({ description: 'ID of the plan in the payment gateway (e.g. Stripe price ID)', required: false })
  @IsString()
  @IsOptional()
  gateway_plan_id?: string;

  @ApiProperty({ description: 'Whether the plan is active', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
