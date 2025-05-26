import { AlertCircle, Eye, EyeOff, Globe, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

export default function AcceptInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [invitationData, setInvitationData] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchInvitationData = async () => {
      try {
        console.log("Validating invitation token:", token);
        const response = await api.get(`/invitations/validate/${token}`);
        console.log("Invitation validation response:", response.data);
        setInvitationData(response.data);
      } catch (error) {
        console.error('Error fetching invitation data:', error);
        setError('Invalid or expired invitation link. Please contact your administrator.');
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchInvitationData();
    } else {
      setLoading(false);
      setError('No invitation token provided');
    }
  }, [token]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Submitting invitation acceptance for token:", token);
      const response = await api.post('/auth/accept-invitation', {
        token,
        password
      });
      
      console.log("Acceptance response:", response.data);
      
      // Store authentication data
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('companyId', response.data.user.companyId);
      localStorage.setItem('userEmail', response.data.user.email);
      localStorage.setItem('isAdmin', response.data.user.role === 'admin' ? 'true' : 'false');
      
      console.log("User data stored in localStorage");
      console.log("Redirecting to dashboard...");
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      
      setError(
        error.response?.data?.message || 
        'An error occurred while accepting the invitation. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center py-12 px-6">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
          <p className="text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }
  
  if (error && !invitationData) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-[#003087] text-white p-8">
            <div className="flex items-center space-x-2 mb-6">
              <Globe className="h-6 w-6 text-white" />
              <span className="text-xl font-semibold">Wealth Map</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Invitation Error</h2>
          </div>
          
          <div className="p-8">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <a 
                href="/"
                className="block w-full text-center py-3 px-4 bg-[#003087] text-white rounded-lg hover:bg-[#146FF6] transition-colors"
              >
                Return to Homepage
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-[#003087] text-white p-8">
          <div className="flex items-center space-x-2 mb-6">
            <Globe className="h-6 w-6 text-white" />
            <span className="text-xl font-semibold">Wealth Map</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Accept Invitation</h2>
          <p className="text-blue-100">Set up your account password to join your team</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Invitation Details</h3>
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Email:</span> {invitationData?.email}<br />
              <span className="font-semibold">Role:</span> {invitationData?.role}<br />
              <span className="font-semibold">Company:</span> {invitationData?.companyName}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#001E4C] mb-1">
                Create Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146FF6] focus:border-[#146FF6]"
                  placeholder="Create a strong password"
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
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#001E4C] mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146FF6] focus:border-[#146FF6]"
                  placeholder="Confirm your password"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#003087] hover:bg-[#146FF6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#146FF6] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Account...' : 'Accept Invitation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}