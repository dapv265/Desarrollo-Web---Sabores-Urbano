function getJwtConfig() {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN;

  if (!secret || !expiresIn) {
    throw new Error("Define JWT_SECRET y JWT_EXPIRES_IN en backend/.env.");
  }

  return { secret, expiresIn };
}

module.exports = { getJwtConfig };
