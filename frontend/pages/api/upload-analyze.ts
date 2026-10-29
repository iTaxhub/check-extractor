import { requireCapability, READ_METHODS } from '@/lib/match-helpers';
import type { NextApiRequest, NextApiResponse } from 'next'
import { requireProcessingAllowed } from '@/lib/usage-gate'

const PYTHON_API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3090'

export const config = {
    api: {
        bodyParser: false,
    },
}

/**
 * This route gets 300s in vercel.json, against the 60s every other API route
 * gets. It is the one endpoint that waits on genuinely long work: the backend
 * rasterises every page, detects cheques, crops each one, and uploads all of
 * them to storage before it answers. A 30-page bank statement is ~7s of compute
 * plus 224 storage uploads; a 44-page one, or the 100MB the backend accepts, is
 * considerably more.
 *
 * The 60s cap was not merely slow, it corrupted state. The proxy returned 504
 * while the backend carried on, finished, wrote check_jobs, registered the
 * upload fingerprint and charged the usage ledger — so the user saw a failure,
 * retried, and was told their invisible-but-successful upload was a duplicate.
 *
 * The real fix is to make upload-analyze return a job id immediately and do the
 * work in the background, the way /api/upload-pdf already does. Until then this
 * buys headroom rather than pretending the problem is solved.
 */

/**
 * POST /api/upload-analyze?confirm_reupload=true
 *
 * Upload + cheque detection. Gated as well as extraction, so a firm past its
 * trial cannot queue work it will never be able to process. The bearer token is
 * forwarded so the backend can resolve the tenant and record the upload
 * fingerprint (migration 028) that backs the duplicate warning.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Server-side role gate (lib/roles.ts): the UI hiding the action is not enough.
  if (!READ_METHODS.has(req.method ?? '') && !(await requireCapability(req, res, 'checks.upload'))) return;
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const gate = await requireProcessingAllowed(req, res)
    if (!gate) return

    try {
        const chunks: Buffer[] = []
        for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
        }
        const body = Buffer.concat(chunks)

        const confirmReupload =
            req.query.confirm_reupload === 'true' || req.query.confirm_reupload === '1'

        const headers: Record<string, string> = {
            'content-type': req.headers['content-type'] || 'application/octet-stream',
        }
        if (gate.accessToken) headers.Authorization = `Bearer ${gate.accessToken}`

        // batch_id attaches this PDF to a reconciliation run (migration 032).
        // Shape-checked here and re-validated against the tenant by the
        // backend, which is the only side that knows whose batch it is.
        const batchId = String(req.query.batch_id || '')
        const batchParam =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(batchId)
                ? `&batch_id=${batchId}`
                : ''

        const url = `${PYTHON_API}/api/upload-analyze?confirm_reupload=${confirmReupload}${batchParam}`
        const response = await fetch(url, { method: 'POST', headers, body })

        const data = await response.json()

        if (!response.ok) {
            return res.status(response.status).json(data)
        }

        return res.status(200).json(data)
    } catch (error) {
        console.error('Upload-analyze proxy error:', error)
        return res.status(503).json({ error: 'Document processing service is currently unavailable. Please try again in a moment.' })
    }
}
