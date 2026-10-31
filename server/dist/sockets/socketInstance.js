"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSocketIO = setSocketIO;
exports.getSocketIO = getSocketIO;
let ioInstance = null;
function setSocketIO(io) {
    ioInstance = io;
}
function getSocketIO() {
    return ioInstance;
}
