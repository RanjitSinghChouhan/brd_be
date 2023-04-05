const jwt = require("jsonwebtoken");

const { JWT_ALGORITHM, ACCESS_TOKEN_MAXAGE } = require("./jwtConfig");

const  JWT_ACCESS_TOKEN_SECRET  = process.env.JWT_SECRET;//this to be kept in env file

function verifyJwtAccessToken(bearerAccessToken) {
  return new Promise((resolve, reject) => {
    if (!bearerAccessToken.startsWith("Bearer")) {
      return reject(new Error("Token is invalid")); // Reject if there is no Bearer in the token
    }

    const accessToken = bearerAccessToken.slice(7, bearerAccessToken.length).trim(); // Remove 'Bearer '(length : 7) from string

    return jwt.verify(accessToken, JWT_ACCESS_TOKEN_SECRET, { algorithm: JWT_ALGORITHM, maxAge: ACCESS_TOKEN_MAXAGE },
      (err, decodedToken) => {
        // check all error types :  https://github.com/auth0/node-jsonwebtoken
        if (err) {
          return reject(err); // format:  err = { name: 'TokenExpiredError', message: 'jwt expired', expiredAt: 1408621000 }
        }
        if (!decodedToken || !decodedToken.userInfo || !decodedToken.userInfo.userId) {
          return reject(new Error("Token is invalid"));
        }
        return resolve(decodedToken.userInfo);
      });
  });
}

module.exports = verifyJwtAccessToken;