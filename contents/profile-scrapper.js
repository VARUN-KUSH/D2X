export async function profileScrape() {
    console.log("Running the profile page scraper");
  
    const getElementTextByXPath = (xpath) => {
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      return result.singleNodeValue ? result.singleNodeValue.innerText : "Data not found";
    };
  
    // Define the XPath expressions
    const xpathofProfileBio =
      "/html/body/div[1]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/div/div/div[3]";
    const xpathofotherdetails =
      "/html/body/div[1]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/div[2]/div/div/div/div/div[4]";
    const xpathofFollowersCount =
      "/html/body/div[1]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/div[2]/div/div/div/div/div[5]/div[2]";
    const xpathofFollowingCount =
      "/html/body/div[1]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div/div[2]/div/div/div/div/div[5]/div[1]";
  
    const scrapeData = () => {
      return new Promise((resolve) => {
        const maxAttempts = 15;
        let attempts = 0;
  
        const attemptScraping = () => {
          attempts++;
          console.log(`Attempt ${attempts}: Checking for elements...`);
  
          // Check if the elements are present
          const profileBio = getElementTextByXPath(xpathofProfileBio);
          const joiningDate = getElementTextByXPath(xpathofotherdetails);
          const followersCount = getElementTextByXPath(xpathofFollowersCount);
          const followingCount = getElementTextByXPath(xpathofFollowingCount);
  
          // Check if we found all necessary data
          if (
            profileBio !== "Data not found" &&
            joiningDate !== "Data not found" &&
            followersCount !== "Data not found" &&
            followingCount !== "Data not found"
          ) {
            const scrapedData = {
              profileBio,
              joiningDate,
              followersCount,
              followingCount
            };
            console.log("Scraped data:", scrapedData);
            resolve(scrapedData);
            return;
          }
  
          // Stop checking after the maximum number of attempts
          if (attempts >= maxAttempts) {
            const scrapedData = {
              profileBio: "Data not found",
              joiningDate: "Data not found",
              followersCount: "Data not found",
              followingCount: "Data not found"
            };
            console.log("Max attempts reached. Scraped data:", scrapedData);
            resolve(scrapedData);
            return;
          }
  
          // Try again after 1 second
          setTimeout(attemptScraping, 1000);
        };
  
        attemptScraping();
      });
    };
  
    // Wait until the page is fully loaded, then start scraping
    if (document.readyState === 'complete') {
      return await scrapeData();
    } else {
      return new Promise((resolve) => {
        window.addEventListener('load', async () => {
          resolve(await scrapeData());
        });
      });
    }
  }
  
  