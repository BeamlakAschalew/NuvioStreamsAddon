#!/usr/bin/env node

/**
 * CLI test script for AnimeFlix scraper
 * Usage: node test-scrapers-animeflix.js "<search query>"
 *
 * Examples:
 *   node test-scrapers-animeflix.js "Naruto"
 *   node test-scrapers-animeflix.js "One Piece"
 */

const {
  searchAnime,
  extractMainDownloadLink,
} = require("./scrapersdirect/animeflix_scraper");

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node test-scrapers-animeflix.js "<search query>"');
  console.log("\nExamples:");
  console.log('  node test-scrapers-animeflix.js "Naruto"');
  console.log('  node test-scrapers-animeflix.js "One Piece"');
  console.log('  node test-scrapers-animeflix.js "Demon Slayer"');
  process.exit(1);
}

const query = args[0];

console.log("=".repeat(60));
console.log("Testing AnimeFlix Scraper");
console.log("=".repeat(60));
console.log(`Search Query: ${query}`);
console.log("=".repeat(60));
console.log("");

// Test the scraper
(async () => {
  try {
    console.log("Searching for anime...");
    const results = await searchAnime(query);

    if (!results || results.length === 0) {
      console.log("\n" + "=".repeat(60));
      console.log("RESULTS");
      console.log("=".repeat(60));
      console.log("❌ No results found");
      console.log("=".repeat(60));
      return;
    }

    console.log(`\nFound ${results.length} result(s). Testing first result...`);
    const firstResult = results[0];
    console.log(`\nTitle: ${firstResult.title}`);
    console.log(`URL: ${firstResult.url}`);

    console.log("\nExtracting download link...");
    const downloadLink = await extractMainDownloadLink(firstResult.url);

    console.log("\n" + "=".repeat(60));
    console.log("RESULTS");
    console.log("=".repeat(60));

    if (!downloadLink) {
      console.log("❌ No download link found");
    } else {
      console.log(`✅ Download link extracted:\n`);
      console.log(`  URL: ${downloadLink.substring(0, 80)}...`);
    }

    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ ERROR");
    console.error("=".repeat(60));
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
