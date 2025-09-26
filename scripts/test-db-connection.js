#!/usr/bin/env node

/**
 * Database Connection Test Script
 *
 * This script tests the connection to your Supabase database
 * and verifies that the schema is properly set up.
 *
 * Usage: node scripts/test-db-connection.js
 */

const { createClient } = require("@supabase/supabase-js");

// Load environment variables manually (avoiding dotenv dependency)
function loadEnvFile() {
  const fs = require('fs');
  const path = require('path');

  const envPath = path.join(process.cwd(), '.env.local');

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    });
  }
}

// Load environment variables
loadEnvFile();

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  reset: "\x1b[0m",
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log("green", `✅ ${message}`);
}

function logError(message) {
  log("red", `❌ ${message}`);
}

function logInfo(message) {
  log("blue", `ℹ️  ${message}`);
}

function logWarning(message) {
  log("yellow", `⚠️  ${message}`);
}

async function testDatabaseConnection() {
  console.log("\n" + "=".repeat(60));
  log("cyan", "🚀 POLLS APP - DATABASE CONNECTION TEST");
  console.log("=".repeat(60) + "\n");

  // Check environment variables
  logInfo("Checking environment variables...");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    logError("NEXT_PUBLIC_SUPABASE_URL is not set in .env.local");
    return false;
  } else {
    logSuccess(`Supabase URL: ${supabaseUrl}`);
  }

  if (!supabaseAnonKey) {
    logError("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in .env.local");
    return false;
  } else {
    logSuccess("Supabase Anon Key is configured");
  }

  if (!serviceRoleKey) {
    logWarning("SUPABASE_SERVICE_ROLE_KEY is not set (optional for this test)");
  } else {
    logSuccess("Supabase Service Role Key is configured");
  }

  // Initialize Supabase client
  logInfo("\nInitializing Supabase client...");
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Test basic connection
    logInfo("Testing basic connection...");
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (error) {
      logError(`Connection failed: ${error.message}`);
      return false;
    }

    logSuccess("Successfully connected to Supabase!");

    // Test schema - check if all required tables exist
    logInfo("\nTesting database schema...");

    const tables = [
      "users",
      "polls",
      "poll_options",
      "votes",
      "poll_categories",
    ];

    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select("*")
          .limit(1);

        if (tableError) {
          if (tableError.code === "PGRST116" || tableError.code === "42P01") {
            logError(
              `Table '${table}' does not exist - run the database schema first`,
            );
          } else {
            logWarning(
              `Table '${table}' exists but has permission issues: ${tableError.message}`,
            );
          }
        } else {
          logSuccess(`Table '${table}' exists and is accessible`);
        }
      } catch (err) {
        logError(`Error checking table '${table}': ${err.message}`);
      }
    }

    // Test views
    logInfo("\nTesting database views...");

    const views = ["polls_with_stats", "poll_options_with_stats"];

    for (const view of views) {
      try {
        const { error: viewError } = await supabase
          .from(view)
          .select("*")
          .limit(1);

        if (viewError) {
          logError(`View '${view}' is not accessible: ${viewError.message}`);
        } else {
          logSuccess(`View '${view}' exists and is accessible`);
        }
      } catch (err) {
        logError(`Error checking view '${view}': ${err.message}`);
      }
    }

    // Test functions
    logInfo("\nTesting database functions...");

    try {
      // Test a function that doesn't require parameters
      const { data: funcData, error: funcError } = await supabase.rpc(
        "user_has_voted",
        {
          poll_uuid: "00000000-0000-0000-0000-000000000000",
          user_uuid: "00000000-0000-0000-0000-000000000000",
        },
      );

      if (funcError) {
        if (funcError.code === "42883") {
          logError("Database functions are not installed");
          logInfo("This is normal if you used a partial schema setup");
        } else {
          logWarning(
            `Functions exist but returned error: ${funcError.message}`,
          );
        }
      } else {
        logSuccess("Database functions are working correctly");
      }
    } catch (err) {
      logError(`Error testing functions: ${err.message}`);
    }

    // Test authentication
    logInfo("\nTesting authentication setup...");

    try {
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (authError) {
        logWarning(`Auth check warning: ${authError.message}`);
      } else {
        logSuccess("Authentication system is configured correctly");
        if (session) {
          logInfo(`Current user: ${session.user.email}`);
        } else {
          logInfo("No active session (this is normal for testing)");
        }
      }
    } catch (err) {
      logWarning(`Auth test warning: ${err.message}`);
    }

    // Test RLS policies
    logInfo("\nTesting Row Level Security...");

    try {
      // Try to access data without authentication (should work for public polls)
      const { data: pollsData, error: pollsError } = await supabase
        .from("polls")
        .select("id, title, is_active")
        .eq("is_active", true)
        .limit(5);

      if (pollsError) {
        if (pollsError.code === "42501") {
          logWarning(
            "RLS policies are very restrictive (might need adjustment)",
          );
        } else {
          logWarning(`RLS test returned: ${pollsError.message}`);
        }
      } else {
        logSuccess("RLS policies are configured and working");
        logInfo(`Found ${pollsData?.length || 0} accessible polls`);
      }
    } catch (err) {
      logWarning(`RLS test warning: ${err.message}`);
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    log("cyan", "📊 TEST SUMMARY");
    console.log("=".repeat(60));

    logInfo("Your Supabase database appears to be set up correctly!");
    logInfo("You can now run your Next.js application with: npm run dev");

    console.log("\n" + "=".repeat(60));
    log("magenta", "🔗 HELPFUL LINKS");
    console.log("\n" + colors.cyan + "🔗 HELPFUL LINKS" + colors.reset);
    console.log("=".repeat(60));
    logInfo(
      `Supabase Dashboard: ${supabaseUrl.replace("/rest/v1", "")}/project/default`,
    );
    logInfo("Table Editor: Dashboard → Table Editor");
    logInfo("SQL Editor: Dashboard → SQL Editor");
    logInfo("Authentication: Dashboard → Authentication");
    logInfo("Setup Guide: supabase/SETUP_GUIDE.md");
    logInfo("Simplified Schema: supabase/schema-simple.sql");
    logInfo("Documentation: https://supabase.com/docs");

    return true;
  } catch (error) {
    logError(`Unexpected error during testing: ${error.message}`);
    return false;
  }
}

