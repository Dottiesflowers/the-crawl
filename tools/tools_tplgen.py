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

# ---------------- Starship Valiant (front at the bottom: the airlock) ----------------
s = G(66, 38)
s.box(0, 0, 65, 36)
s.hwall(9, 0, 65); s.hwall(17, 0, 65); s.hwall(20, 0, 65); s.hwall(28, 0, 65)
s.vwall(21, 0, 9); s.vwall(44, 0, 9)
s.vwall(15, 9, 17); s.vwall(30, 9, 17); s.vwall(35, 9, 17); s.vwall(50, 9, 17)
s.vwall(30, 20, 36); s.vwall(35, 20, 36); s.vwall(21, 20, 28)
s.hwall(28, 0, 65)
# the spine: a corridor down the middle from the bridge to the airlock, and the cross corridor
s.fill(31, 9, 34, 36, '.'); s.fill(1, 18, 64, 19, '.')
for c in (31, 34): pass
s.hwall(17, 0, 30); s.hwall(17, 35, 65); s.hwall(20, 0, 30); s.hwall(20, 35, 65)
s.vwall(30, 9, 17); s.vwall(35, 9, 17); s.vwall(30, 20, 36); s.vwall(35, 20, 36)
s.fill(31, 9, 34, 9, 'D'); s.text(31, 36, 'DDDD')
for c, r in [(8, 17), (22, 17), (42, 17), (57, 17), (10, 20), (25, 20), (45, 20), (55, 20), (30, 32), (35, 32), (30, 24), (35, 24), (21, 5), (44, 5), (30, 13), (35, 13)]: s.put(c, r, 'D')
s.hwall(28, 0, 29); s.hwall(28, 36, 65)
s.windows(6, rows=[0, 36], cols=[0, 65])
# bridge (boss): consoles, the captain's chair, the viewscreen
for c in (24, 26, 28, 37, 39, 41): s.put(c, 1, 'y')
for c in (25, 27, 38, 40): s.put(c, 4, 'I')
s.put(32, 6, '_'); s.put(29, 7, 'I'); s.put(36, 7, 'I'); s.put(23, 7, 'L'); s.put(42, 7, 'L')
# briefing room and science lab
for c in range(6, 15): s.put(c, 5, 'm')
s.put(1, 4, 'y'); s.put(20, 2, 'p')
s.put(48, 3, 'q'); s.put(52, 3, 'q'); s.put(56, 3, 'q'); s.put(60, 6, 'J'); s.text(46, 8, 'ttt'); s.put(64, 4, 'f')
# med bay, captain's quarters, holodeck, transporter
s.text(1, 10, 'e.e.e'); s.put(14, 10, 'C'); s.put(14, 16, 'C'); s.put(7, 14, 'q')
s.put(16, 10, 'E'); s.put(18, 10, 'N'); s.put(25, 14, 'd'); s.put(28, 16, 'u'); s.put(29, 10, ';')
for c in (39, 43, 47): s.put(c, 13, ' ') if False else None
s.text(53, 11, '0.0.0'); s.text(55, 14, 'I')
# mess hall with a kitchen, crew quarters
s.text(1, 21, 'zZOicz'); s.put(4, 24, 'm'); s.put(8, 24, 'm'); s.put(12, 24, 'm'); s.put(16, 24, 'm'); s.put(20, 22, 'v')
s.put(22, 21, 'u'); s.put(28, 21, 'y')
for c in range(36, 65, 2): s.put(c, 21, 'b'); s.put(c, 27, 'b')
# cargo hold and engine room
for c, r in [(2, 30), (3, 30), (2, 31), (8, 30), (9, 30), (14, 34), (15, 34), (20, 30), (25, 33), (26, 33), (27, 33)]: s.put(c, r, 'x')
for c, r in [(5, 34), (11, 30), (22, 34)]: s.put(c, r, '%')
s.put(18, 34, 'R'); s.put(28, 30, 'R')
s.put(50, 32, '9'); s.put(44, 30, 'I'); s.put(56, 30, 'I'); s.put(64, 34, 'h'); s.put(36, 34, 'h')
out['ship'] = s.rows()

# ---------------- The Writers' Building (front at the bottom, onto the picket line) ----------------
w = G(62, 38)
w.box(0, 0, 61, 37)
w.hwall(11, 0, 61); w.hwall(14, 0, 61); w.hwall(24, 0, 61); w.hwall(27, 0, 61)
w.fill(1, 12, 60, 13, '.'); w.fill(1, 25, 60, 26, '.')
for c in (15, 30, 45): w.vwall(c, 0, 11)
w.vwall(41, 14, 24); w.vwall(23, 27, 37); w.vwall(38, 27, 37)
w.windows(4, rows=[0, 37], cols=[0, 61])
for c in (7, 22, 37, 53): w.put(c, 11, 'D')
for c in (10, 30, 50): w.put(c, 14, 'D')
for c in (12, 30, 50): w.put(c, 24, 'D')
for c in (12, 50): w.put(c, 27, 'D')
w.put(30, 27, 'D'); w.put(31, 27, 'D')
w.text(29, 37, 'DDDD')
w.put(0, 12, 'D'); w.put(61, 25, 'D')
# writers' rooms, the script library, the head writer's office
for c in range(4, 12): w.put(c, 5, 'm')
for c in range(19, 27): w.put(c, 5, 'm')
w.put(1, 2, 'y'); w.put(16, 2, 'y')
for c in range(31, 45, 2): w.put(c, 1, 't'); w.put(c, 10, 't')
w.put(38, 5, 'd')
w.put(52, 4, 'q'); w.put(58, 2, 'f'); w.put(47, 9, 'u'); w.put(57, 9, 'p'); w.put(50, 8, '{')
# cubicles
for r in (16, 19, 22):
    for c in range(3, 40, 4): w.put(c, r, 'q')
w.put(1, 15, 'f'); w.put(1, 23, 'f'); w.put(40, 15, 'p')
# break room
w.text(42, 15, 'zZOicz'); w.put(46, 19, 'm'); w.put(50, 19, 'm'); w.put(56, 22, 'v'); w.put(57, 22, 'v'); w.put(60, 17, 'u')
# strike headquarters, lobby with the stairs to the roof, mailroom
for c in range(4, 20, 4): w.put(c, 31, 'm')
w.put(1, 28, 'x'); w.put(2, 28, 'x'); w.put(22, 36, ';'); w.put(1, 36, 'x')
w.text(26, 32, 'KKKKKK'); w.put(25, 35, 'u'); w.put(36, 35, 'u'); w.put(24, 28, 'p'); w.put(37, 28, 'p'); w.fill(34, 28, 35, 29, 'k')
w.text(39, 28, 'fff'); w.text(55, 28, 'fff'); w.put(45, 32, 'q'); w.put(52, 32, 'q'); w.put(40, 36, 'x'); w.put(41, 36, '%'); w.put(60, 36, 'x')
out['writers'] = w.rows()

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
