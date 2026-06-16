import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = createAdminClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

    if (userId) {
      const { error } = await admin
        .from('profiles')
        .update({ plan: 'paid', credits: 999, stripe_customer_id: customerId ?? null })
        .eq('user_id', userId);

      if (error) {
        console.error('[stripe/webhook] failed to upgrade user:', userId, error.message);
        return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
      }
      console.log('[stripe/webhook] upgraded user to paid:', userId);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

    const { error } = await admin
      .from('profiles')
      .update({ plan: 'free', credits: 3 })
      .eq('stripe_customer_id', customerId);

    if (error) {
      console.error('[stripe/webhook] failed to downgrade customer:', customerId, error.message);
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
    }
    console.log('[stripe/webhook] downgraded customer to free:', customerId);
  }

  return NextResponse.json({ received: true });
}
