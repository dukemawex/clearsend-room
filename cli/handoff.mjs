/** Minimal safe room summary: never echo emails, tokens, deliverables or payment URLs. */
export function handoff(result) {
  const e = result.escrow;
  if (!e || !/^esc_[a-z0-9]+$/.test(e.id)) throw Error('Escrow record required');
  const stages = {
    created: ['payer', `@clearsend-executor !clearsend ${e.id} ${e.order ? 'capture' : 'fund'}`, e.order ? 'Approve PayPal sandbox privately before capture.' : 'Check the private role page and payment details before funding.'],
    funded: ['recipient', `@clearsend-executor !clearsend ${e.id} submit <deliverable text>`, 'Only non-confidential text; verification sends it to a model provider.'],
    submitted: ['verifier', `@clearsend-executor !clearsend ${e.id} verify`, 'Review the agreed criteria before requesting verification.'],
    rejected: ['recipient', `@clearsend-executor !clearsend ${e.id} submit <revised deliverable text>`, 'Address the failed criteria, or payer/verifier can request refund.'],
    verified: ['verifier', `@clearsend-executor !clearsend ${e.id} release`, 'Review every criterion and payout details privately before approving.'],
    released: ['none', null, 'Payout batch submitted; final settlement requires provider reconciliation.'],
    refunded: ['none', null, 'Refund submitted; confirm final status with PayPal sandbox.'],
  };
  const stage = stages[e.state];
  if (!stage) throw Error('Unknown escrow state');
  return { ok: true, subject: e.id, state: e.state, nextRole: stage[0], humanCommand: stage[1], instruction: stage[2] };
}
