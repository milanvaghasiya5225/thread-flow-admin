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
  
  const { email, phone, stage } = location.state || {};
  
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
      // Derive purpose from stage: 'verify' -> Registration, 'mfa' -> Login
      const purpose = stage === 'verify' ? OtpPurpose.Registration : OtpPurpose.Login;
      
      let verificationResult = null;
      
      // Verify email if required
      if (email?.required && emailOtp.length === 6) {
        const emailResult = await apiClient.verifyOtp({
          purpose,
          contact: email.contact,
          code: emailOtp,
        });

        if (!emailResult.isSuccess) {
          throw new Error(emailResult.error?.description || 'Email OTP verification failed');
        }
        verificationResult = emailResult;
      }

      // Verify phone if required
      if (phone?.required && phoneOtp.length === 6) {
        const phoneResult = await apiClient.verifyOtp({
          purpose,
          contact: phone.contact,
          code: phoneOtp,
        });

        if (!phoneResult.isSuccess) {
          throw new Error(phoneResult.error?.description || 'Phone OTP verification failed');
        }
        verificationResult = phoneResult;
      }

      // For MFA stage, user should be logged in after verification
      if (stage === 'mfa' && verificationResult?.value?.token) {
        // Store token and user data
        localStorage.setItem('token', verificationResult.value.token);
        setUserFromToken(verificationResult.value.user);
        
        toast({
          title: 'Success',
          description: 'Login successful!',
        });
        navigate('/dashboard');
      } else {
        // For verify stage, redirect to login
        toast({
          title: 'Success',
          description: 'Verification successful! Please login to continue.',
        });
        navigate('/login');
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

  const handleResend = async (contactType: 'email' | 'phone') => {
    if (countdown > 0) return;
    
    const contactInfo = contactType === 'email' ? email : phone;
    if (!contactInfo) return;
    
    // Derive purpose from stage
    const purpose = stage === 'verify' ? OtpPurpose.Registration : OtpPurpose.Login;
    
    setResending(true);
    try {
      const result = await apiClient.resendOtp({
        identifier: contactInfo.contact,
        purpose,
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
            {/* Email Verification - Only show if required */}
            {email?.required && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Email Verification</label>
                <p className="text-xs text-muted-foreground">
                  {getMaskedContact(email.contact, true)}
                </p>
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
              </div>
            )}

            {/* Phone Verification - Only show if required */}
            {phone?.required && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Phone Verification</label>
                <p className="text-xs text-muted-foreground">
                  {getMaskedContact(phone.contact, false)}
                </p>
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
