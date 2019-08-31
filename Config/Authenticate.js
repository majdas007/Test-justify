const jwt = require('jsonwebtoken');
const Conf = require('./Utils')
const responseHandler = require('./Responsehandler');
exports.getToken = function(email) {
    return jwt.sign(email, Conf.secretKey,
        {expiresIn: 3600 * 24 });
};

exports.verifyOrdinaryUser = function(req, res, next) {
    // check header or url parameters or post parameters for token
    let token = req.body.token || req.query.token || req.headers['x-access-token'] ||  req.headers['authorization'];

    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, Conf.secretKey, function(err, decoded) {
            if (err) {
                responseHandler.resHandler(false,null,'You are not authenticated!',res,401)
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });
    } else {
        // if there is no token
        // return an error
        responseHandler.resHandler(false,null,'No token provided!',res,403)

    }
};