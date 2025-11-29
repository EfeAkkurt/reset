import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  return res.status(200).json({
    success: true,
    data: [],
    metadata: {
      sourcePoolId: id,
      count: 0
    }
  });
}