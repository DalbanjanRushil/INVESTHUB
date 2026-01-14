"use client";

import { useState } from "react";
import { Upload, Check, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Mock File Upload Component
const FileUploader = ({ label, onUpload, value }: { label: string, onUpload: (url: string) => void, value?: string }) => {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        // Simulate upload delay
        setTimeout(() => {
            setUploading(false);
            // In a real app, we would upload to S3/Cloudinary here
            const mockUrl = URL.createObjectURL(file);
            onUpload(mockUrl);
            toast.success(`${label} uploaded`);
        }, 1500);
    };

    return (
        <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">{label}</label>
            <div className="relative border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors cursor-pointer">
                {value ? (
                    <div className="relative w-full aspect-video bg-black/50 rounded-lg overflow-hidden flex items-center justify-center">
                        <img src={value} alt="Preview" className="h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-green-400 font-bold gap-2">
                            <Check className="w-5 h-5" /> Uploaded
                        </div>
                    </div>
                ) : (
                    <>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*" />
                        {uploading ? (
                            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                        ) : (
                            <Upload className="w-6 h-6 text-slate-400 mb-2" />
                        )}
                        <p className="text-xs text-slate-400">{uploading ? "Uploading..." : "Click to upload image"}</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default function KYCForm({ existingData }: { existingData?: any }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        panNumber: existingData?.panNumber || "",
        aadhaarNumber: existingData?.aadhaarNumber || "",
        bankDetails: {
            accountNumber: existingData?.bankDetails?.accountNumber || "",
            ifsc: existingData?.bankDetails?.ifsc || "",
            bankName: existingData?.bankDetails?.bankName || "",
        },
        documents: {
            panImage: existingData?.documents?.panImage || "",
            aadhaarFront: existingData?.documents?.aadhaarFront || "",
            aadhaarBack: existingData?.documents?.aadhaarBack || "",
            selfie: existingData?.documents?.selfie || "",
        }
    });

    const isStep1Valid = formData.panNumber && formData.aadhaarNumber && formData.documents.panImage && formData.documents.aadhaarFront && formData.documents.aadhaarBack;
    const isStep2Valid = formData.documents.selfie;
    const isStep3Valid = formData.bankDetails.accountNumber && formData.bankDetails.ifsc && formData.bankDetails.bankName;

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/kyc", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Submission failed");

            toast.success("KYC Submitted Successfully!");
            router.refresh();
        } catch (error) {
            toast.error("Failed to submit KYC");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl max-w-2xl mx-auto">
            {/* Stepper */}
            <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 -z-0"></div>
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className={`w-8 h-8 rounded-full flex items-center justify-center z-10 font-bold transition-all duration-300 ${step >= s ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]" : "bg-slate-800 text-slate-500"
                            }`}
                    >
                        {s}
                    </div>
                ))}
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
                {step === 1 ? "Identity Verification" : step === 2 ? "Liveness Check" : "Bank Verification"}
            </h2>
            <p className="text-slate-400 mb-6 text-sm">
                {step === 1 ? "Provide your official government ID details." : step === 2 ? "Verify you are a real person." : "Where should we send your payouts?"}
            </p>

            {/* Step 1: Identity */}
            {step === 1 && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">PAN Number</label>
                            <input
                                type="text"
                                value={formData.panNumber}
                                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase placeholder:normal-case"
                                placeholder="ABCDE1234F"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Aadhaar Number</label>
                            <input
                                type="text"
                                value={formData.aadhaarNumber}
                                onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="1234 5678 9012"
                                maxLength={12}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FileUploader
                            label="PAN Card Photo"
                            value={formData.documents.panImage}
                            onUpload={(url) => setFormData(prev => ({ ...prev, documents: { ...prev.documents, panImage: url } }))}
                        />
                        <FileUploader
                            label="Aadhaar Front"
                            value={formData.documents.aadhaarFront}
                            onUpload={(url) => setFormData(prev => ({ ...prev, documents: { ...prev.documents, aadhaarFront: url } }))}
                        />
                        <FileUploader
                            label="Aadhaar Back"
                            value={formData.documents.aadhaarBack}
                            onUpload={(url) => setFormData(prev => ({ ...prev, documents: { ...prev.documents, aadhaarBack: url } }))}
                        />
                    </div>

                    <button
                        onClick={() => setStep(2)}
                        disabled={!isStep1Valid}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        Next Step
                    </button>
                </div>
            )}

            {/* Step 2: Liveness */}
            {step === 2 && (
                <div className="space-y-6">
                    <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-200">
                            <p className="font-bold mb-1">Instruction</p>
                            Take a clear selfie in good lighting. Removing glasses or hats helps with faster verification.
                        </div>
                    </div>

                    <div className="max-w-xs mx-auto">
                        <FileUploader
                            label="Take Selfie"
                            value={formData.documents.selfie}
                            onUpload={(url) => setFormData(prev => ({ ...prev, documents: { ...prev.documents, selfie: url } }))}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep(1)}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            disabled={!isStep2Valid}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next Step
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Bank Details */}
            {step === 3 && (
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Bank Name</label>
                            <input
                                type="text"
                                value={formData.bankDetails.bankName}
                                onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, bankName: e.target.value } })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="HDFC, SBI, ICICI..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-500">Account Number</label>
                                <input
                                    type="text"
                                    value={formData.bankDetails.accountNumber}
                                    onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountNumber: e.target.value } })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0000 0000 0000"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-500">IFSC Code</label>
                                <input
                                    type="text"
                                    value={formData.bankDetails.ifsc}
                                    onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, ifsc: e.target.value.toUpperCase() } })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                    placeholder="HDFC0001234"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setStep(2)}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!isStep3Valid || loading}
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Submit Application"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
