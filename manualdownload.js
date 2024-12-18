class DataStore {
    constructor() {
        this.data = {
            screenshot: null,
            posts: null,
            profile: null,
            additionalData: null
        };
        
        // Store URLs/references that need cleanup
        this.cleanupRefs = {
            screenshotURL: null,
            postBlobs: [],
            profileBlobs: []
        };
    }

    // Generic clear method for any data type
    clearData(dataType) {
        switch(dataType) {
            case 'screenshot':
                if (this.cleanupRefs.screenshotURL) {
                    URL.revokeObjectURL(this.cleanupRefs.screenshotURL);
                    this.cleanupRefs.screenshotURL = null;
                }
                this.data.screenshot = null;
                break;

            case 'posts':
                // Clean up any blobs associated with posts
                this.cleanupRefs.postBlobs.forEach(url => URL.revokeObjectURL(url));
                this.cleanupRefs.postBlobs = [];
                this.data.posts = null;
                break;

            case 'profile':
                this.cleanupRefs.profileBlobs.forEach(url => URL.revokeObjectURL(url));
                this.cleanupRefs.profileBlobs = [];
                this.data.profile = null;
                break;

            default:
                console.warn(`Unknown data type: ${dataType}`);
        }
    }

    // Generic store method for any data type
    storeData(dataType, newData) {
        // Clear previous data of this type
        this.clearData(dataType);

        // Store new data
        this.data[dataType] = newData;

        // If data is a blob, store its URL reference
        if (newData instanceof Blob) {
            const url = URL.createObjectURL(newData);
            switch(dataType) {
                case 'screenshot':
                    this.cleanupRefs.screenshotURL = url;
                    break;
                case 'posts':
                    this.cleanupRefs.postBlobs.push(url);
                    break;
                case 'profile':
                    this.cleanupRefs.profileBlobs.push(url);
                    break;
            }
        }
    }

    getData(dataType) {
        return this.data[dataType];
    }
}

class ExtensionController {
    constructor() {
        this.dataStore = new DataStore();
    }

    async handleScreenshotCapture(type) {
        try {
            const screenshot = await captureScreenshot(type);
            this.dataStore.storeData('screenshot', screenshot);
            this.notifyDataUpdated('screenshot');
        } catch (error) {
            console.error('Screenshot capture failed:', error);
            throw error;
        }
    }

    async handlePostScraping() {
        try {
            const posts = await this.scrapePosts();
            this.dataStore.storeData('posts', posts);
            this.notifyDataUpdated('posts');
        } catch (error) {
            console.error('Post scraping failed:', error);
            throw error;
        }
    }

    async handleProfileScraping() {
        try {
            const profile = await this.scrapeProfile();
            this.dataStore.storeData('profile', profile);
            this.notifyDataUpdated('profile');
        } catch (error) {
            console.error('Profile scraping failed:', error);
            throw error;
        }
    }

    notifyDataUpdated(dataType) {
        const event = new CustomEvent('dataUpdated', {
            detail: {
                type: dataType,
                data: this.dataStore.getData(dataType)
            }
        });
        document.dispatchEvent(event);
    }
}

// UI Handler
class UIHandler {
    constructor(controller) {
        this.controller = controller;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Screenshot button
        document.getElementById('screenshot-btn').addEventListener('click', async () => {
            await this.controller.handleScreenshotCapture('full');
        });

        // Post scraping button
        document.getElementById('scrape-posts-btn').addEventListener('click', async () => {
            await this.controller.handlePostScraping();
        });

        // Profile scraping button
        document.getElementById('scrape-profile-btn').addEventListener('click', async () => {
            await this.controller.handleProfileScraping();
        });

        // Listen for data updates
        document.addEventListener('dataUpdated', (event) => {
            this.updateUI(event.detail.type, event.detail.data);
        });
    }

    updateUI(dataType, data) {
        // Update UI based on data type
        switch(dataType) {
            case 'screenshot':
                this.updateScreenshotPreview(data);
                break;
            case 'posts':
                this.updatePostsList(data);
                break;
            case 'profile':
                this.updateProfileInfo(data);
                break;
        }
    }

    updateScreenshotPreview(screenshot) {
        const preview = document.getElementById('screenshot-preview');
        if (preview && screenshot) {
            preview.src = URL.createObjectURL(screenshot);
        }
    }

    updatePostsList(posts) {
        // Update posts display in UI
    }

    updateProfileInfo(profile) {
        // Update profile display in UI
    }
}

// Usage
const controller = new ExtensionController();
const ui = new UIHandler(controller);