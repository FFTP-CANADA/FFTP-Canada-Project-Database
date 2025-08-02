
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { Project } from "@/hooks/useProjectData";

interface AnalyticsDashboardProps {
  projects: Project[];
}

const AnalyticsDashboard = ({ projects }: AnalyticsDashboardProps) => {
  // Data for disbursements by country
  const disbursementsByCountry = projects.reduce((acc, project) => {
    const existing = acc.find(item => item.country === project.country);
    if (existing) {
      existing.amount += project.amountDisbursed;
    } else {
      acc.push({ 
        country: project.country, 
        amount: project.amountDisbursed 
      });
    }
    return acc;
  }, [] as { country: string; amount: number }[]);

  // Data for projects by impact area
  const projectsByImpactArea = projects.reduce((acc, project) => {
    const existing = acc.find(item => item.area === project.impactArea);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ 
        area: project.impactArea, 
        count: 1 
      });
    }
    return acc;
  }, [] as { area: string; count: number }[]);

  // Data for status distribution
  const statusDistribution = projects.reduce((acc, project) => {
    const existing = acc.find(item => item.status === project.status);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ 
        status: project.status, 
        count: 1 
      });
    }
    return acc;
  }, [] as { status: string; count: number }[]);

  // Data for fund type distribution
  const fundTypeDistribution = projects.reduce((acc, project) => {
    const existing = acc.find(item => item.type === project.fundType);
    if (existing) {
      existing.count += 1;
      existing.amount += project.amountDisbursed;
    } else {
      acc.push({ 
        type: project.fundType, 
        count: 1,
        amount: project.amountDisbursed
      });
    }
    return acc;
  }, [] as { type: string; count: number; amount: number }[]);

  // Colors for charts (blue theme)
  const blueColors = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];
  const statusColors = {
    'On-Track': '#10b981',
    'Delayed': '#ef4444',
    'Pending Start': '#f59e0b',
    'Completed': '#3b82f6',
    'Cancelled': '#6b7280',
    'Needs Attention': '#f97316'
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-blue-200 rounded-lg shadow-lg">
          <p className="text-blue-900 font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-blue-700">
              {entry.name}: {typeof entry.value === 'number' ? 
                (entry.name.includes('amount') || entry.name.includes('Amount') ? 
                  `$${entry.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
                  entry.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                ) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Row - Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-blue-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-blue-900">Disbursements by Country</CardTitle>
            <CardDescription className="text-blue-600">
              Total amount disbursed across all countries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={disbursementsByCountry}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                <XAxis 
                  dataKey="country" 
                  stroke="#1e40af"
                  tick={{ fill: '#1e40af' }}
                />
                <YAxis 
                  stroke="#1e40af"
                  tick={{ fill: '#1e40af' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="amount" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Amount Disbursed"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-blue-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-blue-900">Projects by Impact Area</CardTitle>
            <CardDescription className="text-blue-600">
              Number of projects in each impact category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectsByImpactArea}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                <XAxis 
                  dataKey="area" 
                  stroke="#1e40af"
                  tick={{ fill: '#1e40af', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#1e40af"
                  tick={{ fill: '#1e40af' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="#1e40af"
                  radius={[4, 4, 0, 0]}
                  name="Project Count"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row - Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-blue-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-blue-900">Project Status Distribution</CardTitle>
            <CardDescription className="text-blue-600">
              Current status of all projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="count"
                  nameKey="status"
                  label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={statusColors[entry.status as keyof typeof statusColors] || blueColors[index % blueColors.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-blue-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-blue-900">Fund Type Distribution</CardTitle>
            <CardDescription className="text-blue-600">
              Designated vs Undesignated fund allocation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fundTypeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="amount"
                  nameKey="type"
                  label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {fundTypeDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={blueColors[index % blueColors.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-blue-200 rounded-lg shadow-lg">
                          <p className="text-blue-900 font-semibold">{data.type}</p>
                          <p className="text-blue-700">Projects: {data.count}</p>
                          <p className="text-blue-700">Amount: ${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Summary Table */}
      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-900">Undesignated Fund Balances by Impact Area</CardTitle>
          <CardDescription className="text-blue-600">
            Available undesignated funds awaiting designation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-blue-200">
                  <th className="text-left py-3 px-4 text-blue-900 font-semibold">Impact Area</th>
                  <th className="text-right py-3 px-4 text-blue-900 font-semibold">Total Projects</th>
                  <th className="text-right py-3 px-4 text-blue-900 font-semibold">Undesignated Projects</th>
                  <th className="text-right py-3 px-4 text-blue-900 font-semibold">Available Balance</th>
                </tr>
              </thead>
              <tbody>
                {['Food Security', 'Education', 'Housing & Community', 'Health', 'Economic Empowerment', 'Greatest Needs'].map((area) => {
                  const areaProjects = projects.filter(p => p.impactArea === area);
                  const undesignatedProjects = areaProjects.filter(p => p.fundType === 'Undesignated');
                  const availableBalance = undesignatedProjects.reduce((sum, p) => sum + (p.totalCost - p.amountDisbursed), 0);
                  
                  return (
                    <tr key={area} className="border-b border-blue-100 hover:bg-blue-50">
                      <td className="py-3 px-4 text-blue-800">{area}</td>
                      <td className="py-3 px-4 text-right text-blue-800">{areaProjects.length}</td>
                      <td className="py-3 px-4 text-right text-blue-800">{undesignatedProjects.length}</td>
                      <td className="py-3 px-4 text-right text-blue-900 font-semibold">
                        ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
