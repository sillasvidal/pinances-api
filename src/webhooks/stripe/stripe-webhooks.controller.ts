import {
  Controller,
  Post,
  Headers,
  Req,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { StripeGateway } from '../../payments/gateways/stripe.gateway';
import { PaymentsService } from '../../payments/payments.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

@Controller('webhooks/stripe')
export class StripeWebhooksController {
  private readonly logger = new Logger(StripeWebhooksController.name);

  constructor(
    private readonly paymentGateway: StripeGateway,
    private readonly paymentsService: PaymentsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Post()
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing signature header');
    }

    let event;
    try {
      const payload = (req as any).rawBody || req.body;
      event = await this.paymentGateway.constructEventFromPayload(signature, payload);
    } catch (err) {
      this.logger.error(`Webhook Error: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Received event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        await this.subscriptionsService.handleCheckoutSessionCompleted(session);
    } else {
        await this.paymentsService.handleWebhookEvent(event);
    }

    return { received: true };
  }
}
