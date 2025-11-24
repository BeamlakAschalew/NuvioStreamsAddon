#!/usr/bin/env node

/**
 * CLI test script for MoviesDrive provider
 * Usage: node test-moviesdrive.js <tmdbId> [mediaType] [season] [episode]
 *
 * Examples:
 *   node test-moviesdrive.js 550 movie              # Fight Club
 *   node test-moviesdrive.js 1399 tv 1 1            # Game of Thrones S01E01
 */

const { getMoviesDriveStreams } = require("./providers/moviesdrive");

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(
    "Usage: node test-moviesdrive.js <tmdbId> [mediaType] [season] [episode]"
  );
  console.log("\nExamples:");
  console.log("  node test-moviesdrive.js 550 movie              # Fight Club");
  console.log("  node test-moviesdrive.js 603 movie              # The Matrix");
  console.log(
    "  node test-moviesdrive.js 1399 tv 1 1            # Game of Thrones S01E01"
  );
  console.log(
    "  node test-moviesdrive.js 94605 tv 1 1           # Arcane S01E01"
  );
  process.exit(1);
}

const tmdbId = args[0];
const mediaType = args[1] || "movie";
const season = args[2] ? parseInt(args[2]) : null;
const episode = args[3] ? parseInt(args[3]) : null;

console.log("=".repeat(60));
console.log("Testing MoviesDrive Provider");
console.log("=".repeat(60));
console.log(`TMDB ID: ${tmdbId}`);
console.log(`Media Type: ${mediaType}`);
if (season !== null && episode !== null) {
  console.log(`Season: ${season}, Episode: ${episode}`);
}
console.log("=".repeat(60));
console.log("");

// Test the provider
getMoviesDriveStreams(tmdbId, mediaType, season, episode)
  .then((streams) => {
    console.log("\n" + "=".repeat(60));
    console.log("RESULTS");
    console.log("=".repeat(60));

    if (streams.length === 0) {
      console.log("❌ No streams found");
    } else {
      console.log(`✅ Found ${streams.length} stream(s):\n`);

      streams.forEach((stream, index) => {
        console.log(`Stream ${index + 1}:`);
        console.log(`  Name: ${stream.name}`);
        console.log(`  Title: ${stream.title}`);
        console.log(`  Quality: ${stream.quality}`);
        console.log(`  Type: ${stream.type}`);
        console.log(`  URL: ${stream.url.substring(0, 80)}...`);
        if (stream.headers) {
          console.log(`  Headers:`, JSON.stringify(stream.headers, null, 4));
        }
        console.log("");
      });
    }

    console.log("=".repeat(60));
  })
  .catch((error) => {
    console.error("\n" + "=".repeat(60));
    console.error("❌ ERROR");
    console.error("=".repeat(60));
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  });
