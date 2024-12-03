export class AccessPasswordError extends Error {
    constructor(message?: string) {
        const baseMessage = "Access password is invalid"
        if (!message) {
            message = baseMessage
        }
        super(message);
        this.name = "AccessPasswordError";
    }
}

export class NotSupportCommandError extends Error {
    constructor(message?: string) {
        const baseMessage = "Tag does not support command"
        if (!message) {
            message = baseMessage
        }
        super(message);
        this.name = "NotSupportCommandError";
    }
}

export class AccessPasswordIsZeroError extends Error {
    constructor(message?: string) {
        const baseMessage = "Command requires non-zero access password"
        if (!message) {
            message = baseMessage
        }
        super(message);
        this.name = "AccessPasswordIsZeroError";
    }
}

export class SaveFailError extends Error {
    constructor(message?: string) {
        const baseMessage = "Fail to save"
        if (!message) {
            message = baseMessage
        }
        super(message);
        this.name = "SaveFailError";
    }
}

export class CannotAdjustError extends Error {
    constructor(message?: string) {
        const baseMessage = "Power can not be adjusted"
        if (!message) {
            message = baseMessage
        }
        super(message);
        this.name = "CannotAdjustError";
    }
}

export class NotSupportCommandOrAccessPasswordError extends Error {
    constructor(message?: string) {
        const baseMessage = "Command is not supported or access password is invalid"
        if (!message) {
            message = baseMessage
        }
        super(message);
        this.name = "NotSupportCommandOrAccessPasswordError";
    }
}

export class CommandExecuteError extends Error {
    constructor(message?: string) {
        const baseMessage = "Fail to execute command"
        if (!message) {
            message = baseMessage
        }
        super(message);
        this.name = "CommandExecuteError";
    }
}

export class PoorCommunicationError extends Error {
    constructor(message?: string) {
        const baseMessage = "Poor communication between reader and tag"
        if (!message) {
            message = baseMessage
        }
        super(message);
        this.name = "PoorCommunicationError";
    }
}

export class NoTagOperableError extends Error {
    constructor(message?: string) {
        const baseMessage = "No tag in the effective field"
        if (!message) {
            message = baseMessage
        }
        super(message);
        this.name = "NoTagOperableError";
    }
}

export class TagReturnCodeError extends Error {
    constructor(message?: string) {
        const baseMessage = "Tag return error code";
        if (!message) {
            message = baseMessage
        }
        super(message);
        this.name = "TagReturnCodeError";
    }
}

export class CommandLengthWrongError extends Error {
    constructor(message?: string) {
        const baseMessage = "Length of command doesn't conform to the command request"
        if (!message) {
            message = baseMessage
        }
        super(message);
        this.name = "CommandLengthWrongError";
    }
}

export class IllegalCommandError extends Error {
    constructor(message?: string) {
        const baseMessage = "Unrecognized command or CRC error"
        if (!message) {
            message = baseMessage
        }
        super(message);
        this.name = "IllegalCommandError";
    }
}

export class ParameterError extends Error {
    constructor(message?: string) {
        const baseMessage = "Command parameter is invalid"
        if (!message) {
            message = baseMessage
        }
        super(message);
        this.name = "ParameterError";
    }
}