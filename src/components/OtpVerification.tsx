import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { API_URL } from '../config';

interface OtpVerificationProps {
  email: string;
  password: string;
  name: string;
  onVerificationComplete: () => void;
  onBack: () => void;
}

const OtpVerification: React.FC<OtpVerificationProps> = ({
  email,
  password,
  name,
  onVerificationComplete,
  onBack
}) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, otp, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      toast.success('Email verified successfully!');
      onVerificationComplete();
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Verify Your Email</h2>
        <p className="text-muted-foreground mt-2">
          We've sent a 6-digit code to {email}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp">Enter OTP</Label>
          <Input
            id="otp"
            type="text"
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            pattern="[0-9]{6}"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onBack}
            disabled={isLoading}
          >
            Back
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OtpVerification; 