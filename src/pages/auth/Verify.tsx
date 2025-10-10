import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle2, Mail, Phone } from 'lucide-react';

const Verify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, phone } = location.state || {};
  
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const verifyEmail = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: emailOtp,
        type: 'email',
      });

      if (error) throw error;

      setEmailVerified(true);
      toast.success('Email verified successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Email verification failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyPhone = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: phoneOtp,
        type: 'sms',
      });

      if (error) throw error;

      setPhoneVerified(true);
      toast.success('Phone verified successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Phone verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (emailVerified && phoneVerified) {
      navigate('/login');
    } else {
      toast.error('Please verify both email and phone to continue');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/5 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Verify Your Account</CardTitle>
          <CardDescription>
            Please verify your email and phone number to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Verification */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {emailVerified ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Mail className="h-5 w-5 text-muted-foreground" />
              )}
              <h3 className="font-semibold">Email Verification</h3>
            </div>
            {!emailVerified && (
              <>
                <p className="text-sm text-muted-foreground">
                  Check your email for the verification code
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter OTP"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                  />
                  <Button onClick={verifyEmail} disabled={loading || !emailOtp}>
                    Verify
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Phone Verification */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {phoneVerified ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Phone className="h-5 w-5 text-muted-foreground" />
              )}
              <h3 className="font-semibold">Phone Verification</h3>
            </div>
            {!phoneVerified && (
              <>
                <p className="text-sm text-muted-foreground">
                  Check your phone for the verification code
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter OTP"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                  />
                  <Button onClick={verifyPhone} disabled={loading || !phoneOtp}>
                    Verify
                  </Button>
                </div>
              </>
            )}
          </div>

          <Button
            onClick={handleContinue}
            className="w-full"
            disabled={!emailVerified || !phoneVerified}
          >
            Continue to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Verify;
