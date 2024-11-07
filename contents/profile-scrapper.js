export{}

export async function profileScrape() {
  console.log("Running the profile page scraper");

  const scrapeData = () => {
    return new Promise((resolve) => {
      const maxAttempts = 10;
      let attempts = 0;

      const attemptScraping = () => {
        attempts++;
        console.log(`Attempt ${attempts}: Checking for elements...`);

        // Check if the main element is present
        const main = document.querySelector('main[role="main"]');
        if (!main) {
          console.log("Main element not found, retrying...");
          retryOrResolve();
          return;
        }

        console.log("main>>>>>>>>>>", main)
        // Check if the profileBio element is present
        const profileBio = main.querySelector('div[data-testid="primaryColumn"] > div[aria-label="Home timeline"] > div:nth-child(3) > div > div > div:nth-child(2) > div > div > div > div');
        if (!profileBio) {
          console.log("Profile bio not found, retrying...");
          retryOrResolve();
          return;
        }

        console.log("profileBio>>>>>", profileBio)
        // Select additional elements conditionally
        const thirddivbio = profileBio.querySelector(":scope > div:nth-child(3)");
        console.log("thirddivbio:", thirddivbio);
        
        const otherbiodetails = profileBio.querySelector(":scope > div:nth-child(4)");
        console.log("otherbiodetails:", otherbiodetails);
        
        const following_followercount = profileBio.querySelector(":scope > div:nth-child(5)");
        console.log("following_followercount:", following_followercount);
        
        const followingCount = following_followercount?.querySelector('div > a[href*="following"]')?.innerText || "Data not found";
        console.log("followingCount:", followingCount);
        
        const followersCount = following_followercount?.querySelector('div > a[href*="verified_followers"]')?.innerText || "Data not found";
        console.log("followersCount:", followersCount);
        
        let profilebiodata
        const profileBioofUser = thirddivbio?.querySelector(':scope > div > div[data-testid="UserDescription"]')
        console.log("profileBioofUser:", profileBioofUser);
        if (profileBioofUser) {
          const profiledata = profileBioofUser.querySelectorAll(':scope > span');
          profilebiodata = Array.from(profiledata)
              .map(span => span.textContent.trim())
              .join(" ") || "Data not found";
          console.log("profilebiodata:", profilebiodata);
      } else {
          console.log("profilebiodata: Data not found");
      }
        
        const userlocation = otherbiodetails?.querySelector(':scope > div[data-testid="UserProfileHeader_Items"] > span[data-testid="UserLocation"]')?.innerText || "Data not found";
        console.log("userlocation:", userlocation);

        const userBirthdate = otherbiodetails?.querySelector(':scope > div[data-testid="UserProfileHeader_Items"] > span[data-testid="UserBirthdate"]')?.innerText || "Data not found";
        console.log("userBirthdate:", userBirthdate);
        
        const userJoindate = otherbiodetails?.querySelector(':scope > div[data-testid="UserProfileHeader_Items"] > span[data-testid="UserJoinDate"]')?.innerText || "Data not found";
        console.log("userJoindate:", userJoindate);
        
        // Check if necessary data has been found
        if (
          followersCount !== "Data not found" &&
          followingCount !== "Data not found"
        ) {
          const scrapedData = {
            profilebiodata,
            userJoindate,
            followersCount,
            followingCount,
            userlocation,
            userBirthdate
          };
          console.log("Scraped data:", scrapedData);
          resolve(scrapedData);
          return;
        }

        retryOrResolve();
      };

      const retryOrResolve = () => {
        if (attempts >= maxAttempts) {
          console.log("Max attempts reached without finding all data.");
          resolve({
            profileBioofUser: "Data not found",
            userJoindate: "Data not found",
            followersCount: "Data not found",
            followingCount: "Data not found",
            userlocation: "Data not found",
            userBirthdate: "Data not found"
          });
        } else {
          setTimeout(attemptScraping, 1000);
        }
      };

      attemptScraping();
    });
  };

  if (document.readyState === "complete") {
    return await scrapeData();
  } else {
    return new Promise((resolve) => {
      window.addEventListener("load", async () => {
        resolve(await scrapeData());
      });
    });
  }
}

