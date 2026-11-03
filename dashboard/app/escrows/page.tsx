"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function EscrowsPage() {
  const [escrows] = useState<any[]>([]);

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
              <Link href="/escrows" className="text-indigo-600 px-3 py-2 font-medium">
                Escrows
              </Link>
              <Link href="/flights" className="text-gray-700 hover:text-indigo-600 px-3 py-2">
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Escrow Transactions</h2>
          <p className="text-gray-600">
            Track all escrow transactions from creation to completion
          </p>
        </div>

        {escrows.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Escrows Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first escrow transaction in the Switch room
            </p>
            <div className="bg-gray-50 rounded-lg p-6 text-left max-w-2xl mx-auto">
              <h4 className="font-semibold text-gray-900 mb-3">How to create an escrow:</h4>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="font-bold mr-2">1.</span>
                  <span>In the Switch room, type: &quot;Create escrow for [description] worth [amount]&quot;</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">2.</span>
                  <span>The agent creates the escrow and provides payment links</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">3.</span>
                  <span>Payer funds the escrow via PayPal sandbox</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">4.</span>
                  <span>Recipient submits deliverable in the room</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">5.</span>
                  <span>Agent verifies against spec and posts decision</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">6.</span>
                  <span>After human approval, funds are released</span>
                </li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {escrows.map((escrow) => (
              <div key={escrow.escrow_id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{escrow.description}</h3>
                    <p className="text-sm text-gray-500">ID: {escrow.escrow_id}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {escrow.state}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-sm font-medium text-gray-900">
                      {escrow.amount} {escrow.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payer</p>
                    <p className="text-sm font-medium text-gray-900">{escrow.payer_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(escrow.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Updated</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(escrow.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
