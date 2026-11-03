"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function FlightsPage() {
  const [flights] = useState<any[]>([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">ClearSend Room</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/" className="text-gray-700 hover:text-indigo-600 px-3 py-2">
                Dashboard
              </Link>
              <Link href="/escrows" className="text-gray-700 hover:text-indigo-600 px-3 py-2">
                Escrows
              </Link>
              <Link href="/flights" className="text-indigo-600 px-3 py-2 font-medium">
                Flights
              </Link>
              <Link href="/judges" className="text-gray-700 hover:text-indigo-600 px-3 py-2">
                Judges
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Flight Bookings</h2>
          <p className="text-gray-600">
            View all flight searches and bookings made through ClearSend Room
          </p>
        </div>

        {flights.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Flights Yet</h3>
            <p className="text-gray-600 mb-6">
              Search for flights in the Switch room to get started
            </p>
            <div className="bg-gray-50 rounded-lg p-6 text-left max-w-2xl mx-auto">
              <h4 className="font-semibold text-gray-900 mb-3">How to search flights:</h4>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="font-bold mr-2">1.</span>
                  <span>In the Switch room, type: &quot;Search flights from [origin] to [destination] on [date]&quot;</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">2.</span>
                  <span>The agent searches OpenFlights and OpenSky Network data</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">3.</span>
                  <span>View real flight options with schedules and prices (when available)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">4.</span>
                  <span>Select your preferred flight</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">5.</span>
                  <span>Review price breakdown with real FX rates</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">6.</span>
                  <span>Confirm booking and complete payment via PayPal</span>
                </li>
              </ol>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> All flight data is real from OpenFlights.org and OpenSky Network.
                  When live pricing isn&apos;t available, the agent clearly labels it as &quot;Schedule data only&quot;.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {flights.map((flight, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {flight.origin} → {flight.destination}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {flight.airline} {flight.flight_number}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {flight.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Departure</p>
                    <p className="text-sm font-medium text-gray-900">{flight.departure_time}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Arrival</p>
                    <p className="text-sm font-medium text-gray-900">{flight.arrival_time}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-medium text-gray-900">{flight.duration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="text-sm font-medium text-gray-900">
                      {flight.price ? `${flight.price} ${flight.currency}` : 'Schedule only'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Sources</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>OpenFlights.org:</strong> Airport and route database</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>OpenSky Network:</strong> Real-time flight tracking</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>Sky-Scrapper API:</strong> Enhanced pricing (optional)</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Real FX Rates</h3>
            <p className="text-sm text-gray-600 mb-3">
              Currency conversion uses live rates from Frankfurter API:
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Platform fee: 2.5%</li>
              <li>• FX spread: 1.2%</li>
              <li>• Updated every hour</li>
              <li>• No hidden fees</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment</h3>
            <p className="text-sm text-gray-600 mb-3">
              All payments processed via PayPal sandbox:
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Orders v2 API</li>
              <li>• Secure checkout</li>
              <li>• Real payment flow</li>
              <li>• No real money</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
