import jwt from "jsonwebtoken";

const generateToken = (payload: {
  id: string;
  email: string;
  username: string;
}) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurado.");

  return jwt.sign({ ...payload, userId: payload.id }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"],
  });
};
const verifyToken = (token: string) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    return jwt.verify(token, secret, { algorithms: ["HS256"] });
  } catch {
    return null;
  }
};

export { generateToken, verifyToken };
