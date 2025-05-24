// frontend/src/pages/PropertyDetails.jsx - Smart conditional rendering version
import {
  Activity,
  Award,
  BarChart3,
  Building,
  Calendar,
  DollarSign,
  Eye,
  FileText,
  Home,
  Info,
  Loader2,
  Map,
  MapPin,
  Maximize2,
  RefreshCw,
  Target,
  TrendingUp,
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
  const [availableTabs, setAvailableTabs] = useState([]);

  // Helper function to check if data exists
  const hasData = (obj, paths) => {
    if (!obj) return false;
    if (typeof paths === 'string') paths = [paths];
    return paths.some(path => {
      const value = path.split('.').reduce((current, key) => current?.[key], obj);
      return value !== null && value !== undefined && value !== '' && 
             !(Array.isArray(value) && value.length === 0) &&
             !(typeof value === 'object' && Object.keys(value).length === 0);
    });
  };

  // Helper function to check if any data exists in an object
  const hasAnyData = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    return Object.values(obj).some(value => 
      value !== null && value !== undefined && value !== '' &&
      !(Array.isArray(value) && value.length === 0) &&
      !(typeof value === 'object' && Object.keys(value).length === 0)
    );
  };

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

  // Calculate available tabs based on data availability
  useEffect(() => {
    if (!property) return;

    const assessment = getPropertyValue('assessment') || {};
    const building = property.building || {};
    const sale = property.sale || {};
    const owner = property.owner || {};
    const avm = property.events?.avm || {};
    const area = property.area || {};
    const location = property.location || {};
    const identifier = property.identifier || {};

    const tabs = [
      { id: 'overview', label: 'Overview', icon: Home, show: true }, // Always show overview
    ];

    // Building tab - check if we have building, lot, or room data
    if (hasAnyData(building) || hasData(property, ['lot.lotnum', 'lot.lotsize1', 'lot.lotsize2', 'lot.pooltype'])) {
      tabs.push({ id: 'building', label: 'Building Details', icon: Building, show: true });
    }

    // Assessment tab - check if we have assessment or tax data
    if (hasAnyData(assessment) || hasData(property, ['events.assessment'])) {
      tabs.push({ id: 'assessment', label: 'Assessment & Tax', icon: DollarSign, show: true });
    }

    // Valuation tab - check if we have AVM data
    if (hasAnyData(avm) || hasData(property, ['events.avm.amount.value', 'events.avm.eventDate'])) {
      tabs.push({ id: 'valuation', label: 'Valuation & AVM', icon: TrendingUp, show: true });
    }

    // Sale tab - check if we have sale data
    if (hasAnyData(sale) || hasData(property, ['events.sale', 'sale.amount.saleamt', 'expandedProfile.salesHistory'])) {
      tabs.push({ id: 'sale', label: 'Sales History', icon: Calendar, show: true });
    }

    // Owner tab - check if we have owner data
    if (hasAnyData(owner) || hasData(property, ['owner.owner1.fullname', 'owner.corporateindicator'])) {
      tabs.push({ id: 'owner', label: 'Owner Info', icon: User, show: true });
    }

    // Location tab - check if we have location or area data
    if (hasAnyData(location) || hasAnyData(area) || hasData(property, ['address', 'location.latitude'])) {
      tabs.push({ id: 'location', label: 'Location & Area', icon: MapPin, show: true });
    }

    // Technical tab - check if we have technical data
    if (hasAnyData(identifier) || hasData(property, ['vintage', 'summary.legal1', 'identifier.attomId'])) {
      tabs.push({ id: 'technical', label: 'Technical Data', icon: Info, show: true });
    }

    setAvailableTabs(tabs);

    // Set the first available tab as active if current tab is not available
    if (tabs.length > 0 && !tabs.find(tab => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [property, activeTab]);

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

  // Helper functions
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

  const formatPercentage = (value) => {
    if (!value) return null;
    return `${value}%`;
  };

  const getPropertyValue = (path) => {
    const eventsPath = path.split('.').reduce((obj, key) => obj?.events?.[key], property);
    if (eventsPath !== undefined && eventsPath !== null) return eventsPath;
    
    const directPath = path.split('.').reduce((obj, key) => obj?.[key], property);
    return directPath;
  };

  const InfoItem = ({ label, value, icon: Icon, formatter = (v) => v, className = "" }) => {
    const formattedValue = value !== null && value !== undefined ? formatter(value) : null;
    
    if (!formattedValue) return null;
    
    return (
      <div className={`group p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 ${className}`}>
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

  const SectionCard = ({ title, icon: Icon, children, className = "" }) => {
    // Only render if children has content
    if (!children || (React.Children.count(children) === 0)) return null;
    
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 ${className}`}>
        <div className="p-4 lg:p-6 border-b border-gray-100">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Icon className="h-5 w-5 mr-2 text-blue-600" />
            {title}
          </h4>
        </div>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </div>
    );
  };

  // Get all the data objects
  const assessment = getPropertyValue('assessment') || {};
  const assessedValues = assessment.assessed || {};
  const marketValues = assessment.market || {};
  const taxInfo = assessment.tax || {};
  const calculations = assessment.calculations || {};
  const building = property.building || {};
  const buildingSize = building.size || {};
  const buildingSummary = building.summary || {};
  const buildingRooms = building.rooms || {};
  const buildingInterior = building.interior || {};
  const lot = property.lot || {};
  const area = property.area || {};
  const summary = property.summary || {};
  const location = property.location || {};
  const identifier = property.identifier || {};
  const vintage = property.vintage || {};
  const owner = property.owner || {};
  const sale = property.sale || {};
  const saleAmount = sale.amount || {};
  const saleCalculation = sale.calculation || {};
  const avm = property.events?.avm || {};
  const avmAmount = avm.amount || {};
  const avmChange = avm.AVMChange || {};
  const avmCalculations = avm.calculations || {};
  const avmCondition = avm.condition || {};

  const progressPercentage = Math.min((checkAttempts / 10) * 100, 100);

  return (
    <div className="w-full p-6 space-y-6">
      {/* Property Header - Enhanced */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          {property.fullAddress || getPropertyAddress(property)}
        </h3>
        <div className="flex flex-wrap gap-3">
          {summary.propclass && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 font-medium">
              <Building className="h-4 w-4 mr-1" />
              {summary.propclass}
            </span>
          )}
          {summary.yearbuilt && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 font-medium">
              <Calendar className="h-4 w-4 mr-1" />
              Built in {summary.yearbuilt}
            </span>
          )}
          {identifier.attomId && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 font-medium">
              <Info className="h-4 w-4 mr-1" />
              ID: {identifier.attomId}
            </span>
          )}
          {summary.absenteeInd && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800 font-medium">
              <User className="h-4 w-4 mr-1" />
              {summary.absenteeInd}
            </span>
          )}
        </div>
      </div>

      {/* Enhanced Tabs - Only show available tabs */}
      {availableTabs.length > 1 && (
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 overflow-x-auto">
            {availableTabs.map(tab => (
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
      )}

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Street View Section */}
            <SectionCard title="Street View" icon={Map}>
              <div className="aspect-video bg-gray-50 relative overflow-hidden rounded-xl">
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
            </SectionCard>

            {/* Key Information Grid - Only show sections with data */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Basic Property Info - Only show if we have summary data */}
              {hasAnyData(summary) && (
                <SectionCard title="Property Information" icon={Building}>
                  <div className="space-y-4">
                    <InfoItem label="Property Type" value={summary.proptype || summary.propertyType} icon={Building} />
                    <InfoItem label="Property Class" value={summary.propclass} icon={Building} />
                    <InfoItem label="Property Subtype" value={summary.propsubtype} icon={Building} />
                    <InfoItem label="Land Use" value={summary.propLandUse} icon={Building} />
                    <InfoItem label="Year Built" value={summary.yearbuilt} icon={Calendar} />
                    <InfoItem label="Effective Year Built" value={buildingSummary.yearbuilteffective} icon={Calendar} />
                    <InfoItem label="Building Type" value={buildingSummary.bldgType} icon={Building} />
                    <InfoItem label="Improvement Type" value={buildingSummary.imprType} icon={Building} />
                    <InfoItem label="Stories/Levels" value={buildingSummary.levels} icon={Building} />
                    <InfoItem label="Units Count" value={buildingSummary.unitsCount} icon={Building} />
                  </div>
                </SectionCard>
              )}

              {/* Size & Space - Only show if we have size or lot data */}
              {(hasAnyData(buildingSize) || hasAnyData(lot)) && (
                <SectionCard title="Size & Space" icon={Maximize2}>
                  <div className="space-y-4">
                    <InfoItem 
                      label="Total Building Size" 
                      value={buildingSize.bldgsize || buildingSize.universalsize} 
                      formatter={(v) => `${formatNumber(v)} sq ft`}
                      icon={Maximize2}
                    />
                    <InfoItem 
                      label="Living Size" 
                      value={buildingSize.livingsize} 
                      formatter={(v) => `${formatNumber(v)} sq ft`}
                      icon={Home}
                    />
                    <InfoItem 
                      label="Gross Size" 
                      value={buildingSize.grosssize} 
                      formatter={(v) => `${formatNumber(v)} sq ft`}
                      icon={Maximize2}
                    />
                    <InfoItem 
                      label="Adjusted Gross Size" 
                      value={buildingSize.grosssizeadjusted} 
                      formatter={(v) => `${formatNumber(v)} sq ft`}
                      icon={Maximize2}
                    />
                    <InfoItem label="Size Indicator" value={buildingSize.sizeInd} icon={Info} />
                    <InfoItem 
                      label="Lot Size (Acres)" 
                      value={lot.lotsize1} 
                      formatter={(v) => `${v} acres`}
                      icon={Map}
                    />
                    <InfoItem 
                      label="Lot Size (Sq Ft)" 
                      value={lot.lotsize2} 
                      formatter={(v) => `${formatNumber(v)} sq ft`}
                      icon={Map}
                    />
                    <InfoItem label="Lot Number" value={lot.lotnum} icon={Info} />
                  </div>
                </SectionCard>
              )}
            </div>

            {/* Quick Value Overview - Only show if we have value data */}
            {(avmAmount.value || marketValues.mktttlvalue || calculations.calcttlvalue || saleAmount.saleamt) && (
              <SectionCard title="Value Overview" icon={DollarSign}>
                <div className="grid md:grid-cols-3 gap-4">
                  {avmAmount.value && (
                    <InfoItem 
                      label="AVM Value" 
                      value={avmAmount.value}
                      formatter={formatCurrency}
                      icon={DollarSign}
                      className="border border-green-200 bg-green-50"
                    />
                  )}
                  {(marketValues.mktttlvalue || calculations.calcttlvalue) && (
                    <InfoItem 
                      label="Market Total Value" 
                      value={marketValues.mktttlvalue || calculations.calcttlvalue}
                      formatter={formatCurrency}
                      icon={DollarSign}
                      className="border border-blue-200 bg-blue-50"
                    />
                  )}
                  {saleAmount.saleamt && (
                    <InfoItem 
                      label="Last Sale Price" 
                      value={saleAmount.saleamt}
                      formatter={formatCurrency}
                      icon={DollarSign}
                      className="border border-purple-200 bg-purple-50"
                    />
                  )}
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {activeTab === 'building' && (
          <div className="space-y-6">
            {/* Building Details - Only show sections with data */}
            <div className="grid md:grid-cols-2 gap-6">
              {(hasAnyData(buildingSummary) || summary.yearbuilt) && (
                <SectionCard title="Building Structure" icon={Building}>
                  <div className="space-y-4">
                    <InfoItem label="Building Type" value={buildingSummary.bldgType} icon={Building} />
                    <InfoItem label="Improvement Type" value={buildingSummary.imprType} icon={Building} />
                    <InfoItem label="Story Description" value={buildingSummary.storyDesc} icon={Building} />
                    <InfoItem label="Number of Levels" value={buildingSummary.levels} icon={Building} />
                    <InfoItem label="Units Count" value={buildingSummary.unitsCount} icon={Building} />
                    <InfoItem label="Year Built" value={summary.yearbuilt} icon={Calendar} />
                    <InfoItem label="Effective Year Built" value={buildingSummary.yearbuilteffective} icon={Calendar} />
                    <InfoItem label="View" value={buildingSummary.view} icon={Eye} />
                    <InfoItem label="View Code" value={buildingSummary.viewCode} icon={Eye} />
                  </div>
                </SectionCard>
              )}

              {hasAnyData(buildingSize) && (
                <SectionCard title="Building Dimensions" icon={Maximize2}>
                  <div className="space-y-4">
                    <InfoItem 
                      label="Universal Size" 
                      value={buildingSize.universalsize} 
                      formatter={(v) => `${formatNumber(v)} sq ft`}
                      icon={Maximize2}
                    />
                    <InfoItem 
                      label="Building Size" 
                      value={buildingSize.bldgsize} 
                      formatter={(v) => `${formatNumber(v)} sq ft`}
                      icon={Building}
                    />
                    <InfoItem 
                      label="Living Size" 
                      value={buildingSize.livingsize} 
                      formatter={(v) => `${formatNumber(v)} sq ft`}
                      icon={Home}
                    />
                    <InfoItem 
                      label="Gross Size" 
                      value={buildingSize.grosssize} 
                      formatter={(v) => `${formatNumber(v)} sq ft`}
                      icon={Maximize2}
                    />
                    <InfoItem 
                      label="Adjusted Gross Size" 
                      value={buildingSize.grosssizeadjusted} 
                      formatter={(v) => `${formatNumber(v)} sq ft`}
                      icon={Maximize2}
                    />
                    <InfoItem label="Size Indicator" value={buildingSize.sizeInd} icon={Info} />
                  </div>
                </SectionCard>
              )}
            </div>

            {/* Rooms & Interior - Only show if we have room or interior data */}
            <div className="grid md:grid-cols-2 gap-6">
              {hasAnyData(buildingRooms) && (
                <SectionCard title="Room Information" icon={Home}>
                  <div className="space-y-4">
                    <InfoItem label="Total Rooms" value={buildingRooms.roomsTotal} icon={Home} />
                    <InfoItem label="Bedrooms" value={buildingRooms.beds} icon={Home} />
                    <InfoItem label="Total Bathrooms" value={buildingRooms.bathstotal} icon={Home} />
                    <InfoItem label="Full Bathrooms" value={buildingRooms.bathsfull} icon={Home} />
                    <InfoItem label="Half Bathrooms" value={buildingRooms.bathshalf} icon={Home} />
                    <InfoItem label="Quarter Bathrooms" value={buildingRooms.bathsqtr} icon={Home} />
                    <InfoItem label="Three Quarter Baths" value={buildingRooms.baths3qtr} icon={Home} />
                  </div>
                </SectionCard>
              )}

              {hasAnyData(buildingInterior) && (
                <SectionCard title="Interior Features" icon={Home}>
                  <div className="space-y-4">
                  <InfoItem label="Fireplaces" value={buildingInterior.fplccount} icon={Home} />
                   <InfoItem label="Fireplace Type" value={buildingInterior.fplctype} icon={Home} />
                   <InfoItem label="Basement" value={buildingInterior.bsmttype} icon={Building} />
                   <InfoItem label="Basement Size" value={buildingInterior.bsmtsize} formatter={(v) => `${formatNumber(v)} sq ft`} icon={Building} />
                   <InfoItem label="Heating Type" value={buildingInterior.heating} icon={Home} />
                   <InfoItem label="Cooling Type" value={buildingInterior.cooling} icon={Home} />
                   <InfoItem label="Interior Condition" value={buildingInterior.condition} icon={Home} />
                 </div>
               </SectionCard>
             )}
           </div>

           {/* Lot Information - Only show if we have lot data */}
           {hasAnyData(lot) && (
             <SectionCard title="Lot & External Features" icon={Map}>
               <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <InfoItem label="Lot Number" value={lot.lotnum} icon={Info} />
                   <InfoItem 
                     label="Lot Size (Acres)" 
                     value={lot.lotsize1} 
                     formatter={(v) => `${v} acres`}
                     icon={Map}
                   />
                   <InfoItem 
                     label="Lot Size (Sq Ft)" 
                     value={lot.lotsize2} 
                     formatter={(v) => `${formatNumber(v)} sq ft`}
                     icon={Map}
                   />
                   <InfoItem label="Lot Depth" value={lot.depth} formatter={(v) => `${v} ft`} icon={Map} />
                   <InfoItem label="Lot Frontage" value={lot.frontage} formatter={(v) => `${v} ft`} icon={Map} />
                 </div>
                 <div className="space-y-4">
                   <InfoItem label="Pool Type" value={lot.pooltype} icon={Info} />
                   <InfoItem label="Pool Flag" value={lot.poolflag === 'Y' ? 'Yes' : lot.poolflag === 'N' ? 'No' : lot.poolflag} icon={Info} />
                   <InfoItem label="Garage Type" value={lot.garagetype} icon={Building} />
                   <InfoItem 
                     label="Garage Size" 
                     value={lot.garageSquareFootage} 
                     formatter={(v) => `${formatNumber(v)} sq ft`}
                     icon={Building}
                   />
                   <InfoItem label="Parking Spaces" value={lot.parkingSpaces} icon={Building} />
                 </div>
               </div>
             </SectionCard>
           )}
         </div>
       )}

       {activeTab === 'assessment' && (
         <div className="space-y-6">
           <div className="grid md:grid-cols-2 gap-6">
             {/* Assessed Values - Only show if we have assessed values */}
             {hasAnyData(assessedValues) && (
               <SectionCard title="Assessed Values" icon={DollarSign}>
                 <div className="space-y-4">
                   <InfoItem 
                     label="Total Assessed Value" 
                     value={assessedValues.assdttlvalue}
                     formatter={formatCurrency}
                     icon={DollarSign}
                     className="border border-blue-200 bg-blue-50"
                   />
                   <InfoItem 
                     label="Improvements Value" 
                     value={assessedValues.assdimprvalue}
                     formatter={formatCurrency}
                     icon={Building}
                   />
                   <InfoItem 
                     label="Land Value" 
                     value={assessedValues.assdlandvalue}
                     formatter={formatCurrency}
                     icon={Map}
                   />
                   <InfoItem 
                     label="Assessed per Sq Ft" 
                     value={assessedValues.assdttlpersizeunit}
                     formatter={formatCurrency}
                     icon={Maximize2}
                   />
                   <InfoItem 
                     label="Improvements per Sq Ft" 
                     value={assessedValues.assdimprpersizeunit}
                     formatter={formatCurrency}
                     icon={Building}
                   />
                 </div>
               </SectionCard>
             )}

             {/* Market Values - Only show if we have market values */}
             {hasAnyData(marketValues) && (
               <SectionCard title="Market Values" icon={TrendingUp}>
                 <div className="space-y-4">
                   <InfoItem 
                     label="Total Market Value" 
                     value={marketValues.mktttlvalue}
                     formatter={formatCurrency}
                     icon={DollarSign}
                     className="border border-green-200 bg-green-50"
                   />
                   <InfoItem 
                     label="Market Improvements Value"
                     value={marketValues.mktimprvalue}
                     formatter={formatCurrency}
                     icon={Building}
                   />
                   <InfoItem 
                     label="Market Land Value" 
                     value={marketValues.mktlandvalue}
                     formatter={formatCurrency}
                     icon={Map}
                   />
                 </div>
               </SectionCard>
             )}

             {/* Calculated Values - Only show if we have calculated values */}
             {hasAnyData(calculations) && (
               <SectionCard title="Calculated Values" icon={BarChart3}>
                 <div className="space-y-4">
                   <InfoItem 
                     label="Total Calculated Value" 
                     value={calculations.calcttlvalue}
                     formatter={formatCurrency}
                     icon={DollarSign}
                   />
                   <InfoItem 
                     label="Calculated Improvements" 
                     value={calculations.calcimprvalue}
                     formatter={formatCurrency}
                     icon={Building}
                   />
                   <InfoItem 
                     label="Calculated Land Value" 
                     value={calculations.calclandvalue}
                     formatter={formatCurrency}
                     icon={Map}
                   />
                   <InfoItem 
                     label="Value per Sq Ft" 
                     value={calculations.calcvaluepersizeunit}
                     formatter={formatCurrency}
                     icon={Maximize2}
                   />
                   <InfoItem label="Total Indicator" value={calculations.calcttlind} icon={Info} />
                   <InfoItem label="Improvements Indicator" value={calculations.calcimprind} icon={Info} />
                   <InfoItem label="Land Indicator" value={calculations.calclandind} icon={Info} />
                 </div>
               </SectionCard>
             )}

             {/* Tax Information - Only show if we have tax data */}
             {hasAnyData(taxInfo) && (
               <SectionCard title="Tax Information" icon={FileText}>
                 <div className="space-y-4">
                   <InfoItem 
                     label="Annual Tax Amount" 
                     value={taxInfo.taxamt}
                     formatter={formatCurrency}
                     icon={DollarSign}
                     className="border border-red-200 bg-red-50"
                   />
                   <InfoItem 
                     label="Tax per Sq Ft" 
                     value={taxInfo.taxpersizeunit}
                     formatter={formatCurrency}
                     icon={Maximize2}
                   />
                   <InfoItem 
                     label="Tax Year" 
                     value={taxInfo.taxyear}
                     icon={Calendar}
                   />
                 </div>
               </SectionCard>
             )}
           </div>
         </div>
       )}

       {activeTab === 'valuation' && (
         <div className="space-y-6">
           {/* AVM Main Values - Only show if we have AVM data */}
           {hasAnyData(avmAmount) && (
             <SectionCard title="Automated Valuation Model (AVM)" icon={TrendingUp}>
               <div className="grid md:grid-cols-3 gap-4">
                 <InfoItem 
                   label="Current AVM Value" 
                   value={avmAmount.value}
                   formatter={formatCurrency}
                   icon={DollarSign}
                   className="border border-green-200 bg-green-50"
                 />
                 <InfoItem 
                   label="AVM High Estimate" 
                   value={avmAmount.high}
                   formatter={formatCurrency}
                   icon={TrendingUp}
                 />
                 <InfoItem 
                   label="AVM Low Estimate" 
                   value={avmAmount.low}
                   formatter={formatCurrency}
                   icon={TrendingUp}
                 />
                 <InfoItem 
                   label="Value Range" 
                   value={avmAmount.valueRange}
                   formatter={formatCurrency}
                   icon={Activity}
                 />
                 <InfoItem 
                   label="Confidence Score" 
                   value={avmAmount.scr}
                   formatter={(v) => `${v}/100`}
                   icon={Award}
                 />
                 <InfoItem 
                   label="AVM Date" 
                   value={avm.eventDate}
                   formatter={formatDate}
                   icon={Calendar}
                 />
               </div>
             </SectionCard>
           )}

           {/* AVM Changes and Calculations - Only show if we have the data */}
           <div className="grid md:grid-cols-2 gap-6">
             {hasAnyData(avmChange) && (
               <SectionCard title="AVM Changes" icon={Activity}>
                 <div className="space-y-4">
                   <InfoItem 
                     label="Previous Month Value" 
                     value={avmChange.avmlastmonthvalue}
                     formatter={formatCurrency}
                     icon={DollarSign}
                   />
                   <InfoItem 
                     label="Amount Change" 
                     value={avmChange.avmamountchange}
                     formatter={formatCurrency}
                     icon={Activity}
                   />
                   <InfoItem 
                     label="Percent Change" 
                     value={avmChange.avmpercentchange}
                     formatter={formatPercentage}
                     icon={Activity}
                   />
                 </div>
               </SectionCard>
             )}

             {hasAnyData(avmCalculations) && (
               <SectionCard title="AVM Calculations" icon={BarChart3}>
                 <div className="space-y-4">
                   <InfoItem 
                     label="Price per Size Unit" 
                     value={avmCalculations.perSizeUnit}
                     formatter={formatCurrency}
                     icon={Maximize2}
                   />
                   <InfoItem 
                     label="Tax Amount Ratio" 
                     value={avmCalculations.ratioTaxAmt}
                     icon={FileText}
                   />
                   <InfoItem 
                     label="Tax Value Ratio" 
                     value={avmCalculations.ratioTaxValue}
                     icon={FileText}
                   />
                   <InfoItem 
                     label="Range % of Value" 
                     value={avmCalculations.rangePctOfValue}
                     formatter={formatPercentage}
                     icon={Activity}
                   />
                 </div>
               </SectionCard>
             )}
           </div>

           {/* AVM Condition Values - Only show if we have condition data */}
           {hasAnyData(avmCondition) && (
             <SectionCard title="AVM by Property Condition" icon={Award}>
               <div className="grid md:grid-cols-2 gap-6">
                 {(avmCondition.avmpoorlow || avmCondition.avmpoorhigh) && (
                   <div className="space-y-4">
                     <h5 className="font-semibold text-gray-800 mb-3">Poor Condition Range</h5>
                     <InfoItem 
                       label="Poor Condition Low" 
                       value={avmCondition.avmpoorlow}
                       formatter={formatCurrency}
                       icon={DollarSign}
                     />
                     <InfoItem 
                       label="Poor Condition High" 
                       value={avmCondition.avmpoorhigh}
                       formatter={formatCurrency}
                       icon={DollarSign}
                     />
                   </div>
                 )}
                 {(avmCondition.avmgoodlow || avmCondition.avmgoodhigh) && (
                   <div className="space-y-4">
                     <h5 className="font-semibold text-gray-800 mb-3">Good Condition Range</h5>
                     <InfoItem 
                       label="Good Condition Low" 
                       value={avmCondition.avmgoodlow}
                       formatter={formatCurrency}
                       icon={DollarSign}
                     />
                     <InfoItem 
                       label="Good Condition High" 
                       value={avmCondition.avmgoodhigh}
                       formatter={formatCurrency}
                       icon={DollarSign}
                     />
                   </div>
                 )}
                 {(avmCondition.avmexcellentlow || avmCondition.avmexcellenthigh) && (
                   <div className="space-y-4">
                     <h5 className="font-semibold text-gray-800 mb-3">Excellent Condition Range</h5>
                     <InfoItem 
                       label="Excellent Condition Low" 
                       value={avmCondition.avmexcellentlow}
                       formatter={formatCurrency}
                       icon={DollarSign}
                     />
                     <InfoItem 
                       label="Excellent Condition High" 
                       value={avmCondition.avmexcellenthigh}
                       formatter={formatCurrency}
                       icon={DollarSign}
                     />
                   </div>
                 )}
               </div>
             </SectionCard>
           )}
         </div>
       )}

       {activeTab === 'sale' && (
         <div className="space-y-6">
           {/* Main Sale Information - Only show if we have sale data */}
           {(hasAnyData(sale) || hasAnyData(saleAmount)) && (
             <SectionCard title="Last Sale Information" icon={Calendar}>
               <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <InfoItem 
                     label="Sale Amount" 
                     value={saleAmount.saleamt}
                     formatter={formatCurrency}
                     icon={DollarSign}
                     className="border border-green-200 bg-green-50"
                   />
                   <InfoItem 
                     label="Sale Search Date" 
                     value={sale.salesearchdate}
                     formatter={formatDate}
                     icon={Calendar}
                   />
                   <InfoItem 
                     label="Sale Transaction Date" 
                     value={sale.saleTransDate}
                     formatter={formatDate}
                     icon={Calendar}
                   />
                   <InfoItem 
                     label="Sale Recording Date" 
                     value={saleAmount.salerecdate}
                     formatter={formatDate}
                     icon={Calendar}
                   />
                 </div>
                 <div className="space-y-4">
                   <InfoItem label="Sale Code" value={saleAmount.salecode} icon={Info} />
                   <InfoItem label="Sale Transaction Type" value={saleAmount.saletranstype} icon={Info} />
                   <InfoItem label="Sale Document Number" value={saleAmount.saledocnum} icon={FileText} />
                   <InfoItem label="Sale Disclosure Type" value={saleAmount.saledisclosuretype} icon={Info} />
                   <InfoItem label="Interface Family" value={sale.interfamily} icon={Info} />
                   <InfoItem label="Resale or New Construction" value={sale.resaleornewconstruction} icon={Info} />
                   <InfoItem label="Cash or Mortgage Purchase" value={sale.cashormortgagepurchase} icon={Info} />
                 </div>
               </div>
             </SectionCard>
           )}

           {/* Sale Calculations - Only show if we have calculation data */}
           {hasAnyData(saleCalculation) && (
             <SectionCard title="Sale Calculations" icon={BarChart3}>
               <div className="grid md:grid-cols-2 gap-4">
                 <InfoItem 
                   label="Price per Size Unit" 
                   value={saleCalculation.pricepersizeunit}
                   formatter={formatCurrency}
                   icon={Maximize2}
                 />
               </div>
             </SectionCard>
           )}

           {/* Historical Sales - Only show if we have sales history */}
           {property.expandedProfile?.salesHistory?.length > 0 && (
             <SectionCard title="Sales History" icon={Calendar}>
               <div className="space-y-6">
                 {property.expandedProfile.salesHistory.map((history, index) => (
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
                         <InfoItem label="Document #" value={history.recordingDocumentNumber} icon={FileText} />
                         <InfoItem label="Grantee" value={history.grantee} icon={User} />
                         <InfoItem label="Grantor" value={history.grantor} icon={User} />
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </SectionCard>
           )}
         </div>
       )}

       {activeTab === 'owner' && (
         <div className="space-y-6">
           <SectionCard title="Owner Information" icon={User}>
             {hasAnyData(owner) ? (
               <div className="space-y-4">
                 <InfoItem label="Owner Name" value={owner.owner1?.fullname} icon={User} />
                 <InfoItem label="Last Name" value={owner.owner1?.lastname} icon={User} />
                 <InfoItem label="First Name" value={owner.owner1?.firstname} icon={User} />
                 <InfoItem label="Middle Name" value={owner.owner1?.middlename} icon={User} />
                 <InfoItem 
                   label="Corporate Indicator" 
                   value={owner.corporateindicator === 'Y' ? 'Yes' : owner.corporateindicator === 'N' ? 'No' : owner.corporateindicator}
                   icon={Building}
                 />
                 <InfoItem 
                   label="Owner Status" 
                   value={owner.absenteeownerstatus === 'O' ? 'Owner Occupied' : 'Absentee Owner'}
                   icon={Home}
                 />
                 <InfoItem label="Ownership Relationship Rights Code" value={owner.ownerrelationshiprightscode} icon={Info} />
                 <InfoItem label="Mailing Address" value={owner.mailingaddressoneline} icon={MapPin} />
                 
                 {/* Additional Owner Details if available */}
                 {owner.owner2 && (
                   <div className="mt-6 pt-6 border-t border-gray-200">
                     <h5 className="font-semibold text-gray-800 mb-4">Co-Owner Information</h5>
                     <InfoItem label="Co-Owner Name" value={owner.owner2?.fullname} icon={User} />
                     <InfoItem label="Co-Owner Last Name" value={owner.owner2?.lastname} icon={User} />
                     <InfoItem label="Co-Owner First Name" value={owner.owner2?.firstname} icon={User} />
                   </div>
                 )}
               </div>
             ) : (
               <div className="text-center py-12">
                 <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                   <User className="w-8 h-8 text-gray-400" />
                 </div>
                 <p className="text-gray-500 font-medium">No owner information available</p>
               </div>
             )}
           </SectionCard>
         </div>
       )}

       {activeTab === 'location' && (
         <div className="space-y-6">
           {/* Address Information - Only show if we have address data */}
           {hasData(property, ['address.oneLine', 'address.line1', 'fullAddress']) && (
             <SectionCard title="Address Information" icon={MapPin}>
               <div className="grid md:grid-cols-2 gap-4">
                 <InfoItem label="Full Address" value={property.address?.oneLine || property.fullAddress} icon={MapPin} />
                 <InfoItem label="Address Line 1" value={property.address?.line1} icon={MapPin} />
                 <InfoItem label="Address Line 2" value={property.address?.line2} icon={MapPin} />
                 <InfoItem label="Locality" value={property.address?.locality} icon={MapPin} />
                 <InfoItem label="Country" value={property.address?.country} icon={MapPin} />
                 <InfoItem label="State" value={property.address?.countrySubd} icon={MapPin} />
                 <InfoItem label="Postal Code 1" value={property.address?.postal1} icon={MapPin} />
                 <InfoItem label="Postal Code 2" value={property.address?.postal2} icon={MapPin} />
                 <InfoItem label="Postal Code 3" value={property.address?.postal3} icon={MapPin} />
                 <InfoItem label="Match Code" value={property.address?.matchCode} icon={Info} />
               </div>
             </SectionCard>
           )}

           {/* Geographic Information - Only show if we have location data */}
           {hasAnyData(location) && (
             <SectionCard title="Geographic Information" icon={Map}>
               <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <InfoItem label="Latitude" value={location.latitude} icon={Target} />
                   <InfoItem label="Longitude" value={location.longitude} icon={Target} />
                   <InfoItem label="Accuracy" value={location.accuracy} icon={Target} />
                   <InfoItem label="Distance" value={location.distance} icon={Map} />
                   <InfoItem label="GeoID" value={location.geoid} icon={Info} />
                 </div>
               </div>
             </SectionCard>
           )}

           {/* Area Information - Only show if we have area data */}
           {hasAnyData(area) && (
             <SectionCard title="Area & Municipality" icon={Map}>
               <div className="grid md:grid-cols-2 gap-4">
                 <InfoItem label="Block Number" value={area.blockNum} icon={Info} />
                 <InfoItem label="Municipality Code" value={area.muncode} icon={Info} />
                 <InfoItem label="Municipality Name" value={area.munname} icon={Info} />
                 <InfoItem label="Country Subdivision" value={area.countrysecsubd} icon={Map} />
                 <InfoItem label="County Use Code" value={area.countyuse1} icon={Info} />
                 <InfoItem label="Location Type" value={area.loctype} icon={Info} />
                 <InfoItem label="Survey Section" value={area.srvySection} icon={Info} />
                 <InfoItem label="Survey Township" value={area.srvyTownship} icon={Info} />
                 <InfoItem label="Subdivision Name" value={area.subdname} icon={Map} />
                 <InfoItem label="Tax Code Area" value={area.taxcodearea} icon={FileText} />
               </div>
             </SectionCard>
           )}
         </div>
       )}

       {activeTab === 'technical' && (
         <div className="space-y-6">
           {/* Identifiers - Only show if we have identifier data */}
           {hasAnyData(identifier) && (
             <SectionCard title="Property Identifiers" icon={Info}>
               <div className="grid md:grid-cols-2 gap-4">
                 <InfoItem label="ATTOM ID" value={identifier.attomId} icon={Info} />
                 <InfoItem label="Property ID" value={identifier.Id} icon={Info} />
                 <InfoItem label="FIPS Code" value={identifier.fips} icon={Info} />
                 <InfoItem label="APN" value={identifier.apn} icon={Info} />
               </div>
             </SectionCard>
           )}

           {/* Legal Information - Only show if we have legal data */}
           {hasData(property, ['summary.legal1', 'summary.legal2', 'summary.propIndicator']) && (
             <SectionCard title="Legal Information" icon={FileText}>
               <div className="space-y-4">
                 <InfoItem label="Legal Description 1" value={summary.legal1} icon={FileText} />
                 <InfoItem label="Legal Description 2" value={summary.legal2} icon={FileText} />
                 <InfoItem label="Property Indicator" value={summary.propIndicator} icon={Info} />
                 <InfoItem label="Absentee Indicator" value={summary.absenteeInd} icon={Info} />
               </div>
             </SectionCard>
           )}

           {/* Data Vintage - Only show if we have vintage data */}
           {hasAnyData(vintage) && (
             <SectionCard title="Data Information" icon={Calendar}>
               <div className="grid md:grid-cols-2 gap-4">
                 <InfoItem 
                   label="Last Modified" 
                   value={vintage.lastModified}
                   formatter={formatDate}
                   icon={Calendar}
                 />
                 <InfoItem 
                   label="Publication Date" 
                   value={vintage.pubDate}
                   formatter={formatDate}
                   icon={Calendar}
                 />
               </div>
             </SectionCard>
           )}

           {/* Additional Technical Data - Only show if we have geoID data */}
           
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