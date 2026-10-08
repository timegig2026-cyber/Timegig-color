import React, { useState, useEffect } from 'react';
import { ProofOfPayment, ManagedMember, VerificationSubmission, TenantSection, TenantSettings } from '../types';
import { ReferralRegistrationModal } from './ReferralRegistrationModal';
import {
  LayoutDashboard,
  ShieldCheck,
  Building2,
  Users,
  Landmark,
  X,
  CheckCircle2,
  Upload,
  FileText,
  AlertTriangle,
  AlertCircle,
  Share2,
  Copy,
  Check,
  UserPlus,
  ExternalLink,
  Eye,
  Camera,
  Settings,
  LogOut,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface TenantPortalProps {
  userProfilePic?: string;
  onUploadPOP: (data: {
    type: 'tenant';
    ref: 'Ten29';
    docName: string;
    docSize: string;
    docUrl: string;
  }) => void;
  tenantPOP: ProofOfPayment | null;
  onNavigateToAdmin?: () => void;
  managedMembers?: ManagedMember[];
  onAddReferral?: (data: {
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
  onToggleMemberStatus?: (id: string) => void;
  onRemoveManagedMember?: (id: string) => void;
  referralPOPs?: ProofOfPayment[];
  onApproveReferralPOP?: (id: string) => void;
  onRejectReferralPOP?: (id: string) => void;
  referralVerifications?: VerificationSubmission[];
  onApproveReferralVerification?: (id: string) => void;
  onRejectReferralVerification?: (id: string) => void;
  tenantSettings: TenantSettings;
  onUpdateTenantSettings: (settings: TenantSettings) => void;
  onUpdateMemberQuota: (memberId: string, maxTenants: number, maxUsers: number) => void;
}

export const TenantPortal: React.FC<TenantPortalProps> = ({
  userProfilePic,
  onUploadPOP,
  tenantPOP,
  onNavigateToAdmin,
  managedMembers = [],
  onAddReferral,
  onToggleMemberStatus,
  onRemoveManagedMember,
  referralPOPs = [],
  onApproveReferralPOP,
  onRejectReferralPOP,
  referralVerifications = [],
  onApproveReferralVerification,
  onRejectReferralVerification,
  tenantSettings,
  onUpdateTenantSettings,
  onUpdateMemberQuota,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<TenantSection | null>(null);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('activeloce_registered');
    window.location.reload();
  };

  // Settings form state
  const [feeTenant, setFeeTenant] = useState(tenantSettings.feeTenant);
  const [feeUser, setFeeUser] = useState(tenantSettings.feeUser);

  // POP upload form state for tenant's own subscription to Matthews
  const [popFile, setPopFile] = useState<{ name: string; size: string; url: string } | null>(null);

  // Countdown timer for tenant's 15-25 min review
  const [reviewSeconds, setReviewSeconds] = useState(20 * 60);

  // Simulated days offset for testing/demonstration of warning state
  const [simulatedDaysOffset, setSimulatedDaysOffset] = useState<number>(0);

  // Referral link state
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeRosterFilter, setActiveRosterFilter] = useState<'all' | 'tenant' | 'user'>('all');
  const [isAddReferralModalOpen, setIsAddReferralModalOpen] = useState(false);
  const [selectedMemberDetails, setSelectedMemberDetails] = useState<ManagedMember | null>(null);

  // Modals for inspecting received POPs and Verifications from referrals
  const [viewingPOP, setViewingPOP] = useState<ProofOfPayment | null>(null);
  const [viewingVerification, setViewingVerification] = useState<VerificationSubmission | null>(null);
  const [viewingTenants, setViewingTenants] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (tenantPOP?.status === 'pending' && reviewSeconds > 0) {
      timer = setInterval(() => {
        setReviewSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [tenantPOP?.status, reviewSeconds]);

  // Calculate actual days remaining for tenant's own subscription
  const calculateDaysRemaining = () => {
    if (!tenantPOP || tenantPOP.status !== 'approved') return 0;
    if (tenantPOP.expiresTimestamp) {
      const now = Date.now();
      const msLeft = tenantPOP.expiresTimestamp - now;
      const realDays = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
      return Math.max(0, realDays - simulatedDaysOffset);
    }
    return Math.max(0, 30 - simulatedDaysOffset);
  };

  const daysRemaining = calculateDaysRemaining();
  const isExpiringSoon = tenantPOP?.status === 'approved' && daysRemaining <= 5 && daysRemaining > 0;
  const isExpired = tenantPOP?.status === 'approved' && daysRemaining === 0;

  // Member and referral stats
  const managedTenants = managedMembers.filter((m) => m.type === 'tenant');
  const managedUsers = managedMembers.filter((m) => m.type === 'user');

  // "Every referral that registered through tenant link must pay subscription fee to Tenant the same way as in admin feature.
  // If approved tenant or user will be active for 30 days."
  // Only referrals whose POP has been approved and status is active are active and generate profit!
  const activeTenantsList = managedTenants.filter(
    (m) => m.popStatus === 'approved' && m.status === 'active'
  );
  const activeUsersList = managedUsers.filter(
    (m) => m.popStatus === 'approved' && m.status === 'active'
  );

  const activeTenantsCount = activeTenantsList.length;
  const activeUsersCount = activeUsersList.length;

  // Monthly fees: Tenant R299,99; User R29,99
  const tenantSubscriptionProfit = activeTenantsCount * 299.99;
  const userSubscriptionProfit = activeUsersCount * 29.99;

  // Referral queues
  const referralTenantPOPs = referralPOPs.filter((p) => p.type === 'tenant');
  const referralUserPOPs = referralPOPs.filter((p) => p.type === 'user');

  const pendingTenantPOPCount = referralTenantPOPs.filter((p) => p.status === 'pending').length;
  const pendingUserPOPCount = referralUserPOPs.filter((p) => p.status === 'pending').length;
  const pendingVerificationCount = referralVerifications.filter((v) => v.status === 'pending').length;

  // Referral link generation
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://activeloce.app';
  const referralLink = `${origin}/?ref=TENANT29`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSocialShare = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'linkedin' | 'telegram' | 'native') => {
    const shareMessage = `Join ActiVeloce through my tenant link! Tenant plan is R299,99/mo and User subscription is R29,99/mo: ${referralLink}`;
    const encodedMsg = encodeURIComponent(shareMessage);
    const encodedUrl = encodeURIComponent(referralLink);

    switch (platform) {
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodedMsg}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Join our cloud network on ActiVeloce via my tenant portal:')}&url=${encodedUrl}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent('Join my tenant network on ActiVeloce')}`, '_blank');
        break;
      case 'native':
        if (navigator.share) {
          navigator.share({
            title: 'ActiVeloce Tenant Referral',
            text: 'Join ActiVeloce through my tenant referral link!',
            url: referralLink,
          }).catch(() => {});
        } else {
          handleCopyLink();
        }
        break;
    }
  };

  // Upload handler for tenant's own POP
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
      type: 'tenant',
      ref: 'Ten29',
      docName: popFile.name,
      docSize: popFile.size,
      docUrl: popFile.url,
    });

    setPopFile(null);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate days remaining for a managed member
  const getMemberDaysRemaining = (member: ManagedMember) => {
    if (member.popStatus !== 'approved' || !member.popExpiresTimestamp) return 0;
    const now = Date.now();
    const diff = member.popExpiresTimestamp - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Menu items for 4-bar menu
  const menuFeatures = [
    {
      id: 'overview' as TenantSection,
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'verification' as TenantSection,
      label: 'Verification',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: pendingVerificationCount > 0 ? pendingVerificationCount : undefined,
    },
    {
      id: 'tenant-pop' as TenantSection,
      label: 'Tenant PoP',
      icon: <Building2 className="w-4 h-4" />,
      badge: pendingTenantPOPCount > 0 ? pendingTenantPOPCount : undefined,
    },
    {
      id: 'user-pop' as TenantSection,
      label: 'User PoP',
      icon: <Users className="w-4 h-4" />,
      badge: pendingUserPOPCount > 0 ? pendingUserPOPCount : undefined,
    },
    {
      id: 'bank-transfer' as TenantSection,
      label: 'Bank Transfer (Keep Active)',
      icon: <Landmark className="w-4 h-4" />,
      badge: tenantPOP?.status === 'approved' ? `${daysRemaining}d left` : undefined,
    },
    {
      id: 'settings' as TenantSection,
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const filteredMembers = managedMembers.filter((m) => {
    if (activeRosterFilter === 'tenant') return m.type === 'tenant';
    if (activeRosterFilter === 'user') return m.type === 'user';
    return true;
  });

  return (
    <div className="w-full h-full bg-white relative flex flex-col overflow-hidden">
      {/* WARNING NOTIFICATION BANNER BEFORE TENANT'S OWN SUBSCRIPTION ENDS */}
      {isExpiringSoon && (
        <div className="w-full bg-amber-500 text-black px-4 sm:px-6 py-2 flex items-center justify-between text-xs font-bold z-30 shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-black shrink-0 animate-bounce" />
            <span>
              Warning: Your tenant subscription expires in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}!
            </span>
            <span className="font-normal hidden md:inline text-black/85">
              Please pay via Capitec bank transfer (Fee: R299,99) to avoid service suspension.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveSection('bank-transfer')}
            className="bg-black hover:bg-slate-800 text-white px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors"
          >
            Renew Plan →
          </button>
        </div>
      )}

      {/* EXPIRED BANNER WHEN TENANT DAYS REACH 0 */}
      {isExpired && (
        <div className="w-full bg-rose-600 text-white px-4 sm:px-6 py-2 flex items-center justify-between text-xs font-bold z-30 shadow-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
            <span>Subscription Expired: Tenant account deactivated.</span>
            <span className="font-normal hidden md:inline text-white/90">
              Pay via Capitec bank transfer (Ref: Ten29 • R299,99) to reactivate for 30 days.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveSection('bank-transfer')}
            className="bg-white text-black hover:bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors"
          >
            Reactivate Now →
          </button>
        </div>
      )}

      {/* Top Corner Bar: Profile Picture Logo and 4-Bar Menu */}
      <div className="w-full px-5 py-3.5 flex items-center justify-between bg-white z-20 border-b border-slate-100">
        {/* User Profile Picture as Logo in Top Corner */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-black bg-slate-100 flex items-center justify-center shadow-xs">
            {userProfilePic ? (
              <img
                src={userProfilePic}
                alt="Tenant Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center text-white text-xs font-bold">
                TP
              </div>
            )}
          </div>

          {/* Active Days Badge (decreases day by day) */}
          {tenantPOP?.status === 'approved' && !isExpired && (
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
              isExpiringSoon
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'} Remaining</span>
            </span>
          )}

          {activeSection && (
            <span className="text-xs font-bold text-black uppercase tracking-wider hidden sm:inline ml-2">
              • {menuFeatures.find((m) => m.id === activeSection)?.label}
            </span>
          )}
        </div>

        {/* 4-Bar Menu Button in Top Corner */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="4-Bar Menu"
            className="p-1.5 text-black hover:bg-slate-100 rounded-lg transition-colors focus:outline-none flex items-center gap-1"
          >
            <div className="flex flex-col justify-center items-center w-6 h-6 gap-1">
              <span className="block w-5 h-0.5 bg-black rounded-full" />
              <span className="block w-5 h-0.5 bg-black rounded-full" />
              <span className="block w-5 h-0.5 bg-black rounded-full" />
              <span className="block w-5 h-0.5 bg-black rounded-full" />
            </div>
            {(pendingTenantPOPCount > 0 || pendingUserPOPCount > 0 || pendingVerificationCount > 0) && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>

          {/* 4-Bar Dropdown Menu */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 text-xs">
                <div className="px-3.5 pb-2 mb-1 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                  <span>Tenant Features</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection(null);
                      setIsMenuOpen(false);
                    }}
                    className="text-slate-500 hover:text-black font-semibold text-[10px]"
                  >
                    Clear to Blank
                  </button>
                </div>

                {menuFeatures.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between transition-colors ${
                      activeSection === item.id
                        ? 'bg-black text-white font-semibold'
                        : 'text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={activeSection === item.id ? 'text-white' : 'text-black'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        activeSection === item.id ? 'bg-white text-black' : 'bg-black text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 text-rose-600 font-bold hover:bg-rose-50 transition-colors mt-1 border-t border-slate-100"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Tenant Content Area */}
      <div className="flex-1 w-full bg-white p-4 sm:p-6 overflow-y-auto">
        {/* If no section is selected, TenantPortal is pristine blank per user request */}
        {activeSection === null ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-16 h-16 rounded-full border border-dashed border-slate-200 flex items-center justify-center mb-3">
              <LayoutDashboard className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Tenant Portal</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Click the 4-bar menu in the top corner to access Overview, Verification, Tenant PoP, User PoP, or Bank Transfer.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Top Close Button for Current Active Section */}
            <div className="flex justify-end mb-3">
              <button
                type="button"
                onClick={() => setActiveSection(null)}
                className="text-xs font-semibold text-slate-400 hover:text-black flex items-center gap-1 transition-colors"
              >
                <span>Close to Blank</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ======================================================== */}
            {/* 1. OVERVIEW FEATURE */}
            {/* Show Tenant subscription profit, user subscription profit, */}
            {/* active tenants and active subscription users. */}
            {/* Social media link, 10/100 limits, managed members roster. */}
            {/* ======================================================== */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-black tracking-tight flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-black" />
                    <span>Tenant Overview</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Live performance dashboard tracking paid active referrals, subscription profit, and referral network quotas.
                  </p>
                </div>

                {/* 4 KEY METRIC CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* 1. Tenant subscription profit */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-emerald-600 mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Tenant Profit</span>
                      <Building2 className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div className="text-lg sm:text-2xl font-bold text-emerald-900 font-mono">
                      R {tenantSubscriptionProfit.toFixed(2).replace('.', ',')}
                    </div>
                    <p className="text-[10px] text-emerald-700 mt-1">
                      R299,99 / active tenant plan
                    </p>
                  </div>

                  {/* 2. User subscription profit */}
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-blue-600 mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider">User Profit</span>
                      <Users className="w-4 h-4 text-blue-700" />
                    </div>
                    <div className="text-lg sm:text-2xl font-bold text-blue-900 font-mono">
                      R {userSubscriptionProfit.toFixed(2).replace('.', ',')}
                    </div>
                    <p className="text-[10px] text-blue-700 mt-1">
                      R29,99 / active user plan
                    </p>
                  </div>

                  {/* 3. Active tenants (Max 10) */}
                  <div 
                    className="bg-purple-50 border border-purple-200 rounded-2xl p-4 cursor-pointer hover:border-purple-400 transition-colors"
                    onClick={() => setViewingTenants(true)}
                  >
                    <div className="flex items-center justify-between text-purple-600 mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Active Tenants</span>
                      <Building2 className="w-4 h-4 text-purple-700" />
                    </div>
                    <div className="text-lg sm:text-2xl font-bold text-purple-900 font-mono">
                      {activeTenantsCount} <span className="text-xs text-purple-700 font-normal">/ 10 max</span>
                    </div>
                    <p className="text-[10px] text-purple-700 mt-1">
                      {managedTenants.length} registered • Click to manage
                    </p>
                  </div>

                  {/* 4. Active subscription users (Max 100) */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-amber-600 mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Active Users</span>
                      <Users className="w-4 h-4 text-amber-700" />
                    </div>
                    <div className="text-lg sm:text-2xl font-bold text-amber-900 font-mono">
                      {activeUsersCount} <span className="text-xs text-amber-700 font-normal">/ 100 max</span>
                    </div>
                    <p className="text-[10px] text-amber-700 mt-1">
                      {managedUsers.length} registered • {100 - managedUsers.length} slots free
                    </p>
                  </div>
                </div>

                {/* SOCIAL MEDIA REFERRAL LINK BOX */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-black" />
                        <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                          Social Media Referral Link
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Share on social media. Whoever joins through your link must pay subscription fee to you and will be managed here.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white text-black border border-slate-200">
                        Quotas: 10 Tenants • 100 Users
                      </span>
                    </div>
                  </div>

                  {/* Copy Link Field */}
                  <div className="flex items-center gap-2 mb-3 bg-white border border-slate-200 rounded-xl p-1.5 pl-3">
                    <input
                      type="text"
                      readOnly
                      value={referralLink}
                      className="text-xs text-black font-mono flex-1 bg-transparent border-none outline-none truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-black hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Social Media Share Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-600 mr-1">Share via:</span>

                    <button
                      type="button"
                      onClick={() => handleSocialShare('whatsapp')}
                      className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialShare('facebook')}
                      className="px-3 py-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <span>Facebook</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialShare('twitter')}
                      className="px-3 py-1.5 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <span>X (Twitter)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialShare('linkedin')}
                      className="px-3 py-1.5 bg-[#0A66C2] hover:bg-[#095196] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <span>LinkedIn</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialShare('telegram')}
                      className="px-3 py-1.5 bg-[#229ED9] hover:bg-[#1e8cc0] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <span>Telegram</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialShare('native')}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-black rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>More</span>
                    </button>
                  </div>

                  {/* Quota Progress Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-200">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="font-semibold text-slate-700">Tenants Quota (Max 10)</span>
                        <span className="font-mono font-bold text-black">{managedTenants.length} / 10 signed up</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            managedTenants.length >= 10 ? 'bg-amber-500' : 'bg-black'
                          }`}
                          style={{ width: `${Math.min(100, (managedTenants.length / 10) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="font-semibold text-slate-700">Subscription Users Quota (Max 100)</span>
                        <span className="font-mono font-bold text-black">{managedUsers.length} / 100 signed up</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            managedUsers.length >= 100 ? 'bg-amber-500' : 'bg-black'
                          }`}
                          style={{ width: `${Math.min(100, (managedUsers.length / 100) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* MANAGED MEMBERS ROSTER */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                        Managed Members ({managedMembers.length})
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Tenants and users registered through your referral link who pay subscription fees to you.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Filter tabs */}
                      <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs">
                        <button
                          type="button"
                          onClick={() => setActiveRosterFilter('all')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                            activeRosterFilter === 'all' ? 'bg-white text-black shadow-xs' : 'text-slate-600 hover:text-black'
                          }`}
                        >
                          All ({managedMembers.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveRosterFilter('tenant')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                            activeRosterFilter === 'tenant' ? 'bg-white text-black shadow-xs' : 'text-slate-600 hover:text-black'
                          }`}
                        >
                          Tenants ({managedTenants.length}/10)
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveRosterFilter('user')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                            activeRosterFilter === 'user' ? 'bg-white text-black shadow-xs' : 'text-slate-600 hover:text-black'
                          }`}
                        >
                          Users ({managedUsers.length}/100)
                        </button>
                      </div>

                      {/* Register Member & Pay via Link Button */}
                      <button
                        type="button"
                        onClick={() => setIsAddReferralModalOpen(true)}
                        className="px-3 py-1.5 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Register & Pay via Link</span>
                      </button>
                    </div>
                  </div>

                  {/* Members List */}
                  {filteredMembers.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No Members Joined via Link Yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                        Share your referral link on WhatsApp, Facebook, or X. Every referral that registers must pay subscription fees to you via Capitec bank transfer.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddReferralModalOpen(true)}
                        className="mt-3 px-3.5 py-1.5 bg-black hover:bg-slate-800 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Register & Submit First POP</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredMembers.map((member) => {
                        const mDays = getMemberDaysRemaining(member);
                        const isMemberExpiringSoon = member.popStatus === 'approved' && mDays <= 5 && mDays > 0;
                        const isMemberExpired = member.popStatus === 'approved' && mDays === 0;

                        return (
                          <div
                            key={member.id}
                            className="border border-slate-200 rounded-2xl p-3.5 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-black shrink-0">
                                {member.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-black">{member.name}</span>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                    member.type === 'tenant'
                                      ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                      : 'bg-blue-100 text-blue-900 border border-blue-200'
                                  }`}>
                                    {member.type === 'tenant' ? 'Tenant (R299,99/mo)' : 'User (R29,99/mo)'}
                                  </span>

                                  {/* Verification status pill */}
                                  {member.verificationStatus && (
                                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                                      member.verificationStatus === 'approved'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : member.verificationStatus === 'rejected'
                                        ? 'bg-rose-50 text-rose-700'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      ID: {member.verificationStatus}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  {member.contact} • Joined: {member.joinedAt}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                              {/* Payment status and 30-day countdown */}
                              <div>
                                {member.popStatus === 'approved' ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      isMemberExpiringSoon
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : isMemberExpired
                                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {isMemberExpired ? 'Expired' : `Paid • ${mDays}d left`}
                                    </span>
                                  </div>
                                ) : member.popStatus === 'rejected' ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                    PoP Rejected
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                    Pending PoP Review
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedMemberDetails(member)}
                                  className="p-1.5 text-slate-500 hover:text-black border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                  title="View Member Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {member.popStatus === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveSection(member.type === 'tenant' ? 'tenant-pop' : 'user-pop')}
                                    className="px-2.5 py-1 bg-black text-white rounded-lg text-[11px] font-semibold hover:bg-slate-800 transition-colors"
                                  >
                                    Review PoP
                                  </button>
                                )}

                                {onToggleMemberStatus && (
                                  <button
                                    type="button"
                                    onClick={() => onToggleMemberStatus(member.id)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                                      member.status === 'active'
                                        ? 'text-slate-500 hover:text-amber-700 border border-slate-200'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}
                                  >
                                    {member.status === 'active' ? 'Suspend' : 'Activate'}
                                  </button>
                                )}

                                {onRemoveManagedMember && (
                                  <button
                                    type="button"
                                    onClick={() => onRemoveManagedMember(member.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                    title="Remove Member"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 2. VERIFICATION FEATURE IN TENANT PORTAL */}
            {/* Let tenant receive submitted profile picture and id documents */}
            {/* from referrals who registered through tenant link to view, approve, and reject */}
            {/* ======================================================== */}
            {activeSection === 'verification' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-black tracking-tight flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-black" />
                      <span>Referral Verification</span>
                      {pendingVerificationCount > 0 && (
                        <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full font-bold">
                          {pendingVerificationCount} Pending
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Review submitted profile pictures and ID documents from referrals who registered through your tenant link.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                    Received Referral Identity Submissions
                  </h3>

                  {referralVerifications.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50">
                      <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No Identity Documents Received</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        When people register via your tenant link and upload profile pictures or ID documents, they appear here for your review.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {referralVerifications.map((sub) => (
                        <div
                          key={sub.id}
                          className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {sub.selfieUrl ? (
                                <img src={sub.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                              ) : (
                                <Camera className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-black">
                                  {sub.applicantName || 'Applicant'}
                                </span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  sub.plan === 'tenant' ? 'bg-purple-100 text-purple-900' : 'bg-blue-100 text-blue-900'
                                }`}>
                                  {sub.plan === 'tenant' ? 'Tenant (R299,99)' : 'User (R29,99)'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {sub.applicantContact} • Submitted: {sub.submittedAt}
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                                <FileText className="w-3.5 h-3.5 text-black" />
                                <span className="font-medium text-[11px] truncate max-w-xs">{sub.idDocName}</span>
                                <span className="text-[10px] text-slate-400">({sub.idDocSize})</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                              sub.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {sub.status}
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setViewingVerification(sub)}
                                className="p-2 border border-slate-200 hover:border-black rounded-xl text-black hover:bg-slate-50 transition-colors"
                                title="View Profile Picture & ID Document"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {onApproveReferralVerification && (
                                <button
                                  type="button"
                                  onClick={() => onApproveReferralVerification(sub.id)}
                                  disabled={sub.status === 'approved'}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                                    sub.status === 'approved'
                                      ? 'bg-emerald-50 text-emerald-700 opacity-60 cursor-not-allowed'
                                      : 'bg-black hover:bg-slate-800 text-white cursor-pointer shadow-xs'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                              )}

                              {onRejectReferralVerification && (
                                <button
                                  type="button"
                                  onClick={() => onRejectReferralVerification(sub.id)}
                                  disabled={sub.status === 'rejected'}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                                    sub.status === 'rejected'
                                      ? 'bg-rose-50 text-rose-700 opacity-60 cursor-not-allowed'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer'
                                  }`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 3. TENANT POP IN TENANT PORTAL */}
            {/* Tenant receives submitted R299,99 Proof of Payment documents */}
            {/* from referral tenants (Ref: Ten29) to view, approve or reject. */}
            {/* If approved, tenant referral is active for 30 days! */}
            {/* ======================================================== */}
            {activeSection === 'tenant-pop' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-black tracking-tight flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-black" />
                      <span>Tenant PoP (Point of Presence)</span>
                      {pendingTenantPOPCount > 0 && (
                        <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full font-bold">
                          {pendingTenantPOPCount} Pending POP
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Review received Tenant bank transfer Proof of Payment documents (Fee: R299,99 • Ref: Ten29). Approving grants 30 days active and adds to your profit.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                    Received Referral Tenant POP Documents
                  </h3>

                  {referralTenantPOPs.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50">
                      <Landmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No Tenant POP Documents Received Yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        When referral tenants pay via Capitec (Ref: Ten29 • R299,99) and upload proof of payment, it appears here for your approval.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {referralTenantPOPs.map((pop) => (
                        <div
                          key={pop.id}
                          className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {pop.docUrl.startsWith('data:image') ? (
                                <img src={pop.docUrl} alt="POP preview" className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="w-6 h-6 text-black" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-black">
                                  {pop.applicantName || 'Tenant Referral'}
                                </span>
                                <span className="text-[10px] font-mono font-bold bg-slate-100 text-black px-2 py-0.5 rounded border border-slate-200">
                                  Ref: {pop.ref}
                                </span>
                                <span className="text-xs font-bold text-black">{pop.amount}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {pop.applicantContact} • Capitec: Matthews (1334067366) • {pop.submittedAt}
                              </p>
                              <p className="text-[11px] text-slate-600 font-mono mt-1">
                                File: {pop.docName} ({pop.docSize})
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                              pop.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : pop.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {pop.status === 'approved' ? 'Active 30 Days' : pop.status}
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setViewingPOP(pop)}
                                className="p-2 border border-slate-200 hover:border-black rounded-xl text-black hover:bg-slate-50 transition-colors"
                                title="View POP Document"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {onApproveReferralPOP && (
                                <button
                                  type="button"
                                  onClick={() => onApproveReferralPOP(pop.id)}
                                  disabled={pop.status === 'approved'}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                                    pop.status === 'approved'
                                      ? 'bg-emerald-50 text-emerald-700 opacity-60 cursor-not-allowed'
                                      : 'bg-black hover:bg-slate-800 text-white cursor-pointer shadow-xs'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve (30 Days)</span>
                                </button>
                              )}

                              {onRejectReferralPOP && (
                                <button
                                  type="button"
                                  onClick={() => onRejectReferralPOP(pop.id)}
                                  disabled={pop.status === 'rejected'}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                                    pop.status === 'rejected'
                                      ? 'bg-rose-50 text-rose-700 opacity-60 cursor-not-allowed'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer'
                                  }`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 4. USER POP IN TENANT PORTAL */}
            {/* Tenant receives submitted R29,99 Proof of Payment documents */}
            {/* from referral users (Ref: User29) to view, approve or reject. */}
            {/* If approved, user referral is active for 30 days! */}
            {/* ======================================================== */}
            {activeSection === 'user-pop' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-black tracking-tight flex items-center gap-2">
                      <Users className="w-5 h-5 text-black" />
                      <span>User PoP (Point of Presence)</span>
                      {pendingUserPOPCount > 0 && (
                        <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full font-bold">
                          {pendingUserPOPCount} Pending POP
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Review received User bank transfer Proof of Payment documents (Fee: R29,99 • Ref: User29). Approving grants 30 days active and adds to your profit.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                    Received Referral User POP Documents
                  </h3>

                  {referralUserPOPs.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50">
                      <Landmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No User POP Documents Received Yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        When referral users pay via Capitec (Ref: User29 • R29,99) and upload proof of payment, it appears here for your approval.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {referralUserPOPs.map((pop) => (
                        <div
                          key={pop.id}
                          className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {pop.docUrl.startsWith('data:image') ? (
                                <img src={pop.docUrl} alt="POP preview" className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="w-6 h-6 text-black" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-black">
                                  {pop.applicantName || 'User Referral'}
                                </span>
                                <span className="text-[10px] font-mono font-bold bg-slate-100 text-black px-2 py-0.5 rounded border border-slate-200">
                                  Ref: {pop.ref}
                                </span>
                                <span className="text-xs font-bold text-black">{pop.amount}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {pop.applicantContact} • Capitec: Matthews (1334067366) • {pop.submittedAt}
                              </p>
                              <p className="text-[11px] text-slate-600 font-mono mt-1">
                                File: {pop.docName} ({pop.docSize})
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                              pop.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : pop.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {pop.status === 'approved' ? 'Active 30 Days' : pop.status}
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setViewingPOP(pop)}
                                className="p-2 border border-slate-200 hover:border-black rounded-xl text-black hover:bg-slate-50 transition-colors"
                                title="View POP Document"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {onApproveReferralPOP && (
                                <button
                                  type="button"
                                  onClick={() => onApproveReferralPOP(pop.id)}
                                  disabled={pop.status === 'approved'}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                                    pop.status === 'approved'
                                      ? 'bg-emerald-50 text-emerald-700 opacity-60 cursor-not-allowed'
                                      : 'bg-black hover:bg-slate-800 text-white cursor-pointer shadow-xs'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve (30 Days)</span>
                                </button>
                              )}

                              {onRejectReferralPOP && (
                                <button
                                  type="button"
                                  onClick={() => onRejectReferralPOP(pop.id)}
                                  disabled={pop.status === 'rejected'}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                                    pop.status === 'rejected'
                                      ? 'bg-rose-50 text-rose-700 opacity-60 cursor-not-allowed'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer'
                                  }`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 5. BANK TRANSFER (KEEP MASTER TENANT ACCOUNT ACTIVE) */}
            {/* Tenant pays R299,99 to Capitec Matthews 1334067366 ref Ten29 */}
            {/* ======================================================== */}
            {activeSection === 'bank-transfer' && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Landmark className="w-5 h-5 text-black" />
                  <h2 className="text-base font-bold text-black">Pay via Bank Transfer</h2>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Make a transfer of R299,99 to the Capitec account below to keep your tenant account active for 30 days.
                </p>

                {/* Approved for 30 days notice with Days Remaining Counter */}
                {tenantPOP?.status === 'approved' && (
                  <div className={`mb-4 p-4 rounded-2xl border ${
                    isExpiringSoon
                      ? 'bg-amber-50 border-amber-300'
                      : isExpired
                      ? 'bg-rose-50 border-rose-300'
                      : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                        <CheckCircle2 className={`w-4 h-4 ${isExpiringSoon ? 'text-amber-600' : 'text-emerald-600'}`} />
                        <span>Tenant Subscription Status: {isExpired ? 'Expired' : 'Active'}</span>
                      </div>
                      <span className="font-bold text-xs font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                        {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      {isExpiringSoon ? (
                        <strong className="text-amber-800">Warning: Subscription ending soon! Transfer renewal to avoid interruption.</strong>
                      ) : isExpired ? (
                        <strong className="text-rose-700">Account expired. Submit renewal payment below.</strong>
                      ) : (
                        `Valid until ${tenantPOP.expiresAt || '30 days from approval'}. Days decrease day by day.`
                      )}
                    </p>

                    {/* Simulation buttons for testing warning states */}
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

                {/* Capitec Bank Details Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5 mb-5">
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
                    <span className="text-slate-500">Monthly Fee:</span>
                    <strong className="text-black font-bold">R299,99</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                    <span className="text-slate-500">Reference:</span>
                    <span className="font-mono font-bold text-black bg-white px-2 py-0.5 rounded border border-slate-300">
                      Ten29
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subscription Duration:</span>
                    <strong className="text-emerald-700 font-bold">30 Days Active</strong>
                  </div>
                </div>

                {/* Upload Proof of Payment Document */}
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
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          Bank confirmation slip or receipt (Fee: R299,99)
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
            )}

            {/* SETTINGS (Tenant can change monthly subscription fee) */}
            {activeSection === 'settings' && (
              <div className="max-w-xs mx-auto space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-black tracking-tight flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Tenant Settings
                  </h2>
                  <p className="text-xs text-slate-500">Update your referral plan subscription fees.</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-black mb-1">Tenant Fee (R)</label>
                    <input type="number" step="0.01" value={feeTenant} onChange={(e) => setFeeTenant(parseFloat(e.target.value))} className="w-full px-3 py-2 border rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-black mb-1">User Fee (R)</label>
                    <input type="number" step="0.01" value={feeUser} onChange={(e) => setFeeUser(parseFloat(e.target.value))} className="w-full px-3 py-2 border rounded-xl text-xs" />
                  </div>
                  <button
                    onClick={() => onUpdateTenantSettings({ ...tenantSettings, feeTenant, feeUser })}
                    className="w-full py-2 bg-black text-white text-xs font-bold rounded-xl"
                  >
                    Save Fees
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* REFERRAL REGISTRATION & PAYMENT MODAL */}
      <ReferralRegistrationModal
        isOpen={isAddReferralModalOpen}
        onClose={() => setIsAddReferralModalOpen(false)}
        onSubmitReferral={(data) => {
          if (onAddReferral) {
            return onAddReferral(data);
          }
          return false;
        }}
        tenantCount={managedTenants.length}
        userCount={managedUsers.length}
        onNavigateToTenantPOP={(type) => {
          setActiveSection(type === 'tenant' ? 'tenant-pop' : 'user-pop');
        }}
      />

      {/* MODAL: VIEW PROOF OF PAYMENT DOCUMENT */}
      {viewingPOP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-slate-200 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-black" />
                <h3 className="text-sm font-bold text-black">Proof of Payment Document</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingPOP(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Preview */}
            <div className="mb-4 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden min-h-[220px] max-h-[340px] flex items-center justify-center p-2">
              {viewingPOP.docUrl.startsWith('data:image') ? (
                <img
                  src={viewingPOP.docUrl}
                  alt="Proof of Payment"
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <div className="text-center p-6">
                  <FileText className="w-14 h-14 text-black mx-auto mb-2" />
                  <p className="text-xs font-bold text-black">{viewingPOP.docName}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{viewingPOP.docSize}</p>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant:</span>
                <strong className="text-black font-semibold">
                  {viewingPOP.applicantName || 'Referral Member'} ({viewingPOP.applicantContact})
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank & Account:</span>
                <strong className="text-black font-semibold">Capitec • Matthews (1334067366)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                  {viewingPOP.ref}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <strong className="text-emerald-700 font-bold">{viewingPOP.amount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className={`font-bold capitalize ${
                  viewingPOP.status === 'approved' ? 'text-emerald-700' : viewingPOP.status === 'rejected' ? 'text-rose-700' : 'text-amber-700'
                }`}>
                  {viewingPOP.status === 'approved' ? 'Active 30 Days' : viewingPOP.status}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingPOP(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-black"
              >
                Close
              </button>

              {onRejectReferralPOP && (
                <button
                  type="button"
                  onClick={() => {
                    onRejectReferralPOP(viewingPOP.id);
                    setViewingPOP(null);
                  }}
                  disabled={viewingPOP.status === 'rejected'}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Reject
                </button>
              )}

              {onApproveReferralPOP && (
                <button
                  type="button"
                  onClick={() => {
                    onApproveReferralPOP(viewingPOP.id);
                    setViewingPOP(null);
                  }}
                  disabled={viewingPOP.status === 'approved'}
                  className="px-5 py-2 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Approve (30 Days Active)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW IDENTITY VERIFICATION SUBMISSION */}
      {viewingVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-slate-200 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-black" />
                <h3 className="text-sm font-bold text-black">Referral Identity Verification</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingVerification(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photos & Document */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="border border-slate-200 rounded-2xl p-2.5 bg-slate-50">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Live Selfie Profile Photo
                </span>
                <div className="w-full h-40 rounded-xl bg-slate-200 overflow-hidden flex items-center justify-center">
                  {viewingVerification.selfieUrl ? (
                    <img src={viewingVerification.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-slate-400" />
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-2.5 bg-slate-50">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Government ID Document
                </span>
                <div className="w-full h-40 rounded-xl bg-slate-200 overflow-hidden flex items-center justify-center p-2 text-center">
                  {viewingVerification.idDocUrl.startsWith('data:image') ? (
                    <img src={viewingVerification.idDocUrl} alt="ID Document" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div>
                      <FileText className="w-8 h-8 text-black mx-auto mb-1" />
                      <p className="text-[11px] font-bold text-black truncate max-w-[140px]">{viewingVerification.idDocName}</p>
                      <p className="text-[9px] text-slate-500">{viewingVerification.idDocSize}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Applicant details */}
            <div className="bg-slate-50 rounded-2xl p-3 text-xs space-y-1.5 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant:</span>
                <strong className="text-black">{viewingVerification.applicantName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact:</span>
                <strong className="text-black">{viewingVerification.applicantContact}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <strong className="capitalize text-black">{viewingVerification.plan}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className={`font-bold capitalize ${
                  viewingVerification.status === 'approved' ? 'text-emerald-700' : viewingVerification.status === 'rejected' ? 'text-rose-700' : 'text-amber-700'
                }`}>
                  {viewingVerification.status}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingVerification(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-black"
              >
                Close
              </button>

              {onRejectReferralVerification && (
                <button
                  type="button"
                  onClick={() => {
                    onRejectReferralVerification(viewingVerification.id);
                    setViewingVerification(null);
                  }}
                  disabled={viewingVerification.status === 'rejected'}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Reject
                </button>
              )}

              {onApproveReferralVerification && (
                <button
                  type="button"
                  onClick={() => {
                    onApproveReferralVerification(viewingVerification.id);
                    setViewingVerification(null);
                  }}
                  disabled={viewingVerification.status === 'approved'}
                  className="px-5 py-2 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Approve Verification
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MEMBER PROFILE DETAILS */}
      {selectedMemberDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full border border-slate-200 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-black">Member Profile Details</h3>
              <button
                type="button"
                onClick={() => setSelectedMemberDetails(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Full Name:</span>
                <strong className="text-black">{selectedMemberDetails.name}</strong>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Contact:</span>
                <strong className="text-black">{selectedMemberDetails.contact}</strong>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Account Type:</span>
                <strong className="capitalize text-black">{selectedMemberDetails.type}</strong>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Monthly Subscription Fee:</span>
                <strong className="text-emerald-700 font-bold">{selectedMemberDetails.monthlyFee}</strong>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Payment Status:</span>
                <span className={`font-bold capitalize ${
                  selectedMemberDetails.popStatus === 'approved' ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {selectedMemberDetails.popStatus === 'approved' ? 'Approved (Active 30 Days)' : selectedMemberDetails.popStatus || 'Pending'}
                </span>
              </div>
              {selectedMemberDetails.popExpiresAt && (
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-500">Subscription Expiration:</span>
                  <span className="text-slate-800 font-medium">
                    {selectedMemberDetails.popExpiresAt} ({getMemberDaysRemaining(selectedMemberDetails)} days remaining)
                  </span>
                </div>
              )}
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Joined Date:</span>
                <span className="text-slate-700">{selectedMemberDetails.joinedAt}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMemberDetails(null)}
                className="px-4 py-2 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CIRCLE LOADING WITH BLURRY BACKGROUND: Tenant's own subscription review (15-25 minutes) */}
      {tenantPOP?.status === 'pending' && (
        <div className="fixed inset-0 z-50 bg-white/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
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
                strokeDashoffset={70}
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

          <div className="bg-white/90 border border-slate-200/80 rounded-2xl px-6 py-4 mb-6 max-w-md shadow-xs">
            <p className="text-sm font-bold text-black">
              Review takes 15 to 25 minutes
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Your Capitec bank transfer payment of <strong className="text-black">R299,99</strong> (Ref: <strong className="font-semibold text-black">Ten29</strong>) was received and routed to Admin Tenant PoP. Once approved, your account will be active for 30 days.
            </p>
          </div>

          {onNavigateToAdmin && (
            <button
              type="button"
              onClick={onNavigateToAdmin}
              className="px-5 py-2.5 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Open Admin Tenant PoP to Review & Approve →
            </button>
          )}
        </div>
      )}

      {/* Modal to View Active Tenants */}
      {viewingTenants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-slate-200 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-black">Active Tenants Management</h3>
              <button type="button" onClick={() => setViewingTenants(false)} className="p-1 text-slate-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {(managedMembers || []).filter((m) => m.type === 'tenant' && m.status === 'active' && m.popStatus === 'approved').map((tenant) => (
                <div key={tenant.id} className="border border-slate-200 rounded-2xl p-4 flex gap-4 items-center">
                  <img src={tenant.selfieUrl || '/placeholder.png'} className="w-12 h-12 rounded-full border border-slate-200" alt="Tenant Logo" />
                  <div className="flex-1">
                    <p className="font-bold text-sm">{tenant.name}</p>
                    <p className="text-xs text-slate-500">{tenant.contact}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-bold">Max Tenants: <input type="number" defaultValue={tenant.maxTenants || 0} className="border rounded p-1 w-16" onBlur={(e) => onUpdateMemberQuota(tenant.id, parseInt(e.target.value) || 0, tenant.maxUsers || 0)} /></label>
                     <label className="text-[10px] font-bold">Max Users: <input type="number" defaultValue={tenant.maxUsers || 0} className="border rounded p-1 w-16" onBlur={(e) => onUpdateMemberQuota(tenant.id, tenant.maxTenants || 0, parseInt(e.target.value) || 0)} /></label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
