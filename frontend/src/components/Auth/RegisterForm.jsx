import React, { useState } from "react";
import { Input } from "../Common/Input";
import { Button } from "../Common/Button";
import { User, Mail, Phone, CreditCard, Lock, UserPlus } from "lucide-react";

export const RegisterForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    nik: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Password tidak sama";
    }

    if (formData.password.length < 6) {
      newErrors.password = "Password minimal 6 karakter";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const { confirmPassword, ...submitData } = formData;
      onSubmit(submitData);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="Nama Lengkap"
        icon={User}
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="John Doe"
        required
      />

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
        label="No. Telepon"
        icon={Phone}
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        placeholder="081234567890"
      />

      <Input
        label="NIK (Opsional)"
        icon={CreditCard}
        value={formData.nik}
        onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
        placeholder="16 digit NIK"
        maxLength="16"
      />

      <Input
        label="Password"
        type="password"
        icon={Lock}
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Minimal 6 karakter"
        required
        error={errors.password}
      />

      <Input
        label="Konfirmasi Password"
        type="password"
        icon={Lock}
        value={formData.confirmPassword}
        onChange={(e) =>
          setFormData({ ...formData, confirmPassword: e.target.value })
        }
        placeholder="Ketik ulang password"
        required
        error={errors.confirmPassword}
      />

      <Button
        onClick={handleSubmit}
        disabled={loading}
        variant="primary"
        icon={UserPlus}
        className="w-full"
      >
        {loading ? "Memproses..." : "Daftar"}
      </Button>
    </div>
  );
};
