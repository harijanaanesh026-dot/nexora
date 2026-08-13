import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

export default async function handler(req: any, res: any) {
  if (req.method!== 'POST') return res.status(405).end();

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'inr', product_data: { name: 'Nexora Premium Room Entry' }, unit_amount: 9900 }, quantity: 1 }],
      mode: 'payment',
      success_url: `${req.headers.origin}/?success=true`,
      cancel_url: `${req.headers.origin}/`,
    });
    res.status(200).json({ url: session.url });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
