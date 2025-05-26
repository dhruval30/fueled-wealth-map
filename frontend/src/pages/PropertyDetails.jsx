import {
  Activity,
  Award,
  Building,
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
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
import { checkStreetViewStatus, requestStreetViewCapture } from '../services/api';

const PropertyDetails = ({ property }) => {
  const [streetViewStatus, setStreetViewStatus] = useState('checking');
  const [streetViewUrl, setStreetViewUrl] = useState(null);
  const [expandedSections, setExpandedSections] = useState(new Set(['overview', 'streetview']));
  const [isRetrying, setIsRetrying] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);

  useEffect(() => {
    if (!property) return;
    
    setStreetViewStatus('checking');
    setCheckAttempts(0);
    setStreetViewUrl(null);
    setIsRetrying(false);
    
    let intervalId;
    const propertyId = property.identifier?.attomId || property.attomId;
    
    if (property.streetViewImage) {
      setStreetViewUrl(property.streetViewImage);
      setStreetViewStatus('loaded');
      return;
    }
    
    if (propertyId) {
      const checkStatus = async () => {
        try {
          const response = await checkStreetViewStatus(propertyId);
          if (!response.ok) {
            setStreetViewStatus('error');
            return true;
          }
          
          const data = await response.json();
          
          if (data.status === 'complete') {
            setStreetViewUrl(data.url);
            setStreetViewStatus('loaded');
            return true;
          } else if (data.status === 'processing') {
            setStreetViewStatus('loading');
            setCheckAttempts(prev => prev + 1);
            return false;
          } else {
            setStreetViewStatus('error');
            return true;
          }
        } catch (error) {
          console.error('Street view status check error:', error);
          setStreetViewStatus('error');
          return true;
        }
      };
      
      checkStatus();
      
      intervalId = setInterval(async () => {
        if (streetViewStatus === 'checking' || streetViewStatus === 'loading') {
          const done = await checkStatus();
          if (done || checkAttempts >= 10) {
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
    };
  }, [property, isRetrying, streetViewStatus, checkAttempts]);

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

  const hasAnyData = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    return Object.values(obj).some(value => 
      value !== null && value !== undefined && value !== '' &&
      !(Array.isArray(value) && value.length === 0) &&
      !(typeof value === 'object' && Object.keys(value).length === 0)
    );
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    setStreetViewStatus('checking');
    setCheckAttempts(0);
    
    const propertyId = property.identifier?.attomId || property.attomId;
    const address = property.fullAddress || getPropertyAddress(property);
    
    if (propertyId && address) {
      try {
        const data = await requestStreetViewCapture(address, propertyId);
        if (data.success) {
          setStreetViewUrl(data.url);
          setStreetViewStatus('loaded');
        } else {
          setStreetViewStatus('error');
        }
        setIsRetrying(false);
      } catch (error) {
        console.error('Error triggering manual capture:', error);
        setStreetViewStatus('error');
        setIsRetrying(false);
      }
    }
  };

  const toggleSection = (section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const InfoItem = ({ label, value, icon: Icon, formatter = (v) => v, className = "" }) => {
    const formattedValue = value !== null && value !== undefined ? formatter(value) : null;
    
    if (!formattedValue) return null;
    
    return (
      <div className={`flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${className}`}>
        <div className="flex items-center space-x-3">
          {Icon && <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-sm text-gray-900 font-semibold text-right">{formattedValue}</span>
      </div>
    );
  };

  const Section = ({ title, icon: Icon, children, sectionKey, defaultExpanded = false }) => {
    if (!children || React.Children.count(children) === 0) return null;
    
    const isExpanded = expandedSections.has(sectionKey);
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-left">{title}</h3>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
          )}
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/30">
            <div className="pt-2">
              {children}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getPropertyAddress = (property) => {
    if (!property) return 'Unknown Address';
    
    if (property.address?.oneLine) return property.address.oneLine;
    if (property.fullAddress) return property.fullAddress;
    
    let address = '';
    if (property.address?.line1) address += property.address.line1;
    
    const parts = [];
    if (property.address?.city) parts.push(property.address.city);
    if (property.address?.state) parts.push(property.address.state);
    if (property.address?.postal1) parts.push(property.address.postal1);
    
    if (parts.length > 0) {
      address += (address ? ', ' : '') + parts.join(', ');
    }
    
    return address || 'Unknown Address';
  };

  if (!property) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No property selected</p>
          <p className="text-gray-400 text-sm mt-1">Select a property to view details</p>
        </div>
      </div>
    );
  }

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
  const avm = property.events?.avm || {};
  const avmAmount = avm.amount || {};
  const avmChange = avm.AVMChange || {};

  const marketValue = 
    avmAmount.value ||
    marketValues.mktttlvalue ||
    calculations.calcttlvalue ||
    assessedValues.assdttlvalue ||
    saleAmount.saleamt ||
    null;

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="sticky top-0 bg-white z-20 border-b border-gray-200 shadow-sm">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 pr-8">
            {getPropertyAddress(property)}
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {summary.propclass && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-medium">
                <Building className="h-3 w-3 mr-1" />
                {summary.propclass}
              </span>
            )}
            {summary.yearbuilt && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                <Calendar className="h-3 w-3 mr-1" />
                Built {summary.yearbuilt}
              </span>
            )}
            {identifier.attomId && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-800 font-medium">
                <Info className="h-3 w-3 mr-1" />
                ID: {identifier.attomId}
              </span>
            )}
          </div>
          {marketValue && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="text-sm text-green-700 font-medium">Estimated Value</div>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(marketValue)}</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        <Section title="Street View" icon={Map} sectionKey="streetview">
          <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden relative">
            {streetViewStatus === 'checking' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center p-6">
                  <Loader2 className="w-10 h-10 mx-auto text-blue-500 mb-3 animate-spin" />
                  <p className="text-gray-700 font-medium">Checking for street view...</p>
                  <p className="text-gray-500 text-sm mt-1">Please wait</p>
                </div>
              </div>
            )}
            
            {streetViewStatus === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="text-center p-6">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                    <Map className="w-8 h-8 text-blue-700 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-gray-700 font-medium">Loading street view...</p>
                  <p className="text-gray-600 text-sm mt-1">This may take a few moments</p>
                  
                  <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto mt-4 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-in-out rounded-full"
                      style={{ width: `${Math.min((checkAttempts / 10) * 100, 100)}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-gray-500 text-xs mt-2">
                    {checkAttempts < 10 
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
                <div className="text-center p-6">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-3">Street view not available</p>
                  <button 
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
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
        </Section>

        {(hasAnyData(summary) || hasAnyData(buildingSummary)) && (
          <Section title="Property Information" icon={Building} sectionKey="basic">
            <InfoItem label="Property Type" value={summary.proptype || summary.propertyType} icon={Building} />
            <InfoItem label="Property Class" value={summary.propclass} icon={Building} />
            <InfoItem label="Property Subtype" value={summary.propsubtype} icon={Building} />
            <InfoItem label="Year Built" value={summary.yearbuilt} icon={Calendar} />
            <InfoItem label="Effective Year Built" value={buildingSummary.yearbuilteffective} icon={Calendar} />
            <InfoItem label="Building Type" value={buildingSummary.bldgType} icon={Building} />
            <InfoItem label="Stories/Levels" value={buildingSummary.levels} icon={Building} />
            <InfoItem label="Units Count" value={buildingSummary.unitsCount} icon={Building} />
          </Section>
        )}

        {(hasAnyData(buildingSize) || hasAnyData(buildingRooms)) && (
          <Section title="Size & Rooms" icon={Maximize2} sectionKey="size">
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
            <InfoItem label="Total Rooms" value={buildingRooms.roomsTotal} icon={Home} />
            <InfoItem label="Bedrooms" value={buildingRooms.beds} icon={Home} />
            <InfoItem label="Total Bathrooms" value={buildingRooms.bathstotal} icon={Home} />
            <InfoItem label="Full Bathrooms" value={buildingRooms.bathsfull} icon={Home} />
            <InfoItem label="Half Bathrooms" value={buildingRooms.bathshalf} icon={Home} />
          </Section>
        )}

        {(hasAnyData(assessedValues) || hasAnyData(marketValues) || hasAnyData(calculations)) && (
          <Section title="Assessment & Value" icon={DollarSign} sectionKey="assessment">
            <InfoItem 
              label="Market Total Value" 
              value={marketValues.mktttlvalue}
              formatter={formatCurrency}
              icon={DollarSign}
              className="bg-green-50"
            />
            <InfoItem 
              label="Assessed Total Value" 
              value={assessedValues.assdttlvalue}
              formatter={formatCurrency}
              icon={DollarSign}
            />
            <InfoItem 
              label="Calculated Value" 
              value={calculations.calcttlvalue}
              formatter={formatCurrency}
              icon={DollarSign}
            />
            <InfoItem 
              label="Land Value" 
              value={marketValues.mktlandvalue || assessedValues.assdlandvalue}
              formatter={formatCurrency}
              icon={Map}
            />
            <InfoItem 
              label="Improvements Value" 
              value={marketValues.mktimprvalue || assessedValues.assdimprvalue}
              formatter={formatCurrency}
              icon={Building}
            />
          </Section>
        )}

        {hasAnyData(taxInfo) && (
          <Section title="Tax Information" icon={FileText} sectionKey="tax">
            <InfoItem 
              label="Annual Tax Amount" 
              value={taxInfo.taxamt}
              formatter={formatCurrency}
              icon={DollarSign}
              className="bg-red-50"
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
          </Section>
        )}

        {hasAnyData(avmAmount) && (
          <Section title="Automated Valuation Model" icon={TrendingUp} sectionKey="avm">
            <InfoItem 
              label="Current AVM Value" 
              value={avmAmount.value}
              formatter={formatCurrency}
              icon={DollarSign}
              className="bg-green-50"
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
            {hasAnyData(avmChange) && (
              <>
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
              </>
            )}
          </Section>
        )}

        {(hasAnyData(sale) || hasAnyData(saleAmount)) && (
          <Section title="Sales History" icon={Calendar} sectionKey="sales">
            <InfoItem 
              label="Sale Amount" 
              value={saleAmount.saleamt}
              formatter={formatCurrency}
              icon={DollarSign}
              className="bg-purple-50"
            />
            <InfoItem 
              label="Sale Date" 
              value={sale.salesearchdate}
              formatter={formatDate}
              icon={Calendar}
            />
            <InfoItem 
              label="Sale Recording Date" 
              value={saleAmount.salerecdate}
              formatter={formatDate}
              icon={Calendar}
            />
            <InfoItem label="Sale Code" value={saleAmount.salecode} icon={Info} />
            <InfoItem label="Sale Transaction Type" value={saleAmount.saletranstype} icon={Info} />
            <InfoItem label="Sale Document Number" value={saleAmount.saledocnum} icon={FileText} />
          </Section>
        )}

        {hasAnyData(owner) && (
          <Section title="Owner Information" icon={User} sectionKey="owner">
            <InfoItem label="Owner Name" value={owner.owner1?.fullname} icon={User} />
            <InfoItem label="Last Name" value={owner.owner1?.lastname} icon={User} />
            <InfoItem label="First Name" value={owner.owner1?.firstname} icon={User} />
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
            <InfoItem label="Mailing Address" value={owner.mailingaddressoneline} icon={MapPin} />
            {owner.owner2 && (
              <>
                <InfoItem label="Co-Owner Name" value={owner.owner2?.fullname} icon={User} />
                <InfoItem label="Co-Owner Last Name" value={owner.owner2?.lastname} icon={User} />
              </>
            )}
          </Section>
        )}

        {(hasAnyData(location) || hasAnyData(area)) && (
          <Section title="Location & Area" icon={MapPin} sectionKey="location">
            <InfoItem label="Full Address" value={property.address?.oneLine || property.fullAddress} icon={MapPin} />
            <InfoItem label="Latitude" value={location.latitude} icon={Target} />
            <InfoItem label="Longitude" value={location.longitude} icon={Target} />
            <InfoItem label="Accuracy" value={location.accuracy} icon={Target} />
            <InfoItem label="Municipality" value={area.munname} icon={Map} />
            <InfoItem label="County" value={area.countrysecsubd} icon={Map} />
            <InfoItem label="Subdivision" value={area.subdname} icon={Map} />
          </Section>
        )}

        {hasAnyData(lot) && (
          <Section title="Lot Information" icon={Map} sectionKey="lot">
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
            <InfoItem label="Pool Type" value={lot.pooltype} icon={Info} />
            <InfoItem label="Pool" value={lot.poolflag === 'Y' ? 'Yes' : lot.poolflag === 'N' ? 'No' : lot.poolflag} icon={Info} />
            <InfoItem label="Garage Type" value={lot.garagetype} icon={Building} />
            <InfoItem label="Parking Spaces" value={lot.parkingSpaces} icon={Building} />
          </Section>
        )}

        {hasAnyData(buildingInterior) && (
          <Section title="Interior Features" icon={Home} sectionKey="interior">
            <InfoItem label="Fireplaces" value={buildingInterior.fplccount} icon={Home} />
            <InfoItem label="Fireplace Type" value={buildingInterior.fplctype} icon={Home} />
            <InfoItem label="Basement Type" value={buildingInterior.bsmttype} icon={Building} />
            <InfoItem label="Basement Size" value={buildingInterior.bsmtsize} formatter={(v) => `${formatNumber(v)} sq ft`} icon={Building} />
            <InfoItem label="Heating Type" value={buildingInterior.heating} icon={Home} />
            <InfoItem label="Cooling Type" value={buildingInterior.cooling} icon={Home} />
            <InfoItem label="Interior Condition" value={buildingInterior.condition} icon={Home} />
          </Section>
        )}

        {(hasAnyData(identifier) || hasAnyData(vintage)) && (
          <Section title="Technical Data" icon={Info} sectionKey="technical">
            <InfoItem label="ATTOM ID" value={identifier.attomId} icon={Info} />
            <InfoItem label="Property ID" value={identifier.Id} icon={Info} />
            <InfoItem label="FIPS Code" value={identifier.fips} icon={Info} />
            <InfoItem label="APN" value={identifier.apn} icon={Info} />
            <InfoItem label="Legal Description 1" value={summary.legal1} icon={FileText} />
            <InfoItem label="Legal Description 2" value={summary.legal2} icon={FileText} />
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
          </Section>
        )}
      </div>
    </div>
  );
};

export default PropertyDetails;