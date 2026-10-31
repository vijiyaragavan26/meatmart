"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.sendOtp = sendOtp;
exports.verifyOtp = verifyOtp;
exports.resetPassword = resetPassword;
exports.getMe = getMe;
exports.addAddress = addAddress;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const otpService_1 = require("../services/otpService");
const whatsappService_1 = require("../services/whatsappService");
const emailService_1 = require("../services/emailService");
const notificationService_1 = require("../services/notificationService");
async function register(req, res) {
    try {
        const { fullName, phoneNumber, email, password, address, area, pincode, whatsappConsent = true } = req.body;
        if (!fullName || !phoneNumber || !password) {
            return res.status(400).json({ message: 'Full name, mobile number, and password are required.' });
        }
        if (phoneNumber.length < 10) {
            return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number.' });
        }
        // Check if phone already registered
        let existingUser = null;
        if (db_1.isPostgresConnected) {
            existingUser = await db_1.prisma.user.findUnique({ where: { phoneNumber } });
        }
        else {
            existingUser = db_1.memDb.users.find(u => u.phoneNumber === phoneNumber);
        }
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this mobile number already exists.' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const userId = `user-${(0, uuid_1.v4)().substring(0, 8)}`;
        const newUser = {
            id: userId,
            fullName,
            phoneNumber,
            email: email || null,
            passwordHash,
            role: 'CUSTOMER',
            isActive: true,
            avatarUrl: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        if (db_1.isPostgresConnected) {
            const created = await db_1.prisma.user.create({
                data: {
                    id: newUser.id,
                    fullName: newUser.fullName,
                    phoneNumber: newUser.phoneNumber,
                    email: newUser.email,
                    passwordHash: newUser.passwordHash,
                    role: 'CUSTOMER',
                },
            });
            const profile = await db_1.prisma.customerProfile.create({
                data: { userId: created.id },
            });
            if (address && pincode) {
                await db_1.prisma.customerAddress.create({
                    data: {
                        customerProfileId: profile.id,
                        addressLabel: 'Home',
                        recipientName: fullName,
                        recipientPhone: phoneNumber,
                        flatHouseNo: address,
                        streetAddress: address,
                        area: area || 'Kanjikovil',
                        city: 'Erode',
                        state: 'Tamil Nadu',
                        pincode: pincode || '638116',
                        latitude: 11.3985,
                        longitude: 77.6088,
                        isDefault: true,
                    },
                });
            }
        }
        else {
            db_1.memDb.users.push(newUser);
            if (address && pincode) {
                db_1.memDb.customerAddresses.push({
                    id: `addr-${(0, uuid_1.v4)().substring(0, 8)}`,
                    customerProfileId: userId,
                    userId: userId,
                    addressLabel: 'Home',
                    recipientName: fullName,
                    recipientPhone: phoneNumber,
                    flatHouseNo: address,
                    streetAddress: address,
                    area: area || 'Kanjikovil',
                    city: 'Erode',
                    state: 'Tamil Nadu',
                    pincode: pincode || '638116',
                    latitude: 11.3985,
                    longitude: 77.6088,
                    isDefault: true,
                });
            }
        }
        // Initialize notification preferences with customer consent
        await (0, notificationService_1.updateUserPreferences)(userId, {
            whatsappOrderUpdates: Boolean(whatsappConsent),
            emailReceipts: Boolean(email),
            smsAlerts: true,
        });
        // Send instant Welcome WhatsApp and Email notifications to customer
        if (whatsappConsent) {
            (0, whatsappService_1.sendWhatsAppCustomerWelcome)(newUser.phoneNumber, newUser.fullName).catch(err => console.error('[Welcome WhatsApp Error]', err.message));
        }
        if (newUser.email) {
            (0, emailService_1.sendCustomerWelcomeEmail)(newUser.email, newUser.fullName).catch(err => console.error('[Welcome Email Error]', err.message));
        }
        const token = (0, auth_1.generateToken)({
            id: newUser.id,
            fullName: newUser.fullName,
            phoneNumber: newUser.phoneNumber,
            email: newUser.email,
            role: newUser.role,
        });
        res.status(201).json({
            message: 'Account registered successfully!',
            token,
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                phoneNumber: newUser.phoneNumber,
                email: newUser.email,
                role: newUser.role,
            },
        });
    }
    catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: error.message || 'Registration failed' });
    }
}
async function login(req, res) {
    try {
        const { phoneNumber, password } = req.body;
        if (!phoneNumber || !password) {
            return res.status(400).json({ message: 'Mobile number and password are required.' });
        }
        let user = null;
        if (db_1.isPostgresConnected) {
            try {
                user = await db_1.prisma.user.findUnique({ where: { phoneNumber } });
            }
            catch (dbErr) {
                console.warn('[Prisma pooler timeout] Falling back to Memory DB store for login:', phoneNumber);
                user = db_1.memDb.users.find(u => u.phoneNumber === phoneNumber);
            }
        }
        else {
            user = db_1.memDb.users.find(u => u.phoneNumber === phoneNumber);
        }
        if (!user) {
            return res.status(401).json({ message: 'No account found with this mobile number.' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password.' });
        }
        const token = (0, auth_1.generateToken)({
            id: user.id,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            email: user.email,
            role: user.role,
        });
        // Send instant Email and WhatsApp security alerts when Admin logs in
        if (user.role === 'ADMIN') {
            const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '127.0.0.1');
            const userAgent = String(req.headers['user-agent'] || 'Web Browser');
            const adminEmail = user.email || 'vijiyaragavan26@gmail.com';
            const adminPhone = user.phoneNumber || '7604906429';
            const adminName = user.fullName || 'Vijay';
            (0, emailService_1.sendAdminLoginAlertEmail)(adminEmail, adminName, { ip, userAgent }).catch(err => console.error('[Admin Login Alert Email Error]', err.message));
            (0, whatsappService_1.sendWhatsAppAdminLoginAlert)(adminPhone, adminName, { ip }).catch(err => console.error('[Admin Login Alert WhatsApp Error]', err.message));
        }
        let addresses = [];
        if (db_1.isPostgresConnected) {
            try {
                addresses = await db_1.prisma.customerAddress.findMany({ where: { customerProfile: { userId: user.id } } });
            }
            catch (addrErr) {
                addresses = db_1.memDb.customerAddresses.filter(a => a.userId === user.id || a.customerProfileId === user.id);
            }
        }
        else {
            addresses = db_1.memDb.customerAddresses.filter(a => a.userId === user.id || a.customerProfileId === user.id);
            if (addresses.length === 0) {
                const defaultAddr = {
                    id: `addr-${(0, uuid_1.v4)().substring(0, 8)}`,
                    customerProfileId: user.id,
                    userId: user.id,
                    addressLabel: 'Home',
                    recipientName: user.fullName || 'Valued Customer',
                    recipientPhone: user.phoneNumber || '9876543210',
                    flatHouseNo: 'Plot No. 14, Kaveri Nagar',
                    streetAddress: 'Kanjikovil Main Road',
                    area: 'Kanjikovil',
                    city: 'Erode',
                    state: 'Tamil Nadu',
                    pincode: '638116',
                    latitude: 11.3985,
                    longitude: 77.6088,
                    isDefault: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                db_1.memDb.customerAddresses.push(defaultAddr);
                addresses.push(defaultAddr);
            }
        }
        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
            },
            addresses,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
}
async function sendOtp(req, res) {
    try {
        const { phoneNumber, email, purpose = 'LOGIN' } = req.body;
        if (!phoneNumber || phoneNumber.length < 10) {
            return res.status(400).json({ message: 'Valid 10-digit mobile number required.' });
        }
        const otpResult = await (0, otpService_1.createOtp)(phoneNumber, 'MOBILE', purpose);
        if ('error' in otpResult) {
            return res.status(429).json({ message: otpResult.error, cooldownSeconds: otpResult.cooldownSeconds });
        }
        // Send through WhatsApp
        const waResult = await (0, whatsappService_1.sendWhatsAppOtp)(phoneNumber, otpResult.otp);
        // Find if user has an associated email (or user is vijiyaragavan26@gmail.com)
        let targetEmail = email;
        let customerName = 'MeatMart Customer';
        let existingUser = null;
        if (db_1.isPostgresConnected) {
            existingUser = await db_1.prisma.user.findUnique({ where: { phoneNumber } });
        }
        else {
            existingUser = db_1.memDb.users.find(u => u.phoneNumber === phoneNumber);
        }
        if (existingUser) {
            if (!targetEmail && existingUser.email)
                targetEmail = existingUser.email;
            if (existingUser.fullName)
                customerName = existingUser.fullName;
        }
        // Direct binding for developer/store admin's test mobile
        if (!targetEmail && phoneNumber.includes('7604906429')) {
            targetEmail = 'vijiyaragavan26@gmail.com';
            customerName = 'Vijiyaragavan';
        }
        let emailSent = false;
        if (targetEmail) {
            try {
                await (0, emailService_1.sendEmailVerificationOtp)(targetEmail, otpResult.otp, customerName);
                emailSent = true;
                console.log(`[Auth] Dispatched live OTP to Gmail: ${targetEmail}`);
            }
            catch (emailErr) {
                console.error('[Auth] Failed to dispatch email OTP:', emailErr.message);
            }
        }
        res.json({
            message: `Verification code sent to +91 ${phoneNumber}${emailSent ? ` and ${targetEmail}` : ''} via WhatsApp & Email.`,
            expiresIn: 300,
            resendIn: 60,
            otp: otpResult.otp,
            debugOtp: otpResult.otp,
            whatsappDirectUrl: waResult.directWhatsAppUrl,
            isSimulated: Boolean(waResult.simulated),
            emailSent,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message || 'Failed to send OTP.' });
    }
}
async function verifyOtp(req, res) {
    try {
        const { phoneNumber, otp } = req.body;
        if (!phoneNumber || !otp) {
            return res.status(400).json({ message: 'Phone number and OTP are required.' });
        }
        const verifyResult = await (0, otpService_1.verifyStoredOtp)(phoneNumber, 'MOBILE', otp);
        if (!verifyResult.success) {
            return res.status(400).json({ message: verifyResult.message });
        }
        // Find or create user
        let user = null;
        if (db_1.isPostgresConnected) {
            try {
                user = await db_1.prisma.user.findUnique({ where: { phoneNumber } });
            }
            catch (dbErr) {
                console.warn('[Prisma pooler timeout] Falling back to Memory DB store for login:', phoneNumber);
                user = db_1.memDb.users.find(u => u.phoneNumber === phoneNumber);
            }
        }
        else {
            user = db_1.memDb.users.find(u => u.phoneNumber === phoneNumber);
        }
        const isVijiyaragavan = phoneNumber.includes('7604906429');
        const isPoopesh = phoneNumber.includes('9360761595');
        if (!user) {
            // New user via OTP
            const userId = `user-${(0, uuid_1.v4)().substring(0, 8)}`;
            const randomHash = await bcryptjs_1.default.hash((0, uuid_1.v4)(), 10);
            user = {
                id: isVijiyaragavan ? 'user-admin-1' : isPoopesh ? 'user-delivery-1' : userId,
                fullName: isVijiyaragavan ? 'Vijay' : isPoopesh ? 'Poopesh' : `Customer ${phoneNumber.substring(6)}`,
                phoneNumber,
                email: isVijiyaragavan ? 'vijiyaragavan26@gmail.com' : isPoopesh ? 'poopesh.delivery@meatmart.in' : undefined,
                passwordHash: isVijiyaragavan ? await bcryptjs_1.default.hash('Vijay@265', 10) : isPoopesh ? await bcryptjs_1.default.hash('poopesh@123', 10) : randomHash,
                role: isVijiyaragavan ? 'ADMIN' : isPoopesh ? 'DELIVERY_PARTNER' : 'CUSTOMER',
                isActive: true,
                avatarUrl: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            if (db_1.isPostgresConnected) {
                await db_1.prisma.user.create({
                    data: {
                        id: user.id,
                        fullName: user.fullName,
                        phoneNumber: user.phoneNumber,
                        passwordHash: user.passwordHash,
                        role: user.role,
                    },
                });
                if (user.role === 'CUSTOMER') {
                    await db_1.prisma.customerProfile.create({ data: { userId: user.id } });
                }
            }
            else {
                db_1.memDb.users.push(user);
            }
            await (0, notificationService_1.updateUserPreferences)(user.id, {
                whatsappOrderUpdates: true,
                isPhoneVerified: true,
            });
            if (user.role === 'CUSTOMER') {
                (0, whatsappService_1.sendWhatsAppCustomerWelcome)(user.phoneNumber, user.fullName).catch(err => console.error('[Welcome WhatsApp Error]', err.message));
                if (user.email) {
                    (0, emailService_1.sendCustomerWelcomeEmail)(user.email, user.fullName).catch(err => console.error('[Welcome Email Error]', err.message));
                }
            }
        }
        else if (isVijiyaragavan) {
            user.role = 'ADMIN';
            user.fullName = 'Vijay';
            user.email = 'vijiyaragavan26@gmail.com';
            user.passwordHash = await bcryptjs_1.default.hash('Vijay@265', 10);
        }
        else if (isPoopesh) {
            user.role = 'DELIVERY_PARTNER';
            user.fullName = 'Poopesh';
            user.email = 'poopesh.delivery@meatmart.in';
            user.passwordHash = await bcryptjs_1.default.hash('poopesh@123', 10);
        }
        const token = (0, auth_1.generateToken)({
            id: user.id,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            email: user.email,
            role: user.role,
        });
        // Send instant Email and WhatsApp security alerts when Admin logs in
        if (user.role === 'ADMIN') {
            const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '127.0.0.1');
            const userAgent = String(req.headers['user-agent'] || 'Web Browser');
            const adminEmail = user.email || 'vijiyaragavan26@gmail.com';
            const adminPhone = user.phoneNumber || '7604906429';
            const adminName = user.fullName || 'Vijay';
            (0, emailService_1.sendAdminLoginAlertEmail)(adminEmail, adminName, { ip, userAgent }).catch(err => console.error('[Admin Login Alert Email Error]', err.message));
            (0, whatsappService_1.sendWhatsAppAdminLoginAlert)(adminPhone, adminName, { ip }).catch(err => console.error('[Admin Login Alert WhatsApp Error]', err.message));
        }
        let addresses = [];
        if (db_1.isPostgresConnected) {
            try {
                addresses = await db_1.prisma.customerAddress.findMany({ where: { customerProfile: { userId: user.id } } });
            }
            catch (addrErr) {
                addresses = db_1.memDb.customerAddresses.filter(a => a.userId === user.id || a.customerProfileId === user.id);
            }
        }
        else {
            addresses = db_1.memDb.customerAddresses.filter(a => a.userId === user.id || a.customerProfileId === user.id);
        }
        res.json({
            message: 'OTP verified successfully!',
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
            },
            addresses,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message || 'OTP verification failed' });
    }
}
async function resetPassword(req, res) {
    try {
        const { phoneNumber, otp, newPassword } = req.body;
        if (!phoneNumber || !otp || !newPassword) {
            return res.status(400).json({ message: 'Mobile number, OTP, and new password are required.' });
        }
        const verifyResult = await (0, otpService_1.verifyStoredOtp)(phoneNumber, 'MOBILE', otp, 'PASSWORD_RESET');
        if (!verifyResult.success) {
            return res.status(400).json({ message: verifyResult.message });
        }
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        if (db_1.isPostgresConnected) {
            const user = await db_1.prisma.user.findUnique({ where: { phoneNumber } });
            if (!user) {
                return res.status(404).json({ message: 'No account found with this mobile number.' });
            }
            await db_1.prisma.user.update({
                where: { phoneNumber },
                data: { passwordHash },
            });
        }
        else {
            const user = db_1.memDb.users.find(u => u.phoneNumber === phoneNumber);
            if (!user) {
                return res.status(404).json({ message: 'No account found with this mobile number.' });
            }
            user.passwordHash = passwordHash;
        }
        res.json({ message: 'Password reset successfully! You can now sign in with your new password.' });
    }
    catch (err) {
        res.status(500).json({ message: err.message || 'Failed to reset password.' });
    }
}
async function getMe(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        let user = null;
        let addresses = [];
        let deliveryPartnerProfile = null;
        if (db_1.isPostgresConnected) {
            try {
                user = await db_1.prisma.user.findUnique({
                    where: { id: userId },
                    include: {
                        customerProfile: { include: { addresses: true } },
                        deliveryPartner: true,
                    },
                });
                if (user) {
                    addresses = user.customerProfile?.addresses || [];
                    deliveryPartnerProfile = user.deliveryPartner;
                }
            }
            catch (getMeErr) {
                console.warn('[Prisma pooler timeout] Falling back to Memory DB store for getMe:', userId);
                user = db_1.memDb.users.find(u => u.id === userId);
                addresses = db_1.memDb.customerAddresses.filter(a => a.userId === userId || a.customerProfileId === userId);
            }
        }
        else {
            user = db_1.memDb.users.find(u => u.id === userId);
            addresses = db_1.memDb.customerAddresses.filter(a => a.userId === userId || a.customerProfileId === userId);
            if (user && addresses.length === 0) {
                // Auto-seed default Kanjikovil address for instant checkout
                const defaultAddr = {
                    id: `addr-${(0, uuid_1.v4)().substring(0, 8)}`,
                    customerProfileId: userId,
                    userId,
                    addressLabel: 'Home',
                    recipientName: user.fullName || 'Valued Customer',
                    recipientPhone: user.phoneNumber || '9876543210',
                    flatHouseNo: 'Plot No. 14, Kaveri Nagar',
                    streetAddress: 'Kanjikovil Main Road',
                    area: 'Kanjikovil',
                    city: 'Erode',
                    state: 'Tamil Nadu',
                    pincode: '638116',
                    latitude: 11.3985,
                    longitude: 77.6088,
                    isDefault: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                db_1.memDb.customerAddresses.push(defaultAddr);
                addresses.push(defaultAddr);
            }
            deliveryPartnerProfile = db_1.memDb.deliveryPartners.find(d => d.userId === userId);
        }
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            id: user.id,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
            addresses,
            deliveryPartnerProfile,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function addAddress(req, res) {
    try {
        const userId = req.user?.id;
        const { addressLabel, recipientName, recipientPhone, flatHouseNo, streetAddress, landmark, area, city, pincode, latitude, longitude, isDefault } = req.body;
        const user = db_1.memDb.users.find(u => u.id === userId);
        const rName = (recipientName || user?.fullName || 'Customer').trim();
        const rPhone = (recipientPhone || user?.phoneNumber || '9876543210').trim();
        const fHouse = (flatHouseNo || streetAddress || 'Kanjikovil Main Road').trim();
        const sPin = (pincode || '638116').trim();
        const newAddress = {
            id: `addr-${(0, uuid_1.v4)().substring(0, 8)}`,
            customerProfileId: userId,
            userId,
            addressLabel: addressLabel || 'Home',
            recipientName: rName,
            recipientPhone: rPhone,
            flatHouseNo: fHouse,
            streetAddress: streetAddress || fHouse,
            landmark: landmark || null,
            area: area || 'Kanjikovil',
            city: city || 'Erode',
            state: 'Tamil Nadu',
            pincode: sPin,
            latitude: latitude || 11.3985,
            longitude: longitude || 77.6088,
            isDefault: Boolean(isDefault),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        if (db_1.isPostgresConnected) {
            let profile = await db_1.prisma.customerProfile.findUnique({ where: { userId } });
            if (!profile) {
                profile = await db_1.prisma.customerProfile.create({
                    data: {
                        userId,
                    },
                });
            }
            if (profile) {
                if (isDefault) {
                    await db_1.prisma.customerAddress.updateMany({
                        where: { customerProfileId: profile.id },
                        data: { isDefault: false },
                    });
                }
                await db_1.prisma.customerAddress.create({
                    data: {
                        id: newAddress.id,
                        customerProfileId: profile.id,
                        addressLabel: newAddress.addressLabel,
                        recipientName: newAddress.recipientName,
                        recipientPhone: newAddress.recipientPhone,
                        flatHouseNo: newAddress.flatHouseNo,
                        streetAddress: newAddress.streetAddress,
                        landmark: newAddress.landmark,
                        area: newAddress.area,
                        city: newAddress.city,
                        state: newAddress.state,
                        pincode: newAddress.pincode,
                        latitude: newAddress.latitude,
                        longitude: newAddress.longitude,
                        isDefault: newAddress.isDefault,
                    },
                });
            }
        }
        else {
            if (isDefault) {
                db_1.memDb.customerAddresses.forEach(a => {
                    if (a.userId === userId)
                        a.isDefault = false;
                });
            }
            db_1.memDb.customerAddresses.push(newAddress);
        }
        res.status(201).json({ message: 'Address saved successfully!', address: newAddress });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
