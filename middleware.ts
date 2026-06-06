import { clerkMiddleware } from "@clerk/nextjs/server";
import { updateSession } from '@/utils/supabase/middleware'

export default clerkMiddleware(async (auth, request) => {
    const { nextUrl } = request;
    const isPublic =
        nextUrl.pathname === '/' ||
        nextUrl.pathname.startsWith('/api/inngest') ||
        nextUrl.pathname.startsWith('/api/webhooks') ||
        nextUrl.pathname.startsWith('/api/auth') ||
        nextUrl.pathname.startsWith('/sign-in') ||
        nextUrl.pathname.startsWith('/sign-up');

    if (!isPublic) {
        await auth.protect();
    }

    return await updateSession(request);
})

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
