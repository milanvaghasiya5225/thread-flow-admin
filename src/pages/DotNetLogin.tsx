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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const passwordLoginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters'),
  password: z.string()
    .min(1, 'Password is required')
    .max(100, 'Password must not exceed 100 characters'),
});

const otpLoginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (use international format like +1234567890)')
    .optional()
    .or(z.literal('')),
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone is required",
  path: ["email"],
});

type PasswordLoginData = z.infer<typeof passwordLoginSchema>;
type OtpLoginData = z.infer<typeof otpLoginSchema>;

const DotNetLogin = () => {
  const navigate = useNavigate();
  const { login, loginWithOtp } = useDotNetAuth();
  const { toast } = useToast();
  
  const [otpMedium, setOtpMedium] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);

  const passwordForm = useForm<PasswordLoginData>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const otpForm = useForm<OtpLoginData>({
    resolver: zodResolver(otpLoginSchema),
    defaultValues: {
      email: '',
      phone: '',
    },
  });

  const onPasswordLogin = async (data: PasswordLoginData) => {
    setLoading(true);

    try {
      await login(data.email, data.password);
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

  const onOtpLogin = async (data: OtpLoginData) => {
    setLoading(true);

    try {
      const loginData = otpMedium === 'email' 
        ? { medium: 'email' as const, email: data.email! }
        : { medium: 'phone' as const, phone: data.phone! };

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
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordLogin)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="name@example.com"
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Password</FormLabel>
                          <Link
                            to="/forgot-password"
                            className="text-sm text-primary hover:underline"
                          >
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="otp">
              <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(onOtpLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Login with</Label>
                    <Tabs value={otpMedium} onValueChange={(v) => setOtpMedium(v as 'email' | 'phone')}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="email">Email</TabsTrigger>
                        <TabsTrigger value="phone">Phone</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="email" className="mt-4">
                        <FormField
                          control={otpForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="name@example.com"
                                  disabled={loading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                      
                      <TabsContent value="phone" className="mt-4">
                        <FormField
                          control={otpForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="tel"
                                  placeholder="+1234567890"
                                  disabled={loading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
              </Form>
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
