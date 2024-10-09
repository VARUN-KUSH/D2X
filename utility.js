
import JSZip from "jszip.min.js"

let zip = new JSZip();

function modifyUrl(url) {
  // Find the base URL by splitting at the first "/status/" or anything after "https://x.com/"
  const baseUrl = url.split('x.com/')[0] + 'x.com/';
  
  // Append "username" to the base URL
  const modifiedUrl = baseUrl + 'username';
  
  return modifiedUrl;
}

export async function addTimestampToScreenshots(screenshotFiles, time, url, analysisId) {
  return Promise.all(
    screenshotFiles.map((file, index) => {
      return new Promise((resolve, reject) => {
        const newUrl = modifyUrl(url);
        const img = new Image()
        img.onload = function () {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")

          const bannerHeight = 80
          canvas.width = img.width
          canvas.height = img.height + bannerHeight

          ctx.drawImage(img, 0, bannerHeight, img.width, img.height)

          ctx.fillStyle = "#f0f0f0"
          ctx.fillRect(0, 0, canvas.width, bannerHeight)
          ctx.fillStyle = "#000000"
          ctx.font = "14px Arial"
          ctx.textAlign = "left"
          ctx.textBaseline = "middle"

          const timestamp = `Captured on: ${new Date(time).toUTCString()}`
          const urlText = `URL: ${newUrl}`
          const idText = `Analysis ID: ${analysisId}`
          const partText = `Part ${index + 1} of ${screenshotFiles.length}`

          ctx.fillText(timestamp, 10, bannerHeight / 5)
          ctx.fillText(urlText, 10, (bannerHeight / 5) * 2)
          ctx.fillText(idText, 10, (bannerHeight / 5) * 3)
          ctx.fillText(partText, 10, (bannerHeight / 5) * 4)

          canvas.toBlob(function (blob) {
            const url = URL.createObjectURL(blob)
            resolve(url)
          }, "image/png")
        }

        img.onerror = function (error) {
          reject(new Error(`Failed to load the screenshot image ${index + 1}`))
        }

        img.src = file
      })
    })
  )
}

export function addToZip(fileData, filename, directory) {
  console.log(
    "filename>>>>>>",
    filename,
    "fileData>>>>>>>>>>>",
    fileData,
    "directory::::::::",
    directory
  )

  if (directory) {
    zip.folder(directory).file(filename, fileData, { binary: true })
  } else {
    zip.file(filename, fileData, { binary: true })
  }

  downloadZip()
}

export function getFilename(contentURL, uid) {
  if (!contentURL) {
    contentURL = "unknown-url"
  }
  if (!uid) {
    uid = Date.now().toString(36)
  }

  let name = contentURL.split("?")[0].split("#")[0]
  name = name
    .replace(/^https?:\/\//, "")
    .replace(/[^A-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[_\-]+/, "")
    .replace(/[_\-]+$/, "")

  if (name.length > 50) {
    name = name.substring(0, 50)
  }

  const shortUID = uid.substring(0, 8)
  return `screenshot-${shortUID}-${name}-${Date.now()}.png`
}

function downloadZip() {
  zip.generateAsync({ type: "blob" }).then(function (content) {
    // Create a link element
    let a = document.createElement("a")
    a.href = URL.createObjectURL(content)
    a.download = "archive.zip" // Set the name of the downloaded ZIP file

    // Append the link to the body (it won't be visible)
    document.body.appendChild(a)

    // Trigger the download by simulating a click
    a.click()

    // Clean up the link after downloading
    document.body.removeChild(a)
  })
}
