import React, { useState } from 'react';
import { X, Users, Mail, AlertTriangle, Check, Copy } from 'lucide-react';
import { secondaryAuth } from '../lib/firebase';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

export function UserManagementModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [tempPass, setTempPass] = useState('');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, informe o email.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    setTempPass('');
    
    try {
      const loginEmail = email.includes('@') ? email : `${email}@cgna.decea.mil.br`;
      // Create user with a strong temporary password using secondary app so it doesn't log the admin out
      const tempPassword = Math.random().toString(36).slice(-10) + 'A!1';
      await createUserWithEmailAndPassword(secondaryAuth, loginEmail, tempPassword);
      
      // Send a password reset email immediately so the user can set their own password
      await sendPasswordResetEmail(secondaryAuth, loginEmail);
      
      setTempPass(tempPassword);
      setSuccess(`Usuário ${loginEmail} cadastrado com sucesso. Um email foi enviado, mas se o link expirar, forneça a senha temporária abaixo para o usuário.`);
      setEmail('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso por outro usuário.');
      } else {
        setError('Falha ao cadastrar: ' + err.message);
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
            <Users size={24} />
          </div>
          <h3 className="text-lg font-bold text-on-surface font-label-caps tracking-wide">
            CADASTRAR NOVO USUÁRIO
          </h3>
          <p className="text-xs text-on-surface-variant mt-2 text-center font-data-mono leading-relaxed px-4">
            Insira o login (ex: ALPHA-1) ou email. Se usar apenas o login, ele será tratado como @cgna.decea.mil.br.
          </p>
        </div>

        <form onSubmit={handleCreateUser} className="space-y-4">
          {error && (
            <div className="bg-error-container border border-error p-3 text-on-error-container font-data-mono text-xs flex items-start gap-2 rounded-xl">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-success-container/20 border border-success/50 p-4 text-success font-data-mono text-xs flex flex-col items-start gap-3 rounded-xl">
              <div className="flex items-start gap-2">
                <Check size={16} className="shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
              
              {tempPass && (
                <div className="w-full bg-surface-container p-3 rounded-lg border border-success/30">
                  <div className="text-[10px] font-label-caps text-on-surface-variant mb-1">SENHA TEMPORÁRIA (COPIE):</div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary tracking-wider">{tempPass}</span>
                    <button 
                      type="button"
                      onClick={() => navigator.clipboard.writeText(tempPass)}
                      className="p-1.5 hover:bg-surface-container-high rounded-md text-on-surface-variant hover:text-primary transition-colors"
                      title="Copiar senha"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold block">
              LOGIN OU EMAIL DO USUÁRIO
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-60" />
              <input 
                type="text" 
                value={email}
                onChange={(e) => { setEmail(e.target.value.toUpperCase()); setError(''); setSuccess(''); setTempPass(''); }}
                className="w-full bg-surface-container border border-outline-variant rounded-xl pl-9 pr-3 py-3 text-sm font-data-mono outline-none focus:border-primary transition-colors text-on-surface uppercase"
                placeholder="Ex: ALPHA-1"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 bg-primary text-on-primary hover:opacity-90 text-sm font-bold rounded-xl transition-all cursor-pointer font-label-caps shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'CADASTRANDO...' : 'ENVIAR CONVITE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
