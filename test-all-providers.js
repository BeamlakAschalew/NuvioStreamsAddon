#!/usr/bin/env node

/**
 * CLI test script that runs ALL providers and scrapers simultaneously
 * Usage: node test-all-providers.js <tmdbId> [mediaType] [season] [episode]
 *
 * Examples:
 *   node test-all-providers.js 550 movie              # Fight Club
 *   node test-all-providers.js 603 movie              # The Matrix
 *   node test-all-providers.js 1399 tv 1 1            # Game of Thrones S01E01
 *   node test-all-providers.js 2316 tv 1 1            # The Office S01E01
 */

const axios = require("axios");

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(
    "Usage: node test-all-providers.js <tmdbId> [mediaType] [season] [episode]"
  );
  console.log("\nExamples:");
  console.log(
    "  node test-all-providers.js 550 movie              # Fight Club"
  );
  console.log(
    "  node test-all-providers.js 603 movie              # The Matrix"
  );
  console.log(
    "  node test-all-providers.js 1399 tv 1 1            # Game of Thrones S01E01"
  );
  console.log(
    "  node test-all-providers.js 2316 tv 1 1            # The Office S01E01"
  );
  process.exit(1);
}

const tmdbId = args[0];
const mediaType = args[1] || "movie";
const season = args[2] ? parseInt(args[2]) : null;
const episode = args[3] ? parseInt(args[3]) : null;

