#!/usr/bin/env node

/**
 * CLI test script for MyFlixer scraper
 * Usage: node test-scrapers-myflixer.js <tmdbId> [mediaType] [season] [episode]
 *
 * Examples:
 *   node test-scrapers-myflixer.js 550 movie              # Fight Club
 *   node test-scrapers-myflixer.js 1399 tv 1 1            # Game of Thrones S01E01
 */

const MyFlixerExtractor = require("./scrapersdirect/myflixer-extractor");
const axios = require("axios");

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(
    "Usage: node test-scrapers-myflixer.js <tmdbId> [mediaType] [season] [episode]"
  );
  console.log("\nExamples:");
  console.log(
    "  node test-scrapers-myflixer.js 550 movie              # Fight Club"
  );
  console.log(
    "  node test-scrapers-myflixer.js 603 movie              # The Matrix"
  );
  console.log(
    "  node test-scrapers-myflixer.js 1399 tv 1 1            # Game of Thrones S01E01"
  );
  console.log(
    "  node test-scrapers-myflixer.js 2316 tv 1 1            # The Office S01E01"
  );
  process.exit(1);
}

const tmdbId = args[0];
const mediaType = args[1] || "movie";
const season = args[2] ? parseInt(args[2]) : null;
const episode = args[3] ? parseInt(args[3]) : null;

console.log("=".repeat(60));
console.log("Testing MyFlixer Scraper");
console.log("=".repeat(60));
console.log(`TMDB ID: ${tmdbId}`);
console.log(`Media Type: ${mediaType}`);
if (season !== null && episode !== null) {
  console.log(`Season: ${season}, Episode: ${episode}`);
}
console.log("=".repeat(60));
console.log("");

// Fetch TMDB metadata to get the title
async function getTMDBTitle(tmdbId, mediaType) {
  try {
    const apiKey =
      process.env.TMDB_API_KEY || "439c478a771f35c05022f9feabcca01c";
    const url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${apiKey}`;
    const response = await axios.get(url, { timeout: 10000 });
    const title = mediaType === "tv" ? response.data.name : response.data.title;
    return title;
  } catch (error) {
    console.error(`Error fetching TMDB metadata: ${error.message}`);
    return null;
  }
}

// Test the scraper
(async () => {
  try {
    console.log("Fetching title from TMDB...");
    const query = await getTMDBTitle(tmdbId, mediaType);

    if (!query) {
      console.error("Failed to get title from TMDB");
      process.exit(1);
    }

    console.log(`Title: ${query}\n`);

    const extractor = new MyFlixerExtractor();

    extractor
      .extractM3u8Links(query, episode, season)
      .then((links) => {
        console.log("\n" + "=".repeat(60));
        console.log("RESULTS");
        console.log("=".repeat(60));

        if (links.length === 0) {
          console.log("❌ No M3U8 links found");
        } else {
          console.log(`✅ Found ${links.length} M3U8 link(s):\n`);

          links.forEach((link, index) => {
            console.log(`Link ${index + 1}:`);
            console.log(`  Source: ${link.source}`);
            console.log(
              `  Master M3U8 URL: ${link.m3u8Url.substring(0, 80)}...`
            );

            if (link.qualities && link.qualities.length > 0) {
              console.log(`  Available Qualities: ${link.qualities.length}`);
              link.qualities.slice(0, 3).forEach((quality, qIndex) => {
                console.log(
                  `    ${qIndex + 1}. ${quality.quality} (${
                    quality.resolution
                  })`
                );
              });
              if (link.qualities.length > 3) {
                console.log(`    ... and ${link.qualities.length - 3} more`);
              }
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
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ ERROR");
    console.error("=".repeat(60));
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
