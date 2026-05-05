const encoder = new TextEncoder();

async function getKey(secret) {
  const keyData = encoder.encode(String(secret || ''));

  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function createToken(
  email,
  secret,
  ttlSeconds = 60 * 60 * 24 * 7
) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${email}.${exp}`;
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));

  return `${btoa(payload)}.${toHex(sig)}`;
}

export async function verifyToken(token, secret) {
  try {
    const lastDot = token.lastIndexOf('.');

    if (lastDot === -1) {
      return null;
    }

    const b64 = token.slice(0, lastDot);
    const sigHex = token.slice(lastDot + 1);
    const decoded = atob(b64);
    const payloadDot = decoded.lastIndexOf('.');

    if (payloadDot === -1) {
      return null;
    }

    const email = decoded.slice(0, payloadDot);
    const expStr = decoded.slice(payloadDot + 1);

    if (!email || !expStr) {
      return null;
    }

    const exp = Number.parseInt(expStr, 10);

    if (!Number.isFinite(exp) || exp * 1000 < Date.now()) {
      return null;
    }

    const key = await getKey(secret);
    const expectedSig = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(`${email}.${exp}`)
    );

    if (toHex(expectedSig) !== sigHex) {
      return null;
    }

    return email;
  } catch {
    return null;
  }
}
