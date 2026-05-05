const STRIPE_API_VERSION = '2026-02-25.clover';
const STRIPE_CHECKOUT_URL = 'https://api.stripe.com/v1/checkout/sessions';
const SUPPORTED_AMOUNTS = new Set([500, 1000, 2500, 5000, 10000, 25000]);
const SUPPORTED_CURRENCIES = new Set(['gbp']);
const CHECKOUT_KINDS = new Set(['pilot_support', 'kit_deposit', 'tip_demo']);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function getBaseUrl(request, env) {
  const url = new URL(request.url);

  return env.BASE_URL || `${url.protocol}//${url.host}`;
}

function normalizeAmount(value) {
  const amount = Number.parseInt(String(value || ''), 10);

  if (!SUPPORTED_AMOUNTS.has(amount)) {
    return null;
  }

  return amount;
}

function normalizeKind(value) {
  const kind = String(value || 'pilot_support');

  return CHECKOUT_KINDS.has(kind) ? kind : 'pilot_support';
}

function validateAmountForKind(kind, amount) {
  if (kind === 'kit_deposit' && amount !== 10000) {
    return false;
  }

  return true;
}

function getCurrency(env) {
  const currency = String(env.STRIPE_CURRENCY || 'gbp').toLowerCase();

  return SUPPORTED_CURRENCIES.has(currency) ? currency : 'gbp';
}

function getCheckoutCopy(kind) {
  if (kind === 'kit_deposit') {
    return {
      name: 'Hat Trick Pilot Kit Deposit',
      description: 'Refundable deposit to reserve a free Hat Trick pilot kit.',
    };
  }

  if (kind === 'tip_demo') {
    return {
      name: 'Hat Trick Demo Tip',
      description:
        'Prototype checkout for the Hat Trick captive portal tip flow.',
    };
  }

  return {
    name: 'Hat Trick Pilot Support',
    description:
      'Support the first Hat Trick field tests for buskers and fringe venues.',
  };
}

function appendLineItem(params, { amount, currency, copy }) {
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', currency);
  params.set('line_items[0][price_data][unit_amount]', String(amount));
  params.set('line_items[0][price_data][product_data][name]', copy.name);
  params.set(
    'line_items[0][price_data][product_data][description]',
    copy.description
  );
}

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) {
    return jsonResponse(
      { success: false, error: 'Stripe checkout is not configured.' },
      503
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Invalid request.' }, 400);
  }

  const amount = normalizeAmount(body.amount);
  const kind = normalizeKind(body.kind);

  if (!amount || !validateAmountForKind(kind, amount)) {
    return jsonResponse(
      { success: false, error: 'Choose a supported amount.' },
      400
    );
  }

  const baseUrl = getBaseUrl(request, env);
  const currency = getCurrency(env);
  const copy = getCheckoutCopy(kind);
  const params = new URLSearchParams();

  params.set('mode', 'payment');
  params.set('submit_type', kind === 'pilot_support' ? 'donate' : 'pay');
  params.set('client_reference_id', `hattrick:${kind}:${amount}`);
  params.set(
    'success_url',
    `${baseUrl}/?checkout=success&checkout_kind=${kind}&session_id={CHECKOUT_SESSION_ID}#involved`
  );
  params.set(
    'cancel_url',
    `${baseUrl}/?checkout=cancelled&checkout_kind=${kind}#involved`
  );
  params.set('metadata[project]', 'hat-trick');
  params.set('metadata[kind]', kind);
  params.set('metadata[refundable]', kind === 'kit_deposit' ? 'true' : 'false');
  params.set(
    'metadata[source]',
    String(body.source || 'hattrick-site').slice(0, 80)
  );
  params.set('payment_intent_data[metadata][project]', 'hat-trick');
  params.set('payment_intent_data[metadata][kind]', kind);
  params.set(
    'payment_intent_data[metadata][refundable]',
    kind === 'kit_deposit' ? 'true' : 'false'
  );

  appendLineItem(params, { amount, currency, copy });

  const response = await fetch(STRIPE_CHECKOUT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': STRIPE_API_VERSION,
    },
    body: params,
  });

  if (!response.ok) {
    const requestId = response.headers.get('request-id');
    const errorBody = await response.json().catch(() => null);
    const errorCode =
      errorBody?.error?.code || errorBody?.error?.type || 'stripe_error';

    return jsonResponse(
      {
        success: false,
        error: 'Stripe checkout is unavailable.',
        error_code: errorCode,
        stripe_request_id: requestId || null,
      },
      502
    );
  }

  const session = await response.json();

  if (!session.url) {
    return jsonResponse(
      { success: false, error: 'Stripe checkout did not return a URL.' },
      502
    );
  }

  return jsonResponse({
    success: true,
    id: session.id,
    url: session.url,
  });
}
