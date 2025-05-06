import {
  AlertCircle,
  Check,
  ChevronDown,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Settings,
  Shield,
  User,
  UserPlus,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cancelInvitation, getInvitations, inviteEmployee } from '../services/api';

export default function TeamManagement() {
  const [activeTab, setActiveTab] = useState('members');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'viewer' });
  const [invitations, setInvitations] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Fetch invitations
  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        setLoading(true);
        console.log("Fetching invitations...");
        const response = await getInvitations();
        console.log("Invitations response:", response);
        
        // Filter out the accepted/expired invitations
        const pendingInvitations = response.data.filter(
          invitation => invitation.status === 'pending'
        );
        
        setInvitations(pendingInvitations);
        console.log("Pending invitations set:", pendingInvitations);
      } catch (error) {
        console.error('Error fetching invitations:', error);
        setError('Failed to load invitations. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch invitations when on the invitations tab
    if (activeTab === 'invitations') {
      fetchInvitations();
      
      // Set up an interval to refresh data periodically
      const refreshInterval = setInterval(fetchInvitations, 30000); // refresh every 30 seconds
      
      // Clean up interval on component unmount or tab change
      return () => clearInterval(refreshInterval);
    }
  }, [activeTab]);
  
  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        console.log("Fetching team members from invitations...");
        
        // Get all invitations - this endpoint is already working
        const response = await getInvitations();
        console.log("Invitations response:", response);
        
        if (response && response.data) {
          // First, collect all emails from accepted invitations
          const acceptedEmails = new Set();
          response.data.forEach(invitation => {
            if (invitation.status === 'accepted') {
              acceptedEmails.add(invitation.email);
            }
          });
          
          // Create team members array from accepted invitations
          const members = response.data
            .filter(invitation => invitation.status === 'accepted')
            .map(invitation => ({
              _id: invitation._id, // Use invitation ID if user ID isn't available
              email: invitation.email,
              role: invitation.role,
              lastLogin: null, // We don't have this info from invitations
              status: 'Active',
              invitedBy: invitation.invitedBy
            }));
          
          console.log("Extracted team members:", members);
          setTeamMembers(members);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
        setError('Failed to load team members. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch team members when on the members tab
    if (activeTab === 'members') {
      fetchTeamMembers();
      
      // Set up an interval to refresh data periodically
      const refreshInterval = setInterval(fetchTeamMembers, 30000); // refresh every 30 seconds
      
      // Clean up interval on component unmount or tab change
      return () => clearInterval(refreshInterval);
    }
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInviteData({
      ...inviteData,
      [name]: value
    });
  };
  
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    
    if (!inviteData.email.trim()) {
      setError('Please enter an email address');
      return;
    }
    
    try {
      setLoading(true);
      console.log("Sending invitation to:", inviteData.email);
      const response = await inviteEmployee(inviteData);
      console.log("Invitation response:", response);
      
      // Add new invitation to the list
      setInvitations([...invitations, response.data]);
      
      // Show success message
      setSuccessMessage(`Invitation email sent to ${inviteData.email}`);
      
      // Reset form
      setInviteData({ email: '', role: 'viewer' });
      setShowInviteForm(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error sending invitation:', error);
      setError(typeof error === 'string' ? error : 'Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelInvitation = async (invitationId) => {
    try {
      setLoading(true);
      console.log("Cancelling invitation:", invitationId);
      await cancelInvitation(invitationId);
      
      // Remove invitation from list
      setInvitations(invitations.filter(inv => inv._id !== invitationId));
      
      // Show success message
      setSuccessMessage('Invitation cancelled successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      setError(typeof error === 'string' ? error : 'Failed to cancel invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'analyst':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'analyst':
        return <Settings className="w-4 h-4" />;
      case 'viewer':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };
  
  const formatLastActive = (date) => {
    if (!date) return 'Never';
    
    const lastActive = new Date(date);
    const now = new Date();
    
    const diffMs = now - lastActive;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)} hours ago`;
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return lastActive.toLocaleDateString();
    }
  };
  
  const refreshCurrentTab = async () => {
    try {
      setLoading(true);
      if (activeTab === 'members') {
        console.log("Manually refreshing team members...");
        await fetchTeamMembers(); // Use the same function
      } else if (activeTab === 'invitations') {
        console.log("Manually refreshing invitations...");
        const response = await getInvitations();
        const pendingInvitations = response.data.filter(
          invitation => invitation.status === 'pending'
        );
        setInvitations(pendingInvitations);
        console.log("Refreshed invitations:", pendingInvitations);
      }
    } catch (error) {
      console.error(`Error refreshing ${activeTab}:`, error);
      setError(`Failed to refresh ${activeTab}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">Team Management</h1>
        
        <div className="flex space-x-2">
          <button
            onClick={refreshCurrentTab}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center mr-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={() => setShowInviteForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Team Member
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
              <button 
                onClick={() => setError('')}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('members')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'members'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Team Members
              </button>
              <button
                onClick={() => setActiveTab('invitations')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'invitations'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Invitations
              </button>
            </nav>
          </div>
          
          {/* Team Members Table */}
          {activeTab === 'members' && (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="ml-2 text-gray-600">Loading team members...</span>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p>No team members found</p>
                  <button 
                    onClick={() => setShowInviteForm(true)}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Invite a team member
                  </button>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Active
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamMembers.map((member, index) => (
                      <tr key={member._id || `team-member-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-600 font-medium">{member.email.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                            {getRoleIcon(member.role)}
                            <span className="ml-1 capitalize">{member.role}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatLastActive(member.lastLogin)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative inline-block text-left">
                            <button className="text-gray-400 hover:text-gray-500">
                              <MoreHorizontal className="h-5 w-5" />
                            </button>
                            {/* Dropdown menu for actions */}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          
          {/* Invitations Table */}
          {activeTab === 'invitations' && (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="ml-2 text-gray-600">Loading invitations...</span>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p>No pending invitations</p>
                  <button 
                    onClick={() => setShowInviteForm(true)}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Invite a team member
                  </button>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invitations.map((invitation, index) => (
                      <tr key={invitation._id || `invitation-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{invitation.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(invitation.role)}`}>
                            {getRoleIcon(invitation.role)}
                            <span className="ml-1 capitalize">{invitation.role}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleCancelInvitation(invitation._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Invite Member Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Invite Team Member</h2>
              <button
                onClick={() => setShowInviteForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleInviteSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={inviteData.email}
                  onChange={handleInputChange}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="relative">
                  <select
                    id="role"
                    name="role"
                    value={inviteData.role}
                    onChange={handleInputChange}
                    className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="analyst">Analyst</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {inviteData.role === 'admin' && 'Can manage team members and all settings.'}
                  {inviteData.role === 'analyst' && 'Can view and analyze all data.'}
                  {inviteData.role === 'viewer' && 'Can only view authorized data.'}
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}