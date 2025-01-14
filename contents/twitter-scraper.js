export {}

class TwitterScraper {
  constructor() {
    this.emojiDict = null
    this.initializeEmojiDictionary()
  }

  initializeEmojiDictionary() {
    if (typeof EmojiDictionary !== "undefined") {
      this.emojiDict = new EmojiDictionary()
    } else {
      window.addEventListener(
        "EmojiDictionaryReady",
        () => {
          this.emojiDict = new EmojiDictionary()
        },
        { once: true }
      )
    }
  }

  getEmojiDescription(imgElement) {
    if (!this.emojiDict) return "emoji"

    if (imgElement.title) {
      return imgElement.title.replace(" ", "_")
    }

    const src = imgElement.src
    if (src && src.includes("emoji")) {
      const unicodeParts = src.split("/").pop().split(".")[0].split("-")
      const unicodeString = unicodeParts
        .map((part) => `U+${part.toUpperCase()}`)
        .join(" ")
      const description = this.emojiDict.getDescription(unicodeString)
      return description !== "Description not found" ? description : "emoji"
    }

    return "emoji"
  }

  extractTextWithEmojis(element) {
    let text = ""
    for (const child of element.childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.nodeName === "IMG" && child.src.includes("emoji")) {
          const emojiDescription = this.getEmojiDescription(child)
          text += `:${emojiDescription}:`
        } else if (child.nodeName === "SPAN" || child.nodeName === "A") {
          text += this.extractTextWithEmojis(child)
        }
      } else if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent.trim()
      }
    }
    return text
  }

  async extractTweetData(tweet, analysisId, counter) {
    try {
      const container = tweet.querySelector("article[role='article']")
      if (!container) return null

      const screennameElement = container.querySelector("div[dir='ltr']")
      const Screenname = screennameElement
        ? this.extractTextWithEmojis(screennameElement)
        : "Unknown"

      const handleElement = container.querySelector("a[role='link'][href*='/']")
      const Username = handleElement
        ? "@" + handleElement.href.split("/").pop()
        : "Unknown"

      const timeElement = container.querySelector("time")
      const time = timeElement
        ? timeElement.getAttribute("datetime")
        : "Unknown"

      const tweetTextElement = container.querySelector(
        "div[data-testid='tweetText']"
      )
      const text = tweetTextElement
        ? this.extractTextWithEmojis(tweetTextElement)
        : "No text found"

      const showMoreLinkElement = container.querySelector(
        "div[data-testid='tweet-text-show-more-link']"
      )
      const isTruncated = !!showMoreLinkElement

      const tweetIdElement = container.querySelector(
        "a[role='link'][href*='/status/']"
      )
      const tweetId = tweetIdElement
        ? tweetIdElement.href.split("/").pop()
        : "Unknown"

      const postUrl = handleElement
        ? `https://x.com/${handleElement.href.split("/")[3]}/status/${tweetId}`
        : "Unknown"

      const userProfileUrl = handleElement
        ? `https://x.com/${handleElement.href.split("/")[3]}`
        : "Unknown"

      const postId = analysisId ? `${analysisId}-${counter}` : `${counter}`

      return {
        Screenname,
        Username,
        time,
        text,
        postUrl,
        isTruncated,
        userProfileUrl,
        postId
      }
    } catch (error) {
      console.error("Error extracting tweet data:", error)
      return null
    }
  }

  async parseTweets(analysisId = "", targetUrl = null) {
    const alltweetsection = document.querySelector(
      'section[role="region"] > div[aria-label^="Timeline:"]'
    )
    if (!alltweetsection) {
      console.error("Tweet section not found.")
      return []
    }

    const tweetsData = []
    const uniqueTweets = new Set()
    let counter = 1
    let previousTweetCount = 0 // Tracks visible tweets in the current viewport
    let idleCount = 0 // Tracks consecutive iterations with no new tweets

    // Helper function to extract tweet data

    // Scroll and scrape
    while (true) {
      // Extract tweets in the visible section
      const tweetsParent = alltweetsection.querySelectorAll(
        ":scope > div > div[data-testid='cellInnerDiv']"
      )

      console.log("tweetsParent>>>>", tweetsParent)
      for (const tweet of tweetsParent) {
        const tweetData = await this.extractTweetData(
          tweet,
          analysisId,
          counter
        )
        console.log("tweetsData>>>>>>>>.", tweetData)
        if (tweetData && !uniqueTweets.has(tweetData.postUrl)) {
          uniqueTweets.add(tweetData.postUrl)
          tweetsData.push(tweetData)
          counter++
        }
      }

      // Scroll down
      alltweetsection.scrollIntoView({ behavior: "smooth", block: "end" })

      // Wait for new tweets to load
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Check if new tweets are loaded
      const currentTweetCount = alltweetsection.querySelectorAll(
        ":scope > div > div[data-testid='cellInnerDiv']"
      ).length

      if (currentTweetCount === previousTweetCount) {
        idleCount++
        console.log("No new tweets loaded. Idle count:", idleCount)
      } else {
        idleCount = 0 // Reset idle count when new tweets are loaded
        previousTweetCount = currentTweetCount
      }

      // Exit loop if no new tweets are loaded after multiple attempts
      if (idleCount >= 3) {
        console.log("Reached the end of the page. Exiting loop.")
        break
      }
    }

    return tweetsData
  }

  async getTweets(analysisId) {
    console.log(`Getting tweets for analysis ID: ${analysisId}`)
    let tweets = this.parseTweets(analysisId)
    console.log("tweetslength>>>>", tweets.length)
    // console.log(`Initial parsed tweets: ${JSON.stringify(tweets)}`)

    const truncatedTweets = tweets.filter((tweet) => tweet.isTruncated)
    console.log(`Number of truncated tweets: ${truncatedTweets.length}`)

    if (truncatedTweets.length > 0) {
      console.log("Handling truncated tweets...")
      tweets = await this.handleTruncatedPosts(tweets)
    } else {
      console.log("No truncated tweets found.")
    }

    console.log(
      `Final tweets after handling truncation: ${JSON.stringify(tweets)}`
    )
    return tweets
  }

  async handleTruncatedPosts(posts) {
    console.log(`Handling truncated posts. Total posts: ${posts.length}`)
    const truncatedPosts = posts.filter((post) => post.isTruncated)
    console.log(`Number of truncated posts: ${truncatedPosts.length}`)

    for (const post of truncatedPosts) {
      console.log(`Processing truncated post: ${post.postUrl}`)
      try {
        const fullPost = await this.getFullPost(post.postUrl)
        console.log(`Received full post: ${JSON.stringify(fullPost)}`)

        if (fullPost) {
          const index = posts.findIndex((p) => p.postUrl === post.postUrl)
          if (index !== -1) {
            posts[index] = { ...posts[index], ...fullPost, isTruncated: false }
            console.log(`Updated post at index ${index}`)
          } else {
            console.log(`Couldn't find matching post for URL: ${post.postUrl}`)
          }
        } else {
          console.log(`No full post data received for URL: ${post.postUrl}`)
        }
      } catch (error) {
        console.error(`Error processing truncated post ${post.postUrl}:`, error)
      }
    }

    return posts
  }

  async getFullPost(url) {
    console.log(`Requesting full post content for URL: ${url}`)
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: "scrapePostURL", url: url },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              `Error in getFullPost: ${chrome.runtime.lastError.message}`
            )
            reject(chrome.runtime.lastError)
          } else {
            console.log(
              `Received response for URL ${url}: ${JSON.stringify(response)}`
            )
            if (Array.isArray(response) && response.length > 0) {
              const fullPost = response.find((post) => post.postUrl === url)
              if (fullPost) {
                console.log(
                  `Found matching full post: ${JSON.stringify(fullPost)}`
                )
                resolve(fullPost)
              } else {
                console.log(
                  `No matching post found in response for URL: ${url}`
                )
                resolve(null)
              }
            } else {
              console.log(`Invalid response format for URL ${url}`)
              resolve(null)
            }
          }
        }
      )
    })
  }
}

// Make TwitterScraper available globally
window.TwitterScraper = TwitterScraper

// Dispatch a custom event to signal that TwitterScraper is ready
window.dispatchEvent(new Event("TwitterScraperReady"))
