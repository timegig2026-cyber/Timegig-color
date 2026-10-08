import React, { useState, useEffect } from 'react';
import { NavTab, AdminSection, VerificationSubmission, ProofOfPayment, ManagedMember, TenantSettings } from './types';
import { BottomNav } from './components/BottomNav';
import { ActivationOptions } from './components/ActivationOptions';
import { VerificationFlow } from './components/VerificationFlow';
import { TenantPortal } from './components/TenantPortal';
import { UserPortal } from './components/UserPortal';
import { AdminView } from './components/AdminView';

const STORAGE_KEY = 'activeloce_verifications_db';
const ACTIVE_SUB_KEY = 'activeloce_active_sub_id';
const POP_STORAGE_KEY = 'activeloce_pop_submissions_db';
const MANAGED_MEMBERS_KEY = 'activeloce_tenant_managed_members';
const REFERRAL_POPS_KEY = 'activeloce_referral_pops_db';
const REFERRAL_VERIFICATIONS_KEY = 'activeloce_referral_verifications_db';
const TENANT_SETTINGS_KEY = 'activeloce_tenant_settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('activation');
  const [adminSection, setAdminSection] = useState<AdminSection>('overview');

  const [tenantSettings, setTenantSettings] = useState<TenantSettings>(() => {
    try {
      const stored = localStorage.getItem(TENANT_SETTINGS_KEY);
      return stored ? JSON.parse(stored) : { feeTenant: 299.99, feeUser: 29.99, maxTenants: 10, maxUsers: 100 };
    } catch {
      return { feeTenant: 299.99, feeUser: 29.99, maxTenants: 10, maxUsers: 100 };
    }
  });

  // Sync tenant settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TENANT_SETTINGS_KEY, JSON.stringify(tenantSettings));
    } catch {}
  }, [tenantSettings]);

  // Handle updating tenant settings (Fees & Quotas)
  const handleUpdateTenantSettings = (newSettings: TenantSettings) => {
    setTenantSettings(newSettings);
  };

  // Currently chosen activation plan
  const [verifyingOption, setVerifyingOption] = useState<'tenant' | 'user' | null>(null);

  // Submissions list received by Admin in Verification feature
  const [submissions, setSubmissions] = useState<VerificationSubmission[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Proof of Payment submissions list received by Admin in Tenant PoP / User PoP
  const [popSubmissions, setPopSubmissions] = useState<ProofOfPayment[]>(() => {
    try {
      const stored = localStorage.getItem(POP_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // ID of the submission currently tied to the active user's session
  const [currentSessionSubId, setCurrentSessionSubId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_SUB_KEY) || null;
    } catch {
      return null;
    }
  });

  // Members who signed up through the tenant's social media referral link
  const [managedMembers, setManagedMembers] = useState<ManagedMember[]>(() => {
    try {
      const stored = localStorage.getItem(MANAGED_MEMBERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Proof of Payment submissions received by Tenant from their referrals
  const [referralPOPs, setReferralPOPs] = useState<ProofOfPayment[]>(() => {
    try {
      const stored = localStorage.getItem(REFERRAL_POPS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Verification submissions received by Tenant from their referrals
  const [referralVerifications, setReferralVerifications] = useState<VerificationSubmission[]>(() => {
    try {
      const stored = localStorage.getItem(REFERRAL_VERIFICATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
    } catch {}
  }, [submissions]);

  useEffect(() => {
    try {
      localStorage.setItem(POP_STORAGE_KEY, JSON.stringify(popSubmissions));
    } catch {}
  }, [popSubmissions]);

  useEffect(() => {
    try {
      if (currentSessionSubId) {
        localStorage.setItem(ACTIVE_SUB_KEY, currentSessionSubId);
      } else {
        localStorage.removeItem(ACTIVE_SUB_KEY);
      }
    } catch {}
  }, [currentSessionSubId]);

  useEffect(() => {
    try {
      localStorage.setItem(MANAGED_MEMBERS_KEY, JSON.stringify(managedMembers));
    } catch {}
  }, [managedMembers]);

  useEffect(() => {
    try {
      localStorage.setItem(REFERRAL_POPS_KEY, JSON.stringify(referralPOPs));
    } catch {}
  }, [referralPOPs]);

  useEffect(() => {
    try {
      localStorage.setItem(REFERRAL_VERIFICATIONS_KEY, JSON.stringify(referralVerifications));
    } catch {}
  }, [referralVerifications]);

  // Find active submission for the current user's session
  const activeSubmission = currentSessionSubId
    ? submissions.find((s) => s.id === currentSessionSubId) || null
    : null;

  // Find active POP for tenant and user
  const tenantPOP = popSubmissions.find((p) => p.type === 'tenant') || null;
  const userPOP = popSubmissions.find((p) => p.type === 'user') || null;

  // If identity approved, activation feature changes to TenantPortal or UserPortal
  const isApproved = activeSubmission?.status === 'approved';
  const approvedPlan = isApproved ? activeSubmission?.plan : null;

  // Admin Verification handlers
  const handleApprove = (id: string) => {
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, status: 'approved' } : sub))
    );
  };

  const handleReject = (id: string) => {
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, status: 'rejected' } : sub))
    );
  };

  const handleSubmitVerification = (data: {
    plan: 'tenant' | 'user';
    selfieUrl: string;
    idDocName: string;
    idDocSize: string;
    idDocUrl: string;
  }) => {
    const newSub: VerificationSubmission = {
      id: `sub-${Date.now()}`,
      applicantName: data.plan === 'tenant' ? 'Tenant Applicant' : 'User Subscriber',
      plan: data.plan,
      selfieUrl: data.selfieUrl,
      idDocName: data.idDocName,
      idDocSize: data.idDocSize,
      idDocUrl: data.idDocUrl,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'pending',
    };

    setSubmissions((prev) => [newSub, ...prev]);
    setCurrentSessionSubId(newSub.id);
  };

  // Handle uploading Proof of Payment to Admin (Ten29 for Tenant, User29 for User)
  const handleUploadPOP = (data: {
    type: 'tenant' | 'user';
    ref: 'Ten29' | 'User29';
    docName: string;
    docSize: string;
    docUrl: string;
  }) => {
    const newPOP: ProofOfPayment = {
      id: `pop-${Date.now()}`,
      type: data.type,
      ref: data.ref,
      bankName: 'Capitec',
      accountName: 'Matthews',
      accountNumber: '1334067366',
      amount: data.type === 'tenant' ? 'R299,99' : 'R29,99',
      docName: data.docName,
      docSize: data.docSize,
      docUrl: data.docUrl,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'pending',
    };

    setPopSubmissions((prev) => [newPOP, ...prev.filter((p) => p.type !== data.type)]);
  };

  // Admin approves master POP -> Grants 30 Days Active!
  const handleApprovePOP = (id: string) => {
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 30);
    const expiresFormatted = expDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    setPopSubmissions((prev) =>
      prev.map((pop) =>
        pop.id === id
          ? {
              ...pop,
              status: 'approved',
              approvedAt: new Date().toLocaleDateString(),
              expiresAt: expiresFormatted,
              expiresTimestamp: expDate.getTime(),
            }
          : pop
      )
    );
  };

  const handleRejectPOP = (id: string) => {
    setPopSubmissions((prev) =>
      prev.map((pop) => (pop.id === id ? { ...pop, status: 'rejected' } : pop))
    );
  };

  // ========================================================
  // REFERRAL REGISTRATION & PAYMENT FLOW (PAID TO TENANT)
  // "Every referral that registered through tenant link must pay
  // subscription fee to Tenant the same way as in admin feature."
  // ========================================================
  const handleAddReferral = (data: {
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
  }): boolean => {
    const currentTenants = managedMembers.filter((m) => m.type === 'tenant').length;
    const currentUsers = managedMembers.filter((m) => m.type === 'user').length;

    if (data.type === 'tenant' && currentTenants >= tenantSettings.maxTenants) {
      return false;
    }
    if (data.type === 'user' && currentUsers >= tenantSettings.maxUsers) {
      return false;
    }

    const memberId = `mem-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const popId = `ref-pop-${Date.now()}`;

    // 1. Create referral verification for Tenant to review in TenantPortal Verification
    if (data.selfieUrl || data.idDocUrl) {
      const newVerification: VerificationSubmission = {
        id: `ref-ver-${Date.now()}`,
        applicantName: data.name,
        applicantContact: data.contact,
        plan: data.type,
        selfieUrl: data.selfieUrl || '',
        idDocName: data.idDocName || 'ID_Document.pdf',
        idDocSize: data.idDocSize || '1.2 MB',
        idDocUrl: data.idDocUrl || '',
        submittedAt: nowTime,
        status: 'pending',
        referralId: memberId,
      };
      setReferralVerifications((prev) => [newVerification, ...prev]);
    }

    // 2. Create referral Proof of Payment for Tenant to review in Tenant PoP / User PoP
    const newPOP: ProofOfPayment = {
      id: popId,
      type: data.type,
      ref: data.type === 'tenant' ? 'Ten29' : 'User29',
      bankName: 'Capitec',
      accountName: 'Matthews',
      accountNumber: '1334067366',
      amount: data.type === 'tenant' ? `R${tenantSettings.feeTenant.toFixed(2).replace('.', ',')}` : `R${tenantSettings.feeUser.toFixed(2).replace('.', ',')}`,
      docName: data.popDocName,
      docSize: data.popDocSize,
      docUrl: data.popDocUrl,
      submittedAt: nowTime,
      status: 'pending',
      referralId: memberId,
      applicantName: data.name,
      applicantContact: data.contact,
    };
    setReferralPOPs((prev) => [newPOP, ...prev]);

    // 3. Create Managed Member record (starts pending payment approval)
    const newMember: ManagedMember = {
      id: memberId,
      name: data.name,
      contact: data.contact,
      type: data.type,
      joinedAt: new Date().toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      status: 'active',
      monthlyFee: data.type === 'tenant' ? `R${tenantSettings.feeTenant.toFixed(2).replace('.', ',')}` : `R${tenantSettings.feeUser.toFixed(2).replace('.', ',')}`,
      referralCode: 'TENANT29',
      selfieUrl: data.selfieUrl,
      idDocName: data.idDocName,
      idDocSize: data.idDocSize,
      idDocUrl: data.idDocUrl,
      verificationStatus: data.selfieUrl || data.idDocUrl ? 'pending' : 'approved',
      popId,
      popStatus: 'pending',
      popDocName: data.popDocName,
      popDocSize: data.popDocSize,
      popDocUrl: data.popDocUrl,
      popSubmittedAt: nowTime,
    };

    setManagedMembers((prev) => [newMember, ...prev]);
    return true;
  };

  // Tenant approves referral Proof of Payment -> Grants 30 Days Active!
  const handleApproveReferralPOP = (popId: string) => {
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 30);
    const expiresFormatted = expDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const expTimestamp = expDate.getTime();
    const approvedAtStr = new Date().toLocaleDateString();

    setReferralPOPs((prev) =>
      prev.map((pop) =>
        pop.id === popId
          ? {
              ...pop,
              status: 'approved',
              approvedAt: approvedAtStr,
              expiresAt: expiresFormatted,
              expiresTimestamp: expTimestamp,
            }
          : pop
      )
    );

    // Update corresponding managed member to active 30 days
    setManagedMembers((prev) =>
      prev.map((m) =>
        m.popId === popId || m.id === referralPOPs.find((p) => p.id === popId)?.referralId
          ? {
              ...m,
              status: 'active',
              popStatus: 'approved',
              popApprovedAt: approvedAtStr,
              popExpiresAt: expiresFormatted,
              popExpiresTimestamp: expTimestamp,
            }
          : m
      )
    );
  };

  // Tenant rejects referral Proof of Payment
  const handleRejectReferralPOP = (popId: string) => {
    setReferralPOPs((prev) =>
      prev.map((pop) => (pop.id === popId ? { ...pop, status: 'rejected' } : pop))
    );

    setManagedMembers((prev) =>
      prev.map((m) =>
        m.popId === popId || m.id === referralPOPs.find((p) => p.id === popId)?.referralId
          ? { ...m, popStatus: 'rejected' }
          : m
      )
    );
  };

  // Tenant approves referral Verification (profile pic / ID)
  const handleApproveReferralVerification = (id: string) => {
    setReferralVerifications((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: 'approved' } : v))
    );
    setManagedMembers((prev) =>
      prev.map((m) =>
        m.id === referralVerifications.find((v) => v.id === id)?.referralId
          ? { ...m, verificationStatus: 'approved' }
          : m
      )
    );
  };

  // Tenant rejects referral Verification
  const handleRejectReferralVerification = (id: string) => {
    setReferralVerifications((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: 'rejected' } : v))
    );
    setManagedMembers((prev) =>
      prev.map((m) =>
        m.id === referralVerifications.find((v) => v.id === id)?.referralId
          ? { ...m, verificationStatus: 'rejected' }
          : m
      )
    );
  };

  const handleToggleMemberStatus = (id: string) => {
    setManagedMembers((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: m.status === 'active' ? 'suspended' : 'active' } : m
      )
    );
  };

  const handleRemoveManagedMember = (id: string) => {
    setManagedMembers((prev) => prev.filter((m) => m.id !== id));
    setReferralPOPs((prev) => prev.filter((p) => p.referralId !== id));
    setReferralVerifications((prev) => prev.filter((v) => v.referralId !== id));
  };

  const handleUpdateMemberQuota = (id: string, maxTenants: number, maxUsers: number) => {
    setManagedMembers((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, maxTenants, maxUsers } : m
      )
    );
  };

  const handleResetActivation = () => {
    setVerifyingOption(null);
    setCurrentSessionSubId(null);
  };

  // Determine label for the Activation tab
  let activationLabel = 'Activation';
  if (isApproved) {
    activationLabel = approvedPlan === 'tenant' ? 'TenantPortal' : 'UserPortal';
  }

  return (
    <div className="h-screen w-full bg-white relative overflow-hidden flex flex-col">
      {/* Main View Area */}
      <main className="flex-1 w-full h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden bg-white">
        {activeTab === 'activation' && (
          isApproved ? (
            /* IF APPROVED: Activation feature changes to TenantPortal or UserPortal */
            approvedPlan === 'tenant' ? (
              <TenantPortal
                userProfilePic={activeSubmission?.selfieUrl}
                onUploadPOP={handleUploadPOP}
                tenantPOP={tenantPOP}
                onNavigateToAdmin={() => {
                  setActiveTab('admin');
                  setAdminSection('tenant-pop');
                }}
                managedMembers={managedMembers}
                onAddReferral={handleAddReferral}
                onToggleMemberStatus={handleToggleMemberStatus}
                onRemoveManagedMember={handleRemoveManagedMember}
                referralPOPs={referralPOPs}
                onApproveReferralPOP={handleApproveReferralPOP}
                onRejectReferralPOP={handleRejectReferralPOP}
                referralVerifications={referralVerifications}
                onApproveReferralVerification={handleApproveReferralVerification}
                onRejectReferralVerification={handleRejectReferralVerification}
                tenantSettings={tenantSettings}
                onUpdateTenantSettings={handleUpdateTenantSettings}
                onUpdateMemberQuota={handleUpdateMemberQuota}
              />
            ) : (
              <UserPortal
                onReset={handleResetActivation}
                onUploadPOP={handleUploadPOP}
                userPOP={userPOP}
                onNavigateToAdmin={() => {
                  setActiveTab('admin');
                  setAdminSection('user-pop');
                }}
              />
            )
          ) : verifyingOption ? (
            /* IF VERIFYING: Selfie capture & ID upload or pending 15-25 min review */
            <VerificationFlow
              chosenOption={verifyingOption}
              onBack={() => {
                setVerifyingOption(null);
                setCurrentSessionSubId(null);
              }}
              onSubmitVerification={handleSubmitVerification}
              status={activeSubmission?.status || null}
              onNavigateToAdmin={() => {
                setActiveTab('admin');
                setAdminSection('verification');
              }}
            />
          ) : (
            /* INITIAL: 2 Purchase Options (Become a Tenant & User Subscription) */
            <ActivationOptions
              onProceed={(option) => {
                setVerifyingOption(option);
              }}
            />
          )
        )}

        {activeTab === 'admin' && (
          /* ADMIN VIEW: Overview, Verification, Tenant PoP, User PoP */
          <AdminView
            submissions={submissions}
            onApprove={handleApprove}
            onReject={handleReject}
            currentSection={adminSection}
            setCurrentSection={setAdminSection}
            popSubmissions={popSubmissions}
            onApprovePOP={handleApprovePOP}
            onRejectPOP={handleRejectPOP}
            managedMembers={managedMembers}
            tenantSettings={tenantSettings}
            onUpdateTenantSettings={handleUpdateTenantSettings}
            onUpdateMemberQuota={handleUpdateMemberQuota}
          />
        )}
      </main>

      {/* Docked bottom menu bar with black icons and no click lines */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activationLabel={activationLabel}
        approvedPlan={approvedPlan}
      />
    </div>
  );
}
