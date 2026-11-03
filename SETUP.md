# ClearSend Room Setup Guide

Complete step-by-step instructions to get ClearSend Room running for the Flip the Switch hackathon.

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] **Operating System**: macOS, Windows 10+, or Linux
- [ ] **Python**: Version 3.11 or higher ([Download](https://www.python.org/downloads/))
- [ ] **Node.js**: Version 18 or higher ([Download](https://nodejs.org/))
- [ ] **Docker**: For Switch Console ([Download](https://www.docker.com/products/docker-desktop))
- [ ] **Git**: For cloning the repository ([Download](https://git-scm.com/downloads))
- [ ] **Text Editor**: VS Code, Cursor, or similar
- [ ] **Web Browser**: Chrome, Firefox, or Edge

Check versions:
```bash
python --version  # Should be 3.11+
node --version    # Should be 18+
npm --version     # Should be 9+
docker --version  # Any recent version
git --version     # Any recent version
```

## Step 1: Clone the Repository

```bash
git clone https://github.com/dukemawex/clearsend-room.git
cd clearsend-room
```

## Step 2: Install Switch Console

1. Download Switch Console for your platform:
   - **macOS**: [Apple Silicon](https://github.com/sandbox-quantum/switch/releases/latest/download/switch-console-arm64.dmg) | [Intel](https://github.com/sandbox-quantum/switch/releases/latest/download/switch-console-x64.dmg)
   - **Windows**: [Installer](https://github.com/sandbox-quantum/switch/releases/latest/download/switch-console-x64.exe)
   - **Linux**: [AppImage](https://github.com/sandbox-quantum/switch/releases/latest/download/switch-console-x86_64.AppImage) | [DEB](https://github.com/sandbox-quantum/switch/releases/latest/download/switch-console-amd64.deb)

2. Install and launch Switch Console

3. On first launch:
   - Accept telemetry (optional but recommended for the hackathon)
   - Let it start Docker containers (this may take a few minutes)
   - Switch will start a local Mattermost instance included with it

4. Switch Console will be running at `http://localhost:8000`
   - Mattermost will be at `http://localhost:8065`

## Step 3: Create Free Service Accounts

### 3.1 Upstash Redis (Required)

1. Go to [console.upstash.com](https://console.upstash.com)
2. Sign up for free (GitHub/Google sign-in available)
3. Create a new Redis database:
   - Click "Create Database"
   - Name: `clearsend-room`
   - Region: Choose closest to you
   - Type: Regional (free tier)
   - Click "Create"

4. Copy credentials:
   - Click on your database
   - Go to "REST API" tab
   - Copy `UPSTASH_REDIS_REST_URL` (looks like `https://xxx.upstash.io`)
   - Copy `UPSTASH_REDIS_REST_TOKEN` (long string)

### 3.2 PayPal Developer Sandbox (Required)

1. Go to [developer.paypal.com](https://developer.paypal.com)
2. Log in or sign up (free)
3. Go to Dashboard → My Apps & Credentials
4. Under "Sandbox", click "Create App"
   - App Name: `ClearSend Room`
   - App Type: Merchant
   - Click "Create App"

5. Copy credentials:
   - You'll see `Client ID` (starts with `A...`)
   - Click "Show" under `Secret` to reveal it
   - Copy both - these are your `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`

6. Enable Payouts:
   - In the same app page, scroll to "Features"
   - Check "Payouts" if not already enabled
   - Click "Save"

**Important**: These are SANDBOX credentials. They won't work with real money.

### 3.3 OpenRouter (Optional but Recommended)

For free AI models without rate limits:

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up (free)
3. No credit card required for free models
4. Get API key from Settings → API Keys
5. Copy `OPENROUTER_API_KEY`

**Note**: You can skip this and use NVIDIA directly, but OpenRouter has better fallback options.

### 3.4 RapidAPI (Optional)

For enhanced flight pricing data:

1. Go to [rapidapi.com](https://rapidapi.com)
2. Sign up for free
3. Search for "Sky-Scrapper" API
4. Subscribe to the free tier (no credit card needed)
5. Copy `RAPIDAPI_KEY` from the API page

**Note**: This is optional. The project works without it using schedule data only.

## Step 4: Configure Environment Variables

```bash
# In the clearsend-room directory
cp .env.example .env
```

Edit `.env` with your favorite editor:

```bash
nano .env  # or: code .env, vim .env, etc.
```

Fill in the required values:

```env
# ===== AI Model Configuration =====
OPENROUTER_API_KEY=sk-or-v1-xxxxx  # From OpenRouter (optional)
MODEL_NAME=nvidia/nemotron-3-ultra-550b-a55b:free
FALLBACK_MODEL_NAME=google/gemma-4-31b-it:free

# ===== PayPal Sandbox =====
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=Axxxxxxxxxxxxxx  # From PayPal Developer Dashboard
PAYPAL_CLIENT_SECRET=xxxxxxxxxxxxx

# ===== Upstash Redis =====
UPSTASH_REDIS_REST_URL=https://xxxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxx

# ===== Escrow Security =====
# Generate a random 32-character secret:
ESCROW_LINK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

To generate `ESCROW_LINK_SECRET`:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and paste it as `ESCROW_LINK_SECRET`.

## Step 5: Install Agent Dependencies

```bash
cd agent
pip install -r requirements.txt
```

If you get permission errors, try:
```bash
pip install --user -r requirements.txt
```

Or create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Step 6: Install Dashboard Dependencies

```bash
cd ../dashboard
npm install
```

This will take a few minutes. If you see warnings about peer dependencies, that's normal.

## Step 7: Test the Agent

```bash
cd ../agent
python main.py
```

You should see:
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:3001 (Press CTRL+C to quit)
```

Test it:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"healthy","agent":"clearsend","version":"1.0.0"}
```

If it works, press `Ctrl+C` to stop it. We'll run it properly next.

## Step 8: Test the Dashboard

```bash
cd ../dashboard
npm run dev
```

You should see:
```
  ▲ Next.js 15.0.3
  - Local:        http://localhost:3000

 ✓ Ready in 2.3s
```

Open your browser to `http://localhost:3000`. You should see the ClearSend Room dashboard.

Press `Ctrl+C` to stop it. We'll run it properly next.

## Step 9: Create the Switch Room

1. **Open Switch Console** (if not already running)

2. **Import the Template**:
   - Click "Templates" in the sidebar
   - Click "Import Template"
   - Select `clearsend-room.template.yaml` from the project directory
   - Click "Import"

3. **Create the Room**:
   - Click "Rooms" in the sidebar
   - Click "Create from Template"
   - Select "ClearSend Room"
   - Edit these values:
     - `{team}`: Your team name (e.g., `dukers`)
     - `{provider}`: Choose `custom`
     - `{bridge}`: Choose `mattermost` (or your preferred platform)
     - `{$creator}`: Your username
   - Click "Create Room"

4. **Configure the Agent**:
   - In the template, the agent URL is set to `http://localhost:3001/agent`
   - Make sure this matches where your agent is running
   - If Switch Console is in Docker, you may need to use `host.docker.internal:3001` instead of `localhost:3001`

5. **Start the Agent in the Room**:
   - Switch Console should automatically connect to your agent
   - Check the agent logs to confirm connection

## Step 10: Run Everything Together

Now let's run everything properly. You'll need **3 terminal windows**:

### Terminal 1: Agent
```bash
cd agent
python main.py
```

Keep this running. You should see agent logs.

### Terminal 2: Dashboard
```bash
cd dashboard
npm run dev
```

Keep this running. Dashboard is now live.

### Terminal 3: Logs (optional)
```bash
# Watch agent logs
tail -f agent/agent.log
```

Or just monitor Terminal 1 for agent activity.

## Step 11: Access the Chat Platform

### Using Mattermost (bundled with Switch)

1. Open `http://localhost:8065` in your browser
2. Create an account:
   - Email: Use any email (doesn't need to be real)
   - Username: Your choice
   - Password: Your choice
3. Create or join a team
4. Find the `clearsend-room` channel (created by Switch)
5. Start chatting with the agent!

### Using Slack, Discord, or Telegram

See the Switch documentation for connecting other platforms:
- [Slack Setup](https://docs.switchagents.ai/switch-rooms/deploy/messaging-apps/slack)
- [Discord Setup](https://docs.switchagents.ai/switch-rooms/deploy/messaging-apps/discord)
- [Telegram Setup](https://docs.switchagents.ai/switch-rooms/deploy/messaging-apps/telegram)

## Step 12: Test the Workflow

### Test 1: Flight Search

In the chat room, type:
```
Search flights from LOS to LHR on December 15 for 1 passenger
```

The agent should:
1. Acknowledge your request
2. Search for flights (this may take a moment)
3. Show real flight options or schedule data
4. Ask which flight you'd like to book

### Test 2: Create Escrow

In the chat room, type:
```
Create escrow for logo design worth 500 USD
```

The agent should:
1. Create an escrow transaction
2. Provide a payment link for the payer
3. Show the escrow ID and state (`created`)
4. Explain next steps

### Test 3: Check Dashboard

1. Open `http://localhost:3000` in your browser
2. You should see:
   - Escrow count updated
   - Recent transactions listed
   - Real-time state changes
3. Visit `http://localhost:3000/judges` to see the judges page

## Troubleshooting

### Agent won't start

**Error: `Address already in use`**
```bash
# Find process on port 3001
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill it
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

**Error: `ModuleNotFoundError`**
```bash
cd agent
pip install -r requirements.txt
```

**Error: Environment variables not loaded**
```bash
# Check .env file exists
ls -la .env

# Check it has content
cat .env

# Make sure you're running from the right directory
pwd  # Should be .../clearsend-room
```

### Dashboard won't build

**Error: `Cannot find module 'next'`**
```bash
cd dashboard
rm -rf node_modules package-lock.json
npm install
```

**Error: `Port 3000 is already in use`**
```bash
# Change port in dashboard/package.json:
"dev": "next dev -p 3001"  # Use different port
```

**Error: Build fails with TypeScript errors**
```bash
cd dashboard
npm run build  # See exact errors
npx tsc --noEmit  # Check TypeScript
```

### Switch Console issues

**Error: Docker not running**
- Start Docker Desktop
- Wait for it to fully start (whale icon stable)
- Restart Switch Console

**Error: Can't connect to agent**
- Check agent is running: `curl http://localhost:3001/health`
- Check Docker can reach host: Use `host.docker.internal:3001` in template
- Check firewall isn't blocking port 3001

**Error: Mattermost won't load**
- Give it 2-3 minutes on first start (it's setting up)
- Check Docker containers: `docker ps`
- Check logs: `docker logs switch-mattermost`

### PayPal errors

**Error: `Authentication failed`**
- Double-check `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`
- Make sure you're using SANDBOX credentials
- Verify on developer.paypal.com that your app is active

**Error: `Payouts not enabled`**
- Go to developer.paypal.com → Your App
- Under "Features", enable "Payouts"
- Wait a few minutes for it to activate

### Upstash errors

**Error: `Connection refused`**
- Check `UPSTASH_REDIS_REST_URL` is correct (starts with `https://`)
- Check `UPSTASH_REDIS_REST_TOKEN` is correct
- Test connection:
```bash
curl -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
  "$UPSTASH_REDIS_REST_URL/ping"
```

### Flight data not showing

This is expected! Flight pricing data may not be available for all routes. The agent should clearly label data as "Schedule only" when pricing isn't available.

To get better data:
1. Add `RAPIDAPI_KEY` to `.env` (optional)
2. Try different routes (major airports have better coverage)
3. Check OpenSky Network status: https://opensky-network.org/

## Next Steps

Once everything is running:

1. **Explore the workflow**: Try creating escrows, searching flights, and seeing how the agent responds
2. **Check the dashboard**: Monitor transactions in real-time at `http://localhost:3000`
3. **Read the code**: Understand how Switch protocol works in `agent/main.py`
4. **Customize**: Modify `clearsend-room.template.yaml` to adjust agent behavior
5. **Record demo**: Create a short video showing the workflow (required for hackathon)

## For Judges

If you're a hackathon judge reviewing this project:

1. Follow steps 1-12 above
2. Visit `http://localhost:3000/judges` for complete project documentation
3. Test the workflow with the examples provided
4. Check the code structure in `agent/` and `dashboard/`
5. Verify Switch integration by checking logs in Switch Console

**Estimated setup time**: 30-45 minutes (including creating accounts)

## Getting Help

- **Switch Issues**: [Switch Discord](https://discord.com/invite/E6a2Jnb6G) or [GitHub Issues](https://github.com/sandbox-quantum/switch/issues)
- **Hackathon Questions**: WeMakeDevs Discord
- **Project Issues**: [GitHub Issues](https://github.com/dukemawex/clearsend-room/issues)

## Environment Setup Summary

By the end of setup, you should have:

- ✅ Switch Console running with Mattermost
- ✅ Agent running on `http://localhost:3001`
- ✅ Dashboard running on `http://localhost:3000`
- ✅ Switch room created and connected
- ✅ PayPal sandbox configured
- ✅ Upstash Redis storing data
- ✅ Agent responding to messages in chat
- ✅ Dashboard showing real-time updates

**You're ready to demonstrate ClearSend Room!**
