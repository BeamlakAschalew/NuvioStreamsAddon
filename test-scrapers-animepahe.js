#!/usr/bin/env node

/**
 * CLI test script for AnimePahe scraper
 * Usage: node test-scrapers-animepahe.js "<search query>"
 *
 * Examples:
 *   node test-scrapers-animepahe.js "Naruto"
 *   node test-scrapers-animepahe.js "One Piece"
 */

const {
  search,
  loadAnimeDetails,
  generateListOfEpisodes,
  loadVideoLinks,
} = require("./scrapersdirect/animepahe-scraper");

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node test-scrapers-animepahe.js "<search query>"');
  console.log("\nExamples:");
  console.log('  node test-scrapers-animepahe.js "Naruto"');
  console.log('  node test-scrapers-animepahe.js "One Piece"');
  console.log('  node test-scrapers-animepahe.js "Attack on Titan"');
  process.exit(1);
}

const query = args[0];

console.log("=".repeat(60));
console.log("Testing AnimePahe Scraper");
console.log("=".repeat(60));
console.log(`Search Query: ${query}`);
console.log("=".repeat(60));
console.log("");

// Test the scraper
(async () => {
  try {
    console.log("Searching for anime...");
    const results = await search(query);

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
    console.log(`Session: ${firstResult.session}`);

    console.log("\nLoading anime details...");
    const details = await loadAnimeDetails(firstResult.session);

    console.log("\nGenerating episode list...");
    const episodes = await generateListOfEpisodes(firstResult.session);

    console.log("\n" + "=".repeat(60));
    console.log("RESULTS");
    console.log("=".repeat(60));

    if (!episodes || episodes.length === 0) {
      console.log("❌ No episodes found");
    } else {
      console.log(`✅ Found ${episodes.length} episode(s):\n`);
      console.log(`  Anime: ${details.title || firstResult.title}`);
      console.log(`  Total Episodes: ${episodes.length}`);
      console.log(`  First Episode: ${episodes[0]?.episode || "N/A"}`);
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
