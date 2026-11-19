// Slash commands and interaction responses (doc/bots.md, "Slash commands").
import type { OptionTypeValue } from '../constants.ts'
import type { MessageComponents, ModalData } from './components.ts'
import type { AllowedMentions, Embed } from './messages.ts'

export interface CommandOption {
  name: string
  description: string
  /** 3 string, 4 integer, 5 boolean, 6 user, 7 channel. */
  type: OptionTypeValue
  required?: boolean
  /** Allowed values of a string option: at most 25, each 1 to 100 characters. */
  choices?: string[]
}

export type PermissionKey =
  | 'administrator'
  | 'view_channel'
  | 'send_messages'
  | 'attach_files'
  | 'add_reactions'
  | 'manage_messages'
  | 'mention_everyone'
  | 'connect'
  | 'speak'
  | 'video'
  | 'disconnect_members'
  | 'manage_channels'
  | 'manage_roles'
  | 'create_invites'
  | 'manage_webhooks'
  | 'manage_members'
  | 'manage_bots'
  | 'view_audit_log'
  | 'timeout_members'
  | 'ban_members'
  | 'manage_emoji'
  | 'manage_reports'
  | 'send_direct_messages'
  | 'kick_members'
  | 'manage_stage'
  | 'manage_events'
  | 'bypass_new_member_limits'
  | 'edit_wiki'
  | 'manage_wiki'
  | 'view_wiki'
  | 'create_member_invites'

export type DefaultMemberPermissionsInput =
  | string
  | bigint
  | number
  | PermissionKey[]
  | string[]
  | null

/** What a bot registers (PUT and POST /commands). */
export interface CommandInput {
  name: string
  description: string
  options?: CommandOption[]
  /**
   * Permissions a member needs in the channel to see and run the command.
   * A decimal bitfield string (e.g. "6", "1"), a bigint/number, or an array
   * of permission keys (e.g. ["ban_members"]).
   * `null` or omitted: available to everyone who can use commands in the channel.
   * `"0"` or `[]`: available to nobody except Administrator/Owner.
   *
   * Mnema's permission bits have their own values: use `Permissions` from
   * this SDK or permission keys, never bit constants from other chat libraries.
   */
  default_member_permissions?: DefaultMemberPermissionsInput
}

/** A registered command (GET /commands). */
export interface Command {
  id: string
  bot_id: string
  name: string
  description: string
  options: CommandOption[]
  disabled: boolean
  created_at: string
  /**
   * The command's required member permissions as a decimal bitfield string,
   * e.g. "6", or `null` when available to everyone.
   */
  default_member_permissions?: string | null
}

/** The `data` of callback 4 and the body of a follow-up: a message to post. */
export interface InteractionResponseData {
  content?: string
  embeds?: Embed[]
  components?: MessageComponents
  /** Narrows whom the message notifies, as on a post. */
  allowed_mentions?: AllowedMentions
  /** 64: ephemeral. */
  flags?: number
}

/**
 * The `data` of callback 7 and the body of an @original edit: absent fields
 * stay. No flags: the first response decides whether an answer is ephemeral,
 * and the server refuses flags here.
 */
export interface InteractionEditData {
  content?: string
  embeds?: Embed[]
  components?: MessageComponents
  /** Narrows whom the new text notifies, as on a post. */
  allowed_mentions?: AllowedMentions
}

export type InteractionCallback =
  | { type: 4; data: InteractionResponseData }
  | { type: 5; data?: { flags?: number } }
  | { type: 6 }
  | { type: 7; data: InteractionEditData }
  | { type: 9; data: ModalData }
