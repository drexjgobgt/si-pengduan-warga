import { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { authAPI } from '../../services/api';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';

export default function ForgotPasswordForm({ onBack, onSuccess }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await authAPI.forgotPassword({ email });
      setMessage(response.data.message || 'Link reset password telah dikirim ke email Anda');
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <div className="text-center mb-6">
        <img
          src="/logo.png"
          alt="SIPW Logo"
          className="h-16 w-auto mx-auto mb-3 object-contain"
        />
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Form Masuk
        </button>
        <h2 className="text-lg font-bold text-slate-900">Pemulihan Password</h2>
        <p className="text-xs text-slate-500 mt-1">
          Masukkan email terdaftar Anda untuk menerima tautan pemulihan kata sandi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          icon={Mail}
        />

        {message && (
          <div className={`p-3 rounded-lg ${
            message.includes('dikirim') 
              ? 'bg-green-50 text-green-800' 
              : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Mengirim...' : 'Kirim Link Reset Password'}
        </Button>
      </form>
    </div>
  );
}

