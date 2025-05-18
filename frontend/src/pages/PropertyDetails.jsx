// frontend/src/pages/PropertyDetails.jsx - Enhanced UI version
import {
  Building,
  Calendar,
  DollarSign,
  Home,
  Info,
  Loader2,
  Map,
  MapPin,
  Maximize2,
  RefreshCw,
  User
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

const PropertyDetails = ({ property }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [streetViewStatus, setStreetViewStatus] = useState('checking');
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [streetViewUrl, setStreetViewUrl] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [loadingText, setLoadingText] = useState('Checking for street view image...');

  // Street view logic (keeping existing logic)
  useEffect(() => {
    setStreetViewStatus('checking');
    setCheckAttempts(0);
    setStreetViewUrl(null);
    setIsRetrying(false);
    setLoadingText('Checking for street view image...');
    
    let intervalId = null;
    let timeoutId = null;
    
    if (property.streetViewImage) {
      setStreetViewUrl(property.streetViewImage);
      setStreetViewStatus('loaded');
      return () => {
        if (intervalId) clearInterval(intervalId);
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
    
    const propertyId = property.identifier?.attomId || property.attomId;
    if (propertyId) {
      const checkStatus = async () => {
        try {
          const response = await fetch(`/api/images/streetview-status/${propertyId}`);
          if (response.ok) {
            const data = await response.json();
            
            if (data.status === 'complete') {
              setStreetViewUrl(data.url);
              setStreetViewStatus('loaded');
              return true;
            } else if (data.status === 'processing') {
              setStreetViewStatus('loading');
              
              if (data.elapsedSeconds) {
                if (data.elapsedSeconds < 5) {
                  setLoadingText('Locating property on map...');
                } else if (data.elapsedSeconds < 10) {
                  setLoadingText('Looking for street view data...');
                } else if (data.elapsedSeconds < 15) {
                  setLoadingText('Getting street view imagery...');
                } else {
                  setLoadingText('Finalizing street view capture...');
                }
              } else {
                const messages = [
                  'Locating property on map...',
                  'Looking for street view data...',
                  'Getting street view imagery...',
                  'Finalizing street view capture...'
                ];
                setLoadingText(messages[checkAttempts % messages.length]);
              }
              
              setCheckAttempts(prev => Math.min(prev + 1, 10));
              return false;
            } else {
              setStreetViewStatus('error');
              return true;
            }
          } else {
            console.error('Error checking street view status:', response.statusText);
            setStreetViewStatus('error');
            return true;
          }
        } catch (error) {
          console.error('Error checking street view status:', error);
          setStreetViewStatus('error');
          return true;
        }
      };
      
      timeoutId = setTimeout(() => {
        if (streetViewStatus === 'checking') {
          setStreetViewStatus('loading');
          setLoadingText('Connecting to mapping service...');
        }
      }, 1000);
      
      checkStatus();
      
      intervalId = setInterval(async () => {
        if (streetViewStatus === 'checking' || streetViewStatus === 'loading') {
          const done = await checkStatus();
          if (done) {
            clearInterval(intervalId);
          }
        } else {
          clearInterval(intervalId);
        }
      }, 3000);
    } else {
      setStreetViewStatus('error');
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [property, isRetrying]);

  const handleRetry = () => {
    setStreetViewStatus('checking');
    setCheckAttempts(0);
    setLoadingText('Initiating new street view capture...');
    
    const propertyId = property.identifier?.attomId || property.attomId;
    const address = property.fullAddress || getPropertyAddress(property);
    
    if (propertyId && address) {
      setIsRetrying(true);
      
      fetch('/api/images/capture-streetview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          address, 
          propertyId 
        })
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setStreetViewUrl(data.url);
            setStreetViewStatus('loaded');
          } else {
            setStreetViewStatus('error');
          }
          setIsRetrying(false);
        })
        .catch(error => {
          console.error('Error triggering manual capture:', error);
          setStreetViewStatus('error');
          setIsRetrying(false);
        });
    }
  };

  // Helper functions (keeping existing logic)
  const formatCurrency = (value) => {
    if (!value || value === 0) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    if (!value) return null;
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getPropertyValue = (path) => {
    const eventsPath = path.split('.').reduce((obj, key) => obj?.events?.[key], property);
    if (eventsPath !== undefined && eventsPath !== null) return eventsPath;
    
    const directPath = path.split('.').reduce((obj, key) => obj?.[key], property);
    return directPath;
  };

  const InfoItem = ({ label, value, icon: Icon, formatter = (v) => v }) => {
    const formattedValue = value !== null && value !== undefined ? formatter(value) : null;
    
    if (!formattedValue) return null;
    
    return (
      <div className="group p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200">
        <div className="flex items-start space-x-3">
          {Icon && (
            <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
              <Icon className="h-4 w-4 text-gray-600" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
            <p className="text-lg font-semibold text-gray-900">{formattedValue}</p>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'details', label: 'Property Details', icon: Building },
    { id: 'valuation', label: 'Valuation', icon: DollarSign },
    { id: 'owner', label: 'Owner Info', icon: User },
    { id: 'history', label: 'Transaction History', icon: Calendar }
  ];

  const assessment = getPropertyValue('assessment') || {};
  const assessedValues = assessment.assessed || {};
  const marketValues = assessment.market || {};
  const taxInfo = assessment.tax || {};
  const calculations = assessment.calculations || {};

  const progressPercentage = Math.min((checkAttempts / 10) * 100, 100);

  return (
    <div className="w-full p-6 space-y-6">
      {/* Property Header - Enhanced */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          {property.fullAddress || getPropertyAddress(property)}
        </h3>
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 font-medium">
            <Building className="h-4 w-4 mr-1" />
            {property.summary?.propclass || property.summary?.proptype || 'Property'}
          </span>
          {property.summary?.yearbuilt && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 font-medium">
              <Calendar className="h-4 w-4 mr-1" />
              Built in {property.summary.yearbuilt}
            </span>
          )}
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Enhanced Street View Section */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <Map className="h-5 w-5 mr-2 text-blue-600" />
                  Street View
                </h4>
              </div>
              <div className="aspect-video bg-gray-50 relative overflow-hidden">
                {streetViewStatus === 'checking' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center p-8">
                      <Loader2 className="w-12 h-12 mx-auto text-blue-500 mb-4 animate-spin" />
                      <p className="text-gray-700 font-medium text-lg">{loadingText}</p>
                      <p className="text-gray-500 text-sm mt-2">Please wait while we locate this property</p>
                    </div>
                  </div>
                )}
                
                {streetViewStatus === 'loading' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="text-center p-8">
                      <div className="relative w-20 h-20 mx-auto mb-6">
                        <Loader2 className="w-20 h-20 text-blue-500 animate-spin" />
                        <Map className="w-10 h-10 text-blue-700 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-gray-700 font-medium text-lg">{loadingText}</p>
                      <p className="text-gray-600 text-sm mt-2">This may take a few moments</p>
                      
                      <div className="w-80 h-2 bg-gray-200 rounded-full mx-auto mt-6 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-in-out rounded-full"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      
                      <p className="text-gray-500 text-xs mt-3">
                        {progressPercentage < 100 
                          ? `Estimated time remaining: ${Math.max(10 - checkAttempts, 1)} seconds` 
                          : 'Finalizing...'}
                      </p>
                    </div>
                  </div>
                )}
                
                {streetViewStatus === 'loaded' && streetViewUrl && (
                  <img 
                    src={streetViewUrl} 
                    alt="Street View" 
                    className="w-full h-full object-cover"
                    onError={() => setStreetViewStatus('error')}
                  />
                )}
                
                {streetViewStatus === 'error' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center p-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium">Street view not available</p>
                      <button 
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isRetrying ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Trying again...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try again
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Information Sections */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-blue-600" />
                  Basic Information
                </h4>
                <div className="space-y-4">
                  <InfoItem 
                    label="Property Type" 
                    value={property.summary?.propclass || property.summary?.proptype} 
                    icon={Building}
                  />
                  <InfoItem 
                    label="Building Size" 
                    value={property.building?.size?.universalsize} 
                    formatter={(v) => `${formatNumber(v)} sq ft`}
                    icon={Maximize2}
                  />
                  <InfoItem 
                    label="Lot Size" 
                    value={property.lot?.lotsize2} 
                    formatter={(v) => `${formatNumber(v)} sq ft`}
                    icon={Info}
                  />
                  {property.building?.rooms?.beds && (
                    <InfoItem 
                      label="Bedrooms" 
                      value={property.building.rooms.beds}
                      icon={Home}
                    />
                  )}
                  {property.building?.rooms?.bathstotal && (
                    <InfoItem 
                      label="Bathrooms" 
                      value={property.building.rooms.bathstotal}
                      icon={Home}
                    />
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                  Valuation
                </h4>
                <div className="space-y-4">
                  <InfoItem 
                    label="Market Value" 
                    value={marketValues.mktttlvalue || calculations.calcttlvalue}
                    formatter={formatCurrency}
                    icon={DollarSign}
                  />
                  <InfoItem 
                    label="Assessed Value" 
                    value={assessedValues.assdttlvalue}
                    formatter={formatCurrency}
                    icon={DollarSign}
                  />
                  <InfoItem 
                    label="Land Value" 
                    value={marketValues.mktlandvalue || calculations.calclandvalue || assessedValues.assdlandvalue}
                    formatter={formatCurrency}
                    icon={DollarSign}
                  />
                  <InfoItem 
                    label="Last Sale Price" 
                    value={property.sale?.amount?.saleamt}
                    formatter={formatCurrency}
                    icon={DollarSign}
                  />
                  <InfoItem 
                    label="Last Sale Date" 
                    value={property.sale?.salesearchdate}
                    formatter={formatDate}
                    icon={Calendar}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs with enhanced styling */}
        {activeTab === 'details' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-blue-600" />
                  Building Details
                </h4>
                <div className="space-y-4">
                  <InfoItem label="Year Built" value={property.summary?.yearbuilt} icon={Calendar} />
                  <InfoItem 
                    label="Total Size" 
                    value={property.building?.size?.universalsize} 
                    formatter={(v) => `${formatNumber(v)} sq ft`}
                    icon={Maximize2}
                  />
                  <InfoItem 
                    label="Living Area"
                    value={property.building?.size?.livingsize} 
                   formatter={(v) => `${formatNumber(v)} sq ft`}
                   icon={Home}
                 />
                 <InfoItem 
                   label="Stories" 
                   value={property.building?.summary?.levels || property.summary?.levels} 
                   icon={Building}
                 />
                 <InfoItem label="Total Rooms" value={property.building?.rooms?.roomsTotal} icon={Home} />
                 <InfoItem label="Bedrooms" value={property.building?.rooms?.beds} icon={Home} />
                 <InfoItem label="Full Bathrooms" value={property.building?.rooms?.bathsfull} icon={Home} />
                 <InfoItem label="Half Bathrooms" value={property.building?.rooms?.bathshalf} icon={Home} />
                 <InfoItem label="Fireplaces" value={property.building?.interior?.fplccount} icon={Home} />
               </div>
             </div>
             
             <div>
               <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
                 <Map className="h-5 w-5 mr-2 text-green-600" />
                 Lot Information
               </h4>
               <div className="space-y-4">
                 <InfoItem label="Lot Size (acres)" value={property.lot?.lotsize1} icon={Map} />
                 <InfoItem 
                   label="Lot Size (sq ft)" 
                   value={property.lot?.lotsize2} 
                   formatter={formatNumber}
                   icon={Map}
                 />
                 <InfoItem label="Lot Depth" value={property.lot?.depth} icon={Map} />
                 <InfoItem label="Lot Frontage" value={property.lot?.frontage} icon={Map} />
                 <InfoItem 
                   label="Pool" 
                   value={property.lot?.poolflag === 'Y' ? 'Yes' : (property.lot?.pooltype === 'NO POOL' ? 'No' : null)}
                   icon={Info}
                 />
                 <InfoItem label="Garage Type" value={property.lot?.garagetype} icon={Building} />
                 <InfoItem 
                   label="Garage Size" 
                   value={property.lot?.garageSquareFootage} 
                   formatter={(v) => `${formatNumber(v)} sq ft`}
                   icon={Building}
                 />
               </div>
             </div>
           </div>
         </div>
       )}

       {activeTab === 'valuation' && (
         <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
           <div className="grid md:grid-cols-2 gap-6">
             <div>
               <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
                 <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                 Assessment
               </h4>
               <div className="space-y-4">
                 <InfoItem 
                   label="Total Assessed Value" 
                   value={assessedValues.assdttlvalue}
                   formatter={formatCurrency}
                   icon={DollarSign}
                 />
                 <InfoItem 
                   label="Improvements Value" 
                   value={assessedValues.assdimprvalue}
                   formatter={formatCurrency}
                   icon={DollarSign}
                 />
                 <InfoItem 
                   label="Land Value" 
                   value={assessedValues.assdlandvalue}
                   formatter={formatCurrency}
                   icon={DollarSign}
                 />
                 <InfoItem 
                   label="Tax Year" 
                   value={taxInfo.taxyear}
                   icon={Calendar}
                 />
                 <InfoItem 
                   label="Annual Tax" 
                   value={taxInfo.taxamt}
                   formatter={formatCurrency}
                   icon={DollarSign}
                 />
               </div>
             </div>
             
             <div>
               <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
                 <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                 Market Value
               </h4>
               <div className="space-y-4">
                 <InfoItem 
                   label="Total Market Value" 
                   value={marketValues.mktttlvalue || calculations.calcttlvalue}
                   formatter={formatCurrency}
                   icon={DollarSign}
                 />
                 <InfoItem 
                   label="Market Improvements Value" 
                   value={marketValues.mktimprvalue || calculations.calcimprvalue}
                   formatter={formatCurrency}
                   icon={DollarSign}
                 />
                 <InfoItem 
                   label="Market Land Value" 
                   value={marketValues.mktlandvalue || calculations.calclandvalue}
                   formatter={formatCurrency}
                   icon={DollarSign}
                 />
               </div>
             </div>
           </div>
         </div>
       )}

       {activeTab === 'owner' && (
         <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
           <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
             <User className="h-5 w-5 mr-2 text-purple-600" />
             Owner Information
           </h4>
           {property.owner ? (
             Array.isArray(property.owner) ? (
               <div className="space-y-6">
                 {property.owner.map((owner, index) => (
                   <div key={index} className="bg-gray-50 rounded-xl p-6">
                     {property.owner.length > 1 && (
                       <h5 className="font-medium text-gray-900 mb-4">Owner {index + 1}</h5>
                     )}
                     <div className="space-y-4">
                       <InfoItem label="Name" value={owner.name} icon={User} />
                       <InfoItem label="Co-Owner" value={owner.secondname} icon={User} />
                       <InfoItem label="Owner Type" value={owner.ownertype} icon={Info} />
                       {owner.mailingaddress && (
                         <>
                           <InfoItem label="Mailing Address" value={owner.mailingaddress.line1} icon={MapPin} />
                           {owner.mailingaddress.line2 && (
                             <InfoItem label="" value={owner.mailingaddress.line2} icon={MapPin} />
                           )}
                           <InfoItem 
                             label="City, State ZIP" 
                             value={`${owner.mailingaddress.city || ''}, ${owner.mailingaddress.state || ''} ${owner.mailingaddress.postal1 || ''}`}
                             icon={MapPin}
                           />
                         </>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="bg-gray-50 rounded-xl p-6">
                 <div className="space-y-4">
                   <InfoItem label="Owner Name" value={property.owner.owner1?.fullname} icon={User} />
                   <InfoItem 
                     label="Corporate" 
                     value={property.owner.corporateindicator === 'Y' ? 'Yes' : 'No'}
                     icon={Building}
                   />
                   <InfoItem 
                     label="Owner Status" 
                     value={property.owner.absenteeownerstatus === 'O' ? 'Owner Occupied' : 'Absentee Owner'}
                     icon={Home}
                   />
                   <InfoItem label="Mailing Address" value={property.owner.mailingaddressoneline} icon={MapPin} />
                 </div>
               </div>
             )
           ) : (
             <div className="text-center py-12">
               <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                 <User className="w-8 h-8 text-gray-400" />
               </div>
               <p className="text-gray-500 font-medium">No owner information available</p>
             </div>
           )}
         </div>
       )}

       {activeTab === 'history' && (
         <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
           <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
             <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
             Transaction History
           </h4>
           {(property.sale || property.expandedProfile?.salesHistory?.length > 0) ? (
             <div className="space-y-6">
               {property.expandedProfile?.salesHistory?.map((history, index) => (
                 <div key={index} className="relative pl-8 pb-6">
                   <div className="absolute left-0 top-0 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg"></div>
                   {index < property.expandedProfile.salesHistory.length - 1 && (
                     <div className="absolute left-2 top-4 w-0.5 h-full bg-gray-200"></div>
                   )}
                   <div className="bg-blue-50 rounded-xl p-6 ml-4">
                     <h5 className="font-semibold text-blue-900 text-lg mb-4">
                       {formatDate(history.recordingDate)}
                     </h5>
                     <div className="grid md:grid-cols-2 gap-4">
                       <InfoItem label="Amount" value={history.amount} formatter={formatCurrency} icon={DollarSign} />
                       <InfoItem label="Type" value={history.transactionType} icon={Info} />
                       <InfoItem label="Document #" value={history.recordingDocumentNumber} icon={Info} />
                       <InfoItem label="Grantee" value={history.grantee} icon={User} />
                       <InfoItem label="Grantor" value={history.grantor} icon={User} />
                     </div>
                   </div>
                 </div>
               ))}
               
               {property.sale && !property.expandedProfile?.salesHistory?.length && (
                 <div className="relative pl-8">
                   <div className="absolute left-0 top-0 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg"></div>
                   <div className="bg-blue-50 rounded-xl p-6 ml-4">
                     <h5 className="font-semibold text-blue-900 text-lg mb-4">
                       {formatDate(property.sale.salesearchdate)}
                     </h5>
                     <div className="grid md:grid-cols-2 gap-4">
                       <InfoItem label="Sale Price" value={property.sale.amount?.saleamt} formatter={formatCurrency} icon={DollarSign} />
                       <InfoItem label="Document Type" value={property.sale.amount?.saledoctype} icon={Info} />
                       <InfoItem label="Document Number" value={property.sale.amount?.saledocnum} icon={Info} />
                       <InfoItem label="Transaction Type" value={property.sale.amount?.saletranstype} icon={Info} />
                     </div>
                   </div>
                 </div>
               )}
             </div>
           ) : (
             <div className="text-center py-12">
               <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                 <Calendar className="w-8 h-8 text-gray-400" />
               </div>
               <p className="text-gray-500 font-medium">No transaction history available</p>
             </div>
           )}
         </div>
       )}
     </div>
   </div>
 );
};

const getPropertyAddress = (property) => {
 if (property.address?.oneLine) return property.address.oneLine;
 
 let address = '';
 if (property.address?.line1) address += property.address.line1;
 
 const parts = [];
 if (property.address?.city) parts.push(property.address.city);
 if (property.address?.state) parts.push(property.address.state);
 if (property.address?.postal1) parts.push(property.address.postal1);
 
 if (parts.length > 0) {
   address += (address ? ', ' : '') + parts.join(', ');
 }
 
 return address || 'Address Unknown';
};

export default PropertyDetails;