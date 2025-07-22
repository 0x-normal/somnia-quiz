import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { wallet_address, score } = req.body;

  if (!wallet_address || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  if (score < 5) {
    return res.status(200).json({ message: 'Score too low, not saved' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO quiz_results (wallet_address, score)
       VALUES ($1, $2)
       ON CONFLICT (wallet_address)
       DO UPDATE SET score = EXCLUDED.score, created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [wallet_address, score]
    );
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
