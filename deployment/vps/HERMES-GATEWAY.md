# Hermes agent gateway

`hermes-gateway.service` runs the Hermes agent gateway on the VPS. Its unit, its
safety drop-ins and its resource caps live only in `/etc/systemd/system` and
`/etc/systemd/system.control`, so they are captured here: a rebuilt VPS would
otherwise come back without the sandbox boundary, without the emergency-stop
gate and with the unit's own unlimited restart loop.

The gateway's binary and state are outside this repository and are not captured
here: `/usr/local/lib/hermes-agent/.hermes/bin/hermes` and `/root/.hermes`.
`hermes-notify-bridge.service` and its `EnvironmentFile=/etc/hermes-notify-bridge.env`
are a separate unit and a secret; they are not part of this capture either.

## Files and where they install

| In this folder | On the VPS |
| --- | --- |
| `systemd/hermes-gateway.service` | `/etc/systemd/system/hermes-gateway.service` |
| `systemd/hermes-gateway.service.d/90-safety.conf` | `/etc/systemd/system/hermes-gateway.service.d/90-safety.conf` |
| `systemd/hermes-gateway.service.d/95-freeze.conf` | `/etc/systemd/system/hermes-gateway.service.d/95-freeze.conf` |
| `systemd/hermes-gateway.service.d/user-bus.conf` | `/etc/systemd/system/hermes-gateway.service.d/user-bus.conf` |
| `systemd/hermes-gateway.service.control.d/50-*.conf` | `/etc/systemd/system.control/hermes-gateway.service.d/50-*.conf` |

`.control.d` is not a systemd directory name. Those five files are the drop-ins
`systemctl set-property` writes into `/etc/systemd/system.control/`, and they
carry the resource caps: `MemoryHigh=3GiB`, `MemoryMax=5GiB`, `CPUQuota=100%`,
`CPUWeight=25`, `TasksMax=1024`. Copying only `/etc/systemd/system` loses them
without any error -- the unit starts and simply runs uncapped.

Prerequisites on the target host: the gateway install and `/root/.hermes` exist,
and `user@0.service` runs. The unit declares `After=user@0.service` and
`Wants=user@0.service`, and `user-bus.conf` points the process at
`/run/user/0/bus`.

