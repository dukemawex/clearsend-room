"use client";

export default function JudgesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">ClearSend Room</h1>
            </div>
            <div className="flex space-x-4">
              <a href="/" className="text-gray-700 hover:text-indigo-600 px-3 py-2">
                Dashboard
              </a>
              <a href="/judges" className="text-indigo-600 px-3 py-2 font-medium">
                Judges
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ClearSend Room
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Flip the Switch Hackathon 2026
            </p>
            <p className="text-lg text-indigo-600 font-semibold">
              Track: Best Business Workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="border-l-4 border-indigo-500 pl-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Project Information</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Owner</dt>
                  <dd className="text-sm text-gray-900">Emmanuel Duke (<a href="https://github.com/dukemawex" className="text-indigo-600 hover:underline">@dukemawex</a>)</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Organization</dt>
                  <dd className="text-sm text-gray-900">DUKERS LTD, Nigeria</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Repository</dt>
                  <dd className="text-sm">
                    <a href="https://github.com/dukemawex/clearsend-room" className="text-indigo-600 hover:underline">
                      github.com/dukemawex/clearsend-room
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">License</dt>
                  <dd className="text-sm text-gray-900">MIT</dd>
                </div>
              </dl>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Quick Links</h2>
              <ul className="space-y-2">
                <li>
                  <a href="https://github.com/dukemawex/clearsend-room/blob/main/README.md" className="text-indigo-600 hover:underline text-sm">
                    📖 Full Documentation (README)
                  </a>
                </li>
                <li>
                  <a href="https://github.com/dukemawex/clearsend-room" className="text-indigo-600 hover:underline text-sm">
                    💻 Source Code
                  </a>
                </li>
                <li>
                  <a href="https://github.com/dukemawex/clearsend-room/blob/main/SETUP.md" className="text-indigo-600 hover:underline text-sm">
                    🚀 Setup Guide
                  </a>
                </li>
                <li>
                  <span className="text-sm text-gray-500">
                    🎥 Demo Video: <span className="font-medium">TODO - Owner will record</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What This Project Does</h2>
            <p className="text-gray-700 mb-4">
              ClearSend Room connects an AI coding agent through Switch AI to a team chat platform 
              (Slack, Discord, Telegram, or Mattermost) to handle a real cross-border remittance workflow 
              that includes flight booking and secure escrow payments.
            </p>
            <p className="text-gray-700 mb-4">
              The payer, recipient, and verifier collaborate with the AI agent in a shared Switch room to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Search <strong>real flights</strong> from OpenFlights.org and OpenSky Network data</li>
              <li>Book flights with <strong>real PayPal sandbox payments</strong> (Orders v2 API)</li>
              <li>Create and manage <strong>secure escrow transactions</strong> with state stored in Upstash Redis</li>
              <li>Verify deliverables with <strong>AI agent assistance</strong></li>
              <li>Release funds with <strong>human approval</strong> via PayPal Payouts</li>
            </ul>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Architecture & Switch Integration</h2>
            <div className="bg-gray-50 rounded-lg p-6 mb-4">
              <pre className="text-sm overflow-x-auto">
{`┌──────────────────────────────────────────────────────────────────┐
│                      SWITCH AI (Central Hub)                      │
│  • Agent Protocol (SSE in, HTTP out)                              │
│  • Room Management & Message Routing                              │
│  • Multi-platform Bridge (Slack/Discord/Telegram/Mattermost)     │
└─────────────┬─────────────────────────────────────┬──────────────┘
              │                                     │
              ▼                                     ▼
    ┌─────────────────────┐              ┌──────────────────────┐
    │   ClearSend Agent   │              │   Chat Platform      │
    │  (Custom HTTP)      │              │  (Mattermost/etc)    │
    ├─────────────────────┤              ├──────────────────────┤
    │ • Flight Search     │              │ • Users (payer,      │
    │ • PayPal Orders v2  │              │   recipient,         │
    │ • Escrow Logic      │              │   verifier)          │
    │ • FX Rates          │              │ • Shared Context     │
    │ • Verification AI   │              │ • Decision Log       │
    └──────┬──────────────┘              └──────────────────────┘
           │
           ├─────────────┬─────────────┬──────────────┐
           ▼             ▼             ▼              ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐
    │OpenFlights│  │ PayPal   │  │ Upstash  │  │Frankfurter │
    │  (Free)   │  │ Sandbox  │  │  Redis   │  │  FX API    │
    │           │  │          │  │  (Free)  │  │  (Free)    │
    └──────────┘  └──────────┘  └──────────┘  └────────────┘
                                                      
           ▼
    ┌──────────────────────────────────────────────┐
    │         Next.js 15 Dashboard                  │
    │  • Live escrow timeline                       │
    │  • Trip tracking                              │
    │  • Decision history                           │
    │  • PayPal activity                            │
    │  • /judges page (this page!)                  │
    └──────────────────────────────────────────────┘`}
              </pre>
            </div>
            <p className="text-sm text-gray-600">
              <strong>Switch&apos;s Central Role:</strong> Switch AI orchestrates all communication between 
              the agent, users, and chat platform. The agent speaks the Switch agent protocol (Server-Sent 
              Events for input, HTTP POST for responses), and Switch handles message routing, room context, 
              and platform bridging. Without Switch, this workflow cannot function.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Technical Highlights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-600 mb-2">🎯 Real Data Only</h3>
                <p className="text-sm text-gray-600">
                  No mock or seed data. Flight search uses OpenFlights.org database and 
                  OpenSky Network API. Clear labeling when live pricing is unavailable.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-600 mb-2">💳 Real PayPal Integration</h3>
                <p className="text-sm text-gray-600">
                  Uses PayPal sandbox with Orders v2 API for payments and Payouts API 
                  for escrow releases. Honest failures reported, not hidden.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-600 mb-2">🔒 Secure Escrow</h3>
                <p className="text-sm text-gray-600">
                  States stored in Upstash Redis REST with HMAC-signed role links. 
                  7 states: created → funded → submitted → verified → released.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-600 mb-2">🤖 Free AI Models</h3>
                <p className="text-sm text-gray-600">
                  Uses OpenRouter free tier (NVIDIA Nemotron or Google Gemma) or NVIDIA API. 
                  No paid model required to run or judge.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-600 mb-2">✅ Human-in-the-Loop</h3>
                <p className="text-sm text-gray-600">
                  No money action (PayPal order creation, payout) happens without explicit 
                  human confirmation typed in the channel.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-600 mb-2">📊 Live Dashboard</h3>
                <p className="text-sm text-gray-600">
                  Next.js 15 web app with real-time escrow timeline, flight tracking, 
                  and PayPal activity. Not just chat—this is a real application.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Technology Stack</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">🎮</div>
                <div className="font-medium text-sm">Switch AI</div>
                <div className="text-xs text-gray-600">Room Orchestration</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">🐍</div>
                <div className="font-medium text-sm">Python + FastAPI</div>
                <div className="text-xs text-gray-600">Agent Backend</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl mb-2">⚛️</div>
                <div className="font-medium text-sm">Next.js 15</div>
                <div className="text-xs text-gray-600">Dashboard</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl mb-2">💳</div>
                <div className="font-medium text-sm">PayPal</div>
                <div className="text-xs text-gray-600">Payments & Payouts</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl mb-2">🗄️</div>
                <div className="font-medium text-sm">Upstash Redis</div>
                <div className="text-xs text-gray-600">State Store</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl mb-2">✈️</div>
                <div className="font-medium text-sm">OpenFlights</div>
                <div className="text-xs text-gray-600">Flight Data</div>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-lg">
                <div className="text-2xl mb-2">💱</div>
                <div className="font-medium text-sm">Frankfurter</div>
                <div className="text-xs text-gray-600">Real FX Rates</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🤖</div>
                <div className="font-medium text-sm">Free AI Models</div>
                <div className="text-xs text-gray-600">OpenRouter/NVIDIA</div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Reproduce (Judge Instructions)</h2>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-3">1</span>
                <div>
                  <strong>Clone the repository:</strong>
                  <code className="block bg-gray-100 px-3 py-2 rounded mt-1 text-sm">
                    git clone https://github.com/dukemawex/clearsend-room.git
                  </code>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-3">2</span>
                <div>
                  <strong>Install Switch Console</strong> from <a href="https://github.com/sandbox-quantum/switch/releases" className="text-indigo-600 hover:underline">Switch releases</a> (includes Mattermost)
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-3">3</span>
                <div>
                  <strong>Set up free services:</strong> Create free accounts for Upstash Redis and PayPal Sandbox. 
                  See <code>SETUP.md</code> for detailed steps.
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-3">4</span>
                <div>
                  <strong>Configure environment:</strong>
                  <code className="block bg-gray-100 px-3 py-2 rounded mt-1 text-sm">
                    cp .env.example .env  # Then fill in your values
                  </code>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-3">5</span>
                <div>
                  <strong>Run the agent:</strong>
                  <code className="block bg-gray-100 px-3 py-2 rounded mt-1 text-sm">
                    cd agent && pip install -r requirements.txt && python main.py
                  </code>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-3">6</span>
                <div>
                  <strong>Run the dashboard:</strong>
                  <code className="block bg-gray-100 px-3 py-2 rounded mt-1 text-sm">
                    cd dashboard && npm install && npm run dev
                  </code>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-3">7</span>
                <div>
                  <strong>Create Switch room:</strong> Open Switch Console, import <code>clearsend-room.template.yaml</code>, 
                  and create the room.
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-3">8</span>
                <div>
                  <strong>Test the workflow:</strong> In the chat room, try &quot;Search flights from Lagos to London&quot; or 
                  &quot;Create escrow for $500&quot;
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Demo Video Note</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    The hackathon requires a demo video. This will be recorded by the owner (Emmanuel Duke) 
                    after the core functionality is complete. A link will be added to the README before submission.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-indigo-900 mb-2">Thank You, Judges!</h3>
            <p className="text-indigo-700">
              This project demonstrates a real-world business workflow where Switch AI is absolutely central—connecting 
              people and an AI agent to coordinate complex financial transactions that require trust, verification, 
              and human oversight. Every component uses real APIs and services, no fake data, with transparent error 
              handling. We hope you enjoy reviewing ClearSend Room!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
