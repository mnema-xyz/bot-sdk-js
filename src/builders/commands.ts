// Early checks of slash command definitions (doc/bots.md, "Slash commands").
import type { CommandInput, CommandOption } from '../types/commands.ts'
import { checkLength, fail } from './validate.ts'

const NAME = /^[a-z0-9_-]{1,32}$/
const OPTION_TYPES = new Set([3, 4, 5, 6, 7])

function validateDefaultPermissions(name: string, p: unknown): void {
  if (p === undefined || p === null) return
  if (typeof p !== 'string' && typeof p !== 'bigint' && typeof p !== 'number' && !Array.isArray(p)) {
    fail(`/${name}: default_member_permissions must be a string, number, bigint, array or null`)
  }
}

function validateOptions(name: string, options: CommandOption[]): void {
  if (options.length > 10) fail(`/${name} has more than 10 options`)
  let optionalSeen = false
  const names = new Set<string>()
  for (const o of options) {
    const where = `/${name} option "${String(o.name)}"`
    if (typeof o.name !== 'string' || !NAME.test(o.name)) fail(`${where}: name must be 1 to 32 lowercase letters, digits, "-" or "_"`)
    if (names.has(o.name)) fail(`${where} appears twice`)
    names.add(o.name)
    checkLength(`${where} description`, o.description, 1, 100)
    if (!OPTION_TYPES.has(o.type)) fail(`${where}: type must be 3, 4, 5, 6 or 7`)
    if (o.required && optionalSeen) fail(`${where}: required options come first`)
    if (!o.required) optionalSeen = true
    validateChoices(where, o.type, o.choices)
  }
}

/** Throws a ValidationError when a command breaks a documented limit. */
export function validateCommand(c: CommandInput): void {
  if (typeof c?.name !== 'string' || !NAME.test(c.name)) {
    fail(`command name must be 1 to 32 lowercase letters, digits, "-" or "_", got "${String(c?.name)}"`)
  }
  checkLength(`/${c.name} description`, c.description, 1, 100)
  validateDefaultPermissions(c.name, c.default_member_permissions)
  validateOptions(c.name, c.options ?? [])
}

function validateChoices(where: string, type: number, choices: string[] | undefined): void {
  if (choices === undefined) return
  if (type !== 3) fail(`${where}: only string options take choices`)
  if (choices.length > 25) fail(`${where}: at most 25 choices`)
  if (new Set(choices).size !== choices.length) fail(`${where}: choices must be unique`)
  for (const ch of choices) checkLength(`${where} choice`, ch, 1, 100)
}

/** Throws when a bulk registration breaks a limit (at most 50 commands, unique names). */
export function validateCommands(list: CommandInput[]): void {
  if (!Array.isArray(list)) fail('commands must be an array')
  if (list.length > 50) fail(`a bot has at most 50 commands, got ${list.length}`)
  const seen = new Set<string>()
  for (const c of list) {
    validateCommand(c)
    if (seen.has(c.name)) fail(`command /${c.name} appears twice`)
    seen.add(c.name)
  }
}
