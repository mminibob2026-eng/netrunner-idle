const stripeKey = process.env.STRIPE_SECRET_KEY;

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ active: false, error: 'Missing username' });
  }

  if (!stripeKey) {
    return res.status(200).json({ active: !!process.env.DEV_SUB_ACTIVE });
  }

  try {
    // Check Firestore first (used for Google UID-based subs set by webhook)
    try {
      const admin = (await import('firebase-admin')).default;
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      }
      const db = admin.firestore();
      const subDoc = await db.collection('subscriptions').doc(username).get();
      if (subDoc.exists && subDoc.data().active === true) {
        return res.status(200).json({ active: true, source: 'firestore' });
      }
    } catch (fsErr) {
      console.error('Firestore check failed:', fsErr.message);
    }

    // Fallback: check Stripe by email (legacy username path)
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey);
    const customers = await stripe.customers.list({
      email: username,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return res.status(200).json({ active: false });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'active',
      limit: 1,
    });

    res.status(200).json({ active: subscriptions.data.length > 0, source: 'stripe' });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(200).json({ active: false });
  }
}
