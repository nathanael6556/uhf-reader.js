"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParameterError = exports.IllegalCommandError = exports.CommandLengthWrongError = exports.TagReturnCodeError = exports.NoTagOperableError = exports.PoorCommunicationError = exports.CommandExecuteError = exports.NotSupportCommandOrAccessPasswordError = exports.CannotAdjustError = exports.SaveFailError = exports.AccessPasswordIsZeroError = exports.NotSupportCommandError = exports.AccessPasswordError = void 0;
class AccessPasswordError extends Error {
    constructor(message) {
        const baseMessage = "Access password is invalid";
        if (message) {
            message = baseMessage + ".\n" + message;
        }
        else {
            message = baseMessage;
        }
        super(message);
        this.name = "AccessPasswordError";
    }
}
exports.AccessPasswordError = AccessPasswordError;
class NotSupportCommandError extends Error {
    constructor(message) {
        const baseMessage = "Tag does not support command";
        if (message) {
            message = baseMessage + ".\n" + message;
        }
        else {
            message = baseMessage;
        }
        super(message);
        this.name = "NotSupportCommandError";
    }
}
exports.NotSupportCommandError = NotSupportCommandError;
class AccessPasswordIsZeroError extends Error {
    constructor(message) {
        const baseMessage = "Command requires non-zero access password";
        if (message) {
            message = baseMessage + ".\n" + message;
        }
        else {
            message = baseMessage;
        }
        super(message);
        this.name = "AccessPasswordIsZeroError";
    }
}
exports.AccessPasswordIsZeroError = AccessPasswordIsZeroError;
class SaveFailError extends Error {
    constructor(message) {
        const baseMessage = "Fail to save";
        if (message) {
            message = baseMessage + ".\n" + message;
        }
        else {
            message = baseMessage;
        }
        super(message);
        this.name = "SaveFailError";
    }
}
exports.SaveFailError = SaveFailError;
class CannotAdjustError extends Error {
    constructor(message) {
        const baseMessage = "Power can not be adjusted";
        if (message) {
            message = baseMessage + ".\n" + message;
        }
        else {
            message = baseMessage;
        }
        super(message);
        this.name = "CannotAdjustError";
    }
}
exports.CannotAdjustError = CannotAdjustError;
class NotSupportCommandOrAccessPasswordError extends Error {
    constructor(message) {
        const baseMessage = "Command is not supported or access password is invalid";
        if (message) {
            message = baseMessage + ".\n" + message;
        }
        else {
            message = baseMessage;
        }
        super(message);
        this.name = "NotSupportCommandOrAccessPasswordError";
    }
}
exports.NotSupportCommandOrAccessPasswordError = NotSupportCommandOrAccessPasswordError;
class CommandExecuteError extends Error {
    constructor(message) {
        const baseMessage = "Fail to execute command";
        if (message) {
            message = baseMessage + ".\n" + message;
        }
        else {
            message = baseMessage;
        }
        super(message);
        this.name = "CommandExecuteError";
    }
}
exports.CommandExecuteError = CommandExecuteError;
class PoorCommunicationError extends Error {
    constructor(message) {
        const baseMessage = "Poor communication between reader and tag";
        if (message) {
            message = baseMessage + ".\n" + message;
        }
        else {
            message = baseMessage;
        }
        super(message);
        this.name = "PoorCommunicationError";
    }
}
exports.PoorCommunicationError = PoorCommunicationError;
class NoTagOperableError extends Error {
    constructor(message) {
        const baseMessage = "No tag in the effective field";
        if (message) {
            message = baseMessage + ".\n" + message;
        }
        else {
            message = baseMessage;
        }
        super(message);
        this.name = "NoTagOperableError";
    }
}
exports.NoTagOperableError = NoTagOperableError;
class TagReturnCodeError extends Error {
    constructor(message) {
        const baseMessage = "Tag return error code";
        if (message) {
            message = baseMessage + ".\n" + message;
        }
        else {
            message = baseMessage;
        }
        super(message);
        this.name = "TagReturnCodeError";
    }
}
exports.TagReturnCodeError = TagReturnCodeError;
class CommandLengthWrongError extends Error {
    constructor(message) {
        const baseMessage = "Length of command doesn't conform to the command request";
        if (message) {
            message = baseMessage + ".\n" + message;
        }
        else {
            message = baseMessage;
        }
        super(message);
        this.name = "CommandLengthWrongError";
    }
}
exports.CommandLengthWrongError = CommandLengthWrongError;
class IllegalCommandError extends Error {
    constructor(message) {
        const baseMessage = "Unrecognized command or CRC error";
        if (message) {
            message = baseMessage + ".\n" + message;
        }
        else {
            message = baseMessage;
        }
        super(message);
        this.name = "IllegalCommandError";
    }
}
exports.IllegalCommandError = IllegalCommandError;
class ParameterError extends Error {
    constructor(message) {
        const baseMessage = "Command parameter is invalid";
        if (message) {
            message = baseMessage + ".\n" + message;
        }
        else {
            message = baseMessage;
        }
        super(message);
        this.name = "ParameterError";
    }
}
exports.ParameterError = ParameterError;
//# sourceMappingURL=exceptions.js.map