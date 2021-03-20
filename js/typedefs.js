

/**
 * This callback for tags found
 * @callback ShellGameEventCallback
 * @param {ShellGameEventHook} hook
 *
 */


/**
 * Raw input possible keys
 * @typedef {Object} ShellGameRawInput
 * @property {ShellGameSerialized} [game] - optional
 * @property {string[]} [tags] - optional
 */


/**
 * The complete Shell Game,
 * @typedef {Object} ShellGameSerialized
 * @property {Object.<string, ShellGameVariable>} element_lib
 * @property {Object.<string, ShellGameShell>} shell_lib
 * @property {Object.<string, ShellGameShell>} running_shells
 */