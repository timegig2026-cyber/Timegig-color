import React, { useState } from 'react';
import { VerificationSubmission, AdminSection, ProofOfPayment, ManagedMember, TenantSettings } from '../types';
import { Menu, LayoutDashboard, ShieldCheck, Building2, Users, Check, X, Eye, FileText, Server, DollarSign, Landmark, CheckCircle2, Clock, Settings, LogOut, Share2 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface AdminViewProps {
  submissions: VerificationSubmission[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  currentSection: AdminSection;
  setCurrentSection: (section: AdminSection) => void;
  popSubmissions: ProofOfPayment[];
  onApprovePOP: (id: string) => void;
  onRejectPOP: (id: string) => void;
  managedMembers?: ManagedMember[];
  tenantSettings: TenantSettings;
  onUpdateTenantSettings: (settings: TenantSettings) => void;
  onUpdateMemberQuota: (memberId: string, maxTenants: number, maxUsers: number) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  submissions,
  onApprove,
  onReject,
  currentSection,
  setCurrentSection,
  popSubmissions,
  onApprovePOP,
  onRejectPOP,
  managedMembers = [],
  tenantSettings,
  onUpdateTenantSettings,
  onUpdateMemberQuota,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<VerificationSubmission | null>(null);
  const [viewingPOP, setViewingPOP] = useState<ProofOfPayment | null>(null);
  const [viewingTenants, setViewingTenants] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('activeloce_registered');
    window.location.reload();
  };

  // Settings form state
  const [feeTenant, setFeeTenant] = useState(tenantSettings.feeTenant);
  const [feeUser, setFeeUser] = useState(tenantSettings.feeUser);
  const [maxTenants, setMaxTenants] = useState(tenantSettings.maxTenants);
  const [maxUsers, setMaxUsers] = useState(tenantSettings.maxUsers);

  const pendingVerificationCount = submissions.filter((s) => s.status === 'pending').length;
  const pendingTenantPOPCount = popSubmissions.filter((p) => p.type === 'tenant' && p.status === 'pending').length;
  const pendingUserPOPCount = popSubmissions.filter((p) => p.type === 'user' && p.status === 'pending').length;

  const menuItems = [
    { id: 'overview' as AdminSection, label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'verification' as AdminSection, label: 'Verification', icon: <ShieldCheck className="w-4 h-4" />, badge: pendingVerificationCount > 0 ? pendingVerificationCount : undefined },
    { id: 'tenant-pop' as AdminSection, label: 'Tenant PoP', icon: <Building2 className="w-4 h-4" />, badge: pendingTenantPOPCount > 0 ? pendingTenantPOPCount : undefined },
    { id: 'user-pop' as AdminSection, label: 'User PoP', icon: <Users className="w-4 h-4" />, badge: pendingUserPOPCount > 0 ? pendingUserPOPCount : undefined },
    { id: 'settings' as AdminSection, label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'referral' as AdminSection, label: 'Referral', icon: <Share2 className="w-4 h-4" /> },
  ];

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTenantSettings({
      feeTenant: Number(feeTenant),
      feeUser: Number(feeUser),
      maxTenants: Number(maxTenants),
      maxUsers: Number(maxUsers),
    });
  };

  // Active tenants and active users (either approved verification, approved 30-day POP, or managed active members whose POP was approved)
  const baseActiveTenants =
    popSubmissions.filter((p) => p.type === 'tenant' && p.status === 'approved').length ||
    submissions.filter((s) => s.status === 'approved' && s.plan === 'tenant').length;
  const activeTenants =
    baseActiveTenants +
    managedMembers.filter((m) => m.type === 'tenant' && m.status === 'active' && m.popStatus === 'approved').length;

  const baseActiveUsers =
    popSubmissions.filter((p) => p.type === 'user' && p.status === 'approved').length ||
    submissions.filter((s) => s.status === 'approved' && s.plan === 'user').length;
  const activeUsers =
    baseActiveUsers +
    managedMembers.filter((m) => m.type === 'user' && m.status === 'active' && m.popStatus === 'approved').length;

  const tenantProfit = activeTenants * 299.99;
  const userProfit = activeUsers * 29.99;

  const tenantPOPs = popSubmissions.filter((p) => p.type === 'tenant');
  const userPOPs = popSubmissions.filter((p) => p.type === 'user');

  return (
    <div className="w-full h-full bg-white relative flex flex-col overflow-hidden">
      {/* Top 3-Bar Menu Bar */}
      <div className="w-full border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between bg-white z-30">
        <div className="flex items-center gap-3">
          {/* 3-Bar Menu Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 rounded-lg text-black hover:bg-slate-100 transition-colors focus:outline-none flex items-center gap-1.5 border border-slate-200"
              aria-label="Admin Navigation Menu"
            >
              <Menu className="w-5 h-5 text-black" />
              <span className="text-xs font-bold text-black hidden sm:inline">Admin Menu</span>
            </button>

            {/* Dropdown containing: Overview, Verification, Tenant PoP, User PoP, Settings */}
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 text-xs">
                  <div className="px-3 pb-1.5 mb-1 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Admin Navigation
                  </div>
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCurrentSection(item.id);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors ${
                        currentSection === item.id ? 'text-black font-bold bg-slate-50' : 'text-slate-600'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {item.icon}
                        {item.label}
                      </span>
                      {item.badge !== undefined && (
                        <span className="bg-black text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-rose-50 text-rose-600 font-bold mt-1 border-t border-slate-100"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Current Section Title */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-black uppercase tracking-wider">
              {menuItems.find((m) => m.id === currentSection)?.label}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Section Quick Tabs on wider screens */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentSection(item.id)}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                currentSection === item.id
                  ? 'bg-white text-black font-bold shadow-xs'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="bg-black text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Admin Section View Area */}
      <div className="flex-1 w-full bg-white overflow-y-auto p-4 sm:p-6">
        {/* SECTION 1: OVERVIEW */}
        {currentSection === 'overview' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-black tracking-tight">
                System Overview
              </h2>
              <p className="text-xs text-slate-500">
                Key performance indicators, subscription revenues, and active network entities.
              </p>
            </div>

            {/* 4 Required Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* 1. Tenant subscription profit */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center justify-between text-emerald-600 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Tenant Subscription Profit</span>
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-emerald-900">
                  R {tenantProfit.toFixed(2).replace('.', ',')}
                </p>
                <span className="text-[10px] text-emerald-700 font-medium">R299,99 / tenant plan</span>
              </div>

              {/* 2. User subscription profit */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-center justify-between text-blue-600 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">User Subscription Profit</span>
                  <DollarSign className="w-4 h-4 text-blue-700" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-blue-900">
                  R {userProfit.toFixed(2).replace('.', ',')}
                </p>
                <span className="text-[10px] text-blue-700 font-medium">R29,99 / user plan</span>
              </div>

              {/* 3. Active tenants */}
              <div 
                className="bg-purple-50 border border-purple-200 rounded-2xl p-4 cursor-pointer hover:border-purple-400 transition-colors"
                onClick={() => setViewingTenants(true)}
              >
                <div className="flex items-center justify-between text-purple-600 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Active Tenants</span>
                  <Building2 className="w-4 h-4 text-purple-700" />
                </div>
                <p className="text-2xl font-bold text-purple-900">{activeTenants}</p>
                <span className="text-[10px] text-purple-700 font-medium">Click to view details</span>
              </div>

              {/* 4. Active subscription users */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center justify-between text-amber-600 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Active Subscription Users</span>
                  <Users className="w-4 h-4 text-amber-700" />
                </div>
                <p className="text-2xl font-bold text-amber-900">{activeUsers}</p>
                <span className="text-[10px] text-amber-700 font-medium">Approved individuals</span>
              </div>
            </div>

            {/* Quick action card to jump to verification if pending */}
            {pendingVerificationCount > 0 && (
              <div className="border-2 border-black rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50">
                <div>
                  <h3 className="text-sm font-bold text-black">
                    {pendingVerificationCount} Pending Verification {pendingVerificationCount === 1 ? 'Request' : 'Requests'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Applicant submitted profile picture and ID documents ready for approval.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentSection('verification')}
                  className="px-4 py-2 bg-black hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  Go to Verification Queue →
                </button>
              </div>
            )}
            
            {/* Admin Referral Link & Management */}
            {/* REMOVED: Referral section moved to its own tab */}
          </div>
        )}

        {/* SECTION 2: VERIFICATION */}
        {currentSection === 'verification' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-black tracking-tight">
                  Verification Portal
                </h2>
                <p className="text-xs text-slate-500">
                  Review submitted profile pictures and ID documents. Approving activates TenantPortal or UserPortal.
                </p>
              </div>
              <span className="text-xs font-bold text-black bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                {submissions.length} Total Submissions
              </span>
            </div>

            {submissions.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">No Verifications Received Yet</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Once a user submits their selfie face and ID documents in the Activation flow, they will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-black bg-slate-100 shrink-0">
                        <img
                          src={sub.selfieUrl}
                          alt="Profile Picture"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-black">
                            {sub.applicantName || 'Applicant # ' + sub.id.slice(-4)}
                          </h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            sub.plan === 'tenant' ? 'bg-purple-100 text-purple-900' : 'bg-blue-100 text-blue-900'
                          }`}>
                            {sub.plan === 'tenant' ? 'Become a Tenant' : 'User Subscription'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-0.5">
                          Submitted: {sub.submittedAt}
                        </p>

                        <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
                          <FileText className="w-3.5 h-3.5 text-black" />
                          <span className="font-medium truncate max-w-xs">{sub.idDocName}</span>
                          <span className="text-[10px] text-slate-400">({sub.idDocSize})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                          sub.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sub.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {sub.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingSubmission(sub)}
                          className="p-2 border border-slate-200 hover:border-black rounded-xl text-black hover:bg-slate-50 transition-colors"
                          title="View Profile Picture & ID Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onApprove(sub.id)}
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

                        <button
                          type="button"
                          onClick={() => onReject(sub.id)}
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: TENANT POP (Receives Tenant Proof of Payment Documents, Ref Ten29) */}
        {currentSection === 'tenant-pop' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-black tracking-tight flex items-center gap-2">
                  <span>Tenant PoP (Point of Presence)</span>
                  {pendingTenantPOPCount > 0 && (
                    <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full font-bold">
                      {pendingTenantPOPCount} Pending POP
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  Review received Tenant bank transfer Proof of Payment documents (Ref: Ten29). Approving grants 30 days active.
                </p>
              </div>
            </div>

            {/* Received Tenant Proof of Payment Documents */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                Received Tenant Proof of Payment Documents
              </h3>

              {tenantPOPs.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50">
                  <Landmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No Tenant POP Documents Received Yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    When tenants pay via Capitec (Ref: Ten29) and upload proof of payment, it appears here for approval.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tenantPOPs.map((pop) => (
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
                            <span className="font-bold text-sm text-black">Capitec Transfer</span>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-black px-2 py-0.5 rounded border border-slate-200">
                              Ref: {pop.ref}
                            </span>
                            <span className="text-xs font-bold text-black">{pop.amount}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Account: {pop.accountName} ({pop.accountNumber}) • {pop.submittedAt}
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

                          <button
                            type="button"
                            onClick={() => onApprovePOP(pop.id)}
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

                          <button
                            type="button"
                            onClick={() => onRejectPOP(pop.id)}
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 4: USER POP (Receives User Proof of Payment Documents, Ref User29) */}
        {currentSection === 'user-pop' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-black tracking-tight flex items-center gap-2">
                  <span>User PoP (Point of Presence)</span>
                  {pendingUserPOPCount > 0 && (
                    <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full font-bold">
                      {pendingUserPOPCount} Pending POP
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  Review received User bank transfer Proof of Payment documents (Ref: User29). Approving grants 30 days active.
                </p>
              </div>
            </div>

            {/* Received User Proof of Payment Documents */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                Received User Proof of Payment Documents
              </h3>

              {userPOPs.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50">
                  <Landmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No User POP Documents Received Yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    When individual users pay via Capitec (Ref: User29) and upload proof of payment, it appears here for approval.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userPOPs.map((pop) => (
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
                            <span className="font-bold text-sm text-black">Capitec Transfer</span>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-black px-2 py-0.5 rounded border border-slate-200">
                              Ref: {pop.ref}
                            </span>
                            <span className="text-xs font-bold text-black">{pop.amount}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Account: {pop.accountName} ({pop.accountNumber}) • {pop.submittedAt}
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

                          <button
                            type="button"
                            onClick={() => onApprovePOP(pop.id)}
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

                          <button
                            type="button"
                            onClick={() => onRejectPOP(pop.id)}
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 5: SETTINGS */}
        {currentSection === 'settings' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-black tracking-tight">System Settings</h2>
              <p className="text-xs text-slate-500">Manage global subscription fees and signup quotas.</p>
            </div>
            <form onSubmit={handleUpdateSettings} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">Tenant Fee (R)</label>
                  <input type="number" step="0.01" value={feeTenant} onChange={(e) => setFeeTenant(parseFloat(e.target.value))} className="w-full px-3 py-2 border rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">User Fee (R)</label>
                  <input type="number" step="0.01" value={feeUser} onChange={(e) => setFeeUser(parseFloat(e.target.value))} className="w-full px-3 py-2 border rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">Max Tenants</label>
                  <input type="number" value={maxTenants} onChange={(e) => setMaxTenants(parseInt(e.target.value))} className="w-full px-3 py-2 border rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-1">Max Users</label>
                  <input type="number" value={maxUsers} onChange={(e) => setMaxUsers(parseInt(e.target.value))} className="w-full px-3 py-2 border rounded-xl text-xs" />
                </div>
              </div>
              <button type="submit" className="w-full py-2 bg-black text-white text-xs font-bold rounded-xl">Save Settings</button>
            </form>
          </div>
        )}

        {/* SECTION 6: REFERRAL */}
        {currentSection === 'referral' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-lg font-bold text-black tracking-tight">Referral Management</h2>
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg">
              <h3 className="text-sm font-bold mb-2">Admin Referral Link</h3>
              <p className="text-xs text-slate-300 mb-4">Share this link to invite users/tenants directly. They will be added to your managed list.</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/register?referral=ADMIN29`} 
                  className="bg-slate-800 text-slate-300 text-xs p-2 rounded-lg w-full"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/register?referral=ADMIN29`)}
                  className="bg-white text-black text-xs font-bold px-3 py-2 rounded-lg"
                >
                  Copy
                </button>
              </div>
              
              <div className="mt-6">
                <h4 className="text-xs font-bold mb-3 uppercase tracking-wider text-slate-400">Referrals Joined via Admin Link</h4>
                <div className="space-y-2">
                  {(managedMembers || []).filter(m => m.referralCode === 'ADMIN29').map(m => (
                    <div key={m.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-lg text-xs">
                      <span>{m.name} ({m.type})</span>
                      <span className="text-slate-400">{m.joinedAt}</span>
                    </div>
                  ))}
                  {(managedMembers || []).filter(m => m.referralCode === 'ADMIN29').length === 0 && (
                    <p className="text-xs text-slate-500 italic">No referrals yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal to View Verification ID and Selfie */}
      {viewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-black">Applicant Verification Documents</h3>
                <p className="text-xs text-slate-500">Plan: {viewingSubmission.plan === 'tenant' ? 'Become a Tenant' : 'User Subscription'}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingSubmission(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Live Selfie Profile Picture
                </p>
                <div className="w-full h-44 rounded-2xl overflow-hidden border-2 border-black bg-slate-100 flex items-center justify-center">
                  <img
                    src={viewingSubmission.selfieUrl}
                    alt="Selfie"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Uploaded ID Document
                </p>
                <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex flex-col items-center justify-center text-center">
                  {viewingSubmission.idDocUrl.startsWith('data:image') || viewingSubmission.idDocUrl.startsWith('blob:') ? (
                    <img
                      src={viewingSubmission.idDocUrl}
                      alt="ID Document"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2">
                      <FileText className="w-10 h-10 text-black mb-1" />
                      <p className="text-xs font-bold text-black truncate max-w-[120px]">
                        {viewingSubmission.idDocName}
                      </p>
                      <p className="text-[10px] text-slate-400">{viewingSubmission.idDocSize}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onReject(viewingSubmission.id);
                  setViewingSubmission(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100"
              >
                Reject Application
              </button>
              <button
                type="button"
                onClick={() => {
                  onApprove(viewingSubmission.id);
                  setViewingSubmission(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-black hover:bg-slate-800 shadow-xs"
              >
                Approve & Activate {viewingSubmission.plan === 'tenant' ? 'TenantPortal' : 'UserPortal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal to View Proof of Payment Document */}
      {viewingPOP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-black">Proof of Payment Document</h3>
                <p className="text-xs text-slate-500">
                  {viewingPOP.type === 'tenant' ? 'Tenant Payment' : 'User Subscription'} • Ref: {viewingPOP.ref}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingPOP(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-1 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Bank Transfer:</span>
                <strong className="text-black font-semibold">Capitec (Matthews - 1334067366)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Reference:</span>
                <strong className="text-black font-mono">{viewingPOP.ref}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">File Name:</span>
                <span className="text-slate-700 truncate max-w-[200px]">{viewingPOP.docName} ({viewingPOP.docSize})</span>
              </div>
            </div>

            <div className="w-full h-56 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center mb-5">
              {viewingPOP.docUrl.startsWith('data:image') || viewingPOP.docUrl.startsWith('blob:') ? (
                <img
                  src={viewingPOP.docUrl}
                  alt="Proof of Payment"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <FileText className="w-12 h-12 text-black mb-2" />
                  <p className="text-xs font-bold text-black">{viewingPOP.docName}</p>
                  <p className="text-[10px] text-slate-400">{viewingPOP.docSize}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onRejectPOP(viewingPOP.id);
                  setViewingPOP(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100"
              >
                Reject POP
              </button>
              <button
                type="button"
                onClick={() => {
                  onApprovePOP(viewingPOP.id);
                  setViewingPOP(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-black hover:bg-slate-800 shadow-xs"
              >
                Approve (Grant 30 Days Active)
              </button>
            </div>
          </div>
        </div>
      )}
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
