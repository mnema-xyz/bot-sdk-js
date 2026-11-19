// Numbers of the wire protocol (doc/bots.md).

/** Gateway intents: bits of IDENTIFY's `intents`. */
export const Intents = {
  /** CHANNELS_UPDATE */
  Guilds: 1,
  /** GUILD_MEMBER_ADD */
  GuildMembers: 2,
  /** MESSAGE_CREATE, MESSAGE_UPDATE, MESSAGE_DELETE */
  GuildMessages: 512,
  /** MESSAGE_REACTIONS_UPDATE */
  GuildMessageReactions: 1024,
} as const
export type IntentBit = (typeof Intents)[keyof typeof Intents]

/** Intent names as a manifest lists them. */
export type IntentName = 'GUILDS' | 'GUILD_MEMBERS' | 'GUILD_MESSAGES' | 'GUILD_MESSAGE_REACTIONS'

/** Slash command option types. */
export const OptionType = {
  String: 3,
  Integer: 4,
  Boolean: 5,
  User: 6,
  Channel: 7,
} as const
export type OptionTypeValue = (typeof OptionType)[keyof typeof OptionType]

export const ComponentType = {
  ActionRow: 1,
  Button: 2,
  StringSelect: 3,
  TextInput: 4,
  UserSelect: 5,
  RoleSelect: 6,
  ChannelSelect: 8,
} as const
export type ComponentTypeValue = (typeof ComponentType)[keyof typeof ComponentType]

export const ButtonStyle = {
  Primary: 1,
  Secondary: 2,
  Success: 3,
  Danger: 4,
  /** Carries a `url` instead of a `custom_id`. */
  Link: 5,
} as const
export type ButtonStyleValue = (typeof ButtonStyle)[keyof typeof ButtonStyle]

export const TextInputStyle = {
  Short: 1,
  Paragraph: 2,
} as const
export type TextInputStyleValue = (typeof TextInputStyle)[keyof typeof TextInputStyle]

export const InteractionType = {
  /** A slash command ran. */
  ApplicationCommand: 2,
  /** A button or select was used. */
  MessageComponent: 3,
  /** A modal was submitted. */
  ModalSubmit: 5,
} as const
export type InteractionTypeValue = (typeof InteractionType)[keyof typeof InteractionType]

export const CallbackType = {
  /** Post a message. */
  ChannelMessageWithSource: 4,
  /** Acknowledge; the message follows through @original or follow-ups. */
  DeferredChannelMessageWithSource: 5,
  /** Acknowledge a click without changing anything yet. */
  DeferredUpdateMessage: 6,
  /** Update the message the component is on. */
  UpdateMessage: 7,
  /** Open a modal. */
  Modal: 9,
} as const
export type CallbackTypeValue = (typeof CallbackType)[keyof typeof CallbackType]

/** Message flags. */
export const MessageFlags = {
  /** Only the member who triggered the interaction sees the response. */
  Ephemeral: 64,
} as const

/** Activity types of a presence update (streaming is not offered). */
export const ActivityType = {
  Playing: 0,
  Listening: 2,
  Watching: 3,
  Custom: 4,
  Competing: 5,
} as const
export type ActivityTypeValue = (typeof ActivityType)[keyof typeof ActivityType]

/** Gateway opcodes. */
export const GatewayOp = {
  Dispatch: 0,
  Heartbeat: 1,
  Identify: 2,
  PresenceUpdate: 3,
  Resume: 6,
  Reconnect: 7,
  InvalidSession: 9,
  Hello: 10,
  HeartbeatAck: 11,
} as const

/** Close codes the bot gateway uses. */
export const GatewayCloseCode = {
  SessionTakenOver: 4000,
  UnknownOpcode: 4001,
  DecodeError: 4002,
  NotAuthenticated: 4003,
  AuthenticationFailed: 4004,
  AlreadyAuthenticated: 4005,
  InvalidSeq: 4007,
  RateLimited: 4008,
  SessionTimedOut: 4009,
  InvalidIntents: 4013,
  DisallowedIntents: 4014,
} as const

/** The REST API's base path. */
export const API_BASE_PATH = '/api/bot/v1'

/**
 * Mnema Talk's permission bits.
 *
 * Mnema's permission bits have their own values: bit constants from other
 * chat libraries do not match them. Use these, compute bits from Mnema's
 * catalogue or pass an array of permission keys.
 */
export const Permissions = {
  Administrator: 1n,
  ViewChannel: 2n,
  SendMessages: 4n,
  AttachFiles: 8n,
  AddReactions: 16n,
  ManageMessages: 32n,
  MentionEveryone: 64n,
  Connect: 128n,
  Speak: 256n,
  Video: 512n,
  DisconnectMembers: 1024n,
  ManageChannels: 2048n,
  ManageRoles: 4096n,
  CreateInvites: 8192n,
  ManageWebhooks: 16384n,
  ManageMembers: 32768n,
  ManageBots: 65536n,
  ViewAuditLog: 131072n,
  TimeoutMembers: 262144n,
  BanMembers: 524288n,
  ManageEmoji: 1048576n,
  ManageReports: 2097152n,
  SendDirectMessages: 4194304n,
  KickMembers: 8388608n,
  ManageStage: 16777216n,
  ManageEvents: 33554432n,
  BypassNewMemberLimits: 67108864n,
  EditWiki: 134217728n,
  ManageWiki: 268435456n,
  ViewWiki: 536870912n,
  CreateMemberInvites: 1073741824n,
} as const
export type PermissionBit = (typeof Permissions)[keyof typeof Permissions]

/**
 * Checks whether a member permissions bitfield (decimal string, bigint or number)
 * includes a permission. Returns true if the member has the specific permission or
 * Administrator (which grants all permissions).
 */
export function hasPermission(
  permissions: string | bigint | number | undefined | null,
  permission: bigint | number,
): boolean {
  if (permissions === undefined || permissions === null || permissions === '') return false
  try {
    const bits = typeof permissions === 'bigint' ? permissions : BigInt(permissions)
    const target = BigInt(permission)
    return (bits & Permissions.Administrator) === Permissions.Administrator || (bits & target) === target
  } catch {
    return false
  }
}

