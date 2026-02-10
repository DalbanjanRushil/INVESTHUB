import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import KYC from "@/models/KYC";
import { redirect } from "next/navigation";
import KYCForm from "@/components/forms/KYCForm";
import { ShieldCheck, Timer, AlertOctagon } from "lucide-react";

export default async function KYCPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    await connectToDatabase();

    // We check User for quick status, and KYC for details
    const user = await User.findById(session.user.id);
    const kycDoc = await KYC.findOne({ userId: session.user.id });

    const status = user?.kycStatus || "NOT_SUBMITTED";

    return (
        <div className="container mx-auto px-4 lg:px-8 py-8 min-h-screen">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-500">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Identity Verification</h1>
                    <p className="text-muted-foreground">Complete KYC to unlock full platform features.</p>
                </div>
            </div>

            {/* Status Views */}
            {status === "VERIFIED" && (
                <div className="max-w-2xl mx-auto text-center py-12 bg-card border border-emerald-500/30 rounded-3xl relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

                    <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                        <ShieldCheck className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">You are Verified!</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Your identity has been confirmed. You now have unrestricted access to deposits, withdrawals, and advanced strategies.
                    </p>
                </div>
            )}

            {status === "PENDING" && (
                <div className="max-w-2xl mx-auto text-center py-12 bg-card border border-amber-500/30 rounded-3xl relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

                    <div className="w-24 h-24 bg-amber-500/20 text-amber-500 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <Timer className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">Application Under Review</h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-8">
                        Our compliance team is reviewing your documents. This usually takes 24-48 hours. We will notify you once approved.
                    </p>
                    <div className="inline-block px-4 py-2 bg-secondary rounded-lg text-sm text-muted-foreground border border-border">
                        Reference ID: {kycDoc?._id.toString().slice(-8).toUpperCase()}
                    </div>
                </div>
            )}

            {(status === "NOT_SUBMITTED" || status === "REJECTED") && (
                <div>
                    {status === "REJECTED" && (
                        <div className="max-w-2xl mx-auto mb-8 p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-start gap-4">
                            <AlertOctagon className="w-6 h-6 text-destructive shrink-0" />
                            <div>
                                <h3 className="font-bold text-destructive">Verification Failed</h3>
                                <p className="text-destructive font-medium text-sm mt-1">
                                    Reason: {kycDoc?.rejectionReason || "Document mismatch or unclear images."}
                                </p>
                                <p className="text-destructive font-medium text-sm mt-2">Please correct the errors and resubmit below.</p>
                            </div>
                        </div>
                    )}

                    <KYCForm existingData={kycDoc ? JSON.parse(JSON.stringify(kycDoc)) : undefined} />
                </div>
            )}
        </div>
    );
}
