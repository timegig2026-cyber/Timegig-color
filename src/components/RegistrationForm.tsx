import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthFormProps {
  onAuthSuccess: (email: string) => void;
}

export const RegistrationForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !termsAccepted) {
      setError('You must accept the terms and conditions.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Initialize user document
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          createdAt: serverTimestamp(),
          status: 'active'
        });
      }
      onAuthSuccess(email);
    } catch (err: any) {
      setError(err.message || `Failed to ${isLogin ? 'sign in' : 'sign up'}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full space-y-4">
        <h2 className="text-xl font-bold text-black">{isLogin ? 'Sign In' : 'Create Account'}</h2>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded-xl text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded-xl text-sm" required />
        </div>
        {!isLogin && (
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="rounded" />
            <label className="text-xs text-slate-600">I accept the terms and conditions.</label>
          </div>
        )}
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-black text-white p-2 rounded-xl font-bold text-sm disabled:opacity-50">
          {loading ? (isLogin ? 'Signing in...' : 'Signing up...') : (isLogin ? 'Sign In' : 'Sign Up')}
        </button>
        <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-xs text-slate-500 hover:text-black">
          {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
        </button>
      </form>
    </div>
  );
};
