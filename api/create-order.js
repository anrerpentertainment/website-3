// api/create-order.js
const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { amount, customerName, customerEmail, customerPhone } = req.body;
  const orderId = 'ANR_' + Date.now();

  const payload = JSON.stringify({
    order_id: orderId,
    order_amount: amount,
    order_currency: "INR",
    customer_details: {
      customer_id:    customerEmail.replace(/[^a-z0-9]/gi,'').slice(0,50),
      customer_name:  customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone
    },
    order_meta: {
      return_url: `https://yourdomain.com?order_id={order_id}&order_status={order_status}`
    }
  });

  const options = {
    hostname: 'api.cashfree.com',
    path: '/pg/orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-version': '2023-08-01',
      'x-client-id':     process.env.CASHFREE_APP_ID,
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
};
