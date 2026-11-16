#!/usr/bin/env python3
"""Draws the big Floor 2 building templates on a grid and prints them as JS template rows.
Legend matches stamp() in v2_level.js."""
import json, sys

class G:
    def __init__(s, w, h, fill=' '):
        s.w, s.h = w, h; s.g = [[fill] * w for _ in range(h)]
    def put(s, c, r, ch):
        if 0 <= c < s.w and 0 <= r < s.h: s.g[r][c] = ch
    def get(s, c, r): return s.g[r][c]
    def box(s, c0, r0, c1, r1, floor='.'):
        for r in range(r0, r1 + 1):
            for c in range(c0, c1 + 1):
                edge = r in (r0, r1) or c in (c0, c1)
                if edge: s.g[r][c] = '#'
                elif s.g[r][c] == ' ': s.g[r][c] = floor
    def hwall(s, r, c0, c1):
        for c in range(c0, c1 + 1): s.g[r][c] = '#'
    def vwall(s, c, r0, r1):
        for r in range(r0, r1 + 1): s.g[r][c] = '#'
    def fill(s, c0, r0, c1, r1, ch):
        for r in range(r0, r1 + 1):
            for c in range(c0, c1 + 1): s.g[r][c] = ch
    def text(s, c, r, t):
        for i, ch in enumerate(t): s.put(c + i, r, ch)
    def windows(s, every=5, rows=None, cols=None):
        # windows along the outer walls, skipping corners and anything that is not plain wall
        for c in range(2, s.w - 2, every):
            for r in (rows or [0, s.h - 1]):
                if s.g[r][c] == '#' and s._straight(c, r): s.g[r][c] = 'W'
        for r in range(2, s.h - 2, every):
            for c in (cols or [0, s.w - 1]):
                if s.g[r][c] == '#' and s._straight(c, r): s.g[r][c] = 'W'
    def _straight(s, c, r):
        h = c > 0 and c < s.w - 1 and s.g[r][c - 1] in '#W' and s.g[r][c + 1] in '#W'
        v = r > 0 and r < s.h - 1 and s.g[r - 1][c] in '#W' and s.g[r + 1][c] in '#W'
        # a window needs walls on exactly one axis and open floor on the other
        return h != v
    def rows(s): return [''.join(r) for r in s.g]

out = {}

# ---------------- Blackwood Manor: ground floor (front at the bottom) ----------------
m = G(56, 30)
m.box(0, 0, 55, 27)
m.hwall(13, 0, 55)
m.vwall(21, 13, 27); m.vwall(34, 13, 27)
m.vwall(13, 0, 13); m.vwall(42, 0, 13); m.hwall(6, 42, 55)
m.windows(5, rows=[0, 27])
m.text(26, 27, 'DDDD')
for c, r in [(21, 20), (34, 20), (6, 13), (48, 13), (48, 6), (13, 8), (42, 9)]: m.put(c, r, 'D')
m.put(27, 13, 'D'); m.put(28, 13, 'D')
m.put(42, 3, '?')                                   # secret door: ballroom to study
# porch
m.fill(20, 28, 35, 29, '='); m.put(20, 28, 'r'); m.put(35, 28, 'r'); m.put(20, 29, 'r'); m.put(35, 29, 'r')
# library (front left)
for c in range(1, 21):
    if c not in (5, 6, 7): m.put(c, 14, 't')
for r in range(15, 27, 1):
    if r != 20: m.put(1, r, 't')
for c in (5, 10, 15): m.put(c, 19, 'd')
m.put(4, 24, 'u'); m.put(8, 24, 'l'); m.put(16, 24, 'u'); m.put(20, 16, 'L'); m.put(20, 24, 'L'); m.put(12, 26, '^')
# foyer: grand staircase, chandelier, benches
m.fill(26, 14, 29, 16, 'k'); m.put(24, 20, '+'); m.put(31, 20, '+'); m.put(22, 15, 'p'); m.put(33, 15, 'p'); m.put(22, 25, 'n'); m.put(33, 25, 'n')
m.put(22, 18, 'L'); m.put(33, 18, 'L')
# dining hall: one long table
for c in range(38, 52): m.put(c, 20, 'm')
m.put(44, 17, '+'); m.put(44, 23, '+'); m.put(54, 20, '^'); m.put(36, 15, 'C'); m.put(53, 15, 'C'); m.put(36, 26, 'C'); m.put(53, 26, 'C'); m.put(54, 16, 'L'); m.put(54, 24, 'L')
# kitchen (back left)
m.text(1, 1, 'zZOizcz'); m.put(6, 6, 'm'); m.put(1, 11, 'R'); m.put(2, 11, 'R'); m.put(11, 11, '%'); m.put(12, 1, 'h'); m.put(12, 11, 'J')
# ballroom (back middle): the boss room
for c in (18, 25, 31, 38):
    m.put(c, 4, '|'); m.put(c, 10, '|')
m.put(22, 7, '+'); m.put(34, 7, '+'); m.put(15, 2, 'P'); m.put(28, 2, 'p'); m.put(40, 2, 'p'); m.put(14, 7, 'L'); m.put(41, 7, 'L')
# study (back right, behind the secret door) and the portrait gallery
m.text(43, 1, 'ttt'); m.put(54, 3, '^'); m.put(48, 3, 'd'); m.put(52, 5, 'u'); m.put(43, 5, 'V')
for c in (44, 47, 50, 53): m.put(c, 7, '"')
for c in (44, 47, 50, 53): m.put(c, 12, '"')
m.put(46, 10, 'n'); m.put(51, 10, 'n'); m.put(43, 9, 'L')
out['manor'] = m.rows()

# ---------------- Blackwood Manor: upstairs ----------------
u = G(56, 17)
u.box(0, 0, 55, 16)
u.hwall(6, 0, 55); u.hwall(10, 0, 55)
for c in (11, 22, 33, 44): u.vwall(c, 0, 6); u.vwall(c, 10, 16)
u.windows(5, rows=[0, 16])
for c in (5, 16, 38, 49): u.put(c, 6, 'D'); u.put(c, 10, 'D')
u.put(27, 6, 'D'); u.put(24, 10, 'D')
u.fill(26, 7, 29, 8, 'k')
u.put(2, 7, 'L'); u.put(53, 7, 'L'); u.put(12, 8, '"'); u.put(43, 8, '"'); u.put(20, 7, '+'); u.put(36, 7, '+')
# bedrooms on the top row, more below
def bedroom(c0, r0, c1, r1, double=True, nursery=False):
    u.put(c0, r0, 'E' if double else 'e'); u.put(c0 + 2, r0, 'N'); u.put(c1, r0, 'C')
    if nursery:
        u.put(c0 + 3, r1, 'x'); u.put(c1 - 1, r1, 'x'); u.put(c0, r1, 'e')
    else:
        u.put(c1, r1, ';'); u.put(c0, r1, 'l')
bedroom(1, 1, 10, 5); bedroom(12, 1, 21, 5, nursery=True); u.put(23, 1, 't'); u.put(24, 1, 't'); u.put(28, 3, 'd'); u.put(32, 5, 'u')
bedroom(34, 1, 43, 5); u.text(45, 1, 'XXQi'); u.put(54, 5, 'C')
bedroom(1, 11, 10, 15, double=False); bedroom(12, 11, 21, 15); u.put(23, 11, 'x'); u.put(26, 11, 'x'); u.put(24, 15, '%'); u.put(31, 13, 'o'); u.put(28, 15, 'x')
bedroom(34, 11, 43, 15, double=False); bedroom(45, 11, 54, 15)
out['manorUp'] = u.rows()

# ---------------- Starship Valiant: a ship-shaped hull, nose (the bridge) at the top, the main hatch at the bottom ----------------
s = G(66, 38)
def hull(c, r):
    if r > 36: return False
    hw = min(33.0, 12 + r * 2.7)
    return abs(c + 0.5 - 33) <= hw
for r in range(38):
    for c in range(66):
        if hull(c, r): s.g[r][c] = '.'
for r in range(38):
    for c in range(66):
        if s.g[r][c] == '.' and any(not (0 <= c + dc < 66 and 0 <= r + dr < 38) or s.g[r + dr][c + dc] == ' ' for dc in (-1, 0, 1) for dr in (-1, 0, 1)): s.g[r][c] = '#'
def hw_(r, c0, c1):
    for c in range(c0, c1 + 1):
        if s.g[r][c] != ' ': s.g[r][c] = '#'
def vw_(c, r0, r1):
    for r in range(r0, r1 + 1):
        if s.g[r][c] != ' ': s.g[r][c] = '#'
# decks: the bridge in the nose, the upper deck, the cross corridor, the mid deck, the lower deck
hw_(9, 0, 65); hw_(17, 0, 65); hw_(20, 0, 65); hw_(28, 0, 65)
vw_(19, 0, 9); vw_(46, 0, 9)                                  # bridge | briefing room, armory wedges
vw_(30, 9, 17); vw_(35, 9, 17); vw_(30, 20, 36); vw_(35, 20, 36)  # the spine
vw_(15, 9, 17); vw_(50, 9, 17); vw_(18, 20, 28); vw_(5, 28, 36)
vw_(62, 9, 28)                                                 # the Jeffries tube runs inside the starboard hull
s.fill(31, 10, 34, 35, '.'); s.fill(1, 18, 61, 19, '.'); s.fill(63, 10, 64, 27, '.')
for r in (17, 20):
    for c in (30, 35): s.put(c, r, '#')
# sliding doors
for c in range(31, 35): s.put(c, 9, 'D'); s.put(c, 36, 'D')
for c, r in [(8, 17), (22, 17), (42, 17), (57, 17), (30, 13), (35, 13), (9, 20), (25, 20), (48, 20), (35, 24), (30, 32), (35, 32), (5, 32), (12, 28), (16, 9), (46, 6), (19, 6)]: s.put(c, r, 'D')
s.put(0, 31, 'D'); s.put(0, 32, 'D')                           # the airlock's outer door, onto the hangar
s.put(63, 9, 'D'); s.put(63, 28, 'D')                          # Jeffries tube: armory to engine room
s.windows(6, rows=[], cols=[])
# bridge: viewscreens in the nose, consoles, the captain's chair
for c in (27, 30, 35, 38): s.put(c, 1, 'y')
for c in (24, 27, 38, 41): s.put(c, 4, 'I')
s.put(32, 6, '_'); s.put(29, 7, 'I'); s.put(36, 7, 'I'); s.put(21, 7, 'L'); s.put(44, 7, 'L')
# briefing room (port wedge), armory (starboard wedge)
for c in range(9, 16): s.put(c, 7, 'm')
s.put(18, 4, 'y')
for c in (50, 53, 56): s.put(c, 7, 'M')
s.put(60, 8, 'V'); s.put(48, 5, 'x'); s.put(49, 5, 'x')
s.put(63, 8, '.')
# upper deck: captain's quarters, the holodeck, science lab, transporter room
s.put(1, 10, 'E'); s.put(3, 10, 'N'); s.put(10, 12, 'd'); s.put(14, 16, 'u'); s.put(1, 16, ';'); s.put(14, 10, 'C')
for c in (39, 43, 47): s.put(c, 10, 'J')
s.text(37, 16, 'ttt'); s.put(49, 13, 'f'); s.put(42, 13, 'q')
s.text(53, 12, '0.0.0'); s.text(53, 14, '0.0.0'); s.put(57, 16, 'I'); s.put(60, 16, 'I')
# mid deck: mess hall and kitchen, med bay, crew quarters
s.text(1, 21, 'zZOicz'); s.put(4, 24, 'm'); s.put(9, 24, 'm'); s.put(14, 24, 'm'); s.put(17, 27, 'v')
s.text(20, 21, 'e.e.e.e'); s.put(29, 24, 'C'); s.put(29, 27, 'i'); s.put(20, 27, 'C')
for c in range(37, 61, 3): s.put(c, 21, 'b'); s.put(c, 27, 'b')
s.put(61, 24, 'f')
# lower deck: the airlock, the cargo hold, the engine room
for c, r in [(7, 30), (8, 30), (7, 31), (13, 30), (14, 30), (20, 34), (21, 34), (26, 30), (27, 33), (28, 33)]: s.put(c, r, 'x')
for c, r in [(10, 34), (17, 30), (24, 34)]: s.put(c, r, '%')
s.put(29, 30, 'R')
for c in (38, 44, 54, 60): s.put(c, 30, 'I')
s.put(62, 34, 'h'); s.put(37, 34, 'h'); s.put(62, 31, 'h')
out['ship'] = s.rows()

# ---------------- The Writers' Building, ground floor (front at the bottom, onto the picket line) ----------------
w = G(62, 38)
w.box(0, 0, 61, 37)
w.hwall(25, 0, 61); w.hwall(27, 0, 61); w.fill(1, 26, 60, 26, '.')
w.vwall(43, 0, 25); w.hwall(12, 43, 61)
w.vwall(21, 27, 37); w.vwall(40, 27, 37)
w.windows(4, rows=[0, 37], cols=[0, 61])
for c in (10, 30): w.put(c, 25, 'D')
w.put(43, 6, 'D'); w.put(43, 18, 'D'); w.put(52, 25, 'D')
w.put(10, 27, 'D'); w.put(30, 27, 'D'); w.put(31, 27, 'D'); w.put(50, 27, 'D')
w.put(0, 26, 'D'); w.put(61, 26, 'D'); w.text(29, 37, 'DDDD')
# the bullpen: one big open office, desks in pods of four, the strike's whiteboard
for r0 in (3, 9, 15, 21):
    for c0 in range(3, 40, 7):
        if r0 == 21 and c0 > 30: continue
        for dc, dr in [(0, 0), (1, 0), (0, 1), (1, 1)]: w.put(c0 + dc, r0 + dr, 'q')
w.put(1, 1, 'f'); w.put(2, 1, 'f'); w.put(42, 1, 'p'); w.put(42, 24, 'v'); w.put(1, 24, 'p'); w.put(20, 1, 'y')
# mailroom, the archive of rejected scripts
w.text(45, 1, 'fff'); w.text(55, 1, 'fff'); w.put(48, 6, 'q'); w.put(53, 6, 'q'); w.put(60, 11, 'x'); w.put(59, 11, 'x'); w.put(44, 11, '%')
for c in range(45, 61, 2): w.put(c, 13, 't')
for c in (46, 50, 54, 58):
    for r in (16, 17, 19, 20, 22): w.put(c, r, 't')
w.put(60, 24, 'f'); w.put(44, 24, 'f')
# strike headquarters, the lobby with the elevator, the copy room
for c in range(4, 19, 5): w.put(c, 31, 'm')
w.put(1, 28, 'x'); w.put(2, 28, 'x'); w.put(1, 36, 'x'); w.put(20, 36, ';'); w.put(20, 28, 'y')
w.text(26, 33, 'KKKKK'); w.put(22, 35, 'u'); w.put(39, 35, 'u'); w.put(22, 28, 'p'); w.put(39, 28, 'p'); w.fill(36, 28, 37, 29, 'k')
w.put(42, 28, 'v'); w.put(44, 28, 'v'); w.put(46, 32, 'q'); w.put(53, 32, 'q'); w.text(56, 36, 'xx%'); w.text(41, 36, 'ff')
out['writers'] = w.rows()

# ---------------- The Writers' Building, second floor: the Writers' Room, the coffee room, the head writer's office ----------------
u = G(46, 22)
u.box(0, 0, 45, 21)
u.hwall(14, 0, 45); u.hwall(16, 0, 45); u.fill(1, 15, 44, 15, '.')
u.vwall(30, 0, 14); u.vwall(22, 16, 21)
u.windows(4, rows=[0], cols=[0, 45])
u.put(14, 14, 'D'); u.put(38, 14, 'D'); u.put(10, 16, 'D'); u.put(33, 16, 'D')
# the writers' room: one long table, whiteboards along the back wall (placed in code)
for c in range(8, 22): u.put(c, 6, 'm'); u.put(c, 7, 'm')
u.put(1, 1, 'f'); u.put(29, 1, 'f'); u.put(1, 13, 'p'); u.put(29, 13, 'v')
# the coffee room
u.text(31, 1, 'zZOiccz'); u.put(35, 7, 'm'); u.put(40, 7, 'm'); u.put(44, 12, 'u'); u.put(31, 13, 'v')
# the head writer's office, and the stairs: the elevator down at the west end, the roof stairs at the east end
u.put(2, 19, 'd'); u.put(1, 17, 'f'); u.put(8, 20, 'V'); u.put(17, 20, 'u'); u.put(20, 17, 'p')
u.fill(23, 17, 24, 18, 'k'); u.fill(43, 17, 44, 18, 'k')
out['writersUp'] = u.rows()

# ---------------- The roof: Dermot Stoker's Penthouse Green ----------------
r = G(40, 24)
r.box(0, 0, 39, 23)
r.box(0, 14, 12, 23)        # the clubhouse
r.box(31, 18, 38, 22)       # the stair hut
r.put(12, 18, 'D'); r.put(31, 20, 'D')
r.fill(33, 19, 34, 20, 'k')
r.text(2, 16, 'zZic'); r.put(6, 19, 'm'); r.put(10, 21, 'u'); r.put(2, 21, 'X'); r.put(11, 16, 'C')
r.put(36, 21, 'L')
r.put(25, 6, '}'); r.put(8, 4, '{'); r.put(37, 2, 'H'); r.put(37, 3, 'p'); r.put(2, 2, 'p')
out['roof'] = r.rows()

# ---------------- Soundstage 9 (front at the bottom: the big doors) ----------------
q = G(62, 40)
q.box(0, 0, 61, 39)
q.box(1, 1, 14, 9)      # control booth
q.box(47, 1, 60, 11)    # freight elevator
q.put(14, 6, 'D'); q.put(47, 8, 'D')
q.put(54, 6, '$')
q.text(2, 2, 'yyIIIy'); q.put(5, 6, 'q'); q.put(9, 6, 'q'); q.put(12, 8, 'f')
# the western half: false-front flats down the left side
for c in range(3, 26):
    if c % 7 != 0: q.put(c, 16, ']')
for c in range(3, 26, 6): q.put(c, 17, 'H')
for r in (22, 28): q.put(10, r, 'o'); q.put(18, r + 1, 'R')
q.put(6, 31, 'x'); q.put(7, 31, '%')
# the starship half: foam panels down the right side
for c in range(36, 59):
    if c % 6 != 0: q.put(c, 16, '[')
for c in (40, 46, 52): q.put(c, 18, 'I')
q.put(42, 26, '0'); q.put(48, 26, '0')
# the crane in the middle, lights round the edge, the director's chair
q.put(30, 22, '('); q.put(30, 28, '`')
for c, r in [(2, 12), (59, 13), (2, 36), (59, 36), (20, 12), (41, 12)]: q.put(c, r, ')')
q.put(26, 37, 'x'); q.put(35, 37, 'x'); q.put(24, 37, 'm')
q.text(29, 39, 'DDDD')
out['stage'] = q.rows()

js = []
for k, rows in out.items():
    ws = {len(x) for x in rows}
    assert len(ws) == 1, (k, ws)
    js.append(k + ': ' + json.dumps(rows, indent=0).replace('\n', ' '))
open(sys.argv[1], 'w').write('\n'.join('      var GEN_' + k.upper() + ' = ' + json.dumps(v) + ';' for k, v in out.items()) + '\n')
for k, v in out.items():
    print(k); print('\n'.join(v)); print()
