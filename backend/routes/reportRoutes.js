const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Report = require('../models/Report');
const SavedProperty = require('../models/SavedProperty');
const reportGenerationService = require('../utils/reportGenerationService');
const PDFDocument = require('pdfkit');
const { marked } = require('marked');

// Get all reports for company
router.get('/', protect, async (req, res) => {
  try {
    const reports = await Report.find({
      company: req.user.company
    })
    .populate('savedProperty')
    .populate('generatedBy', 'email')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
});

// Generate reports for selected properties
router.post('/generate', protect, async (req, res) => {
  try {
    const { propertyIds, reportType = 'property_overview' } = req.body;
    
    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Property IDs are required'
      });
    }

    console.log(`Generating ${reportType} reports for ${propertyIds.length} properties`);

    // Get saved properties
    const savedProperties = await SavedProperty.find({
      _id: { $in: propertyIds },
      company: req.user.company
    });

    if (savedProperties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No properties found'
      });
    }

    // Check for existing reports
    const existingReports = await Report.find({
      savedProperty: { $in: propertyIds },
      company: req.user.company,
      reportType
    });

    const existingPropertyIds = new Set(
      existingReports.map(report => report.savedProperty.toString())
    );

    // Filter properties that don't have reports yet
    const propertiesNeedingReports = savedProperties.filter(
      property => !existingPropertyIds.has(property._id.toString())
    );

    console.log(`${propertiesNeedingReports.length} properties need new reports`);

    // Prepare data for report generation
    const propertiesData = propertiesNeedingReports.map(property => ({
      savedPropertyId: property._id,
      propertyData: property.propertyData
    }));

    // Generate reports
    const reportResults = await reportGenerationService.batchGenerateReports(
      propertiesData.map(p => p.propertyData), 
      reportType
    );

    // Save successful reports to database
    const savedReports = [];
    const failedReports = [];
    
    for (let i = 0; i < reportResults.length; i++) {
      const result = reportResults[i];
      const propertyData = propertiesData[i];
      
      if (result.success) {
        try {
          const report = new Report({
            company: req.user.company,
            savedProperty: propertyData.savedPropertyId,
            propertyId: propertyData.propertyData.identifier?.attomId || 'unknown',
            title: result.title,
            content: result.content,
            summary: result.summary,
            reportType,
            generatedBy: req.user.id
          });

          const saved = await report.save();
          savedReports.push(saved);
          console.log(`Saved report for property ${propertyData.savedPropertyId}`);
        } catch (saveError) {
          console.error('Error saving report:', saveError);
          failedReports.push({
            propertyId: propertyData.savedPropertyId,
            error: saveError.message
          });
        }
      } else {
        failedReports.push({
          propertyId: propertyData.savedPropertyId,
          error: result.error
        });
      }
    }

    // Include existing reports in response
    const allReports = [...existingReports, ...savedReports];

    res.status(200).json({
      success: true,
      message: `Generated ${savedReports.length} new reports, ${existingReports.length} already existed`,
      data: allReports,
      summary: {
        totalRequested: propertyIds.length,
        newGenerated: savedReports.length,
        alreadyExisted: existingReports.length,
        failed: failedReports.length
      },
      failures: failedReports.length > 0 ? failedReports : undefined
    });

  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate reports',
      error: error.message
    });
  }
});

// Get single report
router.get('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('savedProperty')
      .populate('generatedBy', 'email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user belongs to the same company
    if (report.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this report'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error.message
    });
  }
});

// Export report as PDF
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user belongs to the same company
    if (report.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this report'
      });
    }

    // Create PDF
    const doc = new PDFDocument();
    const filename = `report-${report._id}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text(report.title, 50, 50);
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${report.createdAt.toLocaleDateString()}`);
    doc.moveDown();
    doc.fontSize(12).text(`Report Type: ${report.reportType.replace('_', ' ').toUpperCase()}`);
    doc.moveDown(2);

    // Convert markdown to plain text for PDF (simplified)
    const plainText = report.content
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.*?)`/g, '$1') // Remove code markdown
      .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Remove links

    doc.fontSize(11).text(plainText, {
      width: 500,
      align: 'left'
    });

    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
});

// Delete a report
router.delete('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user belongs to the same company
    if (report.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this report'
      });
    }

    await Report.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete report',
      error: error.message
    });
  }
});

module.exports = router;