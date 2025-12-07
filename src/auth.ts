
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID || process.env.AUTH_CLIENT_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.AUTH_CLIENT_SECRET,
        })
    ],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isProtected = nextUrl.pathname.startsWith('/coach') || nextUrl.pathname.startsWith('/plan')

            if (isProtected) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            }
            return true
        },
    },
})
