import {
    BarChart3,
    Building,
    ChevronRight,
    Clock,
    DollarSign, // Add this import
    Home,
    LogOut,
    Map,
    Menu,
    PieChart,
    Plus,
    Search,
    Settings,
    Users,
    X
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  
  // Get user info from localStorage
  const userEmail = localStorage.getItem('userEmail') || 'Admin User';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  
  // Mock data for statistics (replace with API data)
  const stats = {
    totalProperties: 1245,
    highValueProperties: 328,
    newProperties: 57,
    recentSearches: [
      { id: 1, query: "Properties in New York", date: "2 hours ago" },
      { id: 2, query: "Commercial properties valued > $1M", date: "Yesterday" },
      { id: 3, query: "Residential with >5000 sq ft", date: "3 days ago" }
    ],
    topOwners: [
      { id: 1, name: "Acme Holdings LLC", properties: 24, value: "$42.5M" },
      { id: 2, name: "Summit Investments", properties: 16, value: "$38.2M" },
      { id: 3, name: "Parker Family Trust", properties: 12, value: "$27.8M" }
    ]
  };
  
  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('companyId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAdmin');
    
    // Redirect to login
    navigate('/login');
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-[#003087] text-white ${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-blue-900">
          {isSidebarOpen ? (
            <div className="flex items-center space-x-2">
              <Map className="h-6 w-6 text-white" />
              <span className="font-semibold text-xl">WealthMap</span>
            </div>
          ) : (
            <Map className="h-6 w-6 text-white mx-auto" />
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white hover:text-blue-200"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            <li>
              <a 
                href="/dashboard" 
                className="flex items-center px-4 py-3 text-white bg-blue-800 hover:bg-blue-700"
              >
                <Home className="h-5 w-5" />
                {isSidebarOpen && <span className="ml-3">Dashboard</span>}
              </a>
            </li>
            <li>
              <a 
                href="/property-map" 
                className="flex items-center px-4 py-3 text-white hover:bg-blue-800"
              >
                <Map className="h-5 w-5" />
                {isSidebarOpen && <span className="ml-3">Property Map</span>}
              </a>
            </li>
            <li>
              <a 
                href="/search" 
                className="flex items-center px-4 py-3 text-white hover:bg-blue-800"
              >
                <Search className="h-5 w-5" />
                {isSidebarOpen && <span className="ml-3">Search</span>}
              </a>
            </li>
            <li>
              <a 
                href="/analytics" 
                className="flex items-center px-4 py-3 text-white hover:bg-blue-800"
              >
                <BarChart3 className="h-5 w-5" />
                {isSidebarOpen && <span className="ml-3">Analytics</span>}
              </a>
            </li>
            
            {isAdmin && (
              <li>
                <a 
                  href="/team" 
                  className="flex items-center px-4 py-3 text-white hover:bg-blue-800"
                >
                  <Users className="h-5 w-5" />
                  {isSidebarOpen && <span className="ml-3">Team Management</span>}
                </a>
              </li>
            )}
            
            <li>
              <a 
                href="/settings" 
                className="flex items-center px-4 py-3 text-white hover:bg-blue-800"
              >
                <Settings className="h-5 w-5" />
                {isSidebarOpen && <span className="ml-3">Settings</span>}
              </a>
            </li>
          </ul>
        </nav>
        
        {/* User Section */}
        <div className="p-4 border-t border-blue-900">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center">
              <span className="text-sm font-medium">{userEmail.charAt(0).toUpperCase()}</span>
            </div>
            {isSidebarOpen && (
              <div className="ml-3">
                <p className="text-sm font-medium truncate">{userEmail}</p>
                <p className="text-xs text-blue-300">{isAdmin ? 'Administrator' : 'User'}</p>
              </div>
            )}
          </div>
          
          {isSidebarOpen && (
            <button
              onClick={handleLogout}
              className="mt-4 flex items-center text-sm text-blue-300 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden mr-2 text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search properties..."
                className="py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <span className="w-6 h-6 flex items-center justify-center text-blue-800 font-semibold">
                {userEmail.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <Building className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm font-medium">Total Properties</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProperties.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Across all regions</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <DollarSign className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm font-medium">High Value Properties</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.highValueProperties.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Properties valued over $1M</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 flex items-center">
              <div className="bg-indigo-100 p-3 rounded-full mr-4">
                <PieChart className="h-6 w-6 text-indigo-700" />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm font-medium">New Properties</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.newProperties}</p>
                <p className="text-sm text-gray-600">Added in the last 30 days</p>
              </div>
            </div>
          </div>
          
          {/* Map Preview & Top Owners */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Map Preview */}
            <div className="bg-white rounded-lg shadow col-span-2">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-800">Property Map</h2>
                <a href="/property-map" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                  View Full Map
                  <ChevronRight className="h-4 w-4 ml-1" />
                </a>
              </div>
              <div className="p-4">
                <div className="bg-gray-100 h-64 rounded flex items-center justify-center">
                  <div className="text-center">
                    <Map className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Interactive map will load here</p>
                    <a href="/property-map" className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                      Open Map
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Top Owners */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">Top Property Owners</h2>
              </div>
              <div className="p-4">
                <ul className="divide-y divide-gray-200">
                  {stats.topOwners.map((owner) => (
                    <li key={owner.id} className="py-3 flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{owner.name}</p>
                        <p className="text-sm text-gray-500">{owner.properties} properties</p>
                      </div>
                      <span className="text-sm font-semibold text-green-600">{owner.value}</span>
                    </li>
                  ))}
                </ul>
                <a href="/owners" className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View All Owners
                </a>
              </div>
            </div>
          </div>
          
          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Searches */}
            <div className="bg-white rounded-lg shadow col-span-2">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">Recent Searches</h2>
              </div>
              <div className="p-4">
                <ul className="divide-y divide-gray-200">
                  {stats.recentSearches.map((search) => (
                    <li key={search.id} className="py-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <Search className="h-5 w-5 text-gray-400 mr-3" />
                        <p className="text-sm font-medium text-gray-900">{search.query}</p>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{search.date}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <a href="/search-history" className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View All Searches
                </a>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">Quick Actions</h2>
              </div>
              <div className="p-4">
                <ul className="space-y-3">
                  <li>
                    <a href="/search" className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-800">
                      <Search className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-sm font-medium">New Property Search</span>
                    </a>
                  </li>
                  <li>
                    <a href="/analytics/export" className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-800">
                      <BarChart3 className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-sm font-medium">Export Analytics</span>
                    </a>
                  </li>
                  {isAdmin && (
                    <li>
                      <a href="/team/invite" className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-800">
                        <Plus className="h-5 w-5 text-purple-600 mr-3" />
                        <span className="text-sm font-medium">Invite Team Member</span>
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}