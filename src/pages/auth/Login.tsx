import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const passwordSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const passwordlessSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone number is required'),
  otp: z.string().optional(),
});

type PasswordForm = z.infer<typeof passwordSchema>;
type PasswordlessForm = z.infer<typeof passwordlessSchema>;

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: '', password: '' },
  });

  const passwordlessForm = useForm<PasswordlessForm>({
    resolver: zodResolver(passwordlessSchema),
    defaultValues: { emailOrPhone: '', otp: '' },
  });

  const onPasswordLogin = async (values: PasswordForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (values: PasswordlessForm) => {
    setLoading(true);
    try {
      const isEmail = values.emailOrPhone.includes('@');
      
      if (isEmail) {
        const { error } = await supabase.auth.signInWithOtp({
          email: values.emailOrPhone,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          phone: values.emailOrPhone,
        });
        if (error) throw error;
      }

      setOtpSent(true);
      toast.success('OTP sent successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (values: PasswordlessForm) => {
    if (!values.otp) return;
    
    setLoading(true);
    try {
      const isEmail = values.emailOrPhone.includes('@');
      
      if (isEmail) {
        const { error } = await supabase.auth.verifyOtp({
          email: values.emailOrPhone,
          token: values.otp,
          type: 'email',
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.verifyOtp({
          phone: values.emailOrPhone,
          token: values.otp,
          type: 'sms',
        });
        if (error) throw error;
      }

      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/5 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Choose your preferred login method</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="passwordless">Passwordless</TabsTrigger>
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
                          <Input type="email" placeholder="john@example.com" {...field} />
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
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="passwordless">
              <Form {...passwordlessForm}>
                <form onSubmit={passwordlessForm.handleSubmit(otpSent ? verifyOTP : sendOTP)} className="space-y-4">
                  <FormField
                    control={passwordlessForm.control}
                    name="emailOrPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email or Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="john@example.com or +1234567890" 
                            {...field}
                            disabled={otpSent}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {otpSent && (
                    <FormField
                      control={passwordlessForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Enter OTP</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter the code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Processing...' : otpSent ? 'Verify OTP' : 'Send OTP'}
                  </Button>

                  {otpSent && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setOtpSent(false)}
                    >
                      Change Email/Phone
                    </Button>
                  )}
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Don't have an account?{' '}
            <Button variant="link" className="p-0" onClick={() => navigate('/register')}>
              Register
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
