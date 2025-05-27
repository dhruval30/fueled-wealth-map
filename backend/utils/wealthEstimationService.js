const axios = require('axios');
const fs = require('fs');
const path = require('path');

class WealthEstimationService {
  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.groqBaseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.zipCodeIncomeData = null;
    
    if (!this.groqApiKey) {
        throw new Error('GROQ_API_KEY environment variable is required');
    }
    
    this.loadZipCodeData();
}

  async loadZipCodeData() {
    try {
      const csvPath = path.join(__dirname, '..', 'data', 'zipcode_income_data.csv');
      
      if (fs.existsSync(csvPath)) {
        const Papa = require('papaparse');
        const csvData = fs.readFileSync(csvPath, 'utf8');
        
        const parsed = Papa.parse(csvData, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        
        // Convert to a Map for O(1) lookup by ZIP code
        this.zipCodeIncomeData = new Map();
        
        parsed.data.forEach(row => {
          if (row.ZIPCODE && row['Avg AGI']) {
            this.zipCodeIncomeData.set(row.ZIPCODE.toString(), {
              state: row.STATE,
              zipcode: row.ZIPCODE.toString(),
              numReturns: row['Number of returns'],
              adjustedGrossIncome: row['Adjusted gross income (AGI)'] * 1000, // Convert to actual dollars
              avgAGI: row['Avg AGI'] * 1000, // Convert to actual dollars
              numReturnsWithTotalIncome: row['Number of returns with total income'],
              totalIncomeAmount: row['Total income amount'] * 1000,
              avgTotalIncome: row['Avg total income'] * 1000,
              numReturnsWithTaxableIncome: row['Number of returns with taxable income'],
              taxableIncomeAmount: row['Taxable income amount'] * 1000,
              avgTaxableIncome: row['Avg taxable income'] * 1000
            });
          }
        });
        
        console.log(`Loaded income data for ${this.zipCodeIncomeData.size} ZIP codes`);
      } else {
        console.warn('ZIP code income data CSV not found at:', csvPath);
        console.warn('Falling back to estimates');
      }
    } catch (error) {
      console.error('Error loading ZIP code income data:', error);
      console.warn('Falling back to hardcoded estimates');
    }
  }

  getZipCodeMedianNetWorth(zipCode) {
    if (!zipCode) return 550000; // Default fallback
    
    // Clean ZIP code (remove any extra characters)
    const cleanZip = zipCode.toString().substring(0, 5);
    
    if (this.zipCodeIncomeData && this.zipCodeIncomeData.has(cleanZip)) {
      const incomeData = this.zipCodeIncomeData.get(cleanZip);
      
      // Use professional wealth estimation methodology based on income brackets
      const avgIncome = incomeData.avgTotalIncome;
      
      // Apply tiered multipliers based on income levels (business standard approach)
      let wealthMultiplier;
      if (avgIncome >= 500000) {
        wealthMultiplier = 7.0; // Ultra-high income areas: significant asset accumulation
      } else if (avgIncome >= 250000) {
        wealthMultiplier = 6.0; // High income areas: substantial investment portfolios
      } else if (avgIncome >= 150000) {
        wealthMultiplier = 5.0; // Upper middle class: real estate + retirement accounts
      } else if (avgIncome >= 100000) {
        wealthMultiplier = 4.5; // Middle class: home equity + some investments
      } else if (avgIncome >= 75000) {
        wealthMultiplier = 4.0; // Lower middle class: primarily home equity
      } else {
        wealthMultiplier = 3.5; // Lower income: limited asset accumulation
      }
      
      // Apply state-specific adjustments for cost of living and wealth accumulation patterns
      const stateAdjustment = this.getStateWealthAdjustment(incomeData.state);
      
      const estimatedNetWorth = Math.round(avgIncome * wealthMultiplier * stateAdjustment);
      
      return estimatedNetWorth;
    }
    
    // If specific ZIP not found, use regional estimation from CSV data patterns
    return this.getRegionalWealthEstimateFromData(cleanZip);
  }

  getStateWealthAdjustment(state) {
    // State-based wealth accumulation adjustments based on economic factors
    const stateFactors = {
      'NY': 1.25,  // High asset values, financial center
      'CA': 1.20,  // Tech wealth, high property values
      'CT': 1.18,  // Wealth concentration, proximity to NYC
      'MA': 1.15,  // High education, biotech/finance
      'NJ': 1.12,  // High income, proximity to NYC
      'MD': 1.10,  // Government contractors, DC proximity
      'VA': 1.08,  // Federal employees, tech corridor
      'WA': 1.15,  // Tech industry concentration
      'DC': 1.20,  // High government salaries, lobbying
      'FL': 1.05,  // No state income tax, retiree wealth
      'TX': 1.05,  // No state income tax, energy wealth
      'TN': 1.02,  // No state income tax
      'NH': 1.08,  // No state income tax, high education
      'NV': 1.03,  // No state income tax, tourism
      'WY': 1.00,  // Energy wealth but sparse population
      'AK': 1.05,  // Oil wealth, high costs
      'SD': 1.00,  // Agricultural, low costs
      'default': 0.95
    };
    
    return stateFactors[state] || stateFactors['default'];
  }

  getRegionalWealthEstimateFromData(zipCode) {
    // Find similar ZIP codes in the data to estimate wealth
    if (!this.zipCodeIncomeData || this.zipCodeIncomeData.size === 0) {
      return 550000; // Fallback if no data
    }
    
    const twoDigit = zipCode.substring(0, 2);
    const threeDigit = zipCode.substring(0, 3);
    
    // Try to find ZIP codes with same 3-digit prefix first
    let similarZips = [];
    for (let [zip, data] of this.zipCodeIncomeData) {
      if (zip.substring(0, 3) === threeDigit) {
        similarZips.push(data);
      }
    }
    
    // If no 3-digit matches, try 2-digit prefix
    if (similarZips.length === 0) {
      for (let [zip, data] of this.zipCodeIncomeData) {
        if (zip.substring(0, 2) === twoDigit) {
          similarZips.push(data);
        }
      }
    }
    
    if (similarZips.length === 0) {
      return 550000; // National median fallback
    }
    
    // Calculate weighted average income for the region
    const totalReturns = similarZips.reduce((sum, data) => sum + data.numReturns, 0);
    const weightedAvgIncome = similarZips.reduce((sum, data) => {
      const weight = data.numReturns / totalReturns;
      return sum + (data.avgTotalIncome * weight);
    }, 0);
    
    // Apply appropriate multiplier based on regional income
    let multiplier;
    if (weightedAvgIncome >= 200000) {
      multiplier = 6.0;
    } else if (weightedAvgIncome >= 125000) {
      multiplier = 5.0;
    } else if (weightedAvgIncome >= 85000) {
      multiplier = 4.5;
    } else {
      multiplier = 4.0;
    }
    
    return Math.round(weightedAvgIncome * multiplier);
  }

  async estimateNetWorth(propertyData) {
    const { propertyValue, annualPropertyTax, zipCode, ownerName, propertyAddress } = propertyData;
    
    if (!propertyValue || propertyValue < 50000) {
      throw new Error('Property value too low or missing for reliable estimation');
    }

    // Get ZIP code median for context
    const zipCodeMedianNetWorth = this.getZipCodeMedianNetWorth(zipCode);
    
    // Use AI-driven analysis for sophisticated estimation
    const aiEstimation = await this.getComprehensiveAIEstimation({
      ...propertyData,
      zipCodeMedianNetWorth
    });
    
    return {
      estimatedNetWorth: aiEstimation.estimatedNetWorth,
      confidence: aiEstimation.confidence,
      groqResponse: aiEstimation.reasoning,
      zipCodeMedianNetWorth: zipCodeMedianNetWorth
    };
  }

  async getComprehensiveAIEstimation(propertyData) {
    if (!this.groqApiKey) {
      // Fallback calculation if AI is unavailable
      return this.fallbackCalculation(propertyData);
    }

    const prompt = this.buildComprehensivePrompt(propertyData);

    try {
      const response = await axios.post(this.groqBaseUrl, {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a senior wealth analyst at a private equity firm. Analyze property ownership data to estimate individual net worth using sophisticated financial modeling.

CRITICAL: You MUST respond with VALID JSON in this exact format:
{
  "estimatedNetWorth": [number],
  "confidence": "[High/Medium/Low]",
  "reasoning": "[detailed professional analysis]"
}

Do NOT use markdown, headers, or any other formatting. ONLY return valid JSON.

Consider these factors in your analysis:
1. Property-to-wealth ratios by market segment (ultra-wealthy: 15-25%, high net worth: 25-40%, upper middle: 50-70%, middle: 70-85%)
2. Regional wealth concentration patterns
3. Tax burden analysis relative to income capacity
4. Investment sophistication indicators (LLC/Trust ownership = 15% premium, Corp = 25% premium)
5. Lifestyle cost implications

Use conservative, data-driven assumptions.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.groqApiKey}`
        },
        timeout: 20000
      });

      const content = response.data.choices[0].message.content.trim();
      
      // Log the raw response for debugging
      console.log('AI Response:', content.substring(0, 200) + '...');
      
      try {
        // Try to extract JSON from the response
        let jsonStr = content;
        
        // If response contains markdown or other formatting, try to extract JSON
        if (content.includes('```json')) {
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1];
          }
        } else if (content.includes('{') && content.includes('}')) {
          // Find the first { and last } to extract JSON
          const startIndex = content.indexOf('{');
          const endIndex = content.lastIndexOf('}') + 1;
          if (startIndex !== -1 && endIndex > startIndex) {
            jsonStr = content.substring(startIndex, endIndex);
          }
        }
        
        const parsed = JSON.parse(jsonStr);
        
        // Validate the parsed JSON has required fields
        if (!parsed.estimatedNetWorth || !parsed.confidence) {
          throw new Error('Invalid JSON structure');
        }
        
        return {
          estimatedNetWorth: Math.round(parsed.estimatedNetWorth),
          confidence: parsed.confidence || 'Medium',
          reasoning: parsed.reasoning || content
        };
      } catch (parseError) {
        console.error('JSON parsing failed, using fallback extraction:', parseError.message);
        
        // Fallback: try to extract numbers and text from the response
        const numberMatches = content.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:million|M|thousand|K|billion|B)?/gi);
        let extractedNumber = null;
        
        if (numberMatches && numberMatches.length > 0) {
          // Find the largest number in the response (likely the net worth estimate)
          const numbers = numberMatches.map(match => {
            let num = parseFloat(match.replace(/[\$,]/g, ''));
            if (match.toLowerCase().includes('million') || match.toLowerCase().includes('m')) {
              num *= 1000000;
            } else if (match.toLowerCase().includes('billion') || match.toLowerCase().includes('b')) {
              num *= 1000000000;
            } else if (match.toLowerCase().includes('thousand') || match.toLowerCase().includes('k')) {
              num *= 1000;
            }
            return num;
          });
          
          extractedNumber = Math.max(...numbers);
        }
        
        // Determine confidence from text
        let confidence = 'Medium';
        if (content.toLowerCase().includes('high confidence') || content.toLowerCase().includes('confident')) {
          confidence = 'High';
        } else if (content.toLowerCase().includes('low confidence') || content.toLowerCase().includes('uncertain')) {
          confidence = 'Low';
        }
        
        return {
          estimatedNetWorth: extractedNumber || this.fallbackCalculation(propertyData).estimatedNetWorth,
          confidence: confidence,
          reasoning: content
        };
      }
    } catch (error) {
      console.error('AI estimation error:', error.message);
      return this.fallbackCalculation(propertyData);
    }
  }

  buildComprehensivePrompt(propertyData) {
    const { propertyValue, annualPropertyTax, zipCode, ownerName, propertyAddress, zipCodeMedianNetWorth } = propertyData;
    
    // Get additional context from ZIP code data
    let zipContext = '';
    if (zipCode && this.zipCodeIncomeData && this.zipCodeIncomeData.has(zipCode.toString())) {
      const data = this.zipCodeIncomeData.get(zipCode.toString());
      zipContext = `
ZIP Code ${zipCode} Income Profile:
- Average Total Income: $${data.avgTotalIncome?.toLocaleString()}
- Average AGI: $${data.avgAGI?.toLocaleString()}
- Tax Returns Filed: ${data.numReturns?.toLocaleString()}
- State: ${data.state}`;
    }

    return `Estimate net worth for property owner:

PROPERTY DETAILS:
Address: ${propertyAddress}
Property Value: $${propertyValue?.toLocaleString()}
Annual Property Tax: $${annualPropertyTax?.toLocaleString() || 'Unknown'}
Owner: ${ownerName}

MARKET CONTEXT:
ZIP Code: ${zipCode}
ZIP Median Net Worth: $${zipCodeMedianNetWorth?.toLocaleString()}${zipContext}

ANALYSIS FRAMEWORK:
1. Calculate implied annual carrying cost (taxes + insurance + maintenance + opportunity cost)
2. Assess property-to-wealth ratio appropriate for this market segment
3. Consider owner sophistication (entity vs individual ownership)
4. Factor in regional wealth patterns and cost of living
5. Apply confidence scoring based on data quality

Provide sophisticated wealth estimate with clear business reasoning. Remember to respond ONLY with valid JSON format.`;
  }

  fallbackCalculation(propertyData) {
    const { propertyValue, annualPropertyTax, zipCodeMedianNetWorth } = propertyData;
    
    // Conservative fallback using multiple estimation methods
    const propertyRatioMethod = propertyValue * 3.5; // Assume property is ~30% of net worth
    const carryingCostMethod = (annualPropertyTax || propertyValue * 0.015) * 25; // 4% rule
    const zipCodeMethod = zipCodeMedianNetWorth * 1.2; // Slight premium for property ownership
    
    // Use the median of the three methods for robustness
    const estimates = [propertyRatioMethod, carryingCostMethod, zipCodeMethod].sort((a, b) => a - b);
    const medianEstimate = estimates[1];
    
    return {
      estimatedNetWorth: Math.round(medianEstimate),
      confidence: annualPropertyTax ? 'Medium' : 'Low',
      reasoning: `Fallback calculation using property ratio ($${Math.round(propertyRatioMethod/1000)}K), carrying cost ($${Math.round(carryingCostMethod/1000)}K), and ZIP median ($${Math.round(zipCodeMethod/1000)}K) methods. Median estimate selected for conservative accuracy.`
    };
  }

  async batchEstimateNetWorth(propertiesData) {
    const estimations = [];
    const batchSize = 2; // Process 2 at a time to avoid rate limits
    
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
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    return estimations;
  }
}

module.exports = new WealthEstimationService();