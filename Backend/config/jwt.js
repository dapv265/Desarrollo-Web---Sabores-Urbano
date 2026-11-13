export function getJwtConfig() {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  if (!secret) {
    throw new Error('Define JWT_SECRET en Backend/.env.');
  }

  return { secret, expiresIn };
}
