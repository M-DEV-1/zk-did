import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export const BackButton = ({ className }) => {
    const router = useRouter();
    return (
        <button
            type="button"
            onClick={() => router.back()}
            className={`flex items-center gap-2 text-muted-foreground hover:text-white text-sm font-medium mb-2 ${className}`}
        >
            <ArrowLeft className="w-4 h-4" />
            Back
        </button>
    );
}