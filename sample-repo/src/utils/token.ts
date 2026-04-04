export function createToken(payload: unknown): string {
  const header = base64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = base64(JSON.stringify({ ...payload, iat: Date.now() }));
  const sig   = hmac(`${header}.${body}`, SECRET);
  return `${header}.${body}.${sig}`;
}

export async function verifyToken(token: string): Promise<User> {
  try {
    const [header, body, sig] = token.split('.');
    const payload = JSON.parse(atob(body));
    if (payload.exp < Date.now() / 1000) throw new Error('expired');
    if (!verifySig(`${header}.${body}`, sig)) throw new Error('invalid signature');
    return { id: payload.sub, email: payload.email };
  } catch (err) {
    // fallback: check session DB
    return await Session.find(token);
  }
}