Restore:

    install -D -m 0644 deployment/vps/systemd/hermes-gateway.service \
      /etc/systemd/system/hermes-gateway.service
    install -D -m 0644 deployment/vps/systemd/hermes-gateway.service.d/*.conf \
      -t /etc/systemd/system/hermes-gateway.service.d/
    install -D -m 0644 deployment/vps/systemd/hermes-gateway.service.control.d/*.conf \
      -t /etc/systemd/system.control/hermes-gateway.service.d/
    systemctl daemon-reload
    systemctl enable hermes-gateway

Do not start the gateway as part of the restore. Check the emergency stop first
(below): with the stop engaged a start is skipped, and `systemctl start` still
exits 0.

## Restart policy

The unit file is written for a supervised child: `Restart=always`, `RestartSec=5`,
`SuccessExitStatus=75`, `RestartForceExitStatus=75` (restart me) and
`RestartPreventExitStatus=78` (stop me), with `StartLimitIntervalSec=0` on the
unit itself, which disables systemd's rate limiter. That combination is an
unbounded five-second retry loop, and the 2026-10-21 memory incident is what it
cost.

`95-freeze.conf` overrides it with bounded recovery:

    Restart=on-failure
    RestartSec=30
    StartLimitIntervalSec=900
    StartLimitBurst=3

Three starts per fifteen minutes, thirty seconds apart, and then the unit stays
`failed` instead of looping. Exit 75 still forces a restart and exit 78 still
prevents one. A start refused by this limit is a failure, unlike a start skipped
by a condition:

    systemctl show hermes-gateway -p Restart -p RestartUSec \
      -p StartLimitIntervalUSec -p StartLimitBurst

### After an exhausted restart burst

    systemctl reset-failed hermes-gateway
    systemctl start hermes-gateway
    systemctl is-active hermes-gateway && systemctl show -p NRestarts hermes-gateway

Diagnose before resetting: three failures in fifteen minutes is a crash loop,
not a blip, and `journalctl -u hermes-gateway -n 100` should name the cause.

## Emergency stop

`95-freeze.conf` gates every start on the marker being absent:

    ConditionPathExists=!/root/.hermes/ESTOP

That covers boot, a manual start and every `on-failure` retry, and it lives in
`/etc` rather than `/run` so it survives a reboot. The marker keeps its
operator-only property from three other controls: `/root` is read-only for the
sandboxed process except four state paths, the marker itself is in
`90-safety.conf`'s `InaccessiblePaths`, and the process runs with an empty
`CapabilityBoundingSet`, so it cannot remove an immutable file. The
`apfel-deploy` wrapper refuses to run while the marker exists.

### Engage, or re-engage after a resume

    install -m 0600 /dev/stdin /root/.hermes/ESTOP <<'JSON'
    {"engaged_at": "2026-10-27T10:00:00+00:00", "reason": "why the gateway must stay stopped"}
    JSON
    chattr +i /root/.hermes/ESTOP
    systemctl stop hermes-gateway

Write the reason for the person who resumes it: it is the only record of why the
gateway was stopped. `chattr +i` is what makes the marker operator-only, and it
does not survive a re-engage -- removing the file drops the attribute, so a
later engage must set it again.

While the stop is engaged, a crash is deliberately not retried: the restart
attempt hits the condition and the unit goes inactive. That is the intent, not a
fault to fix by restarting.

A start against an engaged stop is reported as success and does nothing:

    systemctl start hermes-gateway     # exits 0, unit stays inactive
    systemctl is-active hermes-gateway # inactive
    systemctl show hermes-gateway -p ConditionResult

### Resume

    # 1. Keep the record before removing the marker.
    cp -a /root/.hermes/ESTOP /tmp/ESTOP.engaged-$(date -u +%Y%m%d).record.json
    sha256sum /tmp/ESTOP.engaged-*.record.json

    # 2. Clear the immutable attribute, then the marker.
    chattr -i /root/.hermes/ESTOP && rm /root/.hermes/ESTOP

    # 3. Only if the unit is failed (burst exhausted, or stopped while engaged).
    systemctl reset-failed hermes-gateway

    # 4. Start and verify.
    systemctl start hermes-gateway
    systemctl is-active hermes-gateway
    systemctl show hermes-gateway -p NRestarts -p ConditionResult

Resume only after the incident the stop was engaged for is closed. The
2026-10-21 stop was lifted on 2026-10-27, and only then because the restart loop
that caused it had been bounded by `95-freeze.conf`; its record is preserved
outside this repository. Copy the record into the incident notes, and leave
`NRestarts=0` as the healthy baseline for a fresh start.

## Sandbox boundary

`90-safety.conf` is the gateway's containment: `ProtectSystem=strict` with four
writable state paths under `/root`, `/srv/apfel-park` read-only, and
`InaccessiblePaths` over the control sockets and binaries (`systemctl`,
`docker`, `nsenter`, node and the bundled runtimes), the build runner and build
state, the human-only deploy and alert helpers, the deploy tooling checkout, the
production secret files and the root SSH material. It applies on the next
authorized start; editing it does not disturb a running process. Do not remove
it without a reviewed replacement.

## Verification

The capture is faithful when the installed files and these copies are identical:

    sha256sum deployment/vps/systemd/hermes-gateway.service \
      deployment/vps/systemd/hermes-gateway.service.d/*.conf \
      deployment/vps/systemd/hermes-gateway.service.control.d/*.conf
    sha256sum /etc/systemd/system/hermes-gateway.service \
      /etc/systemd/system/hermes-gateway.service.d/*.conf \
      /etc/systemd/system.control/hermes-gateway.service.d/*.conf

`systemctl cat hermes-gateway` prints the fragments systemd loaded in order: the
unit, the five `system.control` caps, then the three `/etc` drop-ins. Nine
fragments is the complete set, and a fragment missing after a restore is exactly
what this check is for. `systemd-analyze verify` on the unit in this folder
checks the syntax of the captured set before it is installed.
