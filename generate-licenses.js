#!/usr/bin/env node

// first generate a file licenses.json with pnpm like this:
// pnpm licenses list --json > licenses.json
// run this script from the root of the project

const fs = require('fs');
const path = require('path');

// Define the input and output file paths
const inputFilePath = path.join(__dirname, 'licenses.json');
const outputFilePath = path.join(__dirname, 'THIRD_PARTY_LICENSES.md');

// Read the licenses.json file
fs.readFile(inputFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading ${inputFilePath}:`, err);
    process.exit(1);
  }

  let licenses;
  try {
    licenses = JSON.parse(data);
  } catch (parseErr) {
    console.error('Error parsing licenses.json:', parseErr);
    process.exit(1);
  }

  // Count occurrences of each license type
  const licenseCounts = {};
  for (const [licenseType, dependencies] of Object.entries(licenses)) {
    licenseCounts[licenseType] = dependencies.length;
  }

  // Build the Markdown content
  let mdContent = `# Third-Party Licenses\n\n`;

  // Add License Overview Table
  mdContent += `## License Overview\n\n`;
  mdContent += `| License Type | Number of Dependencies |\n`;
  mdContent += `|-------------|----------------------|\n`;
  for (const [licenseType, count] of Object.entries(licenseCounts)) {
    mdContent += `| ${licenseType} | ${count} |\n`;
  }
  mdContent += `\n---\n\n`;

  // Iterate over each license type
  for (const [licenseType, dependencies] of Object.entries(licenses)) {
    mdContent += `## License: ${licenseType}\n\n`;
    dependencies.forEach(dep => {
      mdContent += `### ${dep.name}\n`;
      mdContent += `- **License:** ${dep.license}\n`;

      // List version(s)
      if (dep.versions && dep.versions.length) {
        mdContent += `- **Version(s):** ${dep.versions.join(', ')}\n`;
      }

      // Add description if available
      if (dep.description) {
        mdContent += `- **Description:** ${dep.description}\n`;
      }

      // Add author if available
      if (dep.author) {
        mdContent += `- **Author:** ${dep.author}\n`;
      }

      // Add homepage if available
      if (dep.homepage) {
        mdContent += `- **Homepage:** [Link](${dep.homepage})\n`;
      }

      // Try to find and include the full license text from the package folder
      if (dep.paths && dep.paths.length) {
        const packagePath = dep.paths[0]; // Use the first path
        const licenseFilePath = path.join(packagePath, 'LICENSE');

        if (fs.existsSync(licenseFilePath)) {
          try {
            const licenseText = fs.readFileSync(licenseFilePath, 'utf8');
            mdContent += `\n#### Full License Text:\n\`\`\`\n${licenseText}\n\`\`\`\n`;
          } catch (readErr) {
            mdContent += `\n⚠️ *Could not read license file for this package.*\n`;
          }
        } else {
          mdContent += `\n⚠️ *No LICENSE file found in package directory.*\n`;
        }
      }

      mdContent += '\n---\n\n';
    });
  }

  // Write the output file
  fs.writeFile(outputFilePath, mdContent, 'utf8', err => {
    if (err) {
      console.error(`Error writing ${outputFilePath}:`, err);
      process.exit(1);
    } else {
      console.log(`Successfully generated ${outputFilePath}`);
    }
  });
});
