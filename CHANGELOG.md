# Changelog

All notable changes to `@mnema-xyz/bot-sdk`. Versions follow
[semver](https://semver.org).

## Unreleased

- Added `lifetime_seconds` to `CreateMessageData` and `expires_at` to `Message`
  (timed messages), with a contract test for the answer, the event and a read.

## 3.3.0 (2026-11-15)

Tested with Mnema Talk 3.2.0 and newer.

- Added `default_member_permissions` to `CommandInput` and `Command` to restrict
  slash command visibility and execution by member permissions.
- Added `permissions` to `InteractionMember` carrying the invoking member's channel permissions.
- Added `Permissions` constants and `hasPermission` helper (standalone and on `Interaction`).
- Documented that Mnema's permission bits are distinct from Discord's bit values.

## 3.2.0 (2026-11-15)

Tested with Mnema Talk 3.1.1 and newer.

- Added `client.rest.downloadAttachment(id, options?)` to stream message attachments
  without following redirects, with `maxBytes`, `timeoutMs`, and `signal` options.
- Added typed `MaxBytesExceededError` and `NotFoundError`.
- Added optional `size`, `content_type`, and `filename` fields to `Attachment`.

## 3.1.3 (2026-11-13)

Tested with Mnema Talk 3.1.1 and newer.

- Relicensed from AGPL-3.0-only to MIT. 3.1.2 and earlier stay
  AGPL-3.0-only. The code is unchanged.

## 3.1.2 (2026-11-13)

Tested with Mnema Talk 3.1.1 and newer.

- The package page links to the renamed repository
  ([mnema-xyz/bot-sdk-js](https://github.com/mnema-xyz/bot-sdk-js)) and the
  developer docs on mnema.xyz.
- The first version published from CI with npm provenance (trusted
  publishing); 3.1.1 was published by hand.

## 3.1.1 (2026-11-13)

Tested with Mnema Talk 3.1.1 and newer.


The first version published to npm, as `@mnema-xyz/bot-sdk`. The code is the
SDK of Mnema Talk 3.1.1 (`sdk/typescript`, attached to its releases as
`mnema-talk-sdk-3.1.1.tgz`), now in its own repository with its history. The
API is unchanged; the package name and the imports change to
`@mnema-xyz/bot-sdk`. The User-Agent and the gateway's IDENTIFY properties
still say `mnema-talk-sdk`.
