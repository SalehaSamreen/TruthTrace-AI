#!/bin/bash
# TruthTrace AI - Quick Start Script
# Copy and run these commands to get started immediately

echo "🚀 TruthTrace AI - Quick Start"
echo "=============================="
echo ""

# Navigate to project
cd /d/projects/truthtrace-ai

# Step 1: Install dependencies
echo "Step 1/3: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
  echo "❌ npm install failed"
  exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Step 2: Build project
echo "Step 2/3: Building project..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi
echo "✅ Build successful"
echo ""

# Step 3: Start dev server
echo "Step 3/3: Starting development server..."
echo "🌐 Opening http://localhost:3000"
echo ""
npm run dev
