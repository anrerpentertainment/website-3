export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, customerName = "ANR ERP Customer", customerEmail = "customer@anrerp.in", customerPhone = "9876543210" } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Please select at least one ticket or combo' });
  }

  try {
    const response = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2025-01-01',
        'x-client-id': process.env.CASHFREE_CLIENT_ID,
        'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
      },
      body: JSON.stringify({
        order_id: `anrerp_${Date.now()}`,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: `cust_${Date.now()}`,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        },
        order_meta: {
          return_url: `https://www.anrerp.in/success.html?order_id={order_id}`,
        }
      })
    });

    const data = await response.json();

    if (data.payment_session_id) {
      return res.status(200).json({
        success: true,
        payment_session_id: data.payment_session_id
      });
    } else {
      return res.status(400).json({ error: data.message || 'Failed to create order' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
}
