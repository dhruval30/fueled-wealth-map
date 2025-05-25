import { ArrowLeft, Building, CheckCircle, Loader2, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PropertyDetails from './PropertyDetails';
import PropertyMap from './PropertyMap';

export default function PropertyMapPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedProperty, setSelectedProperty] = useState(location.state?.selectedProperty || null);
  const [initialState] = useState(location.state?.initialState || null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');

  const handlePropertySelect = (property) => {
    setSelectedProperty(property);
  };

  const handleSaveProperty = async (property) => {
    setSaveStatus('saving');
    setSaveMessage('Saving property...');
    
    try {
      const { saveProperty } = await import('../services/api');
      await saveProperty(property);
      
      setSaveStatus('saved');
      setSaveMessage('Property saved successfully!');
      
      setTimeout(() => {
        setSaveStatus(null);
        setSaveMessage('');
      }, 2000);
      
    } catch (err) {
      console.error('Error saving property:', err);
      setSaveStatus('error');
      setSaveMessage(err === 'Property already saved' ? 'This property is already saved' : 'Failed to save property');
      
      setTimeout(() => {
        setSaveStatus(null);
        setSaveMessage('');
      }, 3000);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              to="/dashboard" 
              className="group flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-gray-800" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Property Map</h1>
              <p className="text-sm text-gray-500">Explore properties across the United States</p>
            </div>
          </div>
          
          {selectedProperty && (
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg">
                <Building className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Property Selected</span>
              </div>
              <button
                onClick={() => handleSaveProperty(selectedProperty)}
                disabled={saveStatus === 'saving'}
                className={`group relative px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 transform hover:scale-105 ${
                  saveStatus === 'saved' 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-200' 
                    : saveStatus === 'saving'
                    ? 'bg-blue-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200'
                } disabled:transform-none disabled:hover:scale-100`}
              >
                <span className="flex items-center space-x-2">
                  {saveStatus === 'saving' && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {saveStatus === 'saved' && (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <span>
                    {saveStatus === 'saved' ? 'Saved Successfully' : 
                     saveStatus === 'saving' ? 'Saving...' : 
                     'Save Property'}
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className={`${selectedProperty ? 'w-2/3' : 'w-full'} transition-all duration-500 ease-in-out relative`}>
          <PropertyMap
            isOpen={true}
            onClose={() => navigate('/dashboard')}
            onPropertySelect={handlePropertySelect}
            onPropertySaved={handleSaveProperty}
            hideCloseButton={true}
            initialState={initialState}
          />
        </div>

        {selectedProperty && (
          <div className="w-1/3 bg-white border-l border-gray-200 overflow-hidden shadow-2xl transform transition-all duration-500 ease-in-out translate-x-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"></div>
              <div className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Building className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Property Details</h2>
                      <p className="text-blue-100 text-sm">Complete property information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProperty(null)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors group"
                  >
                    <X className="h-5 w-5 text-white group-hover:text-gray-200" />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto h-full pb-32">
              <PropertyDetails property={selectedProperty} />
            </div>

            <div className="absolute bottom-6 left-6 right-6">
              <button
                onClick={() => handleSaveProperty(selectedProperty)}
                disabled={saveStatus === 'saving'}
                className={`w-full py-4 rounded-2xl font-semibold text-white transition-all duration-200 transform hover:scale-105 shadow-xl ${
                  saveStatus === 'saved' 
                    ? 'bg-green-600 shadow-green-200' 
                    : saveStatus === 'saving'
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-blue-200'
                } disabled:transform-none disabled:hover:scale-100`}
              >
                <span className="flex items-center justify-center space-x-2">
                  {saveStatus === 'saving' && (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  )}
                  {saveStatus === 'saved' && (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  <span className="text-lg">
                    {saveStatus === 'saved' ? 'Property Saved!' : 
                     saveStatus === 'saving' ? 'Saving Property...' : 
                     'Save This Property'}
                  </span>
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {saveStatus && (
        <div className={`fixed top-8 right-8 z-50 transform transition-all duration-300 ${
          saveStatus ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}>
          <div className={`p-6 rounded-2xl shadow-2xl backdrop-blur-md border ${
            saveStatus === 'saving' ? 'bg-blue-50/90 border-blue-200' :
            saveStatus === 'saved' ? 'bg-green-50/90 border-green-200' :
            'bg-red-50/90 border-red-200'
          }`}>
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${
                saveStatus === 'saving' ? 'bg-blue-100' :
                saveStatus === 'saved' ? 'bg-green-100' :
                'bg-red-100'
              }`}>
                {saveStatus === 'saving' && (
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                )}
                {saveStatus === 'saved' && (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                )}
                {saveStatus === 'error' && (
                  <X className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <p className={`font-semibold ${
                  saveStatus === 'saving' ? 'text-blue-900' :
                  saveStatus === 'saved' ? 'text-green-900' :
                  'text-red-900'
                }`}>
                  {saveStatus === 'saving' ? 'Saving Property' :
                   saveStatus === 'saved' ? 'Success!' :
                   'Error Occurred'}
                </p>
                <p className={`text-sm ${
                  saveStatus === 'saving' ? 'text-blue-700' :
                  saveStatus === 'saved' ? 'text-green-700' :
                  'text-red-700'
                }`}>
                  {saveMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// // frontend/src/pages/PropertyMapPage.jsx
// import { ArrowLeft, Building, CheckCircle, Loader2, X } from 'lucide-react';
// import React, { useState } from 'react';
// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import PropertyDetails from './PropertyDetails';
// import PropertyMap from './PropertyMap';

// export default function PropertyMapPage() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [selectedProperty, setSelectedProperty] = useState(location.state?.selectedProperty || null);
//   const [initialState] = useState(location.state?.initialState || null);
//   const [saveStatus, setSaveStatus] = useState(null);
//   const [saveMessage, setSaveMessage] = useState('');

//   const handlePropertySelect = (property) => {
//     setSelectedProperty(property);
//   };

//   const handleSaveProperty = async (property) => {
//     setSaveStatus('saving');
//     setSaveMessage('Saving property...');
    
//     try {
//       const { saveProperty } = await import('../services/api');
//       await saveProperty(property);
      
//       setSaveStatus('saved');
//       setSaveMessage('Property saved successfully!');
      
//       setTimeout(() => {
//         setSaveStatus(null);
//         setSaveMessage('');
//       }, 2000);
      
//     } catch (err) {
//       console.error('Error saving property:', err);
//       setSaveStatus('error');
//       setSaveMessage(err === 'Property already saved' ? 'This property is already saved' : 'Failed to save property');
      
//       setTimeout(() => {
//         setSaveStatus(null);
//         setSaveMessage('');
//       }, 3000);
//     }
//   };

//   return (
//     <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
//       {/* Enhanced Header */}
//       <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 py-4 shadow-sm">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <Link 
//               to="/dashboard" 
//               className="group flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-105"
//             >
//               <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
//             </Link>
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Property Map</h1>
//               <p className="text-sm text-gray-500">Explore properties across the United States</p>
//             </div>
//           </div>
          
//           {selectedProperty && (
//             <div className="flex items-center space-x-3">
//               <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg">
//                 <Building className="h-4 w-4 text-blue-600" />
//                 <span className="text-sm font-medium text-blue-700">Property Selected</span>
//               </div>
//               <button
//                 onClick={() => handleSaveProperty(selectedProperty)}
//                 disabled={saveStatus === 'saving'}
//                 className={`group relative px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 transform hover:scale-105 ${
//                   saveStatus === 'saved' 
//                     ? 'bg-green-600 text-white shadow-lg shadow-green-200' 
//                     : saveStatus === 'saving'
//                     ? 'bg-blue-400 text-white cursor-not-allowed'
//                     : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200'
//                 } disabled:transform-none disabled:hover:scale-100`}
//               >
//                 <span className="flex items-center space-x-2">
//                   {saveStatus === 'saving' && (
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                   )}
//                   {saveStatus === 'saved' && (
//                     <CheckCircle className="h-4 w-4" />
//                   )}
//                   <span>
//                     {saveStatus === 'saved' ? 'Saved Successfully' : 
//                      saveStatus === 'saving' ? 'Saving...' : 
//                      'Save Property'}
//                   </span>
//                 </span>
//               </button>
//             </div>
//           )}
//         </div>
//       </header>

//       {/* Main Content */}
//       <div className="flex-1 flex overflow-hidden">
//         {/* Map Section */}
//         <div className={`${selectedProperty ? 'w-2/3' : 'w-full'} transition-all duration-500 ease-in-out relative`}>
//           <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none z-10"></div>
//           <PropertyMap
//             isOpen={true}
//             onClose={() => navigate('/dashboard')}
//             onPropertySelect={handlePropertySelect}
//             onPropertySaved={handleSaveProperty}
//             hideCloseButton={true}
//             initialState={initialState}
//           />
//         </div>

//         {/* Property Details Sidebar - Enhanced */}
//         {selectedProperty && (
//           <div className="w-1/3 bg-white border-l border-gray-200 overflow-hidden shadow-2xl transform transition-all duration-500 ease-in-out translate-x-0">
//             {/* Sidebar Header */}
//             <div className="relative">
//               <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"></div>
//               <div className="relative p-6 text-white">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center space-x-3">
//                     <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
//                       <Building className="h-6 w-6 text-white" />
//                     </div>
//                     <div>
//                       <h2 className="text-xl font-bold">Property Details</h2>
//                       <p className="text-blue-100 text-sm">Complete property information</p>
//                     </div>
//                   </div>
//                   <button
//                     onClick={() => setSelectedProperty(null)}
//                     className="p-2 hover:bg-white/20 rounded-lg transition-colors group"
//                   >
//                     <X className="h-5 w-5 text-white group-hover:text-gray-200" />
//                   </button>
//                 </div>
//               </div>
//             </div>

//             {/* Property Details Content */}
//             <div className="overflow-y-auto h-full pb-32">
//               <PropertyDetails property={selectedProperty} />
//             </div>

//             {/* Floating Action Button */}
//             <div className="absolute bottom-6 left-6 right-6">
//               <button
//                 onClick={() => handleSaveProperty(selectedProperty)}
//                 disabled={saveStatus === 'saving'}
//                 className={`w-full py-4 rounded-2xl font-semibold text-white transition-all duration-200 transform hover:scale-105 shadow-xl ${
//                   saveStatus === 'saved' 
//                     ? 'bg-green-600 shadow-green-200' 
//                     : saveStatus === 'saving'
//                     ? 'bg-blue-400 cursor-not-allowed'
//                     : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-blue-200'
//                 } disabled:transform-none disabled:hover:scale-100`}
//               >
//                 <span className="flex items-center justify-center space-x-2">
//                   {saveStatus === 'saving' && (
//                     <Loader2 className="h-5 w-5 animate-spin" />
//                   )}
//                   {saveStatus === 'saved' && (
//                     <CheckCircle className="h-5 w-5" />
//                   )}
//                   <span className="text-lg">
//                     {saveStatus === 'saved' ? 'Property Saved!' : 
//                      saveStatus === 'saving' ? 'Saving Property...' : 
//                      'Save This Property'}
//                   </span>
//                 </span>
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Enhanced Save Status Toast */}
//       {saveStatus && (
//         <div className={`fixed top-8 right-8 z-50 transform transition-all duration-300 ${
//           saveStatus ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
//         }`}>
//           <div className={`p-6 rounded-2xl shadow-2xl backdrop-blur-md border ${
//             saveStatus === 'saving' ? 'bg-blue-50/90 border-blue-200' :
//             saveStatus === 'saved' ? 'bg-green-50/90 border-green-200' :
//             'bg-red-50/90 border-red-200'
//           }`}>
//             <div className="flex items-center space-x-4">
//               <div className={`p-3 rounded-full ${
//                 saveStatus === 'saving' ? 'bg-blue-100' :
//                 saveStatus === 'saved' ? 'bg-green-100' :
//                 'bg-red-100'
//               }`}>
//                 {saveStatus === 'saving' && (
//                   <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
//                 )}
//                 {saveStatus === 'saved' && (
//                   <CheckCircle className="h-6 w-6 text-green-600" />
//                 )}
//                 {saveStatus === 'error' && (
//                   <X className="h-6 w-6 text-red-600" />
//                 )}
//               </div>
//               <div>
//                 <p className={`font-semibold ${
//                   saveStatus === 'saving' ? 'text-blue-900' :
//                   saveStatus === 'saved' ? 'text-green-900' :
//                   'text-red-900'
//                 }`}>
//                   {saveStatus === 'saving' ? 'Saving Property' :
//                    saveStatus === 'saved' ? 'Success!' :
//                    'Error Occurred'}
//                 </p>
//                 <p className={`text-sm ${
//                   saveStatus === 'saving' ? 'text-blue-700' :
//                   saveStatus === 'saved' ? 'text-green-700' :
//                   'text-red-700'
//                 }`}>
//                   {saveMessage}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Ambient Background Decoration */}
//       <div className="fixed inset-0 pointer-events-none z-0">
//         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
//         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
//       </div>
//     </div>
//   );
// }


