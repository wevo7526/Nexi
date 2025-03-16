import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const response = await axios.get('http://localhost:5000/api/market-research/history');
        return res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching history:', error);
        return res.status(500).json({ 
            status: 'error', 
            message: 'Failed to fetch research history'
        });
    }
} 