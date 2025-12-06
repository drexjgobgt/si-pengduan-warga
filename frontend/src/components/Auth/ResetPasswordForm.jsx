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
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-800"
            >
              Kembali
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
        )}
        <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
        <p className="text-gray-600 mt-2">
          Masukkan password baru Anda
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

