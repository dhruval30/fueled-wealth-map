const axios = require('axios');

class WealthEstimationService {
  constructor() {
    this.groqApiKey = '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'
    this.groqBaseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  }

  async estimateNetWorth(propertyData) {
    if (!this.groqApiKey) {
      throw new Error('GROQ API key not configured');
    }

    const { propertyValue, annualPropertyTax, zipCodeMedianNetWorth, ownerName, propertyAddress } = propertyData;

    const prompt = this.buildPrompt(propertyValue, annualPropertyTax, zipCodeMedianNetWorth);

    try {
      const response = await axios.post(this.groqBaseUrl, {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a financial analyst specializing in wealth estimation. Provide concise, numerical responses only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.groqApiKey}`
        },
        timeout: 30000
      });

      const groqResponse = response.data.choices[0].message.content;
      const estimatedNetWorth = this.parseNetWorthFromResponse(groqResponse);
      const confidence = this.determineConfidence(propertyValue, annualPropertyTax, zipCodeMedianNetWorth);

      return {
        estimatedNetWorth,
        confidence,
        groqResponse: groqResponse.trim()
      };
    } catch (error) {
      console.error('Error calling Groq API:', error.response?.data || error.message);
      throw new Error('Failed to estimate net worth using AI model');
    }
  }

  buildPrompt(propertyValue, annualPropertyTax, zipCodeMedianNetWorth) {
    let prompt = "Estimate the property owner's total net worth based on the following data:\n\n";
    
    if (propertyValue) {
      prompt += `Property Value: $${propertyValue.toLocaleString()}\n`;
    }
    
    if (annualPropertyTax) {
      prompt += `Annual Property Tax: $${annualPropertyTax.toLocaleString()}\n`;
    }
    
    if (zipCodeMedianNetWorth) {
      prompt += `ZIP Code Median Net Worth: $${zipCodeMedianNetWorth.toLocaleString()}\n`;
    }
    
    prompt += "\nConsider that:\n";
    prompt += "- Property value represents a portion of total assets\n";
    prompt += "- Property tax indicates affordability and wealth tier\n";
    prompt += "- Local area wealth provides geographic context\n";
    prompt += "- Typical real estate represents 25-40% of high net worth individuals' portfolios\n\n";
    prompt += "Provide only the estimated net worth as a number (e.g., 2500000 for $2.5M).";
    
    return prompt;
  }

  parseNetWorthFromResponse(response) {
    // Extract numeric value from response
    const cleanedResponse = response.replace(/[$,\s]/g, '');
    const match = cleanedResponse.match(/(\d+(?:\.\d+)?)/);
    
    if (match) {
      return parseInt(match[1]);
    }
    
    // Fallback: try to find common patterns
    const patterns = [
      /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:million|m)/i,
      /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:thousand|k)/i,
      /(\d+(?:,\d{3})*)/
    ];
    
    for (const pattern of patterns) {
      const match = response.match(pattern);
      if (match) {
        let value = parseFloat(match[1].replace(/,/g, ''));
        if (response.toLowerCase().includes('million') || response.toLowerCase().includes('m')) {
          value *= 1000000;
        } else if (response.toLowerCase().includes('thousand') || response.toLowerCase().includes('k')) {
          value *= 1000;
        }
        return Math.round(value);
      }
    }
    
    throw new Error('Could not parse net worth from AI response');
  }

  determineConfidence(propertyValue, annualPropertyTax, zipCodeMedianNetWorth) {
    let dataPoints = 0;
    if (propertyValue) dataPoints++;
    if (annualPropertyTax) dataPoints++;
    if (zipCodeMedianNetWorth) dataPoints++;
    
    if (dataPoints >= 3) return 'High';
    if (dataPoints === 2) return 'Medium';
    return 'Low';
  }

  async batchEstimateNetWorth(propertiesData) {
    const estimations = [];
    const batchSize = 5; // Process in small batches to avoid rate limits
    
    for (let i = 0; i < propertiesData.length; i += batchSize) {
      const batch = propertiesData.slice(i, i + batchSize);
      const batchPromises = batch.map(async (propertyData) => {
        try {
          const estimation = await this.estimateNetWorth(propertyData);
          return {
            ...propertyData,
            ...estimation,
            success: true
          };
        } catch (error) {
          console.error(`Failed to estimate net worth for ${propertyData.ownerName}:`, error.message);
          return {
            ...propertyData,
            success: false,
            error: error.message
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      estimations.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < propertiesData.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return estimations;
  }
}

module.exports = new WealthEstimationService();