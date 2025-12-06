import { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { authAPI } from '../../services/api';
import Button from '../Common/Button';
import Input from '../Common/Input';

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
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Login
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Lupa Password</h2>
        <p className="text-gray-600 mt-2">
          Masukkan email Anda dan kami akan mengirimkan link untuk reset password
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          icon={<Mail className="w-5 h-5" />}
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
          loading={loading}
          className="w-full"
        >
          Kirim Link Reset Password
        </Button>
      </form>
    </div>
  );
}

