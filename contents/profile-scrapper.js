export default function profileScrape() {
    console.log("running the prifle page scrapper")
    const mainElement = document.querySelector('main[role="main"]');
    if (!mainElement) {
        console.error('Main element not found');
        return;
    }

    const primaryColumn = mainElement.querySelector('div[data-testid="primaryColumn"]');
    if (!primaryColumn) {
        console.error('Primary column not found');
        return;
    }

    // Add your scraping logic here
    console.log('Scraping started:', primaryColumn);

     // Select the div with aria-label="Home timeline" inside primaryColumn
     const homeTimeline = primaryColumn.querySelector('div[aria-label="Home timeline"]');
     if (!homeTimeline) {
         console.error('Home timeline not found');
         return;
     }
 
     // Select the last div element inside homeTimeline
     const lastDiv = homeTimeline.querySelector('div:last-child');
     if (!lastDiv) {
         console.error('Last div not found in Home timeline');
         return;
     }
    
       // Select the div inside lastDiv
    const innerDiv = lastDiv.querySelector('div');
    if (!innerDiv) {
        console.error('Inner div not found in last div');
        return;
    }

    // Select the first div element inside the innerDiv
    const targetDiv = innerDiv.querySelector('div > div > div:first-child > div');
    if (!targetDiv) {
        console.error('Target div not found');
        return;
    }
    // Add your scraping logic here
    console.log('Scraping target div:', targetDiv);

    const scrapedData = targetDiv.innerText || "Data not found"; // Modify as needed to retrieve different data
    console.log("Scraping target div:", scrapedData);

    return scrapedData;

}

// Run profileScrape only after the page is fully loaded
// window.addEventListener('load', profileScrape);
