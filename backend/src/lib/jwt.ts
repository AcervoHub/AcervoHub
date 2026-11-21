import jwt from "jsonwebtoken";

const generateToken = (payload: {
  id: string;
  email: string;
  username: string;
}) => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
};
const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    return null;
  }
};

export { generateToken, verifyToken };