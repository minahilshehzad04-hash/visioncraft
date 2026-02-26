import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/utils/supabase/service'

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
    }

    // Get the headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400,
        })
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    console.log(`[Webhook] Received event: ${payload.type}`);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET)

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('[Webhook] Verification failed:', err)
        return new Response('Error occured', {
            status: 400,
        })
    }

    const { id } = evt.data
    const eventType = evt.type

    console.log(`[Webhook] Processing event type: ${eventType} for ID: ${id}`);

    if (eventType === 'user.created') {
        const { email_addresses, first_name, last_name } = evt.data
        const email = email_addresses[0].email_address
        const full_name = `${first_name || ''} ${last_name || ''}`.trim()

        console.log(`[Webhook] Attempting to insert user: ${email}`);

        const supabase = createServiceRoleClient()

        const { error } = await supabase
            .from('users')
            .upsert({
                user_id: id,
                email,
                name: full_name,
            }, { onConflict: 'user_id' })

        if (error) {
            console.error('[Webhook] Supabase insert error:', error)
            return new Response('Error syncing user', { status: 500 })
        }
        console.log('[Webhook] Successfully synced user to Supabase');
    }

    return new Response('', { status: 200 })
}
