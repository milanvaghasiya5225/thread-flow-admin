import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { OtpPurpose } from '@/types/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SmartContactInput } from '@/components/auth/SmartContactInput';

const passwordLoginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters'),
  password: z.string()
    .min(1, 'Password is required')
    .max(100, 'Password must not exceed 100 characters'),
});

const otpLoginSchema = z.object({
  contact: z.string()
    .min(1, 'Email or phone number is required')
    .max(255, 'Input must not exceed 255 characters'),
});

type PasswordLoginData = z.infer<typeof passwordLoginSchema>;
type OtpLoginData = z.infer<typeof otpLoginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithOtp } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [contactValue, setContactValue] = useState('');
  const [isPhoneInput, setIsPhoneInput] = useState(false);

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
      contact: '',
    },
  });

  const onPasswordLogin = async (data: PasswordLoginData) => {
    setLoading(true);

    try {
      const result = await login(data.email, data.password);
      
      if (result.requiresOtp) {
        toast({
          title: '2FA Required',
          description: 'Verification code sent to your email',
        });
        
        navigate('/otp-verification', {
          state: {
            contact: result.email,
            purpose: OtpPurpose.Login,
            medium: 'email',
          },
        });
      }
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
      // Determine if it's email or phone based on the contact value
      const isEmail = contactValue.includes('@');
      const loginData = isEmail
        ? { medium: 'email' as const, email: contactValue }
        : { medium: 'phone' as const, phone: contactValue };

      const result = await loginWithOtp(loginData);
      
      if (result.success) {
        toast({
          title: 'OTP Sent',
          description: `Verification code sent to your ${isEmail ? 'email' : 'phone'}`,
        });
        
        navigate('/otp-verification', {
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

  const handleContactChange = (value: string, isPhone: boolean) => {
    setContactValue(value);
    setIsPhoneInput(isPhone);
    otpForm.setValue('contact', value);
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
                  <FormField
                    control={otpForm.control}
                    name="contact"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <SmartContactInput
                            value={field.value}
                            onChange={handleContactChange}
                            disabled={loading}
                            error={fieldState.error?.message}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || !contactValue}
                  >
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
