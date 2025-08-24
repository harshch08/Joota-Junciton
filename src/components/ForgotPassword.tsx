import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { API_URL } from '../config';

interface ForgotPasswordProps {
  onBack: () => void;
  onComplete: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, onComplete }) => {
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-forgot-password-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }

      toast.success('OTP verified successfully!');
      setStep('password');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
      toast.error(err.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      toast.success('Password reset successfully!');
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('email');
      setOtp('');
    } else if (step === 'password') {
      setStep('otp');
      setNewPassword('');
      setConfirmPassword('');
    }
    setError('');
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          {step === 'email' && 'Forgot Password'}
          {step === 'otp' && 'Verify OTP'}
          {step === 'password' && 'Reset Password'}
        </h2>
        <p className="text-muted-foreground mt-2">
          {step === 'email' && 'Enter your email to receive a reset code'}
          {step === 'otp' && `We've sent a 6-digit code to ${email}`}
          {step === 'password' && 'Enter your new password'}
        </p>
      </div>

      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="forgot-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onBack}
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-otp">Enter OTP</Label>
            <Input
              id="forgot-otp"
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              pattern="[0-9]{6}"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleBack}
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          
          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleBack}
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword; 