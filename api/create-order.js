// api/create-order.js
const https = require('https');
const admin = require('firebase-admin');

// Initialize Firebase Admin securely
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY))
    });
}
const db = admin.firestore();

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { amount, customerName, customerEmail, customerPhone, cartItems, userId } = req.body;
    const orderId = 'ANR_' + Date.now().toString(36).toUpperCase(); // Shorter, cleaner ID

    try {
        // 1. Save the PENDING order to Firebase first
        await db.collection('orders').doc(orderId).set({
            ref: orderId,
            userName: customerName,
            userEmail: customerEmail,
            userPhone: customerPhone,
            userId: userId || 'GUEST',
            amount: amount,
            status: 'PENDING', // Awaiting payment
            createdAt: new Date().toISOString(),
            items: cartItems
        });

        // 2. Request the Payment Session from Cashfree
        const payload = JSON.stringify({
            order_id: orderId,
            order_amount: amount,
            order_currency: "INR",
            customer_details: {
                customer_id: customerEmail.replace(/[^a-z0-9]/gi, '').slice(0, 50),
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone
            },
            order_meta: {
                return_url: `https://anrerp.in?order_id={order_id}`
            }
        });

        const options = {
            hostname: 'api.cashfree.com',
            path: '/pg/orders',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-version': '2023-08-01',
                'x-client-id': process.env.CASHFREE_APP_ID,
                'x-client-secret': process.env.CASHFREE_SECRET_KEY,
            }
        };

        const data = await new Promise((resolve, reject) => {
            const r = https.request(options, resp => {
                let body = '';
                resp.on('data', chunk => body += chunk);
                resp.on('end', () => resolve(JSON.parse(body)));
            });
            r.on('error', reject);
            r.write(payload);
            r.end();
        });

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to initialize order' });
    }
};