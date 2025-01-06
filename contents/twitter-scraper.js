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

  parseTweets(analysisId = "", targetUrl = null) {
    const alltweetsection = document.querySelector(
      'section[role="region"] > div[aria-label="Timeline: Conversation'
    )
    console.log("alltweetsection>>>>>>", alltweetsection)
    const tweetsParent = alltweetsection.querySelectorAll(
      ":scope > div > div[data-testid='cellInnerDiv']"
    )
   
    console.log("tweetspARENT>>>>", tweetsParent)

    const tweetsData = []
    let counter = 1

    for (const tweet of tweetsParent) {
      try {
        const container = tweet.querySelector('article[role="article"]')
        console.log("Containers>>>>>>>>>>>", container)
        if(!container) {
          continue;
        }
        const screennameElement = container.querySelector("div[dir='ltr']")
        console.log("screennameElement>>>>>>>>>>", screennameElement)
        if (screennameElement) {
          const screenname = screennameElement
            ? this.extractTextWithEmojis(screennameElement)
            : "Unknown"

          console.log("screenname>>>>>>>>>>", screenname)

          const handleElement = container.querySelector(
            "a[role='link'][href*='/']"
          )

          console.log("handleElement>>>>>>>>>>", handleElement)

          const handle = handleElement
            ? "@" + handleElement.href.split("/").pop()
            : "Unknown"

          console.log("handle>>>>>>>>>>", handle)

          const timeElement = container.querySelector("time")
          console.log("timeElement>>>>>>>>>>", timeElement)

          const time = timeElement
            ? timeElement.getAttribute("datetime")
            : "Unknown"

          console.log("time>>>>>>>>>>", time)
          const tweetTextElement = container.querySelector(
            "div[data-testid='tweetText']"
          )
          const text = tweetTextElement
            ? this.extractTextWithEmojis(tweetTextElement)
            : "No text found"

          console.log("text>>>>>>>>>>", text)
          const showMoreLinkElement = container.querySelector(
            "div[data-testid='tweet-text-show-more-link']"
          )
          console.log("showMoreLinkElement>>>>>>>>>>", showMoreLinkElement)
          const isTruncated = !!showMoreLinkElement
          console.log("isTruncated>>>>>>>>>>", isTruncated)

          const tweetIdElement = container.querySelector(
            "a[role='link'][href*='/status/']"
          )
          console.log("tweetIdElement>>>>>>>>>>", tweetIdElement)
          const tweetId = tweetIdElement
            ? tweetIdElement.href.split("/").pop()
            : "Unknown"
          console.log("tweetId>>>>>>>>>>", tweetId)

          const postUrl = handleElement
            ? `https://x.com/${
                handleElement.href.split("/")[3]
              }/status/${tweetId}`
            : "Unknown"
          console.log("postUrl>>>>>>>>>>", postUrl)

          const userProfileUrl = handleElement
            ? `https://x.com/${handleElement.href.split("/")[3]}`
            : "Unknown"
          console.log("userProfileUrl>>>>>>>>>>", userProfileUrl)

          const postId = analysisId ? `${analysisId}-${counter}` : `${counter}`

          const tweetData = {
            screenname,
            handle,
            time,
            text,
            postUrl,
            isTruncated,
            userProfileUrl,
            postId
          }

          tweetsData.push(tweetData)

          // if (targetUrl && tweetData.postUrl === targetUrl) {
          //   break;
          // }
        }

        counter++
      } catch (error) {
        console.error("Error parsing tweet:", error)
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
