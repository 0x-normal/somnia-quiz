import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  const { wallet_address } = req.query;

  if (!wallet_address) {
    return res.status(400).json({ success: false, message: 'Missing wallet address' });
  }

  try {
    const result = await pool.query(
      'SELECT wallet_address, score FROM quiz_results WHERE wallet_address = $1',
      [wallet_address]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        wallet_address: result.rows[0].wallet_address,
        score: result.rows[0].score
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

