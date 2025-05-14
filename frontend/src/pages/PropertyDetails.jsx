// Updated PropertyDetails.jsx with enhanced map loading state
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
  const [streetViewStatus, setStreetViewStatus] = useState('checking'); // 'checking', 'loading', 'loaded', 'error'
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [streetViewUrl, setStreetViewUrl] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [loadingText, setLoadingText] = useState('Checking for street view image...');

  // Check if property has street view image or try to construct the path
  useEffect(() => {
    // Reset status when property changes
    setStreetViewStatus('checking');
    setCheckAttempts(0);
    setStreetViewUrl(null);
    setIsRetrying(false);
    setLoadingText('Checking for street view image...');
    
    let intervalId = null;
    let timeoutId = null;
    
    // If property already has a streetViewImage, use it
    if (property.streetViewImage) {
      setStreetViewUrl(property.streetViewImage);
      setStreetViewStatus('loaded');
      return () => {
        if (intervalId) clearInterval(intervalId);
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
    
    // Otherwise, try to construct a potential URL if we have a property ID
    const propertyId = property.identifier?.attomId || property.attomId;
    if (propertyId) {
      // First check the status endpoint to see if image is being processed
      const checkStatus = async () => {
        try {
          const response = await fetch(`/api/images/streetview-status/${propertyId}`);
          if (response.ok) {
            const data = await response.json();
            
            if (data.status === 'complete') {
              // Image is ready
              setStreetViewUrl(data.url);
              setStreetViewStatus('loaded');
              return true; // Done checking
            } else if (data.status === 'processing') {
              // Image is being processed, show loading state with specific text
              setStreetViewStatus('loading');
              
              // Update loading text based on where we are in the process
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
                // Rotate through loading messages if we don't have elapsed time
                const messages = [
                  'Locating property on map...',
                  'Looking for street view data...',
                  'Getting street view imagery...',
                  'Finalizing street view capture...'
                ];
                setLoadingText(messages[checkAttempts % messages.length]);
              }
              
              setCheckAttempts(prev => Math.min(prev + 1, 10));
              return false; // Continue checking
            } else {
              // Image not found and not being processed
              setStreetViewStatus('error');
              return true; // Done checking
            }
          } else {
            // Error checking status
            console.error('Error checking street view status:', response.statusText);
            setStreetViewStatus('error');
            return true; // Done checking
          }
        } catch (error) {
          console.error('Error checking street view status:', error);
          setStreetViewStatus('error');
          return true; // Done checking
        }
      };
      
      // Add a simulated delay to show the checking state (better UX)
      timeoutId = setTimeout(() => {
        if (streetViewStatus === 'checking') {
          setStreetViewStatus('loading');
          setLoadingText('Connecting to mapping service...');
        }
      }, 1000);
      
      // Do initial check
      checkStatus();
      
      // Set up periodic checks
      intervalId = setInterval(async () => {
        // Only continue checking if we're in checking or loading state
        if (streetViewStatus === 'checking' || streetViewStatus === 'loading') {
          const done = await checkStatus();
          if (done) {
            clearInterval(intervalId);
          }
        } else {
          // Already loaded or error, stop checking
          clearInterval(intervalId);
        }
      }, 3000); // Check every 3 seconds
    } else {
      // No property ID, can't construct URL
      setStreetViewStatus('error');
    }
    
    // Clean up interval and timeout
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [property, isRetrying]);

  const handleRetry = () => {
    // Reset status and try again
    setStreetViewStatus('checking');
    setCheckAttempts(0);
    setLoadingText('Initiating new street view capture...');
    
    // Trigger a manual capture
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

  // Helper function to get values from any of the possible paths
  const getPropertyValue = (path) => {
    // Check events path first
    const eventsPath = path.split('.').reduce((obj, key) => obj?.events?.[key], property);
    if (eventsPath !== undefined && eventsPath !== null) return eventsPath;
    
    // Check direct path
    const directPath = path.split('.').reduce((obj, key) => obj?.[key], property);
    return directPath;
  };

  const InfoItem = ({ label, value, icon: Icon, formatter = (v) => v }) => {
    const formattedValue = value !== null && value !== undefined ? formatter(value) : null;
    
    if (!formattedValue) return null;
    
    return (
      <div className="flex items-start gap-3 py-2">
        {Icon && <Icon className="h-5 w-5 text-gray-400 mt-0.5" />}
        <div className="flex-1">
          <span className="text-sm text-gray-500">{label}:</span>
          <span className="ml-2 text-gray-900">{formattedValue}</span>
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

  // Get assessment data from either path
  const assessment = getPropertyValue('assessment') || {};
  const assessedValues = assessment.assessed || {};
  const marketValues = assessment.market || {};
  const taxInfo = assessment.tax || {};
  const calculations = assessment.calculations || {};

  // Calculate progress for the loading bar
  const progressPercentage = Math.min((checkAttempts / 10) * 100, 100);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {property.fullAddress || getPropertyAddress(property)}
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {property.summary?.propclass || property.summary?.proptype || 'Property'}
          </div>
          {property.summary?.yearbuilt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Built in {property.summary.yearbuilt}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div>
            {/* Street View Image Section - With enhanced loading states */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Street View</h4>
              <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                {streetViewStatus === 'checking' && (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 mx-auto text-gray-400 mb-3 animate-spin" />
                    <p className="text-gray-600 font-medium">{loadingText}</p>
                    <p className="text-xs text-gray-500 mt-2">Please wait while we locate this property</p>
                  </div>
                )}
                
                {streetViewStatus === 'loading' && (
                  <div className="p-8 text-center">
                    <div className="relative w-16 h-16 mx-auto mb-3">
                      <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                      <Map className="w-8 h-8 text-blue-700 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-gray-700 font-medium">{loadingText}</p>
                    <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
                    
                    {/* Animated progress bar */}
                    <div className="w-64 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500 ease-in-out rounded-full"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    
                    {/* Estimated time remaining */}
                    <p className="text-xs text-gray-400 mt-2">
                      {progressPercentage < 100 
                        ? `Estimated time remaining: ${Math.max(10 - checkAttempts, 1)} seconds` 
                        : 'Finalizing...'}
                    </p>
                  </div>
                )}
                
                {streetViewStatus === 'loaded' && streetViewUrl && (
                  <img 
                    src={streetViewUrl} 
                    alt="Street View" 
                    className="w-full h-auto"
                    onError={() => setStreetViewStatus('error')}
                  />
                )}
                
                {streetViewStatus === 'error' && (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">Street view not available for this property</p>
                    <button 
                      onClick={handleRetry}
                      disabled={isRetrying}
                      className="mt-3 flex items-center gap-2 mx-auto text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {isRetrying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Trying again...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Try again
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Original content */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Basic Information</h4>
                <div className="space-y-2">
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
                    />
                  )}
                  {property.building?.rooms?.bathstotal && (
                    <InfoItem 
                      label="Bathrooms" 
                      value={property.building.rooms.bathstotal}
                    />
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Valuation</h4>
                <div className="space-y-2">
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
                  />
                  <InfoItem 
                    label="Land Value" 
                    value={marketValues.mktlandvalue || calculations.calclandvalue || assessedValues.assdlandvalue}
                    formatter={formatCurrency}
                  />
                  <InfoItem 
                    label="Last Sale Price" 
                    value={property.sale?.amount?.saleamt}
                    formatter={formatCurrency}
                  />
                  <InfoItem 
                    label="Last Sale Date" 
                    value={property.sale?.salesearchdate}
                    formatter={formatDate}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Building Details</h4>
              <div className="space-y-2">
                <InfoItem label="Year Built" value={property.summary?.yearbuilt} />
                <InfoItem 
                  label="Total Size" 
                  value={property.building?.size?.universalsize} 
                  formatter={(v) => `${formatNumber(v)} sq ft`}
                />
                <InfoItem 
                  label="Living Area" 
                  value={property.building?.size?.livingsize} 
                  formatter={(v) => `${formatNumber(v)} sq ft`}
                />
                <InfoItem 
                  label="Stories" 
                  value={property.building?.summary?.levels || property.summary?.levels} 
                />
                <InfoItem label="Total Rooms" value={property.building?.rooms?.roomsTotal} />
                <InfoItem label="Bedrooms" value={property.building?.rooms?.beds} />
                <InfoItem label="Full Bathrooms" value={property.building?.rooms?.bathsfull} />
                <InfoItem label="Half Bathrooms" value={property.building?.rooms?.bathshalf} />
                <InfoItem label="Fireplaces" value={property.building?.interior?.fplccount} />
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Lot Information</h4>
              <div className="space-y-2">
                <InfoItem label="Lot Size (acres)" value={property.lot?.lotsize1} />
                <InfoItem 
                  label="Lot Size (sq ft)" 
                  value={property.lot?.lotsize2} 
                  formatter={formatNumber}
                />
                <InfoItem label="Lot Depth" value={property.lot?.depth} />
                <InfoItem label="Lot Frontage" value={property.lot?.frontage} />
                <InfoItem 
                  label="Pool" 
                  value={property.lot?.poolflag === 'Y' ? 'Yes' : (property.lot?.pooltype === 'NO POOL' ? 'No' : null)}
                />
                <InfoItem label="Garage Type" value={property.lot?.garagetype} />
                <InfoItem 
                  label="Garage Size" 
                  value={property.lot?.garageSquareFootage} 
                  formatter={(v) => `${formatNumber(v)} sq ft`}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'valuation' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Assessment</h4>
              <div className="space-y-2">
                <InfoItem 
                  label="Total Assessed Value" 
                  value={assessedValues.assdttlvalue}
                  formatter={formatCurrency}
                />
                <InfoItem 
                  label="Improvements Value" 
                  value={assessedValues.assdimprvalue}
                  formatter={formatCurrency}
                />
                <InfoItem 
                  label="Land Value" 
                  value={assessedValues.assdlandvalue}
                  formatter={formatCurrency}
                />
                <InfoItem 
                  label="Tax Year" 
                  value={taxInfo.taxyear}
                />
                <InfoItem 
                  label="Annual Tax" 
                  value={taxInfo.taxamt}
                  formatter={formatCurrency}
                />
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Market Value</h4>
              <div className="space-y-2">
                <InfoItem 
                  label="Total Market Value" 
                  value={marketValues.mktttlvalue || calculations.calcttlvalue}
                  formatter={formatCurrency}
                />
                <InfoItem 
                  label="Market Improvements Value" 
                  value={marketValues.mktimprvalue || calculations.calcimprvalue}
                  formatter={formatCurrency}
                />
                <InfoItem 
                  label="Market Land Value" 
                  value={marketValues.mktlandvalue || calculations.calclandvalue}
                  formatter={formatCurrency}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'owner' && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Owner Information</h4>
            {property.owner ? (
              Array.isArray(property.owner) ? (
                property.owner.map((owner, index) => (
                  <div key={index} className="mb-6">
                    {property.owner.length > 1 && (
                      <h5 className="font-medium text-gray-900 mb-2">Owner {index + 1}</h5>
                    )}
                    <div className="space-y-2">
                      <InfoItem label="Name" value={owner.name} />
                      <InfoItem label="Co-Owner" value={owner.secondname} />
                      <InfoItem label="Owner Type" value={owner.ownertype} />
                      {owner.mailingaddress && (
                        <>
                          <InfoItem label="Mailing Address" value={owner.mailingaddress.line1} />
                          {owner.mailingaddress.line2 && (
                            <InfoItem label="" value={owner.mailingaddress.line2} />
                          )}
                          <InfoItem 
                            label="City, State ZIP" 
                            value={`${owner.mailingaddress.city || ''}, ${owner.mailingaddress.state || ''} ${owner.mailingaddress.postal1 || ''}`}
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  <InfoItem label="Owner Name" value={property.owner.owner1?.fullname} />
                  <InfoItem 
                    label="Corporate" 
                    value={property.owner.corporateindicator === 'Y' ? 'Yes' : 'No'}
                  />
                  <InfoItem 
                    label="Owner Status" 
                    value={property.owner.absenteeownerstatus === 'O' ? 'Owner Occupied' : 'Absentee Owner'}
                  />
                  <InfoItem label="Mailing Address" value={property.owner.mailingaddressoneline} />
                </div>
              )
            ) : (
              <p className="text-gray-500">No owner information available</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Transaction History</h4>
            {(property.sale || property.expandedProfile?.salesHistory?.length > 0) ? (
              <div className="space-y-4">
                {property.expandedProfile?.salesHistory?.map((history, index) => (
                  <div key={index} className="border-l-4 border-blue-600 pl-4 pb-4">
                    <h5 className="font-medium text-blue-800">
                      {formatDate(history.recordingDate)}
                    </h5>
                    <div className="mt-2 space-y-1 text-sm">
                      <InfoItem label="Amount" value={history.amount} formatter={formatCurrency} />
                      <InfoItem label="Type" value={history.transactionType} />
                      <InfoItem label="Document #" value={history.recordingDocumentNumber} />
                      <InfoItem label="Grantee" value={history.grantee} />
                      <InfoItem label="Grantor" value={history.grantor} />
                    </div>
                  </div>
                ))}
                
                {property.sale && !property.expandedProfile?.salesHistory?.length && (
                  <div className="border-l-4 border-blue-600 pl-4 pb-4">
                    <h5 className="font-medium text-blue-800">
                      {formatDate(property.sale.salesearchdate)}
                    </h5>
                    <div className="mt-2 space-y-1 text-sm">
                      <InfoItem label="Sale Price" value={property.sale.amount?.saleamt} formatter={formatCurrency} />
                      <InfoItem label="Document Type" value={property.sale.amount?.saledoctype} />
                      <InfoItem label="Document Number" value={property.sale.amount?.saledocnum} />
                      <InfoItem label="Transaction Type" value={property.sale.amount?.saletranstype} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No transaction history available</p>
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