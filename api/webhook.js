export const config = {
  api: {
    bodyParser: false,
  },
};

const stripeKey = process.env.STRIPE_SECRET_KEY;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripeKey) {
    return res.status(200).json({ received: true });
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey);

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks).toString('utf8');
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const username = session.metadata?.username;
      if (username) {
        const admin = (await import('firebase-admin')).default;
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
          });
        }
        const db = admin.firestore();
        await db.collection('subscriptions').doc(username).set({
          active: true,
          customerId: session.customer,
          subscriptionId: session.subscription,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const customerId = sub.customer;
      const admin = (await import('firebase-admin')).default;
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      }
      const db = admin.firestore();
      const snap = await db.collection('subscriptions').where('customerId', '==', customerId).get();
      snap.forEach(doc => {
        doc.ref.update({ active: false, updatedAt: new Date().toISOString() });
      });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(200).json({ received: true });
  }
}
