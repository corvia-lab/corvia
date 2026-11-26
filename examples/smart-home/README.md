# Example: smart home

> **Status:** Draft, Iteration 1 example model. All data is invented.

An invented private setup with two locations, built to test the generic meta-model (see the [design](https://github.com/corvia-lab/corvia/blob/c445a5fa9c89ff2a2179209fdbec637d63327a36/openspec/changes/stage-1-metamodel-exploration/design.md)).

## Setup

- **Main house:** Home Assistant instance 1 runs as a VM on a virtualization host, next to an MQTT broker. Zigbee, Matter over Thread, 433 MHz (via a receiver and the broker) and Wi-Fi devices report to it. It uses a weather service and a vendor cloud, and is reachable from outside through remote access.
- **Second site:** the devices are there, but Home Assistant instance 2 runs on a mini PC at the main house. Bluetooth devices report through an ESP32, 433 MHz devices through a Raspberry Pi, both over a site-to-site VPN.
- The two instances are independent.

Each **logical connection** (device → instance, with protocol and scope) can have a **technical path** (`realized_by`, an ordered list of gateways, brokers, tunnels and hosts).

The file has 33 things and 61 relationships. Relationships are items too, so the file lists 94 items.

## Messy cases

| # | Case | Where |
|---|---|---|
| 1 | Device without a device class | `dev-unknown`, `dev-lr-plug-router` |
| 2 | Same device in two sources with the same name | `dev-lr-plug` (Home Assistant) and `dev-lr-plug-router` (router) |
| 3 | Device that moved | `dev-garage-climate`: located at the main house, but connected to instance 2, which serves the second site |
| 4 | Bound attribute next to an unbound one | `dev-lr-climate`: `name` from Home Assistant, `purchase_date` only in corvia |
| 5 | Technical path only as text | `conn-remote` (`path_note`, no `realized_by`) |
| 6 | Unreachable device | `dev-bath-climate` (`battery: empty`) |
| 7 | Instance hosted at one location, serving another | `ha-2` runs on `host-minipc` at the main house and serves the second site |
| 8 | Conflicting changes | `dev-kitchen-light`: renamed in corvia and in the source; the source wins |

`dev-door` has a pending change from the source without a conflict.
