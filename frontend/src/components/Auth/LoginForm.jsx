import React, { useState } from "react";
import { Input } from "../Common/Input";
import { Button } from "../Common/Button";
import { Mail, Lock, LogIn } from "lucide-react";

export const LoginForm = ({ onSubmit, loading, onForgotPassword }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="space-y-4">
      <Input
        label="Email"
        type="email"
        icon={Mail}
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="email@example.com"
        required
      />

      <Input
        label="Password"
        type="password"
        icon={Lock}
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="••••••••"
        required
      />

      <Button
        onClick={handleSubmit}
        disabled={loading}
        variant="primary"
        icon={LogIn}
        className="w-full"
      >
        {loading ? "Memproses..." : "Masuk"}
      </Button>

      {onForgotPassword && (
        <button
          type="button"
          onClick={onForgotPassword}
          className="w-full text-sm text-blue-600 hover:text-blue-800 mt-2 text-center"
        >
          Lupa password?
        </button>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 font-medium mb-2">Demo Login:</p>
        <p className="text-xs text-blue-700">
          Admin: admin@pengaduan.local / admin123
        </p>
        <p className="text-xs text-blue-700">
          Petugas: petugas@pengaduan.local / admin123
        </p>
      </div>
    </div>
  );
};
