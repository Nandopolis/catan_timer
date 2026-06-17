# Catan Timer — Domain Glossary

## Core Concepts

**Turn Timer**: A countdown that runs during one player's turn. When it expires, a soft warning is issued. The countdown then resets for the next player's turn.

**Soft Warning**: An alarm and visual indication that a player's time has expired, without forcibly ending their turn. Social pressure, not rule enforcement.

**Overtime**: The period after a turn timer expires, displayed as a count-up in red (e.g., "+0:45") showing how long the player has exceeded their allotted time.

**Round**: One complete cycle through all players. The round counter increments when play returns to the first player.

**Game Phase**: The current state of the game lifecycle: setup, countdown, overtime, paused, or game_over.

**Turn Log**: A record of every completed turn, storing player, round, duration, overtime, and pause data for stats calculation.
