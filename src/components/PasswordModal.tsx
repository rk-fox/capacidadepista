import React, { useState } from 'react';
import { X, Lock, AlertTriangle, Check } from 'lucide-react';
import { auth } from '../lib/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export function PasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    
    if (!user || !user.email) {
      setError('Nenhum usuário logado.');
      return;
    }
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Preencha todos os campos.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('A nova senha e a confirmação não coincidem.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      setSuccess('Senha alterada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
         onClose();
      }, 2000);
      
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('A senha atual está incorreta.');
      } else if (err.code === 'auth/weak-password') {
        setError('A nova senha é muito fraca.');
      } else {
        setError('Falha ao alterar senha: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface-bright rounded-2xl border border-outline-variant shadow-2xl p-6 relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-on-surface-variant hover:text-primary p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-primary/10 text-primary rounded-full mb-3">
            <Lock size={24} />
          </div>
          <h3 className="text-lg font-bold text-on-surface font-label-caps tracking-wide">
            ALTERAR SENHA
          </h3>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {error && (
            <div className="bg-error-container border border-error p-3 text-on-error-container font-data-mono text-xs flex items-start gap-2 rounded-xl">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-success-container/20 border border-success/50 p-3 text-success font-data-mono text-xs flex items-start gap-2 rounded-xl">
              <Check size={16} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold block">
              SENHA ATUAL
            </label>
            <input 
              type="password" 
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setError(''); setSuccess(''); }}
              className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-sm font-data-mono outline-none focus:border-primary transition-colors text-on-surface tracking-widest"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold block">
              NOVA SENHA
            </label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(''); setSuccess(''); }}
              className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-sm font-data-mono outline-none focus:border-primary transition-colors text-on-surface tracking-widest"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold block">
              CONFIRMAR NOVA SENHA
            </label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); setSuccess(''); }}
              className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-sm font-data-mono outline-none focus:border-primary transition-colors text-on-surface tracking-widest"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-on-primary hover:opacity-90 text-sm font-bold rounded-xl transition-all cursor-pointer font-label-caps shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'ALTERANDO...' : 'SALVAR NOVA SENHA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
