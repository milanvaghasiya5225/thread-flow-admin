import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';

interface Stats {
  resolved: number;
  pending: number;
  inProgress: number;
  total: number;
}

interface MonthlyData {
  month: string;
  resolved: number;
  pending: number;
  inProgress: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({ resolved: 0, pending: 0, inProgress: 0, total: 0 });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch current stats
      const { data: contacts } = await supabase
        .from('contacts')
        .select('status, created_at')
        .is('deleted_at', null);

      if (contacts) {
        const resolved = contacts.filter(c => c.status === 'resolved' || c.status === 'closed').length;
        const pending = contacts.filter(c => c.status === 'new').length;
        const inProgress = contacts.filter(c => c.status === 'in_progress').length;

        setStats({
          resolved,
          pending,
          inProgress,
          total: contacts.length,
        });

        // Calculate monthly data for the last 6 months
        const now = new Date();
        const monthlyStats: Record<string, MonthlyData> = {};

        for (let i = 5; i >= 0; i--) {
          const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = month.toLocaleString('default', { month: 'short', year: '2-digit' });
          monthlyStats[monthKey] = {
            month: monthKey,
            resolved: 0,
            pending: 0,
            inProgress: 0,
          };
        }

        contacts.forEach(contact => {
          const contactDate = new Date(contact.created_at);
          const monthKey = contactDate.toLocaleString('default', { month: 'short', year: '2-digit' });
          
          if (monthlyStats[monthKey]) {
            if (contact.status === 'resolved' || contact.status === 'closed') {
              monthlyStats[monthKey].resolved++;
            } else if (contact.status === 'new') {
              monthlyStats[monthKey].pending++;
            } else if (contact.status === 'in_progress') {
              monthlyStats[monthKey].inProgress++;
            }
          }
        });

        setMonthlyData(Object.values(monthlyStats));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Resolved Queries',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: AlertCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Contacts',
      value: stats.total,
      icon: MessageSquare,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your contact overview.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Monthly Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Contact Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="resolved" fill="hsl(var(--chart-1))" name="Resolved" />
                  <Bar dataKey="inProgress" fill="hsl(var(--chart-2))" name="In Progress" />
                  <Bar dataKey="pending" fill="hsl(var(--chart-3))" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
