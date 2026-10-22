import type { NextApiRequest, NextApiResponse } from 'next'
import { jobAccessHeaders } from '@/lib/backend-auth'

const PYTHON_API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3090'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const auth = await jobAccessHeaders(req, res, String(req.query.id ?? ''))
    if (!auth) return

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { id } = req.query

    try {
        const response = await fetch(`${PYTHON_API}/api/jobs/${id}/retry-failed`, {
            method: 'POST',
            headers: { ...auth, 'Content-Type': 'application/json' },
        })
        // A backend crash answers with a plain-text 500; parsing that as JSON
        // used to throw and surface as a misleading 503 "unavailable".
        const text = await response.text()
        let data: unknown
        try { data = JSON.parse(text) } catch { data = { error: text.slice(0, 300) || response.statusText } }

        if (!response.ok) {
            return res.status(response.status).json(data)
        }

        return res.status(200).json(data)
    } catch (error) {
        console.error('Retry-failed proxy error:', error)
        return res.status(503).json({ error: 'Extraction service is currently unavailable. Please try again in a moment.' })
    }
}
