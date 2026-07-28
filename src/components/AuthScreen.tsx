import React, { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Preencha login e senha.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const loginEmail = email.includes('@') ? email : `${email}@cgna.decea.mil.br`;
    
    try {
      await signInWithEmailAndPassword(auth, loginEmail, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('Login ou senha inválidos.');
      } else {
        setError('Falha na autenticação: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Digite seu login/email para redefinir a senha.');
      return;
    }
    const loginEmail = email.includes('@') ? email : `${email}@cgna.decea.mil.br`;
    try {
      await sendPasswordResetEmail(auth, loginEmail);
      setResetSent(true);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError('Falha ao enviar email: ' + err.message);
    }
  };


  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(var(--color-outline-variant) 1px, transparent 1px), linear-gradient(90deg, var(--color-outline-variant) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-3xl shadow-xl shadow-surface-bright/5 relative z-10 overflow-hidden">
        <div className="border-b border-outline-variant p-8 flex flex-col items-center justify-center gap-4 bg-surface-container-lowest">
           <div className="w-16 h-16 rounded-xl flex items-center justify-center">
             <img src="/cgna.png?v=2" alt="CGNA Logo" className="w-full h-full object-contain" />
           </div>
           <div className="text-center">
             <h1 className="font-label-caps text-primary font-bold text-2xl tracking-tight uppercase">CAPACIDADE ATC</h1>
             <p className="font-data-mono text-on-surface-variant text-xs mt-2 italic leading-relaxed">Sistema de Coleta de Dados de Pista.</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-error-container border border-error p-3 text-on-error-container font-data-mono text-xs flex items-center gap-2">
              <Lock size={14} className="shrink-0" /> {error}
            </div>
          )}
          
          {resetSent && (
            <div className="bg-success-container/20 border border-success/50 p-3 text-success font-data-mono text-xs flex items-center gap-2">
              <Mail size={14} className="shrink-0" /> Email de redefinição enviado.
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest font-semibold block">LOGIN / EMAIL</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => { setEmail(e.target.value.toUpperCase()); setError(''); setResetSent(false); }}
              className="w-full bg-surface-container/50 font-data-mono text-primary p-4 rounded-xl outline-none border border-outline-variant focus:border-primary/50 transition-colors uppercase"
              placeholder="e.g. ALPHA-1"
              autoComplete="username"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest font-semibold block flex justify-between">
              <span>SENHA</span>
              <button type="button" onClick={handleResetPassword} className="text-primary hover:underline normal-case">Esqueci a senha</button>
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full bg-surface-container/50 font-data-mono text-primary p-4 rounded-xl outline-none border border-outline-variant focus:border-primary/50 transition-colors tracking-widest"
              placeholder="••••••••"
            />
          </div>

          <div className="mt-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary font-label-caps font-semibold p-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'AGUARDE...' : 'INICIAR SESSÃO'}
            </button>
          </div>
        </form>
        
        <div className="border-t border-outline-variant p-6 text-center font-data-mono text-xs text-on-surface-variant bg-surface-container-lowest">
          Secure multi-factor authentication enabled
        </div>
      </div>
    </div>
  );
}

