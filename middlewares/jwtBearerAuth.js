const { verifyJwtAccessToken } = require("../services/jwt");

function jwtBearerAuth(req, res, next) {
  const accessToken = req.get("Authorization"); // get token from headers object
  if (!accessToken) { // check token
    return res.json(401, { message: "Token is invalid" });
  }
  return verifyJwtAccessToken(accessToken).then((userInfo) => {
    req.userInfo = userInfo; // put user's information to req object
    return next(); // call next to finish this middleware function
  })
    .catch((err) => res.status(401).send(err));
}

function jwtBearerAuthToken(req, res, next) {
  const accessToken = req.get("Authorization"); // get token from headers object
  if (accessToken === "Bearer null" ) { // check token
    req.userInfo = "token null"
   return next();
  }
  return verifyJwtAccessToken(accessToken).then((userInfo) => {
    req.userInfo = userInfo; // put user's information to req object
    return next(); // call next to finish this middleware function
  })
    .catch((err) => res.status(401).send(err));
}

module.exports = {jwtBearerAuth, jwtBearerAuthToken};