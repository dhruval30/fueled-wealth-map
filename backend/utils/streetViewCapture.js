const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');
const mongoose = require('mongoose');
const { saveBuffer, fileExists } = require('./gridfsStorage');

// Ensure temp directory exists for temporary storage
const tempDir = path.join(os.tmpdir(), 'streetview-temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Cache for browser instances to avoid constant creation/destruction
let browserInstance = null;

// Keep track of active capture jobs in memory
const activeJobs = new Map();

/**
 * Register a new street view capture job
 * @param {string} propertyId - The property ID
 * @param {string} address - The property address
 * @returns {Promise<void>}
 */
async function registerCaptureJob(propertyId, address) {
  try {
    const jobId = propertyId.toString();
    // Check if this job is already registered
    if (activeJobs.has(jobId)) {
      console.log(`Capture job for property ${propertyId} already registered`);
      return;
    }
    
    // Create job info
    const jobInfo = {
      propertyId: jobId,
      address,
      startedAt: new Date(),
      status: 'processing'
    };
    
    // Register in memory
    activeJobs.set(jobId, jobInfo);
    
    // Register in database if connected
    if (mongoose.connection.readyState === 1) {
      try {
        // Use a dedicated collection for tracking processing jobs
        await mongoose.connection.db.collection('streetview_processing').updateOne(
          { propertyId: jobId },
          { $set: jobInfo },
          { upsert: true }
        );
      } catch (dbError) {
        console.error(`Error registering capture job in database for property ${propertyId}:`, dbError);
        // Continue even if DB registration fails
      }
    }
    
    console.log(`Registered capture job for property ${propertyId}`);
  } catch (error) {
    console.error(`Error registering capture job for property ${propertyId}:`, error);
  }
}

/**
 * Complete a street view capture job
 * @param {string} propertyId - The property ID
 * @param {boolean} success - Whether the job was successful
 * @param {string} filename - The filename of the captured image (if successful)
 * @returns {Promise<void>}
 */
async function completeCaptureJob(propertyId, success, filename = null) {
  try {
    const jobId = propertyId.toString();
    // Update in memory
    activeJobs.delete(jobId);
    
    // Update in database if connected
    if (mongoose.connection.readyState === 1) {
      try {
        if (success) {
          // If successful, we can remove the processing record
          await mongoose.connection.db.collection('streetview_processing').deleteOne({
            propertyId: jobId
          });
          
          // Update the search history record
          if (filename) {
            const SearchHistory = mongoose.model('SearchHistory');
            await SearchHistory.updateMany(
              { propertyId: propertyId },
              { $set: { streetViewImage: filename } }
            );
          }
        } else {
          // If failed, update the status
          await mongoose.connection.db.collection('streetview_processing').updateOne(
            { propertyId: jobId },
            { 
              $set: { 
                status: 'failed',
                completedAt: new Date(),
                error: 'Failed to capture street view image'
              }
            }
          );
        }
      } catch (dbError) {
        console.error(`Error updating capture job status in database for property ${propertyId}:`, dbError);
      }
    }
    
    console.log(`${success ? 'Completed' : 'Failed'} capture job for property ${propertyId}`);
  } catch (error) {
    console.error(`Error completing capture job for property ${propertyId}:`, error);
  }
}

/**
 * Clean and normalize an address for optimal Google Maps search
 * @param {string} address - The raw address to parse
 * @returns {string} - A cleaned address optimized for Google Maps search
 */
function parseAddress(address) {
  if (!address) return '';
  
  // Extract just street number and street name first
  const streetMatch = address.match(/^(\d+)[,\s]+([^,]+)/);
  if (streetMatch && streetMatch[1] && streetMatch[2]) {
    const streetNumber = streetMatch[1];
    const streetName = streetMatch[2].trim();
    
    // Return just the street number and name - this is most reliable for street view
    return `${streetNumber} ${streetName}`;
  }
  
  // If we couldn't extract street number and name, try to simplify the address
  if (address.includes('Community Board') || address.includes('Civic Center')) {
    // Split by commas and take just the first two parts (usually street number and name)
    const parts = address.split(',').map(part => part.trim());
    if (parts.length >= 2) {
      // Just use the first two parts (street number + street name)
      return `${parts[0]} ${parts[1]}`.replace(/\s+/g, ' ').trim();
    }
  }
  
  // If the address is very long, try to simplify it
  if (address.length > 80) {
    const parts = address.split(',').map(part => part.trim());
    
    // If we have multiple parts, build a simplified address with just the street info
    if (parts.length >= 2) {
      // Take the first part (usually the street number + name)
      return parts[0].trim();
    }
  }
  
  // Default: return the original address with some basic cleaning
  return address
    .replace(/Community Board \d+,?/g, '') // Remove community board references
    .replace(/Civic Center,?/g, '')        // Remove Civic Center
    .replace(/\s+/g, ' ')                  // Normalize spaces
    .replace(/,\s*,/g, ',')                // Fix double commas
    .trim();
}

/**
 * Captures a Street View image for the given address and stores it in MongoDB GridFS
 * @param {string} address - The property address
 * @param {string} propertyId - Unique identifier for the property
 * @returns {Promise<string>} - MongoDB ID for the stored image
 */
async function captureStreetView(address, propertyId) {
  if (!address || !propertyId) {
    console.error('Missing required parameters for street view capture');
    return null;
  }

  // Parse and optimize the address for Google Maps search
  const optimizedAddress = parseAddress(address);
  console.log(`Original address: ${address}`);
  console.log(`Optimized address for search: ${optimizedAddress}`);

  // Register this capture job
  await registerCaptureJob(propertyId, optimizedAddress);

  // Create a unique filename based on propertyId
  const filename = `streetview_${propertyId}.png`;
  
  // Check if image already exists in GridFS
  const exists = await fileExists(filename);
  if (exists) {
    console.log(`Street view image already exists in GridFS for property ${propertyId}`);
    // Mark job as complete since image already exists
    await completeCaptureJob(propertyId, true, filename);
    return filename;
  }
  
  console.log(`Capturing street view for address: ${optimizedAddress}`);
  
  let browser = null;
  let context = null;
  let page = null;
  let tempFilePath = null;
  
  try {
    // Create a temporary file path
    tempFilePath = path.join(tempDir, `temp_${Date.now()}_${Math.floor(Math.random() * 10000)}.png`);
    
    // Launch a browser if there isn't one already
    if (!browserInstance) {
      browserInstance = await chromium.launch({ 
        headless: true,
        args: [
          '--disable-features=site-per-process', 
          '--disable-web-security', 
          '--disable-setuid-sandbox',
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage'
        ],
        timeout: 60000 // 60 seconds timeout
      });
    }
    
    browser = browserInstance;
    context = await browser.newContext({ 
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      locale: 'en-US'
    });
    
    page = await context.newPage();

    // Set navigation timeout
    page.setDefaultNavigationTimeout(30000); // 30 seconds
    page.setDefaultTimeout(15000); // 15 seconds for other actions
    
      // ================ PRIMARY APPROACH: DIRECT STREET SEARCH ================
      console.log('Trying primary approach: Direct Street Search');
      
      try {
        // Create a direct street address search URL
        const directStreetAddress = encodeURIComponent(optimizedAddress);
        const streetMapsUrl = `https://www.google.com/maps/search/${directStreetAddress}/`;
        console.log(`Navigating to direct street search URL: ${streetMapsUrl}`);
        
        await page.goto(streetMapsUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        
        // Accept cookies if needed
        try {
          const cookieSelector = 'button[aria-label="Accept all"], button:has-text("Accept all"), button.VfPpkd-LgbsSe:has-text("Accept all")';
          const cookieButton = await page.$(cookieSelector);
          if (cookieButton) {
            await cookieButton.click({ timeout: 3000 });
            await page.waitForTimeout(1000);
          }
        } catch (e) {
          // Ignore cookie errors
        }
        
        // Wait for map to load
        await page.waitForSelector('div[role="application"]', { timeout: 15000 });
        console.log('Map loaded successfully');
        
        // Take a debug screenshot to help diagnose location issues
        const debugPath = path.join(tempDir, `debug_map_${propertyId}.png`);
        await page.screenshot({ path: debugPath });
        console.log(`Debug screenshot of map saved to: ${debugPath}`);
        
        // Look for Street View button
        try {
          console.log("Looking for Street View button...");
          const streetViewButton = await page.evaluate(() => {
            // Try different selectors for Street View button
            const selectors = [
              'button[data-value="streetview"]',
              'button[aria-label*="Street View"]',
              'button[jsaction*="streetview"]',
              'div[aria-label*="Street View"]',
              'button[data-tooltip="Street View"]',
              'a[href*="streetview"]',
              'img[alt="Street View"]'
            ];
            
            for (const selector of selectors) {
              const elements = document.querySelectorAll(selector);
              for (const el of elements) {
                if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
                  el.click();
                  return true;
                }
              }
            }
            
            return false;
          });
          
          if (streetViewButton) {
            console.log("Street View button found and clicked!");
            await page.waitForTimeout(3000);
            
            // Check for Street View activation
            const hasStreetView = await page.evaluate(() => {
              return !!document.querySelector('canvas');
            });
            
            if (hasStreetView) {
              console.log('Successfully activated Street View through button click!');
              
              // Wait for Street View to load fully
              await page.waitForTimeout(3000);
              
              // Take screenshot
              await page.screenshot({ path: tempFilePath });
              
              // Read the screenshot into a buffer
              const imageBuffer = fs.readFileSync(tempFilePath);
              
              // Save to GridFS
              const metadata = {
                propertyId,
                address: optimizedAddress,
                originalAddress: address,
                capturedAt: new Date(),
                source: 'Google Street View',
                isStreetView: true,
                method: 'direct_button'
              };
              
              await saveBuffer(imageBuffer, filename, metadata);
              console.log(`✅ Saved Street View image via direct button for ${optimizedAddress} to GridFS as ${filename}`);
              
              // Clean up
              if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
              }
              
              // Mark job as complete
              await completeCaptureJob(propertyId, true, filename);
              return filename;
            }
          }
        } catch (e) {
          console.log(`Error finding Street View button: ${e.message}`);
        }
      
        // Try a more direct approach: look for a "person" icon or navigate directly to street view
        try {
          // Try clicking on any person icon that might indicate street view
          const personClicked = await page.evaluate(() => {
            // Look for any people/person icons on the map
            const personElements = Array.from(document.querySelectorAll('img')).filter(img => {
              return img.src && (
                img.src.includes('person') || 
                img.src.includes('pegman') || 
                img.src.includes('street')
              );
            });
            
            if (personElements.length > 0) {
              personElements[0].click();
              return true;
            }
            
            return false;
          });
          
          if (personClicked) {
            console.log("Person icon found and clicked!");
            await page.waitForTimeout(2000);
            
            // Check for canvas activation
            const hasCanvasAfterPerson = await page.evaluate(() => {
              return !!document.querySelector('canvas');
            });
            
            if (hasCanvasAfterPerson) {
              console.log('Street View activated after clicking person icon!');
              
              // Wait for render
              await page.waitForTimeout(3000);
              
              // Take screenshot
              await page.screenshot({ path: tempFilePath });
              
              // Process and save
              const imageBuffer = fs.readFileSync(tempFilePath);
              const metadata = {
                propertyId,
                address: optimizedAddress,
                originalAddress: address,
                capturedAt: new Date(),
                source: 'Google Street View',
                isStreetView: true,
                method: 'person_icon'
              };
              
              await saveBuffer(imageBuffer, filename, metadata);
              console.log(`✅ Saved Street View image via person icon for ${optimizedAddress} to GridFS as ${filename}`);
              
              // Clean up
              if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
              }
              
              // Mark job as complete
              await completeCaptureJob(propertyId, true, filename);
              return filename;
            }
          }
        } catch (e) {
          console.log(`Error with person icon approach: ${e.message}`);
        }
        
        // Try to directly navigate to Street View URL
        try {
          // Construct a direct street view URL - this might work for well-known addresses
          const streetViewDirectUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${optimizedAddress}`;
          console.log(`Trying direct Street View URL: ${streetViewDirectUrl}`);
          
          await page.goto(streetViewDirectUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 20000
          });
          
          // Wait a moment for potential redirect
          await page.waitForTimeout(3000);
          
          // Check for street view canvas
          const hasDirectCanvas = await page.evaluate(() => {
            return !!document.querySelector('canvas');
          });
          
          if (hasDirectCanvas) {
            console.log('Successfully loaded Street View directly!');
            
            // Wait for full render
            await page.waitForTimeout(3000);
            
            // Take screenshot
            await page.screenshot({ path: tempFilePath });
            
            // Process and save
            const imageBuffer = fs.readFileSync(tempFilePath);
            const metadata = {
              propertyId,
              address: optimizedAddress,
              originalAddress: address,
              capturedAt: new Date(),
              source: 'Google Street View',
              isStreetView: true,
              method: 'direct_url'
            };
            
            await saveBuffer(imageBuffer, filename, metadata);
            console.log(`✅ Saved Street View image via direct URL for ${optimizedAddress} to GridFS as ${filename}`);
            
            // Clean up
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
            }
            
            // Mark job as complete
            await completeCaptureJob(propertyId, true, filename);
            return filename;
          }
        } catch (e) {
          console.log(`Error with direct Street View URL: ${e.message}`);
        }
        
        // Try a final approach - manually construct a URL that opens Street View for the exact address
        try {
          // Construct a very explicit URL format for finding a specific address
          // Format: street number + street name, city, zip
          const addressParts = address.split(',').map(part => part.trim());
          let streetPart = addressParts[0];
          
          // Find city part (usually Manhattan, Brooklyn, etc.)
          let cityPart = 'New York';
          for (const part of addressParts) {
            if (part.includes('Manhattan') || 
                part.includes('Brooklyn') ||
                part.includes('Queens') ||
                part.includes('Bronx') ||
                part.includes('Staten Island')) {
              cityPart = part;
              break;
            }
          }
          
          // Find zip code if available
          let zipPart = '';
          const zipMatch = address.match(/\b\d{5}\b/);
          if (zipMatch) {
            zipPart = zipMatch[0];
          }
          
          // Construct a search string that's specific enough to find the address
          // but not so specific that it would search for other things
          let structuredAddress = streetPart;
          if (cityPart) structuredAddress += `, ${cityPart}`;
          if (zipPart) structuredAddress += ` ${zipPart}`;
          
          const encodedStructured = encodeURIComponent(structuredAddress);
          const structuredUrl = `https://www.google.com/maps/place/${encodedStructured}/@?hl=en`;
          
          console.log(`Trying structured URL approach: ${structuredUrl}`);
          
          await page.goto(structuredUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 20000
          });
          
          await page.waitForTimeout(3000);
          
          // First look for Street View button
          const streetViewButtonFound = await page.evaluate(() => {
            // Look for Street View button or link
            const streetViewElements = Array.from(document.querySelectorAll('a, button, div'))
              .filter(el => {
                const text = el.textContent || '';
                const ariaLabel = el.getAttribute('aria-label') || '';
                const dataTooltip = el.getAttribute('data-tooltip') || '';
                
                return (
                  text.includes('Street View') || 
                  ariaLabel.includes('Street View') || 
                  dataTooltip.includes('Street View')
                );
              });
            
            if (streetViewElements.length > 0) {
              streetViewElements[0].click();
              return true;
            }
            
            return false;
          });
          
          if (streetViewButtonFound) {
            console.log('Street View button found and clicked in structured approach!');
            await page.waitForTimeout(3000);
            
            // Check for canvas
            const hasStructuredCanvas = await page.evaluate(() => {
              return !!document.querySelector('canvas');
            });
            
            if (hasStructuredCanvas) {
              console.log('Street View activated in structured approach!');
              
              // Wait for rendering
              await page.waitForTimeout(3000);
              
              // Take screenshot
              await page.screenshot({ path: tempFilePath });
              
              // Process and save
              const imageBuffer = fs.readFileSync(tempFilePath);
              const metadata = {
                propertyId,
                address: structuredAddress,
                originalAddress: address,
                capturedAt: new Date(),
                source: 'Google Street View',
                isStreetView: true,
                method: 'structured_url'
              };
              
              await saveBuffer(imageBuffer, filename, metadata);
              console.log(`✅ Saved Street View image via structured URL for ${structuredAddress} to GridFS as ${filename}`);
              
              // Clean up
              if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
              }
              
              // Mark job as complete
              await completeCaptureJob(propertyId, true, filename);
              return filename;
            }
          }
          
          // If button not found or clicked but no canvas, try clicking on the location marker
          const markerClicked = await page.evaluate(() => {
            // Look for the red marker pin
            const markers = Array.from(document.querySelectorAll('img, div'))
              .filter(el => {
                if (el.src && el.src.includes('marker')) return true;
                if (el.className && (
                  el.className.includes('marker') || 
                  el.className.includes('pin')
                )) return true;
                return false;
              });
            
            if (markers.length > 0) {
              markers[0].click();
              return true;
            }
            
            return false;
          });
          
          if (markerClicked) {
            console.log('Location marker clicked in structured approach!');
            await page.waitForTimeout(2000);
            
            // Look for Street View option in popup
            const popupStreetViewClicked = await page.evaluate(() => {
              // Look for Street View link in popup
              const popupLinks = Array.from(document.querySelectorAll('a, button, div'))
                .filter(el => {
                  const text = el.textContent || '';
                  const ariaLabel = el.getAttribute('aria-label') || '';
                  
                  return text.includes('Street View') || ariaLabel.includes('Street View');
                });
              
              if (popupLinks.length > 0) {
                popupLinks[0].click();
                return true;
              }
              
              return false;
            });
            
            if (popupStreetViewClicked) {
              console.log('Street View link in popup clicked!');
              await page.waitForTimeout(3000);
              
              // Check for canvas
              const hasPopupCanvas = await page.evaluate(() => {
                return !!document.querySelector('canvas');
              });
              
              if (hasPopupCanvas) {
                console.log('Street View activated after popup click!');
                
                // Wait for rendering
                await page.waitForTimeout(3000);
                
                // Take screenshot
                await page.screenshot({ path: tempFilePath });
                
                // Process and save
                const imageBuffer = fs.readFileSync(tempFilePath);
                const metadata = {
                  propertyId,
                  address: structuredAddress,
                  originalAddress: address,
                  capturedAt: new Date(),
                  source: 'Google Street View',
                  isStreetView: true,
                  method: 'popup_link'
                };
                
                await saveBuffer(imageBuffer, filename, metadata);
                console.log(`✅ Saved Street View image via popup link for ${structuredAddress} to GridFS as ${filename}`);
                
                // Clean up
                if (fs.existsSync(tempFilePath)) {
                  fs.unlinkSync(tempFilePath);
                }
                
                // Mark job as complete
                await completeCaptureJob(propertyId, true, filename);
                return filename;
              }
            }
          }
        } catch (e) {
          console.log(`Error with structured URL approach: ${e.message}`);
        }
      
        
      // 3. Try a second search with just the street number and name as a last resort
      const streetAddressMatch = address.match(/^(\d+[^,]+)/);
      if (streetAddressMatch && streetAddressMatch[1] && streetAddressMatch[1] !== optimizedAddress) {
        const streetOnlyAddress = streetAddressMatch[1].trim();
        console.log(`Trying more focused address: ${streetOnlyAddress}`);
        
        // Use a more focused address
        const encodedStreetAddress = encodeURIComponent(streetOnlyAddress);
        const streetFocusedUrl = `https://www.google.com/maps/search/${encodedStreetAddress}`;
        console.log(`Navigating to focused URL: ${streetFocusedUrl}`);
        
        await page.goto(streetFocusedUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        
        // Wait for map to load
        await page.waitForSelector('div[role="application"]', { timeout: 15000 });
        console.log('Map loaded successfully with street-focused address');
        
        // Take a debug screenshot of the focused search
        const debugFocusedPath = path.join(tempDir, `debug_focused_${propertyId}.png`);
        await page.screenshot({ path: debugFocusedPath });
        console.log(`Debug screenshot of focused search saved to: ${debugFocusedPath}`);
        
        // Try to find and click on a "Street View" icon or button
        const streetViewClicked = await page.evaluate(() => {
          // Try to find any element related to Street View
          const selectors = [
            'a[aria-label*="Street View"]',
            'button[aria-label*="Street View"]',
            'div[aria-label*="Street View"]',
            'a[href*="streetview"]',
            'img[alt*="Street View"]',
            // Look for Google Maps Street View yellow man icon
            'button.gm-svpc',
            'div.gm-svpc',
            'div[jsaction*="streetview"]',
            'button[jsaction*="streetview"]'
          ];
          
          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
              if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
                // Try to click it
                try {
                  el.click();
                  return true;
                } catch (e) {
                  // Try next element
                }
              }
            }
          }
          
          return false;
        });
        
        if (streetViewClicked) {
          console.log('Street View related element clicked in focused search!');
          await page.waitForTimeout(2000);
          
          // Try to click on the map to activate street view if needed
          try {
            await page.click('div[role="application"]');
          } catch (e) {
            // Ignore if we can't click the map
          }
          
          await page.waitForTimeout(2000);
          
          // Check for canvas
          const hasCanvasFocused = await page.evaluate(() => {
            return !!document.querySelector('canvas');
          });
          
          if (hasCanvasFocused) {
            console.log('Street View canvas found in focused search!');
            
            // Wait for rendering
            await page.waitForTimeout(3000);
            
            // Take screenshot
            await page.screenshot({ path: tempFilePath });
            
            // Process and save
            const imageBuffer = fs.readFileSync(tempFilePath);
            const metadata = {
              propertyId,
              address: streetOnlyAddress,
              originalAddress: address,
              capturedAt: new Date(),
              source: 'Google Street View',
              isStreetView: true,
              method: 'focused_street_view'
            };
            
            await saveBuffer(imageBuffer, filename, metadata);
            console.log(`✅ Saved Street View image from focused search for ${streetOnlyAddress} to GridFS as ${filename}`);
            
            // Clean up
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
            }
            
            // Mark job as complete
            await completeCaptureJob(propertyId, true, filename);
            return filename;
          }
        }
      }
    } catch (e) {
      console.error(`Error with street view approaches: ${e.message}`);
      // Continue to fallback
    }
    
    // ================ FALLBACK: Use Static Maps API or Screenshot ================
    console.log('Street View approaches failed, using map screenshot fallback...');
    
    try {
      // First try: search directly for the street address in the most specific way
      const streetNumberMatch = address.match(/^\s*(\d+)/);
      let streetNumber = streetNumberMatch ? streetNumberMatch[1] : '';
      
      // Find the street name 
      const streetNameMatch = address.match(/^\s*\d+\s*[,\s]+([^,]+)/);
      let streetName = streetNameMatch ? streetNameMatch[1].trim() : '';
      
      // Combine for a very focused search
      if (streetNumber && streetName) {
        const veryFocusedAddress = `${streetNumber} ${streetName}`;
        const encodedFocused = encodeURIComponent(veryFocusedAddress);
        const veryFocusedUrl = `https://www.google.com/maps/place/${encodedFocused}`;
        
        console.log(`Trying very focused address search: ${veryFocusedUrl}`);
        
        await page.goto(veryFocusedUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 20000
        });
        
        // Wait for map to load
        await page.waitForSelector('div[role="application"]', { timeout: 15000 });
        
        // Take screenshot of map view - this may show the property even without street view
        await page.waitForTimeout(3000);
        await page.screenshot({ path: tempFilePath });
        
        // Add "MAP VIEW" watermark to indicate it's not a street view
        await page.evaluate(() => {
          const watermark = document.createElement('div');
          watermark.innerHTML = 'MAP VIEW';
          watermark.style.position = 'absolute';
          watermark.style.top = '10px';
          watermark.style.right = '10px';
          watermark.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
          watermark.style.color = '#333';
          watermark.style.padding = '5px 10px';
          watermark.style.borderRadius = '3px';
          watermark.style.fontFamily = 'Arial, sans-serif';
          watermark.style.fontSize = '14px';
          watermark.style.fontWeight = 'bold';
          watermark.style.zIndex = '9999';
          document.body.appendChild(watermark);
        });
        
        // Take another screenshot with the watermark
        await page.screenshot({ path: tempFilePath });
        
        // Read the screenshot into a buffer
        const imageBuffer = fs.readFileSync(tempFilePath);
        
        // Save to GridFS
        const metadata = {
          propertyId,
          address: veryFocusedAddress,
          originalAddress: address,
          capturedAt: new Date(),
          source: 'Google Maps Fallback',
          isStreetView: false,
          method: 'focused_map_view'
        };
        
        await saveBuffer(imageBuffer, filename, metadata);
        console.log(`✅ Saved fallback map image for ${veryFocusedAddress} to GridFS as ${filename}`);
        
        // Clean up
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        
        // Mark job as complete but indicate it's a fallback, not a street view
        await completeCaptureJob(propertyId, true, filename);
        return filename;
      }
      
      // Second fallback: Just use the optimized address for a map view
      console.log('Taking screenshot of map view as last resort');
      
      // Try to navigate to a clean map view of the address
      const mapUrl = `https://www.google.com/maps/search/${encodeURIComponent(optimizedAddress)}`;
      
      // Navigate to a fresh map
      await page.goto(mapUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 20000 
      });
      
      // Wait for map to load
      await page.waitForSelector('div[role="application"]', { timeout: 15000 });
      
      // Ensure map is in clean state
      await page.waitForTimeout(3000);
      
      // Add "MAP VIEW" watermark
      await page.evaluate(() => {
        const watermark = document.createElement('div');
        watermark.innerHTML = 'MAP VIEW';
        watermark.style.position = 'absolute';
        watermark.style.top = '10px';
        watermark.style.right = '10px';
        watermark.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        watermark.style.color = '#333';
        watermark.style.padding = '5px 10px';
        watermark.style.borderRadius = '3px';
        watermark.style.fontFamily = 'Arial, sans-serif';
        watermark.style.fontSize = '14px';
        watermark.style.fontWeight = 'bold';
        watermark.style.zIndex = '9999';
        document.body.appendChild(watermark);
      });
      
      // Take a screenshot of the map
      await page.screenshot({ path: tempFilePath });
      
      // Read the screenshot file into a buffer
      const imageBuffer = fs.readFileSync(tempFilePath);
      
      // Save to GridFS
      const metadata = {
        propertyId,
        address: optimizedAddress,
        originalAddress: address,
        capturedAt: new Date(),
        source: 'Google Maps Fallback',
        isStreetView: false,
        method: 'map_screenshot'
      };
      
      await saveBuffer(imageBuffer, filename, metadata);
      console.log(`✅ Saved fallback map image for ${optimizedAddress} to GridFS as ${filename}`);
      
      // Clean up
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      
      // Mark job as complete but indicate it's a fallback, not a street view
      await completeCaptureJob(propertyId, true, filename);
      return filename;
    } catch (error) {
      console.error(`Error with map fallback: ${error.message}`);
      throw error; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error(`Error capturing street view for ${address}:`, error);
    
    // Mark job as failed
    await completeCaptureJob(propertyId, false);
    
    // Clean up resources
    try {
      if (context) await context.close();
    } catch (e) {
      console.error('Error closing context:', e);
    }
    
    // Clean up temp file if it exists
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.error('Error deleting temp file:', e);
      }
    }
    
    return null;
  } finally {
    // Always try to clean up the context to avoid leaks
    try {
      if (context) await context.close();
    } catch (e) {
      console.error('Error closing context in finally block:', e);
    }
  }
}

// Function to close the browser instance
async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// Close browser instance on process exit
process.on('exit', closeBrowser);
process.on('SIGINT', closeBrowser);
process.on('SIGTERM', closeBrowser);

module.exports = { 
  captureStreetView, 
  closeBrowser,
  registerCaptureJob,
  completeCaptureJob,
  parseAddress // Export for testing
};