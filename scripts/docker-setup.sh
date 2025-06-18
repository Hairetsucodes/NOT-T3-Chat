#!/bin/bash

# Docker setup script for OSS T3 Chat
# This script ensures proper Docker environment setup and optionally runs the container

set -e

echo "🐳 Setting up Docker environment for OSS T3 Chat..."

# Ensure docker-data directory exists
if [ ! -d "docker-data" ]; then
    echo "📁 Creating docker-data directory..."
    mkdir -p docker-data
else
    echo "📁 Using existing docker-data directory"
fi

# Check if .env file exists in docker-data
if [ ! -f "docker-data/.env" ]; then
    echo ""
    echo "ℹ️  No .env file found in docker-data directory."
    echo "   The container will auto-generate secrets and use default settings."
    echo "   This is perfect for quick setup!"
    echo ""
    
    # Ask if user wants to create a template .env file
    read -p "🤔 Would you like to create a template .env file for custom configuration? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📝 Creating template .env file..."
        cat > docker-data/.env << 'EOF'
# Custom configuration for OSS T3 Chat Docker deployment
# Uncomment and modify any values you want to customize

# Database Configuration (uncomment to use external database)
# DATABASE_URL="postgresql://user:pass@host:5432/dbname"
# DATABASE_URL="mysql://user:pass@host:3306/dbname"

# Authentication Configuration  
# NEXTAUTH_URL="http://localhost:3000"
# AUTH_SECRET="your-secret-here-or-leave-empty-for-auto-generation"

# API Configuration
# API_KEY_SALT="your-api-key-salt-here-or-leave-empty-for-auto-generation"

# OAuth Providers (for user authentication)
# GitHub OAuth (create app at: https://github.com/settings/developers)
# GITHUB_CLIENT_ID="your-github-client-id"
# GITHUB_CLIENT_SECRET="your-github-client-secret"

# Google OAuth (create app at: https://console.developers.google.com/)
# GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
# GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Provider API Keys
# OpenAI Configuration
# NEXT_PUBLIC_DEFAULT_MODEL_ID="gpt-4o-mini"
# OPENAI_API_KEY="sk-your-openai-api-key-here"

# Anthropic Configuration
# ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key-here"

# Google AI Configuration
# GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-api-key-here"

# Other AI Providers
# GROQ_API_KEY="your-groq-api-key-here"
# COHERE_API_KEY="your-cohere-api-key-here"

# Debug Mode (set to false in production)
# AUTH_DEBUG="false"
EOF
        echo "✅ Template .env file created at docker-data/.env"
        echo "   📝 Edit this file to add your API keys and customize settings"
        echo "   💡 You can leave AUTH_SECRET and API_KEY_SALT empty for auto-generation"
    else
        echo "✅ Skipping .env creation - using auto-generated secrets and defaults"
    fi
else
    echo "✅ Found existing .env file in docker-data directory"
fi

echo ""
echo "🔧 Docker environment setup complete!"
echo ""
echo "📋 What happens when you run the container:"
echo "   🔑 Auto-generates AUTH_SECRET if not provided"
echo "   🧂 Auto-generates API_KEY_SALT if not provided"
echo "   🗄️  Creates SQLite database if using default setup"
echo "   💾 Persists all data in docker-data/ directory"
echo ""

# Ask if user wants to run docker compose now
read -p "🚀 Would you like to start the container now? (Y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "👍 Setup complete! Run this when ready:"
    echo "   docker compose up --build"
else
    echo "🚀 Starting Docker container..."
    echo "   Running: docker compose up --build"
    echo ""
    docker compose up --build
fi 