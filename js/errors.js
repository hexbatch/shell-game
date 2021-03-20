class YamlParseError extends Error {
    constructor(message) {
        super(message);
        this.name = "YamlParseError";
    }
}

class YamlConvertError extends Error {
    constructor(message) {
        super(message);
        this.name = "YamlConvertError";
    }
}

class ShellGameRunError extends Error {
    constructor(message) {
        super(message);
        this.name = "ShellGameRunError";
    }
}

class ShellGameElementError extends Error {
    constructor(message) {
        super(message);
        this.name = "ShellGameElementError";
    }
}

class ShellGameGlomError extends Error {
    constructor(message) {
        super(message);
        this.name = "ShellGameGlomError";
    }
}

class ShellGameVariableError extends Error {
    constructor(message) {
        super(message);
        this.name = "ShellGameVariableError";
    }
}

class ShellGameShellError extends Error {
    constructor(message) {
        super(message);
        this.name = "ShellGameShellError";
    }
}

class ShellGameElementLibError extends Error {
    constructor(message) {
        super(message);
        this.name = "ShellGameElementLibError";
    }
}

class ShellGameElementTemplateError extends Error {
    constructor(message) {
        super(message);
        this.name = "ShellGameElementTemplateError";
    }
}

class ShellGameShellLibError extends Error {
    constructor(message) {
        super(message);
        this.name = "ShellGameShellLibError";
    }
}

class ShellGameElementStateError extends Error {
    constructor(message) {
        super(message);
        this.name = "ShellGameElementStateError";
    }
}

class ShellGameEventHookError extends Error {
    constructor(message) {
        super(message);
        this.name = "ShellGameEventHookError";
    }
}

class ShellGameKeeperError extends Error {
    constructor(message) {
        super(message);
        this.name = "ShellGameKeeperError";
    }
}