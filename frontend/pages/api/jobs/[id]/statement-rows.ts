import type { NextApiRequest, NextApiResponse } from 'next'
import { jobAccessHeaders } from '@/lib/backend-auth'

const PYTHON_API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3090'

/**
 * The cheques a bank statement lists for this job (backend/statement_rows.py).
 * Same gate as the other job routes: jobAccessHeaders proves the caller may see
 * this job before the backend is asked anything.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const auth = await jobAccessHeaders(req, res, String(req.query.id ?? ''))
    if (!auth) return

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const response = await fetch(`${PYTHON_API}/api/jobs/${req.query.id}/statement-rows`, { headers: auth })
        const data = await response.json().catch(() => ({ error: 'Statement rows unavailable' }))
        return res.status(response.status).json(data)
    } catch (error) {
        console.error('Statement rows proxy error:', error)
        return res.status(503).json({ error: 'Statement rows are unavailable right now. Please try again.' })
    }
}
