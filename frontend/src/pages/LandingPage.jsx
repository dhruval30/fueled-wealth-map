import {
  BarChart3,
  ChevronRight,
  Code,
  Coffee,
  Database,
  Globe,
  Map,
  Search,
} from 'lucide-react';

import { useState } from 'react';
import { Link } from 'react-router-dom';


export default function LandingPage() {
  const [email, setEmail] = useState('');
  
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-6 w-6 text-blue-800" />
              <span className="text-xl font-semibold text-blue-900">WealthMap</span>
            </div>
            {/* <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-800 font-medium">Features</a>
              <a href="#solutions" className="text-gray-700 hover:text-blue-800 font-medium">Solutions</a>
              <a href="#about" className="text-gray-700 hover:text-blue-800 font-medium">About</a>
            </nav> */}
            <div className="flex items-center space-x-4">
              <a href="#contact" className="hidden md:block text-blue-600 hover:text-blue-800 font-medium">Contact</a>
              <a href="/login" className="bg-blue-700 text-white px-4 py-2 rounded font-medium hover:bg-blue-800 transition shadow-sm">
                Sign In
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="container mx-auto px-6 pt-20 pb-32">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-1/2 mb-10 lg:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Visualize Property Ownership & Wealth Across the U.S.
              </h1>
              <p className="mt-4 text-xl text-blue-100">
                Empower your team with analytics and verified property data.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link to="/register-company">
                <button className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center hover:bg-blue-600 transition transform hover:scale-105 shadow-lg">
                  Register Your Company
                  <ChevronRight className="ml-2 h-5 w-5" />
                </button>
              </Link>
                <button className="bg-white text-blue-900 px-6 py-3 rounded-lg font-medium flex items-center justify-center hover:bg-blue-50 transition transform hover:scale-105 shadow-md">
                  I Have an Invite
                </button>
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="bg-white p-2 rounded-lg shadow-2xl">
                <div className="bg-blue-900 rounded-t-md p-3">
                  <div className="flex items-center space-x-2">
                    <Map className="h-5 w-5 text-white" />
                    <span className="text-white font-medium">Interactive Wealth Map</span>
                  </div>
                </div>
                <div className="h-64 md:h-80 bg-blue-50 relative overflow-hidden">
                  {/* Decorative map grid */}
                  <div className="absolute inset-0 opacity-20" 
                       style={{
                         backgroundImage: 'linear-gradient(#2563eb 1px, transparent 1px), linear-gradient(90deg, #2563eb 1px, transparent 1px)',
                         backgroundSize: '20px 20px'
                       }} />
                  
                  {/* Property cards */}
                  <div className="absolute left-1/4 top-1/4 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-white rounded-md shadow-lg p-3 w-48">
                      <div className="text-xs text-gray-500">Residential Estate</div>
                      <div className="text-lg font-bold text-blue-900">$4.2M</div>
                      <div className="text-xs text-gray-600">Owner: Tania Solanki</div>
                      <div className="mt-1 text-xs text-blue-700">High net worth</div>
                    </div>
                  </div>
                  
                  <div className="absolute right-1/4 bottom-1/4 transform translate-x-1/2 translate-y-1/2">
                    <div className="bg-white rounded-md shadow-lg p-3 w-48">
                      <div className="text-xs text-gray-500">Residential Estate</div>
                      <div className="text-lg font-bold text-blue-900">$3.8M</div>
                      <div className="text-xs text-gray-600">Owner: Dhruval Padia </div>
                      <div className="mt-1 text-xs text-blue-700">High net worth</div>
                    </div>
                  </div>
                  
                  {/* Map pins */}
                  <div className="absolute left-1/5 top-2/3">
                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm animate-pulse" />
                  </div>
                  <div className="absolute right-1/3 top-1/3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm" />
                  </div>
                  <div className="absolute left-2/3 top-1/2">
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Why WealthMap</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Transform how you understand property ownership with our enterprise-grade intelligence platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-blue-50 rounded-lg p-8 transition duration-300 hover:shadow-lg">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Comprehensive Coverage</h3>
              <p className="text-gray-600">
                Access verified property data and owner wealth insights across all the USA, with unparalleled accuracy.
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-8 transition duration-300 hover:shadow-lg">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Wealth Analytics</h3>
              <p className="text-gray-600">
                Find estimate net worth and identify high-value property ownership patterns.
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-8 transition duration-300 hover:shadow-lg">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Search & Filters</h3>
              <p className="text-gray-600">
                Find owners, addresses, and assets instantly with our powerful search engine
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How We Built It Section */}
      <section id="about" className="py-20 bg-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">How We Built It</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Our journey in creating this wealth mapping project involved various technologies and data sources.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white rounded-lg p-8 shadow-md">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <Code className="h-6 w-6 text-blue-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Technology Stack</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>React.js for the frontend interface</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>Next.js for server-side rendering</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>Tailwind CSS for responsive design</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>Leaflet.js for interactive mapping</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>Node.js backend with Express</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>MongoDB for data storage</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-8 shadow-md">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <Coffee className="h-6 w-6 text-blue-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Development Process</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>Research and data collection from public property records</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>Development of property valuation algorithms</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>Integration with third-party APIs for additional data</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>User interface design with a focus on data visualization</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>Testing and optimization across various devices</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>Documentation and preparation for submission</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      

      {/* footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center space-x-2 mb-4">
                <Globe className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-semibold">WealthMap</span>
              </div>
              <p className="text-gray-400 max-w-xs">
                A project submission for the Wealth Map Challenge, visualizing property ownership and wealth distribution across the United States.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Project</h3>
                <ul className="space-y-2">
                  <li><a href="#features" className="text-gray-400 hover:text-white transition">Overview</a></li>
                  <li><a href="#about" className="text-gray-400 hover:text-white transition">How We Built It</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Demo</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Code Repository</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Technologies</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition">React.js</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Tailwind CSS</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Mapping APIs</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Data Sources</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Resources</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Documentation</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Challenge Details</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Project Blog</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Contact Team</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">Made with ❤️</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {/* <a href="#" className="text-gray-400 hover:text-white transition">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a> */}
              <a href="#" className="text-gray-400 hover:text-white transition">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}