import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Building,
  Calendar,
  DollarSign,
  Download,
  Globe,
  MapPin,
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
import {
  getActivityTrends,
  getCompanyStats,
  getGeographicDistribution,
  getPropertyTypes,
  getPropertyValueDistribution,
  getSearchPatterns,
  getWealthAnalytics
} from '../services/api';

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  
  const [data, setData] = useState({
    overview: {},
    propertyValue: [],
    propertyTypes: [],
    geographic: { states: [], cities: [] },
    activityTrends: [],
    wealthAnalytics: {},
    searchPatterns: {}
  });

  // Optimized color schemes
  const COLORS = {
    primary: ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD'],
    success: ['#059669', '#10B981', '#34D399', '#6EE7B7'],
    warning: ['#D97706', '#F59E0B', '#FBBF24', '#FCD34D'],
    danger: ['#DC2626', '#EF4444', '#F87171', '#FCA5A5'],
    neutral: ['#374151', '#6B7280', '#9CA3AF', '#D1D5DB']
  };

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [
        companyStats,
        propertyValueDist,
        propertyTypesData,
        geographicDist,
        activityTrendsData,
        wealthAnalyticsData,
        searchPatternsData
      ] = await Promise.all([
        getCompanyStats(),
        getPropertyValueDistribution(),
        getPropertyTypes(),
        getGeographicDistribution(),
        getActivityTrends(),
        getWealthAnalytics(),
        getSearchPatterns()
      ]);

      setData({
        overview: companyStats.data || {},
        propertyValue: propertyValueDist.data || [],
        propertyTypes: propertyTypesData.data || [],
        geographic: geographicDist.data || { states: [], cities: [] },
        activityTrends: activityTrendsData.data || [],
        wealthAnalytics: wealthAnalyticsData.data || {},
        searchPatterns: searchPatternsData.data || {}
      });

      setData({
        overview: overview.status === 'fulfilled' ? overview.value.data : {},
        propertyValue: propertyValue.status === 'fulfilled' ? propertyValue.value.data : [],
        propertyTypes: propertyTypes.status === 'fulfilled' ? propertyTypes.value.data : [],
        geographic: geographic.status === 'fulfilled' ? geographic.value.data : { states: [], cities: [] },
        activityTrends: activityTrends.status === 'fulfilled' ? activityTrends.value.data : [],
        wealthAnalytics: wealthAnalytics.status === 'fulfilled' ? wealthAnalytics.value.data : {},
        searchPatterns: searchPatterns.status === 'fulfilled' ? searchPatterns.value.data : {}
      });

    } catch (err) {
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

  // Optimized components
  const MetricCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  const ChartContainer = ({ title, subtitle, children, height = 400 }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={height}>
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Analytics</h2>
          <p className="text-gray-600">Preparing your insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-3">Analytics Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchAnalyticsData}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'properties', label: 'Properties', icon: Building },
    { id: 'geography', label: 'Geography', icon: MapPin },
    { id: 'wealth', label: 'Wealth', icon: DollarSign },
    { id: 'activity', label: 'Activity', icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <BarChart3 className="h-7 w-7 mr-3 text-blue-600" />
                  Analytics Dashboard
                </h1>
                <p className="text-gray-600">Portfolio insights and analytics</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <nav className="flex space-x-8 border-b border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                icon={Building}
                title="Total Properties"
                value={data.overview.totalProperties || 0}
                subtitle="in portfolio"
                color="blue"
              />
              <MetricCard
                icon={DollarSign}
                title="Average Value"
                value={formatCurrency(data.overview.averageValue)}
                subtitle="per property"
                color="green"
              />
              <MetricCard
                icon={TrendingUp}
                title="High Value Properties"
                value={data.overview.highValueProperties || 0}
                subtitle="over $1M"
                color="purple"
              />
              <MetricCard
                icon={Calendar}
                title="New Properties"
                value={data.overview.newProperties || 0}
                subtitle="this month"
                color="orange"
              />
            </div>

            {/* Activity Chart */}
            <ChartContainer
              title="Portfolio Activity"
              subtitle="Daily searches and property saves"
              height={350}
            >
              <AreaChart data={data.activityTrends}>
                <defs>
                  <linearGradient id="searchGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="saveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
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

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ChartContainer
                title="Property Value Distribution"
                subtitle="Portfolio breakdown by value ranges"
                height={320}
              >
                <RechartsPieChart>
                  <Pie
                    data={data.propertyValue}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {data.propertyValue.map((entry, index) => (
                      <Cell key={index} fill={COLORS.primary[index % COLORS.primary.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RechartsPieChart>
              </ChartContainer>

              <ChartContainer
                title="Property Types"
                subtitle="Distribution by classification"
                height={320}
              >
                <BarChart data={data.propertyTypes.slice(0, 6)}>
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                icon={Building}
                title="Total Properties"
                value={data.overview.totalProperties || 0}
                subtitle="in portfolio"
                color="blue"
              />
              <MetricCard
                icon={DollarSign}
                title="Average Value"
                value={formatCurrency(data.overview.averageValue)}
                subtitle="estimated average"
                color="green"
              />
              <MetricCard
                icon={BarChart3}
                title="Property Types"
                value={data.propertyTypes.length}
                subtitle="classifications"
                color="purple"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ChartContainer title="Value Distribution" height={400}>
                <BarChart data={data.propertyValue}>
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>

              <ChartContainer title="Property Types" height={400}>
                <RechartsPieChart>
                  <Pie
                    data={data.propertyTypes}
                    cx="50%"
                    cy="50%"
                    outerRadius={130}
                    dataKey="value"
                    label={({ name, percentage }) => `${percentage}%`}
                  >
                    {data.propertyTypes.map((entry, index) => (
                      <Cell key={index} fill={COLORS.neutral[index % COLORS.neutral.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </RechartsPieChart>
              </ChartContainer>
            </div>
          </div>
        )}

        {activeTab === 'geography' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                icon={Globe}
                title="States"
                value={data.geographic.states?.length || 0}
                subtitle="covered"
                color="blue"
              />
              <MetricCard
                icon={MapPin}
                title="Cities"
                value={data.geographic.cities?.length || 0}
                subtitle="with properties"
                color="green"
              />
              <MetricCard
                icon={Building}
                title="Top State"
                value={`${data.geographic.states?.[0]?.percentage || 0}%`}
                subtitle={data.geographic.states?.[0]?.name || 'N/A'}
                color="purple"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ChartContainer title="States" height={400}>
                <BarChart data={data.geographic.states?.slice(0, 8)}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="properties" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>

              <ChartContainer title="Cities" height={400}>
                <BarChart data={data.geographic.cities?.slice(0, 8)}>
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="properties" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        )}

        {activeTab === 'wealth' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                icon={DollarSign}
                title="Total Estimations"
                value={data.wealthAnalytics.totalEstimations || 0}
                subtitle="wealth profiles"
                color="green"
              />
              <MetricCard
                icon={TrendingUp}
                title="Average Wealth"
                value={formatCurrency(data.wealthAnalytics.averageWealth)}
                subtitle="estimated"
                color="blue"
              />
              <MetricCard
                icon={Users}
                title="High Net Worth"
                value={data.wealthAnalytics.distribution?.find(d => d.name.includes('Over'))?.value || 0}
                subtitle="over $50M"
                color="purple"
              />
              <MetricCard
                icon={BarChart3}
                title="High Confidence"
                value={data.wealthAnalytics.confidence?.find(c => c.name === 'High')?.value || 0}
                subtitle="reliable estimates"
                color="orange"
              />
            </div>

            {data.wealthAnalytics.totalEstimations > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartContainer title="Wealth Distribution" height={400}>
                  <RechartsPieChart>
                    <Pie
                      data={data.wealthAnalytics.distribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={130}
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {data.wealthAnalytics.distribution?.map((entry, index) => (
                        <Cell key={index} fill={COLORS.success[index % COLORS.success.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPieChart>
                </ChartContainer>

                <ChartContainer title="Confidence Levels" height={400}>
                  <BarChart data={data.wealthAnalytics.confidence}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No Wealth Data</h3>
                <p className="text-gray-600 mb-6">Run wealth estimations to see analytics</p>
                <Link 
                  to="/dashboard"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Generate Estimations
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                icon={Search}
                title="Total Searches"
                value={data.activityTrends.reduce((sum, day) => sum + day.searches, 0)}
                subtitle="in period"
                color="blue"
              />
              <MetricCard
                icon={Building}
                title="Properties Saved"
                value={data.activityTrends.reduce((sum, day) => sum + day.saves, 0)}
                subtitle="in period"
                color="green"
              />
              <MetricCard
                icon={TrendingUp}
                title="Peak Hour"
                value={data.searchPatterns.hourlyPattern?.reduce((max, hour) => 
                  hour.searches > max.searches ? hour : max, { searches: 0, hour: '0:00' }
                )?.hour || 'N/A'}
                subtitle="busiest time"
                color="purple"
              />
              <MetricCard
                icon={Activity}
                title="Search Types"
                value={data.searchPatterns.searchTypes?.length || 0}
                subtitle="methods used"
                color="orange"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ChartContainer title="Activity Trends" height={400}>
                <LineChart data={data.activityTrends}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="searches" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    name="Searches"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saves" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    name="Saves"
                  />
                </LineChart>
              </ChartContainer>

              <ChartContainer title="Search Methods" height={400}>
                <RechartsPieChart>
                  <Pie
                    data={data.searchPatterns.searchTypes}
                    cx="50%"
                    cy="50%"
                    outerRadius={130}
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {data.searchPatterns.searchTypes?.map((entry, index) => (
                      <Cell key={index} fill={COLORS.neutral[index % COLORS.neutral.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RechartsPieChart>
              </ChartContainer>
            </div>

            <ChartContainer title="Hourly Activity Pattern" height={300}>
              <AreaChart data={data.searchPatterns.hourlyPattern}>
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="searches"
                  stroke="#3B82F6"
                  fill="url(#activityGradient)"
                  strokeWidth={2}
                  name="Searches"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;