export {}

export async function profileScrape() {
  console.log("Running the profile page scraper")

  const scrapeData = () => {
    return new Promise((resolve) => {
      const maxAttempts = 10
      let attempts = 0

      const attemptScraping = () => {
        attempts++
        console.log(`Attempt ${attempts}: Checking for elements...`)

        const main = document.querySelector('main[role="main"]')
        if (!main) {
          console.log("Main element not found, retrying...")
          return retryOrResolve()
        }

        const primaryColumn = main.querySelector(
          'div[data-testid="primaryColumn"] > div[aria-label^="Home"] > div:nth-child(3)'
        )
        if (!primaryColumn) {
          console.log("Primary column not found, retrying...")
          return retryOrResolve()
        }

        const profileBio = primaryColumn.querySelector(
          ":scope > div > div > div > div"
        )
        if (!profileBio) {
          console.log("Profile bio not found, retrying...")
          return retryOrResolve()
        }

        const followingFollowerCount = profileBio.querySelector(
          ":scope > div:nth-child(5)"
        )
        if (!followingFollowerCount) {
          console.log("Following/Follower count section not found, retrying...")
          return retryOrResolve()
        }

        const followingCount =
          followingFollowerCount
            ?.querySelector('div > a[href*="following"]')
            ?.innerText.trim() || ""
        const followersCount =
          followingFollowerCount
            ?.querySelector('div > a[href*="verified_followers"]')
            ?.innerText.trim() || ""

        if (!followersCount || !followingCount) {
          console.log("Follower/Following count not found, retrying...")
          return retryOrResolve()
        }

        console.log("Followers Count:", followersCount)
        console.log("Following Count:", followingCount)

        // Now extract other profile details
        const thirdDivBio = profileBio.querySelector(
          ":scope > div:nth-child(3)"
        )
        const otherBioDetails = profileBio.querySelector(
          ":scope > div:nth-child(4)"
        )

        let profileBioData = ""
        const profileBioOfUser = thirdDivBio?.querySelector(
          ':scope > div > div[data-testid="UserDescription"]'
        )
        if (profileBioOfUser) {
          const profileData = profileBioOfUser.querySelectorAll(":scope > span")
          profileBioData =
            Array.from(profileData)
              .map((span) => span.textContent.trim())
              .join(" ") || ""
        }

        const userLocation =
          otherBioDetails
            ?.querySelector(
              ':scope > div[data-testid="UserProfileHeader_Items"] > span[data-testid="UserLocation"]'
            )
            ?.innerText.trim() || ""
        const userBirthdate =
          otherBioDetails
            ?.querySelector(
              ':scope > div[data-testid="UserProfileHeader_Items"] > span[data-testid="UserBirthdate"]'
            )
            ?.innerText.trim() || ""
        const userJoinDate =
          otherBioDetails
            ?.querySelector(
              ':scope > div[data-testid="UserProfileHeader_Items"] > span[data-testid="UserJoinDate"]'
            )
            ?.innerText.trim() || ""
        const userUrl =
          otherBioDetails
            ?.querySelector(
              ':scope > div[data-testid="UserProfileHeader_Items"] > a[data-testid="UserUrl"]'
            )
            ?.innerText.trim() || ""

        const scrapedData = {
          profileBioData,
          userJoinDate,
          followersCount,
          followingCount,
          userLocation,
          userBirthdate,
          userUrl
        }

        console.log("Scraped Data:", scrapedData)
        resolve(scrapedData)
      }

      const retryOrResolve = () => {
        if (attempts >= maxAttempts) {
          console.log(
            "Max attempts reached without finding follower and following count."
          )
          resolve({
            profileBioofUser: "",
            userJoindate: "",
            followersCount: "",
            followingCount: "",
            userlocation: "",
            userBirthdate: ""
          })
        } else {
          setTimeout(attemptScraping, 1000)
        }
      }

      attemptScraping()
    })
  }

  if (document.readyState === "complete") {
    return await scrapeData()
  } else {
    return new Promise((resolve) => {
      window.addEventListener("load", async () => {
        resolve(await scrapeData())
      })
    })
  }
}
