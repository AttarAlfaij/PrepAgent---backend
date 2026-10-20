const mongoose = require('mongoose');

const DEFAULT_LOCAL_URI = 'mongodb://127.0.0.1:27017/prepagent';

// Strip credentials from anything that looks like a connection string before
// logging, so error messages can never leak the password.
const redactUri = (text) =>
  String(text).replace(/mongodb(\+srv)?:\/\/[^\s"'`]+/gi, 'mongodb+srv://[redacted]');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!uri) {
    if (isProduction) {
      // Fail fast instead of silently connecting to localhost on the server.
      console.error(
        '[Database Error] MONGODB_URI is not set. Define it in your deployment environment (e.g. Render -> Environment) and redeploy.'
      );
      process.exit(1);
    }
    console.warn(
      '[Database] MONGODB_URI not set - falling back to local MongoDB (mongodb://127.0.0.1:27017/prepagent).'
    );
  }

  try {
    const conn = await mongoose.connect(uri || DEFAULT_LOCAL_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${redactUri(error.message)}`);
    const message = String(error.message);
    if (/authentication failed|bad auth/i.test(message)) {
      console.error(
        '[Database Error] Hint: the database server rejected the credentials. Verify the username/password under Atlas -> Database Access and that MONGODB_URI matches exactly (percent-encode special password characters such as : < > @ / ? # or space).'
      );
    } else if (/timed out|Server selection|ECONNREFUSED|ENOTFOUND|getaddrinfo/i.test(message)) {
      console.error(
        '[Database Error] Hint: MongoDB was unreachable. Check the host in MONGODB_URI and the Atlas -> Network Access IP allowlist (it must permit the environment you deploy from).'
      );
    }
    process.exit(1);
  }
};

module.exports = connectDB;
