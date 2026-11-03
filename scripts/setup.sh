#!/bin/bash
# ClearSend Room Setup Script
# Automates the setup process for the hackathon project

set -e  # Exit on error

echo "🚀 ClearSend Room Setup"
echo "======================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found. Please install Python 3.11+${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "${GREEN}✅ Python $PYTHON_VERSION${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js $NODE_VERSION${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm $NPM_VERSION${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker not found. Switch Console requires Docker${NC}"
    echo "   Download from: https://www.docker.com/products/docker-desktop"
else
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | sed 's/,//')
    echo -e "${GREEN}✅ Docker $DOCKER_VERSION${NC}"
fi

echo ""
echo "📝 Setting up environment..."

# Check if .env exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
    read -p "Do you want to recreate it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file"
    else
        cp .env.example .env
        echo -e "${GREEN}✅ Created new .env from template${NC}"
    fi
else
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env from template${NC}"
fi

# Generate escrow secret if not set
if ! grep -q "ESCROW_LINK_SECRET=.\+" .env; then
    echo "🔐 Generating escrow secret..."
    SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    sed -i.bak "s/ESCROW_LINK_SECRET=.*/ESCROW_LINK_SECRET=$SECRET/" .env
    rm -f .env.bak
    echo -e "${GREEN}✅ Generated escrow secret${NC}"
fi

echo ""
echo "📦 Installing agent dependencies..."
cd agent
python3 -m pip install --quiet -r requirements.txt
echo -e "${GREEN}✅ Agent dependencies installed${NC}"
cd ..

echo ""
echo "📦 Installing dashboard dependencies..."
cd dashboard
npm install --silent
echo -e "${GREEN}✅ Dashboard dependencies installed${NC}"
cd ..

echo ""
echo "✨ Setup complete!"
echo ""
echo "⚙️  Next steps:"
echo "1. Edit .env file with your credentials:"
echo "   - PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET"
echo "   - UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN"
echo "   - Optional: OPENROUTER_API_KEY, RAPIDAPI_KEY"
echo ""
echo "2. Install and launch Switch Console:"
echo "   https://github.com/sandbox-quantum/switch/releases"
echo ""
echo "3. Start the agent:"
echo "   cd agent && python main.py"
echo ""
echo "4. Start the dashboard (in another terminal):"
echo "   cd dashboard && npm run dev"
echo ""
echo "5. Import clearsend-room.template.yaml in Switch Console"
echo ""
echo "📖 For detailed instructions, see SETUP.md"
echo ""
echo "🎉 Happy hacking!"
