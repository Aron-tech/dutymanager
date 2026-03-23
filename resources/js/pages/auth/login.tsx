import { Head } from '@inertiajs/react';
import { FaDiscord } from "react-icons/fa";
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';

export default function Login() {
    const loginWithDiscord = () => {
        window.location.href = '/login/discord';
    };

    return (
        <AuthLayout
            title="DutyManager v3"
            description="A rendszer használatához Discord hitelesítés szükséges"
        >
            <Head title="Bejelentkezés" />

            <div className="grid gap-6 mt-4">
                <Button
                    type="button"
                    size="lg"
                    onClick={loginWithDiscord}
                    className="w-full bg-[#5865F2] text-white hover:bg-[#4752C4] border-none font-bold py-6 text-lg"
                >
                    <FaDiscord className="mr-3 h-6 w-6" />
                    Belépés Discorddal
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                    A belépéssel automatikusan elfogadod a felhasználási feltételeket.
                </p>
            </div>
        </AuthLayout>
    );
}