// Fetch TMDB title for scrapers that need it
async function getTMDBTitle() {
  try {
    const apiKey =
      process.env.TMDB_API_KEY || "439c478a771f35c05022f9feabcca01c";
    const url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${apiKey}`;
    const response = await axios.get(url, { timeout: 10000 });
    return mediaType === "tv" ? response.data.name : response.data.title;
  } catch (error) {
    console.error(`Error fetching TMDB metadata: ${error.message}`);
    return null;
  }
}

// Import all providers
const providers = {
  // Main providers (from providers/ folder)
  Vixsrc: () =>
    require("./providers/vixsrc").getVixsrcStreams(
      tmdbId,
      mediaType,
      season,
      episode
    ),
  "4KHDHub": () =>
    require("./providers/4khdhub").get4KHDHubStreams(
      tmdbId,
      mediaType,
      season,
      episode
    ),
  MP4Hydra: () =>
    require("./providers/MP4Hydra").getMP4HydraStreams(
      tmdbId,
      mediaType,
      season,
      episode
    ),
  Showbox: () =>
    require("./providers/Showbox").getStreamsFromTmdbId(
      tmdbId,
      mediaType,
      season,
      episode
    ),
  VidZee: () =>
    require("./providers/VidZee").getVidZeeStreams(
      tmdbId,
      mediaType,
      season,
      episode
    ),
  DramaDrip: () =>
    require("./providers/dramadrip").getDramaDripStreams(
      tmdbId,
      mediaType,
      season,
      episode
    ),
  MovieBox: () =>
    require("./providers/moviebox").getMovieBoxStreams(
      tmdbId,
      mediaType,
      season,
      episode
    ),
  MoviesDrive: () =>
    require("./providers/moviesdrive").getMoviesDriveStreams(
      tmdbId,
      mediaType,
      season,
      episode
    ),
  MoviesMod: () =>
    require("./providers/moviesmod").getMoviesModStreams(
      tmdbId,
      mediaType,
      season,
      episode
    ),
  SoaperTV: () =>
    require("./providers/soapertv").getSoaperTvStreams(
      tmdbId,
      mediaType,
      season,
      episode
    ),
  TopMovies: () =>
    require("./providers/topmovies").getTopMoviesStreams(
      tmdbId,
      mediaType,
      season,
      episode
    ),
  UHDMovies: () =>
    require("./providers/uhdmovies").getUHDMoviesStreams(
      tmdbId,
      mediaType,
      season,
      episode
    ),
  VidSrcExtractor: () =>
    require("./providers/vidsrcextractor").getStreamContent(
      tmdbId,
      mediaType,
      season,
      episode
    ),
};

// Scrapers that need search query (will be initialized after fetching title)
function getScrapers(title) {
  const MyFlixerExtractor = require("./scrapersdirect/myflixer-extractor");

  return {
    "MyFlixer (scraper)": async () => {
      const extractor = new MyFlixerExtractor();
      return await extractor.extractM3u8Links(title, episode, season);
    },
  };
}

// Results storage
const startTime = Date.now();

console.log("=".repeat(70));
console.log("TESTING ALL PROVIDERS & SCRAPERS SIMULTANEOUSLY");
console.log("=".repeat(70));
console.log(`TMDB ID: ${tmdbId}`);
console.log(`Media Type: ${mediaType}`);
if (season !== null && episode !== null) {
  console.log(`Season: ${season}, Episode: ${episode}`);
}
console.log("=".repeat(70));
console.log("");

// Create test function for each provider
async function testProvider(name, providerFn) {
  const providerStart = Date.now();
  try {
    const streams = await providerFn();
    const duration = Date.now() - providerStart;
    return {
      name,
      success: true,
      streamCount: Array.isArray(streams) ? streams.length : 0,
      streams: Array.isArray(streams) ? streams : [],
      duration,
      error: null,
    };
  } catch (error) {
    const duration = Date.now() - providerStart;
    return {
      name,
      success: false,
      streamCount: 0,
      streams: [],
      duration,
      error: error.message,
    };
  }
}

// Run all providers and scrapers in parallel
async function runAllProviders() {
  // First fetch the title for scrapers
  console.log("Fetching title from TMDB...");
  const title = await getTMDBTitle();

  if (title) {
    console.log(`Title: "${title}"\n`);
  } else {
    console.log(
      "Warning: Could not fetch title from TMDB. Scrapers may not work.\n"
    );
  }

  // Combine providers and scrapers
  const allSources = { ...providers };

  if (title) {
    const scrapers = getScrapers(title);
    Object.assign(allSources, scrapers);
  }

  console.log(
    `Starting ${Object.keys(allSources).length} sources in parallel...\n`
  );

  const promises = Object.entries(allSources).map(([name, fn]) =>
    testProvider(name, fn)
  );

  const allResults = await Promise.all(promises);
  const totalDuration = Date.now() - startTime;

  // Sort by stream count (descending), then by duration (ascending)
  allResults.sort((a, b) => {
    if (b.streamCount !== a.streamCount) return b.streamCount - a.streamCount;
    return a.duration - b.duration;
  });

  // Print results
  console.log("\n" + "=".repeat(70));
  console.log("RESULTS SUMMARY");
  console.log("=".repeat(70));

  // Summary table header
  console.log("\n" + "-".repeat(70));
  console.log(
    `${"Provider".padEnd(20)} | ${"Status".padEnd(10)} | ${"Streams".padEnd(
      8
    )} | ${"Time".padEnd(10)} | Error`
  );
  console.log("-".repeat(70));

  let totalStreams = 0;
  let successCount = 0;
  let failCount = 0;

  allResults.forEach((result) => {
    const status =
      result.streamCount > 0
        ? "✅ Found"
        : result.success
        ? "⚠️ Empty"
        : "❌ Error";
    const streams = result.streamCount.toString();
    const time = `${(result.duration / 1000).toFixed(2)}s`;
    const error = result.error ? result.error.substring(0, 25) + "..." : "";

    console.log(
      `${result.name.padEnd(20)} | ${status.padEnd(10)} | ${streams.padEnd(
        8
      )} | ${time.padEnd(10)} | ${error}`
    );

    totalStreams += result.streamCount;
    if (result.streamCount > 0) successCount++;
    else if (!result.success) failCount++;
  });

  console.log("-".repeat(70));
  console.log(
    `\nTotal: ${totalStreams} streams from ${successCount} providers (${failCount} errors)`
  );
  console.log(`Total time: ${(totalDuration / 1000).toFixed(2)}s`);

  // Detailed stream info for successful providers
  console.log("\n" + "=".repeat(70));
  console.log("DETAILED STREAM INFO");
  console.log("=".repeat(70));

  const providersWithStreams = allResults.filter((r) => r.streamCount > 0);

  if (providersWithStreams.length === 0) {
    console.log("\n❌ No streams found from any provider");
  } else {
    providersWithStreams.forEach((result) => {
      console.log(`\n📺 ${result.name} (${result.streamCount} streams):`);
      result.streams.slice(0, 3).forEach((stream, idx) => {
        console.log(
          `   ${idx + 1}. ${stream.title || stream.name || "Unknown"}`
        );
        console.log(`      Quality: ${stream.quality || "N/A"}`);
        if (stream.url) {
          console.log(`      URL: ${stream.url.substring(0, 60)}...`);
        }
      });
      if (result.streams.length > 3) {
        console.log(`   ... and ${result.streams.length - 3} more streams`);
      }
    });
  }

  console.log("\n" + "=".repeat(70));

  // Return summary for potential programmatic use
  return {
    totalStreams,
    successCount,
    failCount,
    totalDuration,
    results: allResults,
  };
}

// Run the test
runAllProviders()
  .then((summary) => {
    if (summary.totalStreams === 0) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error.message);
    process.exit(1);
  });
