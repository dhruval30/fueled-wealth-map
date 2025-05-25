import {
    Activity,
    AlertCircle,
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    BarChart3,
    Building,
    Calendar,
    ChevronDown,
    DollarSign,
    Download,
    Eye,
    Globe,
    MapPin,
    PieChart,
    RefreshCw,
    Search,
    TrendingUp,
    Users,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart as RechartsPieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
  
  const Analytics = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [timeRange, setTimeRange] = useState('30d');
    const [refreshing, setRefreshing] = useState(false);
    
    // Data states
    const [overviewData, setOverviewData] = useState({});
    const [propertyValueData, setPropertyValueData] = useState([]);
    const [propertyTypesData, setPropertyTypesData] = useState([]);
    const [geographicData, setGeographicData] = useState({ states: [], cities: [] });
    const [activityTrendsData, setActivityTrendsData] = useState([]);
    const [wealthAnalyticsData, setWealthAnalyticsData] = useState({});
    const [searchPatternsData, setSearchPatternsData] = useState({});
  
    // Premium color schemes
    const PREMIUM_COLORS = ['#0F172A', '#1E293B', '#334155', '#475569', '#64748B', '#94A3B8'];
    const VALUE_COLORS = ['#DC2626', '#EA580C', '#D97706', '#059669', '#0284C7', '#7C3AED'];
    const GRADIENT_COLORS = ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE', '#EFF6FF'];
  
    // Fetch all analytics data
    const fetchAnalyticsData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('authToken');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
  
        const [
          overviewRes,
          valueDistRes,
          typesRes,
          geoRes,
          trendsRes,
          wealthRes,
          patternsRes
        ] = await Promise.all([
          fetch('/api/analytics/company-stats', { headers }),
          fetch('/api/analytics/property-value-distribution', { headers }),
          fetch('/api/analytics/property-types', { headers }),
          fetch('/api/analytics/geographic-distribution', { headers }),
          fetch('/api/analytics/activity-trends', { headers }),
          fetch('/api/analytics/wealth-analytics', { headers }),
          fetch('/api/analytics/search-patterns', { headers })
        ]);
  
        if (overviewRes.ok) {
          const data = await overviewRes.json();
          setOverviewData(data.data);
        }
  
        if (valueDistRes.ok) {
          const data = await valueDistRes.json();
          setPropertyValueData(data.data);
        }
  
        if (typesRes.ok) {
          const data = await typesRes.json();
          setPropertyTypesData(data.data);
        }
  
        if (geoRes.ok) {
          const data = await geoRes.json();
          setGeographicData(data.data);
        }
  
        if (trendsRes.ok) {
          const data = await trendsRes.json();
          setActivityTrendsData(data.data);
        }
  
        if (wealthRes.ok) {
          const data = await wealthRes.json();
          setWealthAnalyticsData(data.data);
        }
  
        if (patternsRes.ok) {
          const data = await patternsRes.json();
          setSearchPatternsData(data.data);
        }
  
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      fetchAnalyticsData();
    }, [timeRange]);
  
    const handleRefresh = async () => {
      setRefreshing(true);
      await fetchAnalyticsData();
      setRefreshing(false);
    };
  
    // Premium Metric Card Component
    const MetricCard = ({ icon: Icon, title, value, subtitle, trend, color = "slate", gradient = false }) => (
      <div className={`group bg-white rounded-2xl shadow-sm p-6 border border-slate-200/60 hover:shadow-xl hover:border-slate-300/60 transition-all duration-300 relative overflow-hidden ${gradient ? 'bg-gradient-to-br from-white to-slate-50' : ''}`}>
        {gradient && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
              color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' :
              color === 'emerald' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' :
              color === 'purple' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-100' :
              color === 'amber' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' :
              'bg-slate-50 text-slate-600 group-hover:bg-slate-100'
            }`}>
              <Icon className="h-6 w-6" />
            </div>
            {trend !== undefined && (
              <div className={`flex items-center text-sm font-semibold px-3 py-1.5 rounded-full ${
                trend > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
              }`}>
                {trend > 0 ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-2">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
            {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
          </div>
        </div>
      </div>
    );
  
    // Premium Chart Container Component
    const ChartContainer = ({ title, subtitle, children, action, height = 400, className = "" }) => (
      <div className={`bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-lg transition-all duration-300 ${className}`}>
        <div className="p-6 border-b border-slate-100/80">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
              {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
            </div>
            {action && (
              <div className="flex items-center space-x-3">
                {action}
              </div>
            )}
          </div>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={height}>
            {children}
          </ResponsiveContainer>
        </div>
      </div>
    );
  
    // Premium Custom Tooltip Component
    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white/95 backdrop-blur-md p-4 border border-slate-200 rounded-xl shadow-xl">
            <p className="text-slate-900 font-semibold mb-2">{label}</p>
            {payload.map((entry, index) => (
              <p key={index} className="text-sm flex items-center" style={{ color: entry.color }}>
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                {entry.name}: <span className="font-semibold ml-1">{entry.value}</span>
              </p>
            ))}
          </div>
        );
      }
      return null;
    };
  
    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto w-20 h-20 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-slate-600 border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Loading Analytics</h2>
            <p className="text-slate-600">Preparing your comprehensive insights...</p>
          </div>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full text-center">
            <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Analytics Error</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button 
              onClick={fetchAnalyticsData}
              className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-3 rounded-xl font-semibold hover:from-slate-800 hover:to-slate-700 transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
  
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        {/* Premium Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="group flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all duration-200 hover:scale-105"
                >
                  <ArrowLeft className="h-5 w-5 text-slate-600 group-hover:text-slate-800 transition-colors" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
                    <BarChart3 className="h-8 w-8 mr-3 text-slate-700" />
                    Analytics Dashboard
                  </h1>
                  <p className="text-slate-600 mt-1">Comprehensive insights into your property portfolio</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-slate-100 rounded-xl p-1">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="bg-transparent border-none text-sm font-medium text-slate-700 focus:outline-none px-3 py-2"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="1y">Last year</option>
                  </select>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </div>
                
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl transition-all flex items-center font-medium"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                
                <button className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-2.5 rounded-xl hover:from-slate-800 hover:to-slate-700 transition-all flex items-center font-semibold shadow-lg">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
            
            {/* Premium Tab Navigation */}
            <nav className="flex space-x-8 overflow-x-auto scrollbar-hide border-b border-slate-200">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'properties', label: 'Properties', icon: Building },
                { id: 'geography', label: 'Geography', icon: MapPin },
                { id: 'wealth', label: 'Wealth', icon: DollarSign },
                { id: 'activity', label: 'Activity', icon: Activity }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </header>
  
        {/* Premium Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Premium Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  icon={Building}
                  title="Total Properties"
                  value={overviewData.totalProperties || 0}
                  subtitle="in portfolio"
                  color="blue"
                  gradient={true}
                />
                <MetricCard
                  icon={DollarSign}
                  title="High Value Properties"
                  value={overviewData.highValueProperties || 0}
                  subtitle="over $1M"
                  trend={12}
                  color="emerald"
                  gradient={true}
                />
                <MetricCard
                  icon={Calendar}
                  title="New Properties"
                  value={overviewData.newProperties || 0}
                  subtitle="this month"
                  trend={8}
                  color="purple"
                  gradient={true}
                />
                <MetricCard
                  icon={Users}
                  title="Property Owners"
                  value={overviewData.topOwners?.length || 0}
                  subtitle="tracked"
                  color="amber"
                  gradient={true}
                />
              </div>
  
              {/* Premium Activity Chart */}
              <ChartContainer
                title="Portfolio Activity Trends"
                subtitle="Daily searches and property saves over the past month"
                height={350}
                action={
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <Eye className="h-4 w-4" />
                    <span>Live Data</span>
                  </div>
                }
              >
                <AreaChart data={activityTrendsData}>
                  <defs>
                    <linearGradient id="searchGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="saveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748B' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748B' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="searches"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="url(#searchGradient)"
                    strokeWidth={2}
                    name="Searches"
                  />
                  <Area
                    type="monotone"
                    dataKey="saves"
                    stackId="1"
                    stroke="#10B981"
                    fill="url(#saveGradient)"
                    strokeWidth={2}
                    name="Saves"
                  />
                </AreaChart>
              </ChartContainer>
  
              {/* Premium Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartContainer
                  title="Property Value Distribution"
                  subtitle="Portfolio breakdown by property values"
                  height={320}
                >
                  <RechartsPieChart>
                    <Pie
                      data={propertyValueData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={130}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {propertyValueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={VALUE_COLORS[index % VALUE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </RechartsPieChart>
                </ChartContainer>
  
                <ChartContainer
                  title="Property Types"
                  subtitle="Distribution by property classification"
                  height={320}
                >
                  <BarChart data={propertyTypesData.slice(0, 8)}>
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748B' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="value" 
                      fill="#3B82F6" 
                      radius={[4, 4, 0, 0]}
                      className="hover:opacity-80 transition-opacity"
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          )}
  
          {activeTab === 'properties' && (
            <div className="space-y-8">
              {/* Property Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  icon={Building}
                  title="Total Properties"
                  value={overviewData.totalProperties || 0}
                  subtitle="in your portfolio"
                  color="blue"
                  gradient={true}
                />
                <MetricCard
                  icon={TrendingUp}
                  title="Average Value"
                  value={propertyValueData.length > 0 ? 
                    `$${(propertyValueData.reduce((sum, item) => sum + (item.value * 1000000), 0) / propertyValueData.reduce((sum, item) => sum + item.value, 0) || 0).toFixed(0)}K` : 
                    'N/A'
                  }
                  subtitle="estimated average"
                  color="emerald"
                  gradient={true}
                />
                <MetricCard
                  icon={PieChart}
                  title="Property Types"
                  value={propertyTypesData.length}
                  subtitle="different classifications"
                  color="purple"
                  gradient={true}
                />
              </div>
  
              {/* Detailed Property Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartContainer
                  title="Value Analysis Breakdown"
                  subtitle="Complete distribution of property values"
                  height={400}
                >
                  <BarChart data={propertyValueData} layout="horizontal">
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100} 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
  
                <ChartContainer
                  title="Property Types Analysis"
                  subtitle="Portfolio composition by property type"
                  height={400}
                >
                  <RechartsPieChart>
                    <Pie
                      data={propertyTypesData}
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {propertyTypesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PREMIUM_COLORS[index % PREMIUM_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPieChart>
                </ChartContainer>
              </div>
  
              {/* Premium Property Performance Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-xl font-semibold text-slate-900">Property Type Performance</h3>
                  <p className="text-slate-500 text-sm mt-1">Detailed breakdown by property classification</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Property Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Count
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Percentage
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Trend
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {propertyTypesData.map((type, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-3"
                                style={{ backgroundColor: PREMIUM_COLORS[index % PREMIUM_COLORS.length] }}
                              ></div>
                              <span className="text-sm font-medium text-slate-900">{type.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                            {type.value}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {type.percentage}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-emerald-600 text-sm flex items-center font-medium">
                              <ArrowUp className="h-4 w-4 mr-1" />
                              +{Math.floor(Math.random() * 15 + 5)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
  
          {activeTab === 'geography' && (
            <div className="space-y-8">
              {/* Geographic Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  icon={Globe}
                  title="States Covered"
                  value={geographicData.states?.length || 0}
                  subtitle="across the US"
                  color="blue"
                  gradient={true}
                />
                <MetricCard
                  icon={MapPin}
                  title="Cities"
                  value={geographicData.cities?.length || 0}
                  subtitle="with properties"
                  color="emerald"
                  gradient={true}
                />
                <MetricCard
                  icon={Building}
                  title="Concentration"
                  value={`${geographicData.states?.[0]?.percentage || 0}%`}
                  subtitle={`in ${geographicData.states?.[0]?.name || 'top state'}`}
                  color="purple"
                  gradient={true}
                />
              </div>
  
              {/* Geographic Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartContainer
                  title="Top States by Property Count"
                  subtitle="Geographic distribution across states"
                  height={400}
                >
                  <BarChart data={geographicData.states}>
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748B' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="properties" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
  
                <ChartContainer
                  title="Top Cities by Property Count"
                  subtitle="Urban concentration analysis"
                  height={400}
                >
                  <BarChart data={geographicData.cities?.slice(0, 8)} layout="horizontal">
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={80}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="properties" fill="#10B981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          )}
  
          {activeTab === 'wealth' && (
            <div className="space-y-8">
              {/* Wealth Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard
                  icon={DollarSign}
                  title="Total Estimations"
                  value={wealthAnalyticsData.totalEstimations || 0}
                  subtitle="wealth profiles"
                  color="emerald"
                  gradient={true}
                />
                <MetricCard
               icon={TrendingUp}
               title="Average Wealth"
               value={wealthAnalyticsData.averageWealth ? 
                 `$${(wealthAnalyticsData.averageWealth / 1000000).toFixed(1)}M` : 
                 'N/A'
               }
               subtitle="estimated average"
               color="blue"
               gradient={true}
             />
             <MetricCard
               icon={Users}
               title="High Net Worth"
               value={wealthAnalyticsData.distribution?.find(d => d.name.includes('Over'))?.value || 0}
               subtitle="over $50M"
               color="purple"
               gradient={true}
             />
             <MetricCard
               icon={BarChart3}
               title="High Confidence"
               value={wealthAnalyticsData.confidence?.find(c => c.name === 'High')?.value || 0}
               subtitle="reliable estimates"
               color="amber"
               gradient={true}
             />
           </div>

           {wealthAnalyticsData.totalEstimations > 0 ? (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <ChartContainer
                 title="Wealth Distribution"
                 subtitle="Net worth ranges of property owners"
                 height={400}
               >
                 <RechartsPieChart>
                   <Pie
                     data={wealthAnalyticsData.distribution}
                     cx="50%"
                     cy="50%"
                     outerRadius={150}
                     dataKey="value"
                     label={({ name, percentage }) => `${name}: ${percentage}%`}
                   >
                     {wealthAnalyticsData.distribution?.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={VALUE_COLORS[index % VALUE_COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip content={<CustomTooltip />} />
                 </RechartsPieChart>
               </ChartContainer>

               <ChartContainer
                 title="Estimation Confidence"
                 subtitle="Quality of wealth estimations"
                 height={400}
               >
                 <BarChart data={wealthAnalyticsData.confidence}>
                   <XAxis 
                     dataKey="name"
                     axisLine={false}
                     tickLine={false}
                     tick={{ fontSize: 12, fill: '#64748B' }}
                   />
                   <YAxis 
                     axisLine={false}
                     tickLine={false}
                     tick={{ fontSize: 12, fill: '#64748B' }}
                   />
                   <Tooltip content={<CustomTooltip />} />
                   <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ChartContainer>
             </div>
           ) : (
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
               <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-8 max-w-lg mx-auto">
                 <DollarSign className="h-16 w-16 text-slate-400 mx-auto mb-6" />
                 <h3 className="text-xl font-semibold text-slate-900 mb-3">No Wealth Data Available</h3>
                 <p className="text-slate-600 mb-6">
                   Run wealth estimations on your saved properties to see detailed analytics about property owner net worth.
                 </p>
                 <Link 
                   to="/dashboard"
                   className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl font-semibold hover:from-slate-800 hover:to-slate-700 transition-all shadow-lg"
                 >
                   <Zap className="h-5 w-5 mr-2" />
                   Generate Wealth Estimations
                 </Link>
               </div>
             </div>
           )}
         </div>
       )}

       {activeTab === 'activity' && (
         <div className="space-y-8">
           {/* Activity Metrics */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <MetricCard
               icon={Search}
               title="Total Searches"
               value={activityTrendsData.reduce((sum, day) => sum + day.searches, 0)}
               subtitle="in selected period"
               color="blue"
               gradient={true}
             />
             <MetricCard
               icon={Building}
               title="Properties Saved"
               value={activityTrendsData.reduce((sum, day) => sum + day.saves, 0)}
               subtitle="in selected period"
               color="emerald"
               gradient={true}
             />
             <MetricCard
               icon={TrendingUp}
               title="Peak Activity"
               value={searchPatternsData.hourlyPattern?.reduce((max, hour) => 
                 hour.searches > max.searches ? hour : max, { searches: 0, hour: '0:00' }
               )?.hour || 'N/A'}
               subtitle="busiest hour"
               color="purple"
               gradient={true}
             />
             <MetricCard
               icon={Activity}
               title="Search Types"
               value={searchPatternsData.searchTypes?.length || 0}
               subtitle="different methods"
               color="amber"
               gradient={true}
             />
           </div>

           {/* Activity Charts */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <ChartContainer
               title="Daily Activity Trend"
               subtitle="Searches and saves over time"
               height={400}
             >
               <LineChart data={activityTrendsData}>
                 <XAxis 
                   dataKey="date"
                   axisLine={false}
                   tickLine={false}
                   tick={{ fontSize: 12, fill: '#64748B' }}
                 />
                 <YAxis 
                   axisLine={false}
                   tickLine={false}
                   tick={{ fontSize: 12, fill: '#64748B' }}
                 />
                 <Tooltip content={<CustomTooltip />} />
                 <Legend />
                 <Line 
                   type="monotone" 
                   dataKey="searches" 
                   stroke="#3B82F6" 
                   strokeWidth={3}
                   dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                   activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2, fill: '#fff' }}
                   name="Searches"
                 />
                 <Line 
                   type="monotone" 
                   dataKey="saves" 
                   stroke="#10B981" 
                   strokeWidth={3}
                   dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                   activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2, fill: '#fff' }}
                   name="Saves"
                 />
               </LineChart>
             </ChartContainer>

             <ChartContainer
               title="Search Method Distribution"
               subtitle="How users interact with the platform"
               height={400}
             >
               <RechartsPieChart>
                 <Pie
                   data={searchPatternsData.searchTypes}
                   cx="50%"
                   cy="50%"
                   outerRadius={150}
                   dataKey="value"
                   label={({ name, percentage }) => `${name}: ${percentage}%`}
                 >
                   {searchPatternsData.searchTypes?.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={PREMIUM_COLORS[index % PREMIUM_COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip content={<CustomTooltip />} />
               </RechartsPieChart>
             </ChartContainer>
           </div>

           {/* Hourly Activity Pattern */}
           <ChartContainer
             title="Hourly Activity Pattern"
             subtitle="When users are most active throughout the day"
             height={300}
           >
             <AreaChart data={searchPatternsData.hourlyPattern}>
               <defs>
                 <linearGradient id="hourlyGradient" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                   <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                 </linearGradient>
               </defs>
               <XAxis 
                 dataKey="hour"
                 axisLine={false}
                 tickLine={false}
                 tick={{ fontSize: 12, fill: '#64748B' }}
               />
               <YAxis 
                 axisLine={false}
                 tickLine={false}
                 tick={{ fontSize: 12, fill: '#64748B' }}
               />
               <Tooltip content={<CustomTooltip />} />
               <Area
                 type="monotone"
                 dataKey="searches"
                 stroke="#3B82F6"
                 fill="url(#hourlyGradient)"
                 strokeWidth={2}
                 name="Searches"
               />
             </AreaChart>
           </ChartContainer>

           {/* Activity Timeline */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
             <div className="p-6 border-b border-slate-100">
               <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                 <Calendar className="h-5 w-5 mr-2 text-slate-600" />
                 Recent Activity Timeline
               </h3>
               <p className="text-slate-500 text-sm mt-1">Latest team actions and interactions</p>
             </div>
             <div className="p-6">
               <div className="space-y-6">
                 {activityTrendsData.slice(-5).map((activity, index) => (
                   <div key={index} className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                     <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                       {index + 1}
                     </div>
                     <div className="flex-1">
                       <p className="text-slate-900 font-medium">
                         {activity.searches} searches, {activity.saves} properties saved
                       </p>
                       <p className="text-slate-500 text-sm">{activity.date}</p>
                     </div>
                     <div className="text-right">
                       <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                         Active
                       </span>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         </div>
       )}
     </div>

     
   </div>
 );
};

export default Analytics;