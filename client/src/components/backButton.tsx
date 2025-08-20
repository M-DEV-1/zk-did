import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";

interface BackButtonProps {
    className?: string;
}

export const BackButton = ({ className }: BackButtonProps) => {
    const router = useRouter();
    return (
        <Button
            type="button"
            onClick={() => router.back()}
            className={`flex items-center gap-2 text-muted-foreground hover:text-white text-sm font-medium mb-2 ${className}`}
        >
            <ArrowLeft className="w-4 h-4" />
            Back
        </Button>
    );
}