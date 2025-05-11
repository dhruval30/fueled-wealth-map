import {
  Building,
  Calendar,
  DollarSign,
  Home,
  Info,
  MapPin,
  Maximize2,
  User
} from 'lucide-react';
import React, { useState } from 'react';

const PropertyDetails = ({ property }) => {
  const [activeTab, setActiveTab] = useState('overview');

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

// Helper function to get property address
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