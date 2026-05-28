import { ShieldCheck } from 'lucide-react';

interface site_logo_props {
    show_version?: boolean;
}

export default function SiteLogo({ show_version = true }: site_logo_props) {
    return (
        <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF2A2A] to-[#2A85FF] shadow-[0_0_20px_rgba(255,75,75,0.35)]">
                <div className="absolute inset-[1.5px] rounded-[10px] bg-[#0D0D12]" />
                <ShieldCheck className="relative h-5 w-5 text-white" strokeWidth={2.25} />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">DutyManager</span>
                {show_version && (
                    <span className="rounded-md border border-[#2A85FF]/40 bg-[#2A85FF]/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#4B9BFF]">
                        v3
                    </span>
                )}
            </div>
        </div>
    );
}
