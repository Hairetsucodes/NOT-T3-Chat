#!/bin/sh

echo "🚀 Starting OSS T3 Chat container..."

# Load environment variables from .env file if it exists
if [ -f "/app/data/.env" ]; then
    echo "📋 Loading environment variables from .env file..."
    # Export all variables from the .env file
    set -a  # automatically export all variables
    . /app/data/.env
    set +a  # turn off automatic export
    echo "✅ Environment variables loaded"
else
    echo "📋 No .env file found - using container defaults"
fi

# Always ensure AUTH_SECRET is available
if [ -z "$AUTH_SECRET" ]; then
    if [ -f "/app/data/.auth_secret" ]; then
        echo "🔑 Loading existing AUTH_SECRET..."
        export AUTH_SECRET=$(cat /app/data/.auth_secret)
    else
        echo "🔑 Generating new AUTH_SECRET..."
        export AUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        echo "$AUTH_SECRET" > /app/data/.auth_secret
        chmod 600 /app/data/.auth_secret
    fi
fi

# Always ensure API_KEY_SALT is available
if [ -z "$API_KEY_SALT" ]; then
    if [ -f "/app/data/.api_key_salt" ]; then
        echo "🧂 Loading existing API_KEY_SALT..."
        export API_KEY_SALT=$(cat /app/data/.api_key_salt)
    else
        echo "🧂 Generating new API_KEY_SALT..."
        export API_KEY_SALT=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        echo "$API_KEY_SALT" > /app/data/.api_key_salt
        chmod 600 /app/data/.api_key_salt
    fi
fi

# Initialize SQLite database if using default SQLite setup
if [ "$DATABASE_URL" = "file:/app/data/prod.db" ] || [ -z "$DATABASE_URL" ]; then
    if [ ! -f "/app/data/prod.db" ]; then
        echo "🗄️  Initializing production SQLite database..."
        pnpx prisma db push --skip-generate
    else
        echo "🗄️  Using existing SQLite database"
    fi
else
    echo "🗄️  Using custom database configuration: $DATABASE_URL"
fi

echo "✅ Container initialization complete!"
echo "🌐 Starting Next.js application..."

# Start the application
exec pnpm start 