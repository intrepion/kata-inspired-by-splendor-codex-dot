# Four-player default with preserved saved tables

Accepted 2026-10-22 following the user's requested revision.

New tables default to one human and three named Automata. Optional smaller tables use the publisher's player-count supplies. Treat the chosen first player as a seat in a circular order. End a triggered final round only when the next seat is the first player; score all seats together and allow any number of shared winners.

Keep the original localStorage key to discover existing saves, and upgrade version-one two-player matches to version two without changing their seats, stocks, private cards, phase or turn. Inserting two players mid-match would alter earned positions and break resource conservation. Show a resume notice; the next new table defaults to four. Reject unsupported or structurally invalid saves and offer fresh onboarding.

Each AI callback captures both the generation and its seat, then consumes only that seat's sanitized observation. Restart cancels the callback; reload resumes the currently saved seat, including required returns or a patron choice. This replaces the original two-seat scheduling assumptions without adding a second rules path.
