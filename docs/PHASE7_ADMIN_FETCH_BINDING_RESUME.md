# Phase 7 — Admin Snippet fixed and continuation prepared

Review 17 October 2026. User GET-only report at 10:49:19 UTC confirms signed-out Chrome receives /account HTML: HTTP 200, same-origin, no redirect, private/no-store/nosniff, 8.871 bytes, login gate and no rendered identity. This is new anonymous observation, not proof that the previous Admin request succeeded or an explanation of its stop.

## Bug found in private helper

Earlier successful Staff Snippet passed fetch bound to window. Admin finish v1 builder passed an unbound function, which the helper then calls as ctx.fetch(). New Admin finish v2 again uses window.fetch.bind(window). The rule about the correct receiver is described in the [Web IDL specification](https://webidl.spec.whatwg.org/#es-operations).

Strict synthetic host-contract test runs the actual generated Snippet: old footer ends with Illegal invocation, one recorded attempt and zero calls to the underlying mock request; new footer passes. This corrects earlier counter interpretation: original requests=1/getRequests=1 counts the attempt before the fetch call, so it does not prove the HTTP request was actually sent. Original raw error was not preserved; link between found regression and that specific stop remains inference, not confirmed wire evidence. Original FAIL remains preserved.

Browser tool blocked synthetic data: trial page. Trial tab was closed, ban was not bypassed and real browser binding test was not run. Synthetic test is not presented as native browser PASS. User Chrome, login, cookie and credential values were not used.

## What completed without user inputs

New package has 35 local PASS and 27 real SQL PASS in isolated container without network. Included are three mandatory shutdown cases after partial progress. Separate temporary client, certificate and ownership were verified locally; both new owned containers were removed and their absence independently confirmed. Earlier six real local Next Admin POST controls are reused as existing evidence, without repeating that model.

SQL model uses real previous full 124-row archive and exact recorded business deltas to state126, with explicitly historical Auth material. This is not a new full copy of the current database. New real hosted continuation and full126/nine-file copy are not yet executed.

Last actually verified state remains126 rows, 29 protected original subsets and nine identical files, total10.488.465 bytes. Both existing decision proposals are pending on revision3/1. Preserved Staff recommendation, its author/time and seven existing scoped audits remain protected. All seven trial accounts are retired/banned, without rights, sessions or refresh rows. Owner and existing trial passwords remain preserved.

## New continuation

Next procedure is only resume-reviewed-admin-decisions.ps1, with NEW securedesk-proposal-admin-finish-v2.js. Old Admin v1 and earlier decision procedures are not next commands. First line of new Snippet is // SecureDesk proposal Admin finish v2.

Procedure first asks for two hidden existing inputs: DATABASE password and backend sb_secret key. Before any activation it verifies exact retired126 state, creates new full DB/nine-files copy and restores it in isolation. Then activates only known trial Admin; Staff, preserved recommendation and both existing trial passwords are unchanged. Reuses same two decision proposals. Full expected end is132 rows: one trial project and five new marked audits alongside initial126.

One Admin login and two reports from same new Snippet are required: decisions/replay/final-state controls, then separate signed-out check. Procedure mandatorily shuts down Admin rights and tokens, independently compares final SQL/29 subsets and re-reads all nine Storage hashes. Owner password or new trial password choice is not required.

New report saves only limited whitelist diagnostics of last read and fixed error category; does not save raw body, raw exception, cookie or credentials. Until no business POST is attempted, at most three manual login/read fixes per phase in same terminal are allowed, with same original deadline. Sign out remains sign out. After any failure involving business POST, retirement and review follow; such attempt is not automatically repeated.

## User steps

1. While signed out, user replaces entire large Chrome Snippet editor content with new v2 file. Do not run it yet.
2. With Docker running, start new PowerShell procedure and enter two existing values only in hidden prompts. Stay signed out until READY — CHECK 1/2.
3. Sign in as securedesk-g7-0f8ac9e3e94173d6-admin_a@securedesk.example.invalid with last remembered trial password. Manually open /account and verify Active. Run new Snippet and paste entire SECUREDESK_PROPOSAL_DECISIONS_RESULT line into same PowerShell via Ctrl+V, then Enter.
4. On CHECK 2/2 click Sign out, manually reopen /account and verify Welcome back. Run same Snippet signed out and paste entire new result into same terminal. Send to conversation only final PASS or error message, without private values.

Private evidence is in ignored .tools/verification/phase7: account-response-user-observed-2026-10-17.json, native-admin-fetch-binding-review-2026-10-17.json and proposal-admin-resume-handoff-2026-10-17.json. Handoff has exact hashes of isolated/client evidence and final Snippet. Application, deployment, approved specification and schedule were not changed; no push. Existing user maintenance note was not changed. Gate7 remains open.
