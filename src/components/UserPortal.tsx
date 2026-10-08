import React, { useState, useEffect } from 'react';
import { ProofOfPayment } from '../types';
import { User, CheckCircle2, Laptop, HardDrive, ShieldCheck, Landmark, Upload, FileText, AlertCircle, AlertTriangle, X } from 'lucide-react';

interface UserPortalProps {
  onReset?: () => void;
  onUploadPOP: (data: {
    type: 'user';
    ref: 'User29';
    docName: string;
    docSize: string;
    docUrl: string;
  }) => void;
  userPOP: ProofOfPayment | null;
  onNavigateToAdmin?: () => void;
}

export const UserPortal: React.FC<UserPortalProps> = ({
  onReset,
  onUploadPOP,
  userPOP,
  onNavigateToAdmin,
}) => {
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [popFile, setPopFile] = useState<{ name: string; size: string; url: string } | null>(null);
  const [reviewSeconds, setReviewSeconds] = useState(20 * 60);

  // Simulated days offset for testing/demonstration of warning state
  const [simulatedDaysOffset, setSimulatedDaysOffset] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (userPOP?.status === 'pending' && reviewSeconds > 0) {
      timer = setInterval(() => {
        setReviewSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [userPOP?.status, reviewSeconds]);

  // Calculate actual days remaining (decreases day by day)
  const calculateDaysRemaining = () => {
    if (!userPOP || userPOP.status !== 'approved') return 0;
    if (userPOP.expiresTimestamp) {
      const now = Date.now();
      const msLeft = userPOP.expiresTimestamp - now;
      const realDays = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
      return Math.max(0, realDays - simulatedDaysOffset);
    }
    return Math.max(0, 30 - simulatedDaysOffset);
  };

  const daysRemaining = calculateDaysRemaining();
  const isExpiringSoon = userPOP?.status === 'approved' && daysRemaining <= 5 && daysRemaining > 0;
  const isExpired = userPOP?.status === 'approved' && daysRemaining === 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handlePOPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!popFile) return;

    onUploadPOP({
      type: 'user',
      ref: 'User29',
      docName: popFile.name,
      docSize: popFile.size,
      docUrl: popFile.url,
    });

    setPopFile(null);
    setIsPayModalOpen(false);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full max-w-5xl mx-auto flex flex-col justify-between overflow-hidden">
      {/* WARNING NOTIFICATION BANNER BEFORE SUBSCRIPTION ENDS */}
      {isExpiringSoon && (
        <div className="w-full bg-amber-500 text-black px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-bold z-30 shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-black shrink-0 animate-bounce" />
            <span>
              Warning: Your user subscription expires in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}!
            </span>
            <span className="font-normal hidden md:inline text-black/85">
              Please pay via Capitec bank transfer (Ref: User29) to avoid service suspension.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsPayModalOpen(true)}
            className="bg-black hover:bg-slate-800 text-white px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors"
          >
            Renew Plan →
          </button>
        </div>
      )}

      {/* EXPIRED BANNER WHEN DAYS REACH 0 */}
      {isExpired && (
        <div className="w-full bg-rose-600 text-white px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-bold z-30 shadow-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
            <span>Subscription Expired: Individual Pro access suspended.</span>
            <span className="font-normal hidden md:inline text-white/90">
              Pay via Capitec bank transfer (Ref: User29) to reactivate for 30 days.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsPayModalOpen(true)}
            className="bg-white text-black hover:bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors"
          >
            Reactivate Now →
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:py-6">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-black tracking-tight">
                  UserPortal
                </h1>
                {userPOP?.status === 'approved' && !isExpired ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isExpiringSoon
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'} Remaining</span>
                  </span>
                ) : isExpired ? (
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-600" /> Subscription Expired
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Identity Verified
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Individual Pro Workspace #USR-4421 • Personal Cloud Access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(true)}
              className="px-3 py-1.5 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>{userPOP?.status === 'approved' ? 'Renew 30 Days' : 'Pay & Keep Active'}</span>
            </button>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs text-slate-400 hover:text-black underline"
              >
                Change Plan
              </button>
            )}
          </div>
        </div>

        {/* 30 Days Active Banner with Days Remaining Countdown and Warning */}
        {userPOP?.status === 'approved' && (
          <div className={`mb-4 p-4 rounded-2xl border ${
            isExpiringSoon
              ? 'bg-amber-50 border-amber-300'
              : isExpired
              ? 'bg-rose-50 border-rose-300'
              : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <CheckCircle2 className={`w-4 h-4 ${isExpiringSoon ? 'text-amber-600' : isExpired ? 'text-rose-600' : 'text-emerald-600'}`} />
                <span>User Subscription: {isExpired ? 'Expired' : 'Active (30 Days Cycle)'}</span>
              </div>
              <span className="font-bold text-xs font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              {isExpiringSoon ? (
                <strong className="text-amber-800">
                  Warning: Your subscription is ending soon! Please pay via Capitec bank transfer to avoid account interruption.
                </strong>
              ) : isExpired ? (
                <strong className="text-rose-700">
                  Account expired. Submit renewal payment below (Ref: User29) to reactivate.
                </strong>
              ) : (
                `Valid until ${userPOP.expiresAt || '30 days from approval'}. Activation days decrease each day.`
              )}
            </p>

            {/* Simulation test buttons to verify warning alert */}
            <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-500 font-medium">Test Warning Alert:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setSimulatedDaysOffset(0)}
                  className={`px-2 py-0.5 rounded ${simulatedDaysOffset === 0 ? 'bg-black text-white font-bold' : 'bg-white border text-slate-700'}`}
                >
                  30 Days
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedDaysOffset(27)}
                  className={`px-2 py-0.5 rounded ${simulatedDaysOffset === 27 ? 'bg-amber-600 text-white font-bold' : 'bg-white border text-slate-700'}`}
                >
                  3 Days (Warn)
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedDaysOffset(30)}
                  className={`px-2 py-0.5 rounded ${simulatedDaysOffset === 30 ? 'bg-rose-600 text-white font-bold' : 'bg-white border text-slate-700'}`}
                >
                  0 Days (Expire)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Synced Devices</span>
              <Laptop className="w-3.5 h-3.5 text-black" />
            </div>
            <p className="text-sm font-bold text-black">1 Connected</p>
            <span className="text-[10px] text-emerald-600 font-medium">Current Device Active</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Personal Vault</span>
              <HardDrive className="w-3.5 h-3.5 text-black" />
            </div>
            <p className="text-sm font-bold text-black">100 GB Cloud</p>
            <span className="text-[10px] text-slate-500 font-medium">12.4 GB Used</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Security State</span>
              <ShieldCheck className="w-3.5 h-3.5 text-black" />
            </div>
            <p className="text-sm font-bold text-black">Verified</p>
            <span className="text-[10px] text-emerald-600 font-medium">2FA Biometric</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider">Subscription</span>
              <User className="w-3.5 h-3.5 text-black" />
            </div>
            <p className="text-sm font-bold text-black">R29,99 / mo</p>
            <span className="text-[10px] text-slate-500 font-medium">Ref: User29</span>
          </div>
        </div>

        {/* Bank Transfer Card in User Portal */}
        <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-black" />
              <h3 className="text-xs font-bold text-black">Capitec Bank Transfer Details</h3>
            </div>
            <span className="text-[10px] font-bold bg-slate-100 text-black px-2 py-0.5 rounded">
              Ref: User29
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 mb-3">
            <div><span className="text-slate-400 block">Bank</span><strong>Capitec</strong></div>
            <div><span className="text-slate-400 block">Account Name</span><strong>Matthews</strong></div>
            <div><span className="text-slate-400 block">Account Number</span><strong className="font-mono">1334067366</strong></div>
            <div><span className="text-slate-400 block">Reference</span><strong className="font-mono">User29</strong></div>
          </div>
          <button
            type="button"
            onClick={() => setIsPayModalOpen(true)}
            className="text-xs font-semibold text-black hover:text-slate-700 underline"
          >
            Upload Proof of Payment Document →
          </button>
        </div>
      </div>

      <div className="text-center py-2 border-t border-slate-100 shrink-0">
        <p className="text-[11px] text-slate-400">
          ActiVeloce Individual Pro Engine • Identity verification confirmed
        </p>
      </div>

      {/* Pay Modal for User */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-black" />
                <h3 className="text-sm font-bold text-black">Pay via Bank Transfer</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2 mb-4">
              <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                <span className="text-slate-500">Bank:</span>
                <strong>Capitec</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                <span className="text-slate-500">Account Name:</span>
                <strong>Matthews</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                <span className="text-slate-500">Account Number:</span>
                <strong className="font-mono font-bold text-sm">1334067366</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                <span className="text-slate-500">Monthly Fee:</span>
                <strong className="text-black font-bold">R29,99</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reference:</span>
                <strong className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300">User29</strong>
              </div>
            </div>

            <form onSubmit={handlePOPSubmit} className="space-y-4">
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
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-black mb-1 transition-colors" />
                    <span className="text-xs font-bold text-black">
                      Select Proof of Payment (PDF, JPG, PNG)
                    </span>
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={!popFile}
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  popFile
                    ? 'bg-black hover:bg-slate-800 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Submit Proof of Payment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CIRCLE LOADING WITH BLURRY BACKGROUND FOR USER */}
      {userPOP?.status === 'pending' && (
        <div className="fixed inset-0 z-50 bg-white/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
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
                strokeDashoffset={70}
                strokeLinecap="round"
                className="animate-spin origin-center"
                style={{ animationDuration: '3s' }}
              />
            </svg>

            <div className="absolute inset-3 border-2 border-black/10 border-t-black rounded-full animate-spin" />

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

          <div className="bg-white/90 border border-slate-200/80 rounded-2xl px-6 py-4 mb-6 max-w-md shadow-xs">
            <p className="text-sm font-bold text-black">
              Review takes 15 to 25 minutes
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Your Capitec bank transfer payment (Ref: <strong className="font-semibold text-black">User29</strong>) was received and routed to Admin User PoP. Once approved, your account will be active for 30 days.
            </p>
          </div>

          {onNavigateToAdmin && (
            <button
              type="button"
              onClick={onNavigateToAdmin}
              className="px-5 py-2.5 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Open Admin User PoP to Review & Approve →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