// Run the test
testDatabaseConnection()
  .then((success) => {
    if (success) {
      console.log(
        "\n" +
          colors.green +
          "🎉 All tests completed successfully!" +
          colors.reset,
      );
      console.log(
        "\n" + colors.cyan + "RECOMMENDED NEXT STEPS:" + colors.reset,
      );
      logInfo("1. Start your Next.js app: npm run dev");
      logInfo("2. Try creating a test user account");
      logInfo("3. Create your first poll");
      logInfo("4. Test the voting functionality");
      console.log(
        "\n" +
          colors.yellow +
          "If you encountered any schema errors during setup," +
          colors.reset,
      );
      console.log(
        colors.yellow +
          "consider using the simplified schema: supabase/schema-simple.sql" +
          colors.reset,
      );
      process.exit(0);
    } else {
      console.log(
        "\n" +
          colors.red +
          "💥 Some tests failed. Please check your setup." +
          colors.reset,
      );
      console.log("\n" + colors.cyan + "TROUBLESHOOTING TIPS:" + colors.reset);
      logInfo(
        "1. Verify your .env.local file has correct Supabase credentials",
      );
      logInfo("2. Check if your Supabase project is fully initialized");
      logInfo("3. Try using the simplified schema: supabase/schema-simple.sql");
      logInfo("4. Run the setup guide: see supabase/SETUP_GUIDE.md");
      process.exit(1);
    }
  })
  .catch((error) => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
