import jwt from 'jsonwebtoken';

import { getJwtConfig } from '../config/jwt.js';
import { Usuario } from '../models/Usuario.js';

export async function authenticate(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(authorization);

  if (!match) {
    return res.status(401).json({
      success: false,
      message: 'Se requiere un token Bearer válido.',
    });
  }

  const { secret } = getJwtConfig();

  let payload;
  try {
    payload = jwt.verify(match[1], secret, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({
      success: false,
      message: 'El token es inválido o expiró.',
    });
  }

  if (!payload || typeof payload !== 'object' || typeof payload.sub !== 'string') {
    return res.status(401).json({
      success: false,
      message: 'El token no contiene una identidad válida.',
    });
  }

  const usuario = await Usuario.findById(payload.sub);
  if (!usuario || !usuario.activo) {
    return res.status(401).json({
      success: false,
      message: 'La sesión no está activa.',
    });
  }

  req.user = usuario;
  return next();
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción.',
      });
    }

    return next();
  };
}
