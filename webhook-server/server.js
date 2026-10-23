import express from 'express';
import crypto from 'node:crypto';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

const app = express();

const WEBHOOK_SECRET = process.env.YOUPI_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.error('Missing YOUPI_WEBHOOK_SECRET environment variable');
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

app.post('/api/youpi-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-gateway-signature'] || '';
  const expected = 'sha256=' + crypto.createHmac('sha256', WEBHOOK_SECRET).update(req.body).digest('hex');

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  } catch {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (payload.event !== 'SUCCESS') {
    return res.status(200).json({ received: true });
  }

  try {
    const mapRef = doc(db, 'youpi_order_map', payload.orderId);
    const mapSnap = await getDoc(mapRef);

    if (!mapSnap.exists()) {
      console.warn('Order map not found for:', payload.orderId);
      return res.status(404).json({ error: 'Order not found' });
    }

    const { restaurantId } = mapSnap.data();
    const orderRef = doc(db, `restaurants/${restaurantId}/orders/${payload.orderId}`);

    await updateDoc(orderRef, {
      paymentStatus: 'paid',
      utr: payload.utr || '',
      paidAt: serverTimestamp(),
      paymentGateway: 'youpi',
      paymentId: payload.paymentId || ''
    });

    console.log(`Order ${payload.orderId} marked as paid via YouPI`);
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'easyorder-youpi-webhook' });
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`YouPI webhook server running on port ${PORT}`);
});
