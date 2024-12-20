
// content.js
export {}

console.log("taking screenshot of full page now")

async function captureFullPageScreenshot() {
  console.log("scroll started to take")
    // First, get the total scrollable height
    const getScrollHeight = () => {
      return Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
    };
  
    // Save original scroll position
    const originalScrollPos = window.scrollY;
    
    // Scroll to bottom to ensure all content is loaded
    let lastScrollHeight = 0;
    let currentScrollHeight = getScrollHeight();
    
    while (lastScrollHeight !== currentScrollHeight) {
      lastScrollHeight = currentScrollHeight;
      window.scrollTo(0, currentScrollHeight);
      
      // Wait for potential dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      currentScrollHeight = getScrollHeight();
    }
    
    // Scroll back to top
    window.scrollTo(0, 0);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get final dimensions
    const totalHeight = getScrollHeight();
    const viewportWidth = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth
    );
    
    // Create canvas for the full screenshot
    const canvas = document.createElement('canvas');
    canvas.width = viewportWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    
    // Capture screenshots in chunks and stitch them together
    const viewportHeight = window.innerHeight;
    let currentPosition = 0;
    
    while (currentPosition < totalHeight) {
      // Scroll to position
      window.scrollTo(0, currentPosition);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Capture current viewport
      const dataUrl = await new Promise(resolve => {
        chrome.runtime.sendMessage(
          { action: 'captureVisibleTabofx' },
          response => resolve(response.dataUrl)
        );
      });

      console.log("dataUrl>>>>>.", dataUrl)
      
      // Draw captured image onto canvas
      const img = new Image();
      await new Promise(resolve => {
        img.onload = resolve;
        img.src = dataUrl;
      });
      
      ctx.drawImage(
        img,
        0,
        currentPosition,
        viewportWidth,
        viewportHeight
      );
      
      currentPosition += viewportHeight;
    }
    
    // Restore original scroll position
    window.scrollTo(0, originalScrollPos);
    
    // Convert canvas to blob and download
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png');
    });
    
    return blob;
  }
  
  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'takeScreenshot') {
      captureFullPageScreenshot().then(blob => {
        // Create object URL for the blob
        console.log("blob>>>>>>", blob)
        const url = URL.createObjectURL(blob);
        console.log("url>>>>>>>>>>.", url)
        const id = getActiveAnalysisId()
        console.log("analysisId>>>>>>>", id)
        sendResponse({ analysisId: getActiveAnalysisId(), URL: url})
      });
    }
    return true;
  });