import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, Check, RefreshCw, AlertCircle, ArrowLeft, FileText, CheckCircle2, SwitchCamera, XCircle } from 'lucide-react';

interface VerificationFlowProps {
  chosenOption: 'tenant' | 'user';
  onBack: () => void;
  onSubmitVerification: (data: {
    plan: 'tenant' | 'user';
    selfieUrl: string;
    idDocName: string;
    idDocSize: string;
    idDocUrl: string;
  }) => void;
  status: 'pending' | 'approved' | 'rejected' | null;
  onNavigateToAdmin?: () => void;
}

export const VerificationFlow: React.FC<VerificationFlowProps> = ({
  chosenOption,
  onBack,
  onSubmitVerification,
  status,
  onNavigateToAdmin,
}) => {
  // Selfie state
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // ID Document state
  const [idDocument, setIdDocument] = useState<{ name: string; size: string; previewUrl: string } | null>(null);

  // Review timer (15 to 25 min)
  const [remainingSeconds, setRemainingSeconds] = useState(20 * 60);

  // Countdown timer for 15-25 min review
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'pending' && remainingSeconds > 0) {
      timer = setInterval(() => {
        setRemainingSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status, remainingSeconds]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Callback ref to attach live stream as soon as video DOM element mounts
  const attachVideoElement = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    if (element && mediaStreamRef.current) {
      element.srcObject = mediaStreamRef.current;
      element.muted = true;
      element.onloadedmetadata = () => {
        element.play().catch(() => {});
      };
      element.play().catch(() => {});
    }
  }, []);

  // Ensure stream is playing whenever camera becomes active or facing changes
  useEffect(() => {
    if (isCameraActive && videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive, facingMode]);

  const startCamera = async (targetFacing: 'user' | 'environment' = 'user') => {
    setCameraError(null);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API is not supported in this browser. Please upload a selfie photo below.');
      return;
    }

    try {
      let stream: MediaStream;
      try {
        // Enforce front camera (facingMode: 'user')
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: targetFacing },
            width: { ideal: 720 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (_) {
        // Fallback to ideal facingMode
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: targetFacing,
            width: { ideal: 720 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      }

      mediaStreamRef.current = stream;
      setFacingMode(targetFacing);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was not granted by your browser. You can grant access in browser permissions or take/upload a photo directly below.');
      } else {
        setCameraError('Unable to connect to front camera. Please take or upload a face selfie photo below.');
      }
      setIsCameraActive(false);
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    startCamera(nextFacing);
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (_) {}
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror context for front camera so photo matches user mirror view
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setSelfieImage(dataUrl);
        stopCamera();
      }
    } catch (_) {
      stopCamera();
    }
  };

  const handleSelfieFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfieImage(reader.result as string);
        setCameraError(null);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = (file.size / 1024 / 1024).toFixed(2) + ' MB';
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdDocument({
          name: file.name,
          size: sizeStr,
          previewUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!selfieImage || !idDocument) return;
    onSubmitVerification({
      plan: chosenOption,
      selfieUrl: selfieImage,
      idDocName: idDocument.name,
      idDocSize: idDocument.size,
      idDocUrl: idDocument.previewUrl,
    });
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Review screen after submission
  if (status === 'pending') {
    const totalDuration = 20 * 60;
    const progressPercent = Math.min(100, Math.round(((totalDuration - remainingSeconds) / totalDuration) * 100));

    return (
      <div className="w-full h-full max-w-xl mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
        {/* Animated Circle Loading */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth="6"
            />
            {/* Animated Loading Circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="transparent"
              stroke="#000000"
              strokeWidth="6"
              strokeDasharray="264"
              strokeDashoffset={264 - (264 * Math.max(progressPercent, 12)) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Inner Pulsing Circle Loading Ring */}
          <div className="absolute inset-3 border-2 border-black/10 border-t-black rounded-full animate-spin" />

          {/* Center Timer Display */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-xl sm:text-2xl font-bold font-mono text-black">
              {formatTimer(remainingSeconds)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Remaining
            </span>
          </div>
        </div>

        {/* Status Headings */}
        <h2 className="text-xl sm:text-2xl font-bold text-black tracking-tight mb-2">
          Verification Review in Progress
        </h2>

        {/* Required Notice: Review takes 15 to 25 minutes */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 mb-6 max-w-md">
          <p className="text-sm font-semibold text-black">
            Review takes 15 to 25 minutes
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Submitted to Admin verification queue. Once approved by Admin, your {chosenOption === 'tenant' ? 'TenantPortal' : 'UserPortal'} will unlock automatically.
          </p>
        </div>

        {/* Quick button to view in Admin for convenience */}
        {onNavigateToAdmin && (
          <button
            type="button"
            onClick={onNavigateToAdmin}
            className="mb-6 px-5 py-2.5 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 mx-auto"
          >
            <span>Open Admin Verification Queue →</span>
          </button>
        )}

        <button
          type="button"
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-black transition-colors"
        >
          ← Return to Activation Options
        </button>
      </div>
    );
  }

  // If rejected by admin
  if (status === 'rejected') {
    return (
      <div className="w-full h-full max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-black mb-2">Verification Rejected</h2>
        <p className="text-xs text-slate-500 mb-6">
          The admin reviewed your submission and declined the verification. Please resubmit a clear live face selfie and a valid government ID document.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 bg-black text-white text-xs font-bold rounded-xl shadow-xs hover:bg-slate-800"
        >
          Re-submit Documents
        </button>
      </div>
    );
  }

  // Initial document collection
  return (
    <div className="w-full h-full max-w-2xl mx-auto px-4 py-4 sm:py-6 flex flex-col justify-between overflow-y-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onBack();
            }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-black font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Change Option
          </button>
          <span className="text-xs font-bold text-black uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            {chosenOption === 'tenant' ? 'Tenant Verification' : 'User Verification'}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight mb-1">
          Identity Verification
        </h1>
        <p className="text-xs text-slate-500 mb-6">
          Capture a live face-only selfie with your front camera and upload your ID document to finalize your {chosenOption === 'tenant' ? 'Tenant' : 'Subscription'} activation.
        </p>

        {/* Step 1: Live Selfie Face Only (Front Camera) */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 mb-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Step 1
              </span>
              <h2 className="text-sm font-bold text-black">
                Live Front Camera Selfie (Face Only)
              </h2>
            </div>
            {selfieImage && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Face Captured
              </span>
            )}
          </div>

          {/* Front Camera Viewfinder with Live Mirror Feed */}
          {isCameraActive ? (
            <div className="relative w-full max-w-sm mx-auto h-72 sm:h-80 bg-slate-950 rounded-2xl overflow-hidden shadow-md flex items-center justify-center">
              <video
                ref={attachVideoElement}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
              />

              {/* Front Camera Live Badge */}
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{facingMode === 'user' ? 'Front Camera Live Mirror' : 'Back Camera Live'}</span>
              </div>

              {/* Camera Switcher Button */}
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-xs transition-colors shadow-sm"
                title="Switch Camera"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>

              {/* Oval Face Guide Overlay (Face Only) */}
              <div className="absolute inset-5 border-2 border-dashed border-white/80 rounded-full pointer-events-none flex items-center justify-center">
                <span className="text-[10px] text-white/95 bg-black/50 px-3 py-1 rounded-full backdrop-blur-xs font-medium shadow-xs">
                  Center face inside oval
                </span>
              </div>

              {/* Snap Photo Controls */}
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-6 py-2.5 bg-white hover:bg-slate-100 text-black font-bold text-xs rounded-full shadow-xl transition-transform active:scale-95 flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Selfie</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2.5 bg-black/70 hover:bg-black text-white text-xs rounded-full backdrop-blur-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : selfieImage ? (
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-black bg-slate-100 relative">
                <img src={selfieImage} alt="Selfie preview" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-bold text-black">Front camera face photo ready</p>
                <p className="text-[11px] text-slate-500 mb-2">Live facial biometric confirmed</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelfieImage(null);
                    startCamera('user');
                  }}
                  className="text-xs font-semibold text-black underline hover:text-slate-600 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Retake Front Selfie
                </button>
              </div>
            </div>
          ) : (
            <div>
              {cameraError && (
                <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Camera Notice</p>
                    <p className="text-slate-600 mt-0.5">{cameraError}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Button to activate front camera */}
                <button
                  type="button"
                  onClick={() => startCamera('user')}
                  className="p-4 border-2 border-dashed border-black/30 hover:border-black rounded-xl flex flex-col items-center justify-center text-center transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-black group-hover:text-white flex items-center justify-center text-black mb-2 transition-colors">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-black">Open Front Camera Mirror</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Live on-screen front selfie viewfinder</span>
                </button>

                {/* Front selfie device camera / file upload input */}
                <label className="p-4 border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleSelfieFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-black mb-2 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-black">Device Front Camera / Photo</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Direct device selfie capture</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Upload ID Documents from Device */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Step 2
              </span>
              <h2 className="text-sm font-bold text-black">
                Upload ID Document from Device
              </h2>
            </div>
            {idDocument && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> ID Uploaded
              </span>
            )}
          </div>

          {idDocument ? (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center">
                  {idDocument.previewUrl.startsWith('data:image') ? (
                    <img src={idDocument.previewUrl} alt="ID preview" className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-6 h-6 text-black" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-black truncate max-w-xs">{idDocument.name}</p>
                  <p className="text-[10px] text-slate-400">{idDocument.size}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIdDocument(null)}
                className="text-xs font-semibold text-slate-500 hover:text-black underline"
              >
                Replace
              </button>
            </div>
          ) : (
            <label className="w-full p-5 border-2 border-dashed border-slate-300 hover:border-black rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleIdFileUpload}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-black mb-2 transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-black">
                Choose ID Document (Passport, License, National ID)
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                PDF, JPG, or PNG up to 15MB
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Submit Action Button */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          disabled={!selfieImage || !idDocument}
          onClick={handleSubmit}
          className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all shadow-md ${
            selfieImage && idDocument
              ? 'bg-black hover:bg-slate-800 text-white shadow-black/10 cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {!selfieImage
            ? '1. Please capture front camera selfie'
            : !idDocument
            ? '2. Please upload ID document from device'
            : 'Submit for Verification'}
        </button>
      </div>
    </div>
  );
};
