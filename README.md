Chrome Extension
This repository contains the source code for our Chrome Extension. Follow the instructions below to set up, run, and contribute to the project.

Table of Contents
Prerequisites

Node.js Installation

pnpm Installation

Getting Started

Cloning the Repository

Installing Dependencies

Running the Extension

Development Mode

Production Mode

Loading the Extension in Chrome

Contribution Guidelines

Reporting Bugs

Suggesting Enhancements

Submitting Pull Requests

Code Style

Commit Messages

License

Prerequisites
Before you begin, ensure you have the following installed on your system:

Node.js (LTS version recommended)

pnpm

Node.js Installation
For Windows:

Go to the official Node.js website: https://nodejs.org/en/download/

Download the Windows Installer (.msi) for the LTS (Long Term Support) version.

Run the installer and follow the prompts. It will automatically add Node.js and npm (Node Package Manager) to your system's PATH.

Verify the installation by opening Command Prompt or PowerShell and running:

node -v
npm -v

For macOS:

Using Homebrew (Recommended):

If you don't have Homebrew installed, open Terminal and run:

/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

Once Homebrew is installed, install Node.js by running:

brew install node

Using the Official Installer:

Go to the official Node.js website: https://nodejs.org/en/download/

Download the macOS Installer (.pkg) for the LTS version.

Run the installer and follow the prompts.

Verify the installation by opening Terminal and running:

node -v
npm -v

pnpm Installation
After installing Node.js, you can install pnpm globally using npm:

npm install -g pnpm

Verify the installation:

pnpm -v

Getting Started
Cloning the Repository
To get a local copy of the repository, open your terminal or command prompt and run the following command:

git clone <repository-url>
cd <repository-name>

Replace <repository-url> with the actual URL of your Git repository (e.g., https://github.com/your-username/your-extension.git) and <repository-name> with the name of the cloned directory.

Installing Dependencies
Once you have cloned the repository and navigated into its directory, install the project dependencies using pnpm:

pnpm install

This command will download and install all the necessary packages listed in the package.json file.

Running the Extension
Development Mode
To run the extension in development mode with hot-reloading capabilities, use the following command:

pnpm dev

This will typically start a development server and compile the extension files into a dist or build folder (check your project's configuration for the exact output directory).

Production Mode
To build the extension for production, which creates optimized and minified files, use the following command:

pnpm build

This command will generate the production-ready files in a designated output folder (e.g., dist or build).

Loading the Extension in Chrome
After running either pnpm dev or pnpm build, you can load the extension into your Chrome browser:

Open Google Chrome.

Type chrome://extensions in the address bar and press Enter, or navigate to the Chrome menu (three dots in the top-right corner) -> More tools -> Extensions.

In the top-right corner, toggle on "Developer mode".

Click on the "Load unpacked" button that appears.

A file dialog will open. Navigate to your project directory.

If you ran pnpm dev, select the development output folder (e.g., dist or build).

If you ran pnpm build, select the production output folder (e.g., dist or build).

Click "Select Folder".

Your extension should now appear in the list of extensions. If you are in development mode, any changes you make to the source code will automatically trigger a rebuild, and you can simply click the refresh icon on the extension card in chrome://extensions to see the updates.

Contribution Guidelines
We welcome contributions to this project! Please follow these guidelines to ensure a smooth collaboration process.

Reporting Bugs
If you find a bug, please open an issue on the GitHub repository. When reporting a bug, please include:

A clear and concise description of the bug.

Steps to reproduce the behavior.

Expected behavior.

Screenshots or videos if applicable.

Your operating system and Chrome version.

Suggesting Enhancements
If you have an idea for a new feature or an improvement, please open an issue to discuss it. Describe the enhancement clearly, explaining why it would be beneficial to the extension.

Submitting Pull Requests
Fork the repository: Click the "Fork" button on the top right of the GitHub repository page.

Clone your forked repository:

git clone https://github.com/your-username/your-extension.git
cd your-extension

Create a new branch: Choose a descriptive name for your branch (e.g., feature/add-dark-mode, bugfix/fix-login-issue).

git checkout -b your-branch-name

Make your changes: Implement your feature or bug fix.

Test your changes: Ensure your changes work as expected and don't introduce new issues.

Commit your changes: Write clear and concise commit messages.

git add .
git commit -m "feat: Add dark mode toggle"

Push your branch:

git push origin your-branch-name

Open a Pull Request: Go to your forked repository on GitHub and click the "New pull request" button. Provide a detailed description of your changes.

Code Style
Please adhere to the existing code style of the project. We recommend setting up a linter (e.g., ESLint) and a code formatter (e.g., Prettier) to help maintain consistency.

Commit Messages
Please follow the Conventional Commits specification for your commit messages. This helps in generating changelogs and understanding the history of the project.

Examples:

feat: Add new user authentication flow

fix: Correct typo in settings page

docs: Update installation instructions

refactor: Improve performance of content script

License
This project is licensed under the MIT License.