#!/bin/bash

echo "🚀 Setting up OSS T3 Chat..."

# Check if .env file exists, create if not
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
fi

# Generate AUTH_SECRET if not present or is placeholder
if ! grep -q 'AUTH_SECRET="[^"]*"' .env || grep -q 'AUTH_SECRET="your-secret-here"' .env; then
    echo "🔑 Generating AUTH_SECRET..."
    AUTH_SECRET=$(openssl rand -base64 33)
    if grep -q "AUTH_SECRET=" .env; then
        # Replace existing AUTH_SECRET
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/AUTH_SECRET=.*/AUTH_SECRET=\"$AUTH_SECRET\"/" .env
        else
            sed -i "s/AUTH_SECRET=.*/AUTH_SECRET=\"$AUTH_SECRET\"/" .env
        fi
    else
        # Add AUTH_SECRET
        echo "AUTH_SECRET=\"$AUTH_SECRET\"" >> .env
    fi
fi

# Generate API_KEY_SALT if not present or is placeholder
if ! grep -q 'API_KEY_SALT="[^"]*"' .env || grep -q 'API_KEY_SALT="your-api-key-salt"' .env; then
    echo "🧂 Generating API_KEY_SALT..."
    API_KEY_SALT=$(openssl rand -base64 33)
    if grep -q "API_KEY_SALT=" .env; then
        # Replace existing API_KEY_SALT
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/API_KEY_SALT=.*/API_KEY_SALT=\"$API_KEY_SALT\"/" .env
        else
            sed -i "s/API_KEY_SALT=.*/API_KEY_SALT=\"$API_KEY_SALT\"/" .env
        fi
    else
        # Add API_KEY_SALT
        echo "API_KEY_SALT=\"$API_KEY_SALT\"" >> .env
    fi
fi

# Set DATABASE_URL if not present or is placeholder
if ! grep -q "DATABASE_URL=" .env; then
    echo "🗄️ Setting DATABASE_URL..."
    echo "DATABASE_URL=\"file:../dev.db\"" >> .env
elif grep -q 'DATABASE_URL=".*your.*"' .env; then
    echo "🗄️ Updating DATABASE_URL..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's/DATABASE_URL=.*/DATABASE_URL="file:..\/dev.db"/' .env
    else
        sed -i 's/DATABASE_URL=.*/DATABASE_URL="file:..\/dev.db"/' .env
    fi
fi

# Set NEXTAUTH_URL if not present or is placeholder
if ! grep -q "NEXTAUTH_URL=" .env; then
    echo "🌐 Setting NEXTAUTH_URL..."
    echo "NEXTAUTH_URL=\"http://localhost:3000\"" >> .env
elif grep -q 'NEXTAUTH_URL=".*your.*"' .env; then
    echo "🌐 Updating NEXTAUTH_URL..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's/NEXTAUTH_URL=.*/NEXTAUTH_URL="http:\/\/localhost:3000"/' .env
    else
        sed -i 's/NEXTAUTH_URL=.*/NEXTAUTH_URL="http:\/\/localhost:3000"/' .env
    fi
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️ Setting up database..."
npx prisma db push

echo "✅ Setup complete! Your environment is ready."
echo "💡 Run 'pnpm dev' to start the development server." 