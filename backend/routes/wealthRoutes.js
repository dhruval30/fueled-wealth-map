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
    console.log('Starting wealth estimation process...');
    console.log('User company:', req.user.company);
    
    // Get all saved properties for the company
    const savedProperties = await SavedProperty.find({
      company: req.user.company
    });

    console.log(`Found ${savedProperties.length} saved properties`);

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

    console.log(`Found ${existingEstimations.length} existing estimations`);

    // Filter properties that don't have estimations yet
    const propertiesNeedingEstimation = savedProperties.filter(
      property => !existingPropertyIds.has(property._id.toString())
    );

    console.log(`${propertiesNeedingEstimation.length} properties need new estimations`);

    if (propertiesNeedingEstimation.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All properties already have wealth estimations',
        data: [],
        summary: {
          totalProperties: savedProperties.length,
          validProperties: 0,
          processed: 0,
          successful: 0,
          failed: 0
        }
      });
    }

    // Prepare data for estimation with better property value extraction
    const propertiesData = propertiesNeedingEstimation.map(property => {
      const propertyData = property.propertyData;
      
      if (!propertyData) {
        console.warn(`Property ${property._id} has no propertyData`);
        return null;
      }

      const ownerName = propertyData?.owner?.owner1?.fullname || 
                      propertyData?.owner?.owner1?.lastname || 
                      'Unknown Owner';
      
      const propertyAddress = propertyData?.fullAddress || 
                             propertyData?.address?.oneLine || 
                             propertyData?.address?.line1 ||
                             'Unknown Address';

      // Enhanced property value extraction
      const propertyValue = 
        propertyData?.events?.avm?.amount?.value ||  // AVM is most current
        propertyData?.events?.assessment?.market?.mktttlvalue ||  // Market value
        propertyData?.assessment?.market?.mktttlvalue ||
        propertyData?.events?.sale?.amount?.saleamt ||  // Last sale price
        propertyData?.sale?.amount?.saleamt ||
        propertyData?.assessment?.calculations?.calcttlvalue ||  // Calculated value
        null;

      // Enhanced tax information extraction
      const annualPropertyTax = 
        propertyData?.events?.assessment?.tax?.taxamt ||
        propertyData?.assessment?.tax?.taxamt ||
        null;

      // ZIP code extraction
      const zipCode = 
        propertyData?.address?.postal1 ||
        propertyData?.events?.address?.postal1 ||
        null;

      console.log(`Property ${property._id}: Owner="${ownerName}", Value=${propertyValue}, Tax=${annualPropertyTax}, ZIP=${zipCode}`);

      return {
        savedPropertyId: property._id,
        ownerName,
        propertyAddress,
        propertyValue,
        annualPropertyTax,
        zipCode,
        zipCodeMedianNetWorth: zipCode ? wealthEstimationService.getZipCodeMedianNetWorth(zipCode) : null
      };
    }).filter(data => data !== null); // Remove null entries

    console.log(`Prepared ${propertiesData.length} property data objects`);

    // Filter out properties without sufficient data
    const validPropertiesData = propertiesData.filter(data => {
      const isValid = data.ownerName && 
                     data.ownerName !== 'Unknown Owner' && 
                     data.propertyValue && 
                     data.propertyValue > 50000;
      
      if (!isValid) {
        console.log(`Invalid property data: Owner="${data.ownerName}", Value=${data.propertyValue}`);
      }
      
      return isValid;
    });

    console.log(`${validPropertiesData.length} properties have valid data for estimation`);

    if (validPropertiesData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No properties with sufficient data for wealth estimation',
        details: {
          totalFound: savedProperties.length,
          needingEstimation: propertiesNeedingEstimation.length,
          withData: propertiesData.length,
          validForEstimation: validPropertiesData.length,
          issues: 'Properties missing owner name or property value > $50,000'
        }
      });
    }

    console.log(`Processing ${validPropertiesData.length} properties for wealth estimation`);

    // Batch estimate net worth using the improved service
    const estimationResults = await wealthEstimationService.batchEstimateNetWorth(validPropertiesData);

    console.log(`Estimation completed. ${estimationResults.length} results returned`);

    // Save successful estimations to database
    const savedEstimations = [];
    const failedEstimations = [];
    
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
          console.log(`Saved estimation for ${result.ownerName}: $${result.estimatedNetWorth?.toLocaleString()}`);
        } catch (saveError) {
          console.error('Error saving wealth estimation:', saveError);
          failedEstimations.push({
            ownerName: result.ownerName,
            error: saveError.message
          });
        }
      } else {
        failedEstimations.push({
          ownerName: result.ownerName,
          error: result.error
        });
      }
    }

    console.log(`Successfully saved ${savedEstimations.length} estimations`);
    console.log(`Failed to save ${failedEstimations.length} estimations`);

    res.status(200).json({
      success: true,
      message: `Generated ${savedEstimations.length} new wealth estimations`,
      data: savedEstimations,
      summary: {
        totalProperties: propertiesNeedingEstimation.length,
        validProperties: validPropertiesData.length,
        processed: estimationResults.length,
        successful: savedEstimations.length,
        failed: failedEstimations.length
      },
      failures: failedEstimations.length > 0 ? failedEstimations : undefined
    });

  } catch (error) {
    console.error('Error running wealth estimations:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to run wealth estimations',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

module.exports = router;