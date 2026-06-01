import { RegisterForm } from '../../features/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      {/* Gọi mảnh ghép Form ra đây */}
      <RegisterForm />
    </div>
  );
}
