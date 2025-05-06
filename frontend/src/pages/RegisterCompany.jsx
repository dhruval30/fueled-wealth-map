import { AlertCircle, Building, Camera, Check, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { registerCompany } from '../services/api';


export default function RegisterCompany() {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    logo: null
  });
  
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formStage, setFormStage] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        logo: file
      });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTermsChange = (e) => {
    setTermsAccepted(e.target.checked);
    // Clear any terms-related error
    if (errors.terms) {
      setErrors({
        ...errors,
        terms: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.companyName.trim()) 
      newErrors.companyName = 'Company name is required';
    
    if (!formData.email.trim()) 
      newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) 
      newErrors.email = 'Email is invalid';
    
    if (!formData.password) 
      newErrors.password = 'Password is required';
    else if (formData.password.length < 8) 
      newErrors.password = 'Password must be at least 8 characters';
    
    if (formData.password !== formData.confirmPassword) 
      newErrors.confirmPassword = 'Passwords do not match';
    
    // Add terms validation for the final step
    if (formStage === 3 && !termsAccepted)
      newErrors.terms = 'You must accept the Terms of Service and Privacy Policy';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Create form data for multipart/form-data to handle file upload
      const submitData = new FormData();
      submitData.append('companyName', formData.companyName);
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      submitData.append('termsAccepted', termsAccepted);
      if (formData.logo) {
        submitData.append('logo', formData.logo);
      }
      
      // Use our API service
      const data = await registerCompany(submitData);
      
      // Save token and company ID
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('companyId', data.companyId);
        localStorage.setItem('userEmail', formData.email);
        localStorage.setItem('isAdmin', 'true'); // First user is always admin
      }
      
      // Show success message
      setSuccessMessage('Company registered successfully! You will receive a confirmation email shortly.');
      
      // Reset form
      setFormData({
        companyName: '',
        email: '',
        password: '',
        confirmPassword: '',
        logo: null
      });
      setLogoPreview(null);
      setTermsAccepted(false);
      
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    // Validate current step
    const currentStepValid = formStage === 1 
      ? formData.companyName.trim() && formData.email.trim() && /\S+@\S+\.\S+/.test(formData.email)
      : formData.password && formData.password.length >= 8 && formData.password === formData.confirmPassword;
    
    if (!currentStepValid) {
      validateForm();
      return;
    }
    
    setFormStage(formStage + 1);
  };

  const prevStep = () => {
    setFormStage(formStage - 1);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side - Sidebar */}
        <div className="bg-[#003087] text-white p-8 md:w-2/5 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-6">Wealth Map</h1>
            <div className="space-y-8 mt-12">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full ${formStage >= 1 ? 'bg-[#146FF6]' : 'bg-white bg-opacity-30'} flex items-center justify-center mr-4`}>
                  {formStage > 1 ? <Check className="w-5 h-5" /> : <span>1</span>}
                </div>
                <span className={`${formStage === 1 ? 'font-bold' : ''}`}>Company Information</span>
              </div>
              
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full ${formStage >= 2 ? 'bg-[#146FF6]' : 'bg-white bg-opacity-30'} flex items-center justify-center mr-4`}>
                  {formStage > 2 ? <Check className="w-5 h-5" /> : <span>2</span>}
                </div>
                <span className={`${formStage === 2 ? 'font-bold' : ''}`}>Security Setup</span>
              </div>
              
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full ${formStage >= 3 ? 'bg-[#146FF6]' : 'bg-white bg-opacity-30'} flex items-center justify-center mr-4`}>
                  {formStage > 3 ? <Check className="w-5 h-5" /> : <span>3</span>}
                </div>
                <span className={`${formStage === 3 ? 'font-bold' : ''}`}>Confirmation</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Form */}
        <div className="p-8 md:w-3/5">
          {successMessage ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#001E4C] mb-4">Registration Complete!</h2>
              <p className="text-gray-600 mb-8">{successMessage}</p>
              <a href="/login" className="px-6 py-3 bg-[#003087] text-white rounded-lg hover:bg-[#146FF6] transition-colors">
                Go to Login Page
              </a>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-[#001E4C] mb-2">
                {formStage === 1 && "Register Your Company"}
                {formStage === 2 && "Secure Your Account"}
                {formStage === 3 && "Review & Submit"}
              </h2>
              <p className="text-gray-600 mb-8">
                {formStage === 1 && "Create an admin account to manage Wealth Map for your company"}
                {formStage === 2 && "Set up secure access to your company dashboard"}
                {formStage === 3 && "Please review your information before submitting"}
              </p>
              
              {errors.submit && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-sm text-red-700">
                      {errors.submit}
                    </p>
                  </div>
                </div>
              )}

              {/* Stage 1: Company Info */}
              {formStage === 1 && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-[#001E4C] mb-1">
                      Company Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Building className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        id="companyName"
                        name="companyName"
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="pl-10 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146FF6] focus:border-[#146FF6]"
                        placeholder="Enter your company name"
                      />
                    </div>
                    {errors.companyName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.companyName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#001E4C] mb-1">
                      Admin Email
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
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146FF6] focus:border-[#146FF6]"
                        placeholder="admin@yourcompany.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#001E4C] mb-1">
                      Company Logo (optional)
                    </label>
                    <div className="mt-1">
                      {logoPreview ? (
                        <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                          <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({...formData, logo: null});
                              setLogoPreview(null);
                            }}
                            className="absolute top-2 right-2 p-1 rounded-full bg-white shadow-md text-gray-700 hover:bg-gray-100"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center justify-center w-full h-40 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() => document.getElementById('logo-upload').click()}
                        >
                          <div className="flex flex-col items-center">
                            <Camera className="h-12 w-12 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">Click to upload your company logo</span>
                            <span className="text-xs text-gray-400 mt-1">Recommended: Square format, min 200x200px</span>
                            <input
                              id="logo-upload"
                              name="logo"
                              type="file"
                              accept="image/*"
                              onChange={handleLogoChange}
                              className="sr-only"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={nextStep}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#003087] hover:bg-[#146FF6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#146FF6] transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Stage 2: Password Setup */}
              {formStage === 2 && (
                <div className="space-y-6">
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
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
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
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.password}
                      </p>
                    )}
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
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
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
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 flex space-x-4">
                    <button
                      onClick={prevStep}
                      className="w-1/3 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#146FF6] transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={nextStep}
                      className="w-2/3 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#003087] hover:bg-[#146FF6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#146FF6] transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Stage 3: Review & Submit */}
              {formStage === 3 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-[#001E4C] mb-4">Review Your Information</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="w-1/3 text-sm font-medium text-gray-500">Company Name</div>
                        <div className="w-2/3 text-sm text-[#001E4C] font-medium">{formData.companyName}</div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-1/3 text-sm font-medium text-gray-500">Admin Email</div>
                        <div className="w-2/3 text-sm text-[#001E4C] font-medium">{formData.email}</div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-1/3 text-sm font-medium text-gray-500">Password</div>
                        <div className="w-2/3 text-sm text-[#001E4C] font-medium">••••••••</div>
                      </div>
                      
                      {logoPreview && (
                        <div className="flex items-start">
                          <div className="w-1/3 text-sm font-medium text-gray-500">Company Logo</div>
                          <div className="w-2/3">
                            <img src={logoPreview} alt="Company logo" className="h-16 w-16 object-contain bg-gray-100 rounded" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={handleTermsChange}
                      className="h-4 w-4 text-[#146FF6] focus:ring-[#146FF6] border-gray-300 rounded"
                    />
                    <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
                      I agree to the <a href="/terms" className="text-[#146FF6] hover:underline">Terms of Service</a> and <a href="/privacy" className="text-[#146FF6] hover:underline">Privacy Policy</a>
                    </label>
                  </div>
                  {errors.terms && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.terms}
                    </p>
                  )}

                  <div className="pt-4 flex space-x-4">
                    <button
                      onClick={prevStep}
                      className="w-1/3 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#146FF6] transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-2/3 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#003087] hover:bg-[#146FF6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#146FF6] transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating Account...' : 'Create Company Account'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}