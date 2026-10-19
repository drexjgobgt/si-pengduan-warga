import { useState, useEffect } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { authAPI } from '../../services/api';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';

export default function ResetPasswordForm({ token, onBack, onSuccess }) {
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token tidak ditemukan. Pastikan link reset password valid.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak sama');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.resetPassword({ token, password });
      setMessage(response.data.message || 'Password berhasil direset');
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md w-full mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="SIPW Logo"
            className="h-16 w-auto mx-auto mb-3 object-contain"
          />
          <p className="text-rose-600 text-xs font-semibold mb-4">{error}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Login
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
      <div className="text-center mb-6">
        <img
          src="/logo.png"
          alt="SIPW Logo"
          className="h-16 w-auto mx-auto mb-3 object-contain"
        />
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali
          </button>
        )}
        <h2 className="text-lg font-bold text-slate-900">Atur Ulang Password</h2>
        <p className="text-xs text-slate-500 mt-1">
          Masukkan kata sandi baru untuk mengamankan akun SIPW Anda
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="password"
          placeholder="Password Baru"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          icon={Lock}
        />

        <Input
          type="password"
          placeholder="Konfirmasi Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          icon={Lock}
        />

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-800">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 rounded-lg bg-green-50 text-green-800">
            {message}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Memproses...' : 'Reset Password'}
        </Button>
      </form>
    </div>
  );
}

