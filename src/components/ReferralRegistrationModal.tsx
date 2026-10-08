import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Users,
  Landmark,
  Upload,
  FileText,
  AlertCircle,
  Camera,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

interface ReferralRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReferral: (data: {
    name: string;
    contact: string;
    type: 'tenant' | 'user';
    selfieUrl?: string;
    idDocName?: string;
    idDocSize?: string;
    idDocUrl?: string;
    popDocName: string;
    popDocSize: string;
    popDocUrl: string;
  }) => boolean;
  tenantCount: number;
  userCount: number;
  onNavigateToTenantPOP?: (type: 'tenant' | 'user') => void;
}

export const ReferralRegistrationModal: React.FC<ReferralRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSubmitReferral,
  tenantCount,
  userCount,
  onNavigateToTenantPOP,
}) => {
  const [step, setStep] = useState<'info' | 'payment' | 'review'>('info');

  // Form state
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [type, setType] = useState<'tenant' | 'user'>(tenantCount < 10 ? 'tenant' : 'user');

  // Verification documents state
  const [selfieFile, setSelfieFile] = useState<{ name: string; url: string } | null>(null);
  const [idFile, setIdFile] = useState<{ name: string; size: string; url: string } | null>(null);

  // POP document state
  const [popFile, setPopFile] = useState<{ name: string; size: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Countdown timer for 15-25 min review
  const [reviewSeconds, setReviewSeconds] = useState(20 * 60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'review' && reviewSeconds > 0) {
      timer = setInterval(() => {
        setReviewSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, reviewSeconds]);

  if (!isOpen) return null;

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfieFile({
          name: file.name,
          url: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = (file.size / 1024 / 1024).toFixed(2) + ' MB';
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdFile({
          name: file.name,
          size: sizeStr,
          url: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePopUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = (file.size / 1024 / 1024).toFixed(2) + ' MB';
      const reader = new FileReader();
      reader.onloadend = () => {
        setPopFile({
          name: file.name,
          size: sizeStr,
          url: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !contact.trim()) {
      setError('Please provide your full name and contact information.');
      return;
    }

    if (type === 'tenant' && tenantCount >= 10) {
      setError('Tenant quota reached! Only 10 tenants can register under this tenant.');
      return;
    }

    if (type === 'user' && userCount >= 100) {
      setError('User quota reached! Only 100 subscription users can register under this tenant.');
      return;
    }

    setStep('payment');
  };

  const handleSubmitPOP = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!popFile) {
      setError('Please select and upload your Proof of Payment document.');
      return;
    }

    const success = onSubmitReferral({
      name: name.trim(),
      contact: contact.trim(),
      type,
      selfieUrl: selfieFile?.url,
      idDocName: idFile?.name || 'ID_Document.pdf',
      idDocSize: idFile?.size || '1.2 MB',
      idDocUrl: idFile?.url || '',
      popDocName: popFile.name,
      popDocSize: popFile.size,
      popDocUrl: popFile.url,
    });

    if (success) {
      setStep('review');
    } else {
      setError('Quota reached for this plan. Please choose a different option.');
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const monthlyFee = type === 'tenant' ? 'R299,99' : 'R29,99';
  const refCode = type === 'tenant' ? 'Ten29' : 'User29';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      {/* CIRCLE LOADING WITH BLURRY BACKGROUND: 15 to 25 minutes review */}
      {step === 'review' ? (
        <div className="fixed inset-0 z-60 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          {/* Animated Circle Loading */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="transparent"
                stroke="#000000"
                strokeWidth="6"
                strokeDasharray="264"
                strokeDashoffset={75}
                strokeLinecap="round"
                className="animate-spin origin-center"
                style={{ animationDuration: '3s' }}
              />
            </svg>

            {/* Inner Pulsing Circle Loading Ring */}
            <div className="absolute inset-3 border-2 border-black/10 border-t-black rounded-full animate-spin" />

            {/* Center Timer */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl sm:text-2xl font-bold font-mono text-black">
                {formatTimer(reviewSeconds)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Remaining
              </span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-black tracking-tight mb-2">
            Proof of Payment Under Review
          </h2>

          <div className="bg-white/95 border border-slate-200/90 rounded-2xl px-6 py-4 mb-6 max-w-md shadow-xs text-left">
            <p className="text-sm font-bold text-black mb-1">
              Review takes 15 to 25 minutes
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your Capitec bank transfer payment of <strong className="text-black font-bold">{monthlyFee}</strong> (Ref: <strong className="font-mono text-black font-bold">{refCode}</strong>) has been submitted to the Tenant's <strong className="text-black font-semibold">{type === 'tenant' ? 'Tenant PoP' : 'User PoP'}</strong>.
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              Once approved by the tenant, your {type === 'tenant' ? 'Tenant' : 'User'} account will be active for 30 days!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {onNavigateToTenantPOP && (
              <button
                type="button"
                onClick={() => {
                  onNavigateToTenantPOP(type);
                  onClose();
                }}
                className="px-6 py-2.5 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Open Tenant {type === 'tenant' ? 'Tenant PoP' : 'User PoP'} to Review & Approve →
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        /* MODAL CONTAINER */
        <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full border border-slate-200 shadow-2xl relative my-8">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold text-black">
                  Register & Pay via Tenant Referral
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Referral Link Attribution: <code className="font-mono text-black font-bold bg-slate-100 px-1.5 py-0.5 rounded">TENANT29</code>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-2 mb-5">
            <div className={`flex-1 h-1.5 rounded-full ${step === 'info' || step === 'payment' ? 'bg-black' : 'bg-slate-200'}`} />
            <div className={`flex-1 h-1.5 rounded-full ${step === 'payment' ? 'bg-black' : 'bg-slate-200'}`} />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: REFERRAL INFO & OPTION SELECTION */}
          {step === 'info' && (
            <form onSubmit={handleProceedToPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Full Name / Organization
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Ndlovu or Apex Studio"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Contact Email / Phone
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. sarah@example.com or +27 83 456 7890"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-black focus:outline-none focus:border-black"
                />
              </div>

              {/* Plan Choice with Quotas */}
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  Select Subscription Plan
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Tenant Plan Option */}
                  <button
                    type="button"
                    disabled={tenantCount >= 10}
                    onClick={() => setType('tenant')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      tenantCount >= 10
                        ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200'
                        : type === 'tenant'
                        ? 'border-black bg-black text-white shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">Tenant</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        type === 'tenant' ? 'bg-white/20 text-white' : 'bg-slate-100 text-black'
                      }`}>
                        {tenantCount}/10
                      </span>
                    </div>
                    <p className={`text-xs font-bold ${type === 'tenant' ? 'text-white' : 'text-black'}`}>
                      R299,99 / mo
                    </p>
                    <p className={`text-[10px] ${type === 'tenant' ? 'text-white/80' : 'text-slate-400'}`}>
                      Ref: Ten29
                    </p>
                  </button>

                  {/* User Plan Option */}
                  <button
                    type="button"
                    disabled={userCount >= 100}
                    onClick={() => setType('user')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      userCount >= 100
                        ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200'
                        : type === 'user'
                        ? 'border-black bg-black text-white shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">User</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        type === 'user' ? 'bg-white/20 text-white' : 'bg-slate-100 text-black'
                      }`}>
                        {userCount}/100
                      </span>
                    </div>
                    <p className={`text-xs font-bold ${type === 'user' ? 'text-white' : 'text-black'}`}>
                      R29,99 / mo
                    </p>
                    <p className={`text-[10px] ${type === 'user' ? 'text-white/80' : 'text-slate-400'}`}>
                      Ref: User29
                    </p>
                  </button>
                </div>
              </div>

              {/* Optional Identity Verification Uploads */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Identity Verification Documents (For Tenant Review)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Selfie Upload */}
                  <label className="p-2.5 border border-dashed border-slate-300 hover:border-black rounded-xl flex items-center gap-2 cursor-pointer transition-colors bg-slate-50/50">
                    <input type="file" accept="image/*" onChange={handleSelfieUpload} className="hidden" />
                    <Camera className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[11px] font-bold text-black block truncate">
                        {selfieFile ? selfieFile.name : 'Selfie Profile Photo'}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {selfieFile ? 'Uploaded ✓' : 'Optional biometric photo'}
                      </span>
                    </div>
                  </label>

                  {/* ID Document Upload */}
                  <label className="p-2.5 border border-dashed border-slate-300 hover:border-black rounded-xl flex items-center gap-2 cursor-pointer transition-colors bg-slate-50/50">
                    <input type="file" accept="image/*,.pdf" onChange={handleIdUpload} className="hidden" />
                    <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[11px] font-bold text-black block truncate">
                        {idFile ? idFile.name : 'Government ID Doc'}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {idFile ? idFile.size : 'Optional ID / Passport'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: BANK TRANSFER PAYMENT INSTRUCTIONS & PROOF OF PAYMENT UPLOAD */}
          {step === 'payment' && (
            <form onSubmit={handleSubmitPOP} className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-500">Applicant:</span>
                  <strong className="text-xs text-black block">{name} ({contact})</strong>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500">Selected Plan:</span>
                  <strong className="text-xs text-black block capitalize">{type} ({monthlyFee})</strong>
                </div>
              </div>

              {/* Capitec Bank Transfer Details Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <Landmark className="w-4 h-4 text-black" />
                  <span className="font-bold text-black uppercase tracking-wider text-[11px]">
                    Capitec Bank Transfer Instructions
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500">Bank:</span>
                  <strong className="text-black font-semibold">Capitec</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500">Account Name:</span>
                  <strong className="text-black font-semibold">Matthews</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500">Account Number:</span>
                  <strong className="text-black font-mono font-bold text-sm tracking-wider">1334067366</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500">Subscription Fee:</span>
                  <strong className="text-black font-bold text-sm">{monthlyFee}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500">Required Reference:</span>
                  <span className="font-mono font-bold text-black bg-white px-2 py-0.5 rounded border border-slate-300">
                    {refCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Subscription Duration:</span>
                  <strong className="text-emerald-700 font-bold">30 Days Active once approved</strong>
                </div>
              </div>

              {/* Upload Proof of Payment (POP) Document */}
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  Upload Proof of Payment (POP) from Device
                </label>

                {popFile ? (
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-black shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-black truncate max-w-xs">{popFile.name}</p>
                        <p className="text-[10px] text-slate-400">{popFile.size}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPopFile(null)}
                      className="text-xs font-semibold text-slate-500 hover:text-black underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <label className="w-full p-4 border-2 border-dashed border-slate-300 hover:border-black rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handlePopUpload}
                      className="hidden"
                    />
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-black mb-1 transition-colors" />
                    <span className="text-xs font-bold text-black">
                      Select Proof of Payment (PDF, JPG, PNG)
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Bank confirmation slip showing transfer of {monthlyFee} (Ref: {refCode})
                    </span>
                  </label>
                )}
              </div>

              <div className="pt-2 flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep('info')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-black flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={!popFile}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    popFile
                      ? 'bg-black hover:bg-slate-800 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Submit Proof of Payment ({monthlyFee})
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
