const axios = require('axios');

class ReportGenerationService {
  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.groqBaseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    
    if (!this.groqApiKey) {
        throw new Error('GROQ_API_KEY environment variable is required');
    }
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
      
      // Generate a clean summary (no hashtags or markdown)
      const summary = this.generateCleanSummary(content, propertyData, reportType);

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

  generateCleanSummary(content, propertyData, reportType) {
    const address = this.getPropertyAddress(propertyData);
    const value = this.getPropertyValue(propertyData);
    const propertyType = propertyData.summary?.propclass || 'Property';
    const ownerName = propertyData.owner?.owner1?.fullname || 'Unknown Owner';

    // Try to extract executive summary from content
    let extractedSummary = '';
    
    // Look for executive summary section
    const lines = content.split('\n');
    let inExecutiveSummary = false;
    let summaryLines = [];
    
    for (let line of lines) {
      const cleanLine = line.trim();
      
      if (cleanLine.toLowerCase().includes('executive summary') || 
          cleanLine.toLowerCase().includes('summary')) {
        inExecutiveSummary = true;
        continue;
      }
      
      if (inExecutiveSummary) {
        if (cleanLine.startsWith('#') && !cleanLine.toLowerCase().includes('summary')) {
          break; // Hit next section
        }
        
        if (cleanLine && !cleanLine.startsWith('#') && !cleanLine.startsWith('*')) {
          // Clean the line of markdown
          const cleanedLine = cleanLine
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1') // Remove italic
            .replace(/`(.*?)`/g, '$1') // Remove code
            .replace(/#{1,6}\s/g, '') // Remove headers
            .trim();
          
          if (cleanedLine.length > 10) { // Only meaningful lines
            summaryLines.push(cleanedLine);
          }
        }
        
        if (summaryLines.length >= 2) break; // Got enough summary
      }
    }
    
    if (summaryLines.length > 0) {
      extractedSummary = summaryLines.join(' ').substring(0, 200);
    }
    
    // If we couldn't extract a good summary, create one based on report type
    if (!extractedSummary || extractedSummary.length < 50) {
      switch (reportType) {
        case 'market_analysis':
          extractedSummary = `Market analysis for ${propertyType.toLowerCase()} at ${address}. Property owned by ${ownerName}${value ? ` with estimated value of $${value.toLocaleString()}` : ''}. Analysis includes market conditions, comparable properties, and investment potential.`;
          break;
          
        case 'investment_summary':
          extractedSummary = `Investment summary for ${propertyType.toLowerCase()} at ${address}. ${value ? `Property valued at $${value.toLocaleString()}` : 'Property'} owned by ${ownerName}. Report covers investment highlights, financial overview, and return potential.`;
          break;
          
        case 'risk_assessment':
          extractedSummary = `Risk assessment for ${propertyType.toLowerCase()} at ${address}. Property owned by ${ownerName}${value ? ` valued at $${value.toLocaleString()}` : ''}. Assessment covers market risks, physical property risks, and mitigation strategies.`;
          break;
          
        default: // property_overview
          extractedSummary = `Comprehensive overview of ${propertyType.toLowerCase()} located at ${address}. Property owned by ${ownerName}${value ? ` with estimated value of $${value.toLocaleString()}` : ''}. Report includes property details, location analysis, and market context.`;
      }
    }
    
    // Ensure summary is clean and properly truncated
    const finalSummary = extractedSummary
      .replace(/#{1,6}\s/g, '') // Remove any remaining headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove code
      .trim();
    
    // Truncate to reasonable length with proper ending
    if (finalSummary.length > 250) {
      const truncated = finalSummary.substring(0, 247);
      const lastSpace = truncated.lastIndexOf(' ');
      return truncated.substring(0, lastSpace > 200 ? lastSpace : 247) + '...';
    }
    
    return finalSummary;
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
1. Executive Summary (2-3 sentences about the property and market opportunity)
2. Property Overview
3. Market Conditions
4. Comparable Properties Analysis
5. Investment Potential
6. Market Trends
7. Recommendations

Format as professional markdown with clear sections and bullet points. Keep the executive summary concise and factual.`;

      case 'investment_summary':
        return `Create an investment summary report for this property:

${baseInfo}

Include:
1. Executive Summary (2-3 sentences about investment highlights)
2. Investment Highlights
3. Financial Overview
4. Risk Assessment
5. Return Potential
6. Market Position
7. Investment Recommendation

Format as professional markdown with clear sections. Keep the executive summary focused on investment merits.`;

      case 'risk_assessment':
        return `Prepare a risk assessment report for this property:

${baseInfo}

Include:
1. Executive Summary (2-3 sentences about overall risk profile)
2. Market Risks
3. Physical Property Risks
4. Financial Risks
5. Legal/Regulatory Risks
6. Mitigation Strategies
7. Overall Risk Rating

Format as professional markdown with clear sections. Keep the executive summary focused on key risk factors.`;

      default:
        return `Generate a comprehensive property overview report for:

${baseInfo}

Include:
1. Executive Summary (2-3 sentences about the property and its characteristics)
2. Property Details
3. Location Analysis
4. Owner Information
5. Valuation Assessment
6. Market Context
7. Key Insights

Format as professional markdown with clear sections and bullet points. Keep the executive summary concise and informative.`;
    }
  }

  generateFallbackReport(propertyData, reportType) {
    const address = this.getPropertyAddress(propertyData);
    const value = this.getPropertyValue(propertyData);
    const propertyType = propertyData.summary?.propclass || 'Property';
    const ownerName = propertyData.owner?.owner1?.fullname || 'Unknown Owner';
    
    const content = `# ${reportType.replace('_', ' ').toUpperCase()} Report

## Executive Summary
This report provides an analysis of the property located at ${address}. The ${propertyType.toLowerCase()} is owned by ${ownerName}${value ? ` and has an estimated value of $${value.toLocaleString()}` : ''}.

## Property Details
- **Address**: ${address}
- **Type**: ${propertyType}
- **Owner**: ${ownerName}
- **Value**: ${value ? `$${value.toLocaleString()}` : 'Unknown'}
- **Year Built**: ${propertyData.summary?.yearbuilt || 'Unknown'}

## Key Insights
This property represents a real estate asset in the current market. Further analysis would require additional market data and comparable sales information.

## Conclusion
Based on available data, this property appears to be a standard real estate holding requiring additional due diligence for investment decisions.`;

    // Generate clean summary for fallback
    const summary = `${reportType.replace('_', ' ')} report for ${propertyType.toLowerCase()} at ${address}. Property owned by ${ownerName}${value ? ` with estimated value of $${value.toLocaleString()}` : ''}. Analysis includes property details, location information, and market context.`;

    return {
      content,
      summary,
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