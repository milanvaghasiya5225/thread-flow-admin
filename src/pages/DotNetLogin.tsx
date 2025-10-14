import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDotNetAuth } from '@/contexts/DotNetAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { OtpPurpose } from '@/types/api';

const DotNetLogin = () => {
  const navigate = useNavigate();
  const { login, loginWithOtp } = useDotNetAuth();
  const { toast } = useToast();
  
  // Password login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP login
  const [otpMedium, setOtpMedium] = useState<'email' | 'phone'>('email');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPhone, setOtpPhone] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Login failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loginData = otpMedium === 'email' 
        ? { medium: 'email', email: otpEmail }
        : { medium: 'phone', phone: otpPhone };

      const result = await loginWithOtp(loginData);
      
      if (result.success) {
        toast({
          title: 'OTP Sent',
          description: `Verification code sent to your ${otpMedium}`,
        });
        
        navigate('/otp-verify', {
          state: {
            contact: result.contact,
            purpose: OtpPurpose.Login,
            medium: result.medium,
          },
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="otp">OTP Login</TabsTrigger>
            </TabsList>
            
            <TabsContent value="password">
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="otp">
              <form onSubmit={handleOtpLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Login with</Label>
                  <Tabs value={otpMedium} onValueChange={(v) => setOtpMedium(v as 'email' | 'phone')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="email">Email</TabsTrigger>
                      <TabsTrigger value="phone">Phone</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="email" className="mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="otpEmail">Email Address</Label>
                        <Input
                          id="otpEmail"
                          type="email"
                          placeholder="name@example.com"
                          value={otpEmail}
                          onChange={(e) => setOtpEmail(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="phone" className="mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="otpPhone">Phone Number</Label>
                        <Input
                          id="otpPhone"
                          type="tel"
                          placeholder="+1234567890"
                          value={otpPhone}
                          onChange={(e) => setOtpPhone(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  We'll send a verification code to your {otpMedium}
                </p>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link to="/dotnet-register" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DotNetLogin;
