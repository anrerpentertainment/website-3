// api/webhook.js
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY))
    });
}
const db = admin.firestore();

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

    try {
        // Cashfree sends the payload in req.body.data
        const payload = req.body.data;
        
        if (payload && payload.order && payload.payment) {
            const orderId = payload.order.order_id;
            const paymentStatus = payload.payment.payment_status;

            // If the payment was successful, flip the database record
            if (paymentStatus === 'SUCCESS') {
                await db.collection('orders').doc(orderId).update({
                    status: 'COMPLETED',
                    paidAt: new Date().toISOString()
                });
                console.log(`Order ${orderId} marked as COMPLETED.`);
            }
        }
        
        // Always return 200 OK so Cashfree knows you received the message
        res.status(200).send('Webhook Processed');
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Internal Server Error');
    }
};