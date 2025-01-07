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

        // Check if the main element is present
        const main = document.querySelector('main[role="main"]')
        if (!main) {
          console.log("Main element not found, retrying...")
          retryOrResolve()
          return
        }

        console.log("main>>>>>>>>>>", main)
        // Check if the profileBio element is present
        const primaryColoumn = main.querySelector(
          'div[data-testid="primaryColumn"] > div[aria-label^="Home"] > div:nth-child(3)'
        )
        console.log("primaryColoumn", primaryColoumn)
        if (!primaryColoumn) {
          console.log("Main element not found, retrying...")
          retryOrResolve()
          return
        }

        const profileBio = primaryColoumn.querySelector(
          ":scope > div > div > div > div"
        )
        if (!profileBio) {
          console.log("Profile bio not found, retrying...")
          retryOrResolve()
          return
        }

        console.log("profileBio>>>>>", profileBio)
        // Select additional elements conditionally
        const thirddivbio = profileBio.querySelector(
          ":scope > div:nth-child(3)"
        )
        console.log("thirddivbio:", thirddivbio)

        const otherbiodetails = profileBio.querySelector(
          ":scope > div:nth-child(4)"
        )
        console.log("otherbiodetails:", otherbiodetails)

        const following_followercount = profileBio.querySelector(
          ":scope > div:nth-child(5)"
        )
        console.log("following_followercount:", following_followercount)

        const followingCount =
          following_followercount?.querySelector('div > a[href*="following"]')
            ?.innerText || " "
        console.log("followingCount:", followingCount)

        const followersCount =
          following_followercount?.querySelector(
            'div > a[href*="verified_followers"]'
          )?.innerText || " "
        console.log("followersCount:", followersCount)

        let profilebiodata
        const profileBioofUser = thirddivbio?.querySelector(
          ':scope > div > div[data-testid="UserDescription"]'
        )
        console.log("profileBioofUser:", profileBioofUser)
        if (profileBioofUser) {
          const profiledata = profileBioofUser.querySelectorAll(":scope > span")
          profilebiodata =
            Array.from(profiledata)
              .map((span) => span.textContent.trim())
              .join(" ") || ""
          console.log("profilebiodata:", profilebiodata)
        } else {
          console.log("profilebiodata: Data not found")
        }

        const userlocation =
          otherbiodetails?.querySelector(
            ':scope > div[data-testid="UserProfileHeader_Items"] > span[data-testid="UserLocation"]'
          )?.innerText || ""
        console.log("userlocation:", userlocation)

        const userBirthdate =
          otherbiodetails?.querySelector(
            ':scope > div[data-testid="UserProfileHeader_Items"] > span[data-testid="UserBirthdate"]'
          )?.innerText || ""
        console.log("userBirthdate:", userBirthdate)

        const userJoindate =
          otherbiodetails?.querySelector(
            ':scope > div[data-testid="UserProfileHeader_Items"] > span[data-testid="UserJoinDate"]'
          )?.innerText || ""
        console.log("userJoindate:", userJoindate)

        const userUrl =
          otherbiodetails?.querySelector(
            ':scope > div[data-testid="UserProfileHeader_Items"] > a[data-testid="UserUrl"]'
          )?.innerText || ""
        console.log("userUrl>>>>>>>", userUrl)
        //screenname scrape
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
            userBirthdate,
            userUrl
          }
          console.log("Scraped data:", scrapedData)
          resolve(scrapedData)
          return
        }

        retryOrResolve()
      }

      const retryOrResolve = () => {
        if (attempts >= maxAttempts) {
          console.log("Max attempts reached without finding all data.")
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
