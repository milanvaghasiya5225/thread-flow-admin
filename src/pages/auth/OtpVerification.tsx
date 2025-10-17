import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { OtpPurpose } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';
import { Check } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

interface VerificationContact {
  required: boolean;
  contact: string;
  sent: boolean;
}

const OtpVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { setUserFromToken } = useAuth();
  
  const { email, phone, purpose } = location.state || {};
  
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!email && !phone) {
      toast({
        title: 'Error',
        description: 'Invalid verification request',
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [email, phone, navigate, toast]);

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
      // Verify email if required
      if (email?.required && emailOtp.length === 6) {
        const emailResult = await apiClient.verifyOtp({
          purpose: purpose as OtpPurpose,
          contact: email.contact,
          code: emailOtp,
        });

        if (!emailResult.isSuccess) {
          throw new Error(emailResult.error?.description || 'Email OTP verification failed');
        }
      }

      // Verify phone if required
      if (phone?.required && phoneOtp.length === 6) {
        const phoneResult = await apiClient.verifyOtp({
          purpose: purpose as OtpPurpose,
          contact: phone.contact,
          code: phoneOtp,
        });

        if (!phoneResult.isSuccess) {
          throw new Error(phoneResult.error?.description || 'Phone OTP verification failed');
        }
      }

      toast({
        title: 'Success',
        description: 'Verification successful! Please login to continue.',
      });
      navigate('/login');
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

  const handleResend = async (contactType: 'email' | 'phone') => {
    if (countdown > 0) return;
    
    const contactInfo = contactType === 'email' ? email : phone;
    if (!contactInfo) return;
    
    setResending(true);
    try {
      const result = await apiClient.resendOtp({
        identifier: contactInfo.contact,
        purpose: purpose as OtpPurpose,
      });

      if (!result.isSuccess) {
        throw new Error(result.error?.description || 'Failed to resend OTP');
      }

      toast({
        title: 'Success',
        description: `OTP sent to ${contactType}`,
      });
      setCountdown(60);
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

  const getMaskedContact = (contact: string, isEmail: boolean) => {
    if (!contact) return '';
    
    if (isEmail) {
      const [name, domain] = contact.split('@');
      return `${name.substring(0, 2)}***@${domain}`;
    }
    
    return `***${contact.slice(-4)}`;
  };

  const canSubmit = () => {
    if (email?.required && emailOtp.length !== 6) return false;
    if (phone?.required && phoneOtp.length !== 6) return false;
    return true;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verify Your Account</CardTitle>
          <CardDescription className="text-center">
            Complete verification to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            {/* Email Verification */}
            {email && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Email Verification</label>
                  {!email.required && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="h-4 w-4" />
                      <span className="text-xs">Verified</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getMaskedContact(email.contact, true)}
                </p>
                {email.required ? (
                  <>
                    <InputOTP
                      maxLength={6}
                      value={emailOtp}
                      onChange={setEmailOtp}
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
                    {email.sent && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => handleResend('email')}
                        disabled={resending || countdown > 0}
                        className="text-xs h-auto p-0"
                      >
                        {resending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="h-10 rounded-md border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 flex items-center justify-center">
                    <span className="text-sm text-green-700 dark:text-green-300">Email verified</span>
                  </div>
                )}
              </div>
            )}

            {/* Phone Verification */}
            {phone && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Phone Verification</label>
                  {!phone.required && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="h-4 w-4" />
                      <span className="text-xs">Verified</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getMaskedContact(phone.contact, false)}
                </p>
                {phone.required ? (
                  <>
                    <InputOTP
                      maxLength={6}
                      value={phoneOtp}
                      onChange={setPhoneOtp}
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
                    {phone.sent && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => handleResend('phone')}
                        disabled={resending || countdown > 0}
                        className="text-xs h-auto p-0"
                      >
                        {resending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="h-10 rounded-md border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 flex items-center justify-center">
                    <span className="text-sm text-green-700 dark:text-green-300">Phone verified</span>
                  </div>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || !canSubmit()}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </Button>
          </form>

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
