"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.authenticate = authenticate;
exports.optionalAuthenticate = optionalAuthenticate;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_meatmart_jwt_key_2026_kanjikovil_erode';
function generateToken(user) {
    return jsonwebtoken_1.default.sign({
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
    }, JWT_SECRET, { expiresIn: '7d' });
}
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user) {
        return res.status(401).json({ message: 'Invalid or expired session token.' });
    }
    req.user = user;
    next();
}
function optionalAuthenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const user = verifyToken(token);
        if (user) {
            req.user = user;
        }
    }
    next();
}
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required.' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Forbidden. Access requires one of roles: ${allowedRoles.join(', ')}.`,
            });
        }
        next();
    };
}
