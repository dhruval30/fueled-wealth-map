const axios = require('axios');

class ReportGenerationService {
  constructor() {
    this.groqApiKey = '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';
    this.groqBaseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  }

  async generatePropertyReport(propertyData, reportType = 'property_overview') {
    if (!this.groqApiKey) {
      throw new Error('Groq API key not configured');
    }

    const prompt = this.buildReportPrompt(propertyData, reportType);

    try {
      const response = await axios.post(this.groqBaseUrl, {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a professional real estate analyst. Generate comprehensive, well-structured property reports in markdown format. Always include executive summary, key details, market insights, and conclusions.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.groqApiKey}`
        },
        timeout: 30000
      });

      const content = response.data.choices[0].message.content.trim();
      
      // Extract summary (first paragraph or section)
      const lines = content.split('\n').filter(line => line.trim());
      const summary = lines.slice(0, 3).join(' ').substring(0, 200) + '...';

      return {
        content,
        summary,
        title: `${reportType.replace('_', ' ').toUpperCase()} - ${this.getPropertyAddress(propertyData)}`
      };
    } catch (error) {
      console.error('Report generation error:', error.message);
      
      // Fallback to template report
      return this.generateFallbackReport(propertyData, reportType);
    }
  }

  buildReportPrompt(propertyData, reportType) {
    const address = this.getPropertyAddress(propertyData);
    const value = this.getPropertyValue(propertyData);
    const ownerName = propertyData.owner?.owner1?.fullname || 'Unknown';
    const propertyType = propertyData.summary?.propclass || 'Property';

    const baseInfo = `
Property Address: ${address}
Property Type: ${propertyType}
Owner: ${ownerName}
Estimated Value: ${value ? `$${value.toLocaleString()}` : 'Unknown'}
Year Built: ${propertyData.summary?.yearbuilt || 'Unknown'}
Size: ${propertyData.building?.size?.universalsize ? `${propertyData.building.size.universalsize.toLocaleString()} sq ft` : 'Unknown'}
`;

    switch (reportType) {
      case 'market_analysis':
        return `Generate a comprehensive market analysis report for this property:

${baseInfo}

Include:
1. Executive Summary
2. Property Overview
3. Market Conditions
4. Comparable Properties Analysis
5. Investment Potential
6. Market Trends
7. Recommendations

Format as professional markdown with clear sections and bullet points.`;

      case 'investment_summary':
        return `Create an investment summary report for this property:

${baseInfo}

Include:
1. Investment Highlights
2. Financial Overview
3. Risk Assessment
4. Return Potential
5. Market Position
6. Key Considerations
7. Investment Recommendation

Format as professional markdown with clear sections.`;

      case 'risk_assessment':
        return `Prepare a risk assessment report for this property:

${baseInfo}

Include:
1. Executive Summary
2. Market Risks
3. Physical Property Risks
4. Financial Risks
5. Legal/Regulatory Risks
6. Mitigation Strategies
7. Overall Risk Rating

Format as professional markdown with clear sections.`;

      default:
        return `Generate a comprehensive property overview report for:

${baseInfo}

Include:
1. Executive Summary
2. Property Details
3. Location Analysis
4. Owner Information
5. Valuation Assessment
6. Market Context
7. Key Insights

Format as professional markdown with clear sections and bullet points.`;
    }
  }

  generateFallbackReport(propertyData, reportType) {
    const address = this.getPropertyAddress(propertyData);
    const value = this.getPropertyValue(propertyData);
    
    const content = `# ${reportType.replace('_', ' ').toUpperCase()} Report

## Executive Summary
This report provides an analysis of the property located at ${address}.

## Property Details
- **Address**: ${address}
- **Type**: ${propertyData.summary?.propclass || 'Property'}
- **Owner**: ${propertyData.owner?.owner1?.fullname || 'Unknown'}
- **Value**: ${value ? `$${value.toLocaleString()}` : 'Unknown'}
- **Year Built**: ${propertyData.summary?.yearbuilt || 'Unknown'}

## Key Insights
This property represents a real estate asset in the current market. Further analysis would require additional market data and comparable sales information.

## Conclusion
Based on available data, this property appears to be a standard real estate holding requiring additional due diligence for investment decisions.`;

    return {
      content,
      summary: `Property report for ${address} - ${propertyData.summary?.propclass || 'Property'}`,
      title: `${reportType.replace('_', ' ').toUpperCase()} - ${address}`
    };
  }

  getPropertyAddress(propertyData) {
    return propertyData.fullAddress || 
           propertyData.address?.oneLine || 
           propertyData.address?.line1 || 
           'Unknown Address';
  }

  getPropertyValue(propertyData) {
    return propertyData.events?.assessment?.market?.mktttlvalue ||
           propertyData.assessment?.market?.mktttlvalue ||
           propertyData.sale?.amount?.saleamt ||
           null;
  }

  async batchGenerateReports(propertiesData, reportType = 'property_overview') {
    const reports = [];
    const batchSize = 2; // Process 2 at a time to avoid rate limits
    
    for (let i = 0; i < propertiesData.length; i += batchSize) {
      const batch = propertiesData.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (propertyData) => {
        try {
          const report = await this.generatePropertyReport(propertyData, reportType);
          return {
            ...propertyData,
            ...report,
            success: true
          };
        } catch (error) {
          console.error(`Failed to generate report for ${this.getPropertyAddress(propertyData)}:`, error.message);
          return {
            ...propertyData,
            success: false,
            error: error.message
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      reports.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < propertiesData.length) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    return reports;
  }
}

module.exports = new ReportGenerationService();