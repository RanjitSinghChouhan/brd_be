const jwt = require("jsonwebtoken");

const { JWT_ALGORITHM, ACCESS_TOKEN_MAXAGE } = require("./jwtConfig");

const  JWT_ACCESS_TOKEN_SECRET  = "qwertyuiop";

function getAccessToken({ userId, userRoleId }) {
  return jwt.sign(
    { userInfo: { userId, userRoleId }, generatedAt: new Date().getTime() },
    JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_MAXAGE, algorithm: JWT_ALGORITHM },
  );
}

module.exports = getAccessToken;