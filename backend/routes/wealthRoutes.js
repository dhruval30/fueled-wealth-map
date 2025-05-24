const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const WealthEstimation = require('../models/WealthEstimation');
const SavedProperty = require('../models/SavedProperty');
const wealthEstimationService = require('../utils/wealthEstimationService');

// Get all wealth estimations for company
router.get('/estimations', protect, async (req, res) => {
  try {
    const estimations = await WealthEstimation.find({
      company: req.user.company
    })
    .populate('savedProperty')
    .sort({ estimatedAt: -1 });

    res.status(200).json({
      success: true,
      count: estimations.length,
      data: estimations
    });
  } catch (error) {
    console.error('Error fetching wealth estimations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wealth estimations',
      error: error.message
    });
  }
});

// Run new estimations for properties without existing estimations
router.post('/estimate', protect, async (req, res) => {
  try {
    // Get all saved properties for the company
    const savedProperties = await SavedProperty.find({
      company: req.user.company
    });

    if (savedProperties.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No saved properties found to estimate wealth for'
      });
    }

    // Get existing estimations to avoid duplicates
    const existingEstimations = await WealthEstimation.find({
      company: req.user.company
    }).select('savedProperty');

    const existingPropertyIds = new Set(
      existingEstimations.map(est => est.savedProperty.toString())
    );

    // Filter properties that don't have estimations yet
    const propertiesNeedingEstimation = savedProperties.filter(
      property => !existingPropertyIds.has(property._id.toString())
    );

    if (propertiesNeedingEstimation.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All properties already have wealth estimations',
        data: []
      });
    }

    // Prepare data for estimation
    const propertiesData = propertiesNeedingEstimation.map(property => {
      const propertyData = property.propertyData;
      const ownerName = propertyData?.owner?.owner1?.fullname || 'Unknown Owner';
      const propertyAddress = propertyData?.fullAddress || 
                            propertyData?.address?.oneLine || 
                            'Unknown Address';

      // Extract property value from various possible paths
      const propertyValue = 
        propertyData?.events?.assessment?.market?.mktttlvalue ||
        propertyData?.assessment?.market?.mktttlvalue ||
        propertyData?.assessment?.calculated?.calcttlvalue ||
        propertyData?.events?.avm?.amount?.value ||
        propertyData?.sale?.amount?.saleamt ||
        null;

      // Extract tax information
      const annualPropertyTax = 
        propertyData?.assessment?.tax?.taxamt ||
        propertyData?.events?.assessment?.tax?.taxamt ||
        null;

      // Extract ZIP code
      const zipCode = 
        propertyData?.address?.postal1 ||
        propertyData?.address?.zip ||
        null;

      return {
        savedPropertyId: property._id,
        ownerName,
        propertyAddress,
        propertyValue,
        annualPropertyTax,
        zipCode,
        zipCodeMedianNetWorth: zipCode ? getZipCodeMedianNetWorth(zipCode) : null
      };
    });

    // Filter out properties without owner names
    const validPropertiesData = propertiesData.filter(
      data => data.ownerName && data.ownerName !== 'Unknown Owner'
    );

    if (validPropertiesData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No properties with valid owner information found'
      });
    }

    // Batch estimate net worth
    const estimationResults = await wealthEstimationService.batchEstimateNetWorth(validPropertiesData);

    // Save successful estimations to database
    const savedEstimations = [];
    for (const result of estimationResults) {
      if (result.success) {
        try {
          const wealthEstimation = new WealthEstimation({
            company: req.user.company,
            savedProperty: result.savedPropertyId,
            ownerName: result.ownerName,
            propertyAddress: result.propertyAddress,
            propertyValue: result.propertyValue,
            annualPropertyTax: result.annualPropertyTax,
            zipCode: result.zipCode,
            zipCodeMedianNetWorth: result.zipCodeMedianNetWorth,
            estimatedNetWorth: result.estimatedNetWorth,
            confidence: result.confidence,
            groqResponse: result.groqResponse
          });

          const saved = await wealthEstimation.save();
          savedEstimations.push(saved);
        } catch (saveError) {
          console.error('Error saving wealth estimation:', saveError);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Generated ${savedEstimations.length} new wealth estimations`,
      data: savedEstimations,
      summary: {
        processed: estimationResults.length,
        successful: savedEstimations.length,
        failed: estimationResults.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Error running wealth estimations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run wealth estimations',
      error: error.message
    });
  }
});

// Delete a wealth estimation
router.delete('/estimations/:id', protect, async (req, res) => {
  try {
    const estimation = await WealthEstimation.findById(req.params.id);

    if (!estimation) {
      return res.status(404).json({
        success: false,
        message: 'Wealth estimation not found'
      });
    }

    // Check if user belongs to the same company
    if (estimation.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this estimation'
      });
    }

    await WealthEstimation.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Wealth estimation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting wealth estimation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete wealth estimation',
      error: error.message
    });
  }
});

// Helper function to get ZIP code median net worth (simplified)
function getZipCodeMedianNetWorth(zipCode) {
  // This is a simplified implementation
  // In a real application, you'd want to integrate with a service like:
  // - Census API
  // - Esri Demographics
  // - DataAxle (formerly Infogroup)
  // - Or maintain your own ZIP code wealth database

  const zipCodeWealthEstimates = {
    // High-wealth ZIP codes (examples)
    '10021': 2500000, // Upper East Side, NYC
    '10028': 2200000, // Upper East Side, NYC
    '90210': 3000000, // Beverly Hills, CA
    '94027': 2800000, // Atherton, CA
    '06840': 2400000, // New Canaan, CT
    '07620': 1800000, // Alpine, NJ
    '33109': 2100000, // Miami Beach, FL
    '94301': 2600000, // Palo Alto, CA
    
    // Medium-wealth ZIP codes (examples)
    '10019': 800000,  // Manhattan, NYC
    '90024': 1200000, // West LA, CA
    '02138': 1500000, // Cambridge, MA
    '60614': 900000,  // Lincoln Park, Chicago
    '78703': 800000,  // Austin, TX
    '30309': 650000,  // Atlanta, GA
    
    // Default ranges by first digit (very rough estimates)
    '0': 400000, // Northeast
    '1': 450000, // Northeast
    '2': 380000, // Southeast
    '3': 350000, // Southeast
    '4': 320000, // Midwest
    '5': 340000, // Midwest
    '6': 360000, // South Central
    '7': 380000, // South Central
    '8': 420000, // Mountain/West
    '9': 500000  // Pacific/West Coast
  };

  // Try exact match first
  if (zipCodeWealthEstimates[zipCode]) {
    return zipCodeWealthEstimates[zipCode];
  }

  // Fall back to regional estimate based on first digit
  const firstDigit = zipCode.charAt(0);
  return zipCodeWealthEstimates[firstDigit] || 400000; // Default to $400k
}

module.exports = router;