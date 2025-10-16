import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { OtpPurpose } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

const OtpVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { setUserFromToken } = useAuth();
  
  const { contact, purpose, medium } = location.state || {};
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!contact || !purpose) {
      toast({
        title: 'Error',
        description: 'Invalid verification request',
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [contact, purpose, navigate, toast]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await apiClient.verifyOtp({
        purpose: purpose as OtpPurpose,
        contact,
        code: otp,
      });

      if (!result.isSuccess) {
        throw new Error(result.error?.description || 'OTP verification failed');
      }

      if (result.value && 'user' in result.value) {
        setUserFromToken(result.value.user);
        toast({
          title: 'Success',
          description: 'Login successful!',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Invalid OTP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setResending(true);
    try {
      const result = await apiClient.resendOtp({
        identifier: contact,
        purpose: purpose as OtpPurpose,
      });

      if (!result.isSuccess) {
        throw new Error(result.error?.description || 'Failed to resend OTP');
      }

      toast({
        title: 'Success',
        description: 'OTP sent successfully',
      });
      setCountdown(60); // 60 seconds cooldown
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to resend OTP',
        variant: 'destructive',
      });
    } finally {
      setResending(false);
    }
  };

  const getMaskedContact = () => {
    if (!contact) return '';
    
    if (medium === 'email' || contact.includes('@')) {
      const [name, domain] = contact.split('@');
      return `${name.substring(0, 2)}***@${domain}`;
    }
    
    return `***${contact.slice(-4)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verify OTP</CardTitle>
          <CardDescription className="text-center">
            Enter the verification code sent to{' '}
            <span className="font-semibold">{getMaskedContact()}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                disabled={loading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <p className="text-sm text-muted-foreground text-center">
                Enter the 6-digit verification code
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Didn't receive the code?
            </p>
            <Button
              variant="link"
              onClick={handleResend}
              disabled={resending || countdown > 0}
              className="text-primary"
            >
              {resending
                ? 'Sending...'
                : countdown > 0
                ? `Resend in ${countdown}s`
                : 'Resend Code'}
            </Button>
          </div>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="text-sm"
            >
              ← Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OtpVerification;
