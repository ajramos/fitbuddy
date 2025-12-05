
import { signIn } from "@/auth"

export function LoginButton() {
    return (
        <form
            action={async () => {
                "use server"
                await signIn("google", { redirectTo: "/coach" })
            }}
        >
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                Sign in with Google
            </button>
        </form>
    )
}
