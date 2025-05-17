import { AlertCircle, Eye, EyeOff, Globe, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

export default function Login() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
    
    // Clear error when typing
    if (error) {
      setError('');
    }
  };

// Improve the handleSubmit function in Login.jsx to provide faster feedback

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate form - do client-side validation first for immediate feedback
  if (!credentials.email.trim()) {
    setError('Please enter your email');
    return;
  }
  
  if (!credentials.password) {
    setError('Please enter your password');
    return;
  }
  
  // Simple email format validation for instant feedback
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(credentials.email.trim())) {
    setError('Please enter a valid email address');
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    // Set a timeout to provide feedback if request is taking too long
    const timeoutId = setTimeout(() => {
      // Only show this message if we're still submitting
      if (isSubmitting) {
        setError('The server is taking longer than expected. Please wait...');
      }
    }, 3000);
    
    const response = await login(credentials);
    
    // Clear timeout since we got a response
    clearTimeout(timeoutId);
    
    // Save authentication data
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('companyId', response.user.companyId);
    localStorage.setItem('userEmail', response.user.email);
    localStorage.setItem('isAdmin', response.user.role === 'admin' ? 'true' : 'false');
    
    // Redirect to dashboard
    navigate('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    setError(typeof error === 'string' ? error : 'Invalid credentials. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#003087] text-white p-8">
          <div className="flex items-center space-x-2 mb-6">
            <Globe className="h-6 w-6 text-white" />
            <span className="text-xl font-semibold">Wealth Map</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
          <p className="text-blue-100">Sign in to access your company's property data</p>
        </div>
        
        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#001E4C] mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={credentials.email}
                  onChange={handleInputChange}
                  className="pl-10 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146FF6] focus:border-[#146FF6]"
                  placeholder="name@company.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#001E4C] mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="pl-10 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146FF6] focus:border-[#146FF6]"
                  placeholder="Enter your password"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#146FF6] focus:ring-[#146FF6] border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <a href="/forgot-password" className="text-[#146FF6] hover:underline">
                  Forgot your password?
                </a>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#003087] hover:bg-[#146FF6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#146FF6] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/register-company" className="text-[#146FF6] hover:underline font-medium">
                Register your company
              </a>
            </p>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Have an invitation?{' '}
              <a href="/accept-invitation" className="text-[#146FF6] hover:underline">
                Accept invitation
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}