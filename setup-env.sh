#!/bin/bash

# Setup script to create .env files from templates

echo "Setting up environment files..."

# Backend .env
if [ ! -f "backend/.env" ]; then
  cp backend/env.template backend/.env
  echo "✅ Created backend/.env - Please add your GROQ_API_KEY"
else
  echo "⚠️  backend/.env already exists, skipping..."
fi

# Frontend .env.local
if [ ! -f "frontend/.env.local" ]; then
  cp frontend/env.template frontend/.env.local
  echo "✅ Created frontend/.env.local"
else
  echo "⚠️  frontend/.env.local already exists, skipping..."
fi

echo ""
echo "📝 Next steps:"
echo "1. Edit backend/.env and add your GROQ_API_KEY"
echo "2. Get your API key from: https://console.groq.com/"
echo ""
echo "Done! 🎉"













