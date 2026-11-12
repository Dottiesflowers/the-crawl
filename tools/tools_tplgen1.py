#!/usr/bin/env python3
"""Draws the Floor 1 building templates (Processing Center, Imp Union Hall, Flooded Archive, Stairwell Gate)
and prints them as JS row arrays. Legend matches stamp() in v2_level.js; U = training dummy, 6 = brazier."""
import json, sys, random
_src = open(__file__.replace('tools_tplgen1.py', 'tools_tplgen.py')).read(); exec(_src[:_src.index('out = {}')])
random.seed(1970)
out, areas = {}, {}

def room_door(g, c, r): g.put(c, r, 'D')

# ---------------- The Processing Center: 70 x 70, halls in a cross, exits east and north ----------------
p = G(70, 70)
p.box(0, 0, 69, 69)
p.fill(33, 1, 36, 68, '.'); p.fill(1, 33, 68, 36, '.')              # the cross halls
p.vwall(32, 0, 69); p.vwall(37, 0, 69); p.hwall(32, 0, 69); p.hwall(37, 0, 69)
p.fill(33, 32, 36, 37, '.'); p.fill(32, 33, 37, 36, '.')             # open the crossing
p.fill(33, 1, 36, 31, '.'); p.fill(33, 38, 36, 68, '.'); p.fill(1, 33, 31, 36, '.'); p.fill(38, 33, 68, 36, '.')
p.vwall(16, 0, 32); p.hwall(16, 0, 32)                                 # NW: four rooms
p.vwall(53, 0, 32); p.hwall(16, 37, 69)                                # NE: four rooms
p.hwall(49, 0, 32); p.vwall(16, 37, 49); p.vwall(21, 49, 69)          # SW: medical, annex, green room, holding pen
p.hwall(53, 37, 69); p.vwall(53, 53, 69)                               # SE: theater, stage 3, loading dock
p.windows(6, rows=[0, 69], cols=[0, 69])
for c, r in [(8, 32), (24, 32), (8, 16), (32, 8), (32, 24), (24, 16), (45, 32), (61, 32), (37, 8), (37, 24), (61, 16), (45, 16),
             (8, 37), (24, 37), (32, 58), (21, 60), (26, 49), (37, 44), (52, 37), (45, 53), (61, 53)]: p.put(c, r, 'D')
p.text(69, 34, 'D'); p.put(69, 35, 'D'); p.put(34, 0, 'D'); p.put(35, 0, 'D')
# Intake (NW top-left): a counter and desks
p.text(3, 11, 'KKKKKKK'); p.put(3, 3, 'q'); p.put(7, 3, 'q'); p.put(11, 3, 'q'); p.put(1, 14, 'f'); p.put(15, 1, 'p'); p.text(2, 13, 'n..n')
# Contracts Office
for r in (3, 7, 11):
    for c in (19, 23, 27): p.put(c, r, 'q')
p.text(17, 1, 'ffff'); p.put(31, 14, 'p')
# Waiver Signing
for c in range(3, 15, 3): p.put(c, 21, 'q'); p.put(c, 26, 'q')
p.put(1, 31, 'f'); p.put(15, 18, 'p')
# Casting Office: a table and a screen
p.text(21, 24, 'mmmmm'); p.put(31, 24, 'y'); p.put(17, 18, 'l'); p.put(17, 31, 'u')
# Makeup & Prosthetics: mirrors (cabinets) and chairs
p.text(38, 1, 'C.C.C.C.C.C.C'); p.text(39, 4, 'q.q.q.q.q.q'); p.put(52, 14, ';'); p.put(38, 14, 'i')
# Wardrobe Department
p.text(55, 3, ';;;.;;;.;;;'); p.text(55, 8, ';;;.;;;.;;;'); p.text(54, 1, 'CCCC'); p.put(68, 14, 'u')
# Control Room
p.text(38, 17, 'yyyyIIIIyyyy'); for_c = [p.put(c, 22, 'q') for c in (40, 44, 48)]; p.put(52, 30, 'f')
# Prop Storage
for c, r in [(55, 18), (56, 18), (57, 18), (55, 19), (60, 22), (61, 22), (66, 18), (67, 18), (64, 27), (65, 27)]: p.put(c, r, 'x')
for c, r in [(58, 25), (68, 30), (55, 30)]: p.put(c, r, '%')
p.put(62, 30, 'R'); p.text(54, 31, 'hhh')
# Medical (Closed)
p.text(1, 38, 'e.e.e.e'); p.put(15, 38, 'C'); p.put(15, 48, 'i'); p.put(8, 45, 'q')
# Craft Services Annex
p.text(17, 38, 'zZOicz'); p.put(20, 44, 'm'); p.put(24, 44, 'm'); p.put(28, 44, 'm'); p.put(31, 48, 'v')
# The Green Room: where everyone wakes up (bunks, lockers, kitchen, TV, toilets, free food)
p.text(1, 50, 'XX.Qi.CCCCC'); p.put(20, 50, 'y')
for r in (53, 56, 59, 62): p.put(1, r, 'b')
p.put(18, 54, 'u'); p.put(18, 52, 'l'); p.text(7, 58, 'mmm'); p.text(4, 68, 'zZOcz.**'); p.put(20, 68, 'p')
# Holding Pen B: cells along the back
p.text(22, 51, 'e.#e.#e.#e'); p.text(22, 52, '..#..#..#.'); p.text(22, 53, 'jj#jj#jj#j')
p.put(31, 62, 'x'); p.put(31, 68, '%')
# Orientation Theater
for r in range(41, 52, 2):
    for c in range(40, 67):
        if c not in (52, 53): p.put(c, r, 'n')
p.text(50, 38, 'yyyy'); p.put(38, 38, 'p'); p.put(68, 38, 'p')
# Stage 3: training dummies and a weapon rack
for c, r in [(40, 58), (44, 58), (48, 58), (42, 63), (46, 63)]: p.put(c, r, 'U')
p.put(38, 68, 'M'); p.put(52, 68, 'M'); p.put(52, 55, 'x')
# Loading Dock
for c, r in [(55, 55), (56, 55), (55, 56), (60, 60), (61, 60), (66, 55), (67, 55), (67, 56), (58, 66), (59, 66), (64, 66)]: p.put(c, r, 'x')
for c, r in [(62, 57), (57, 63), (66, 64)]: p.put(c, r, '%')
p.put(68, 60, 'R'); p.put(55, 68, '!')
out['pc'] = p.rows()
areas['pc'] = [('Processing Halls', 1, 1, 68, 68, 'corridor'),
  ('Intake', 1, 1, 15, 15), ('Contracts Office', 17, 1, 31, 15), ('Waiver Signing', 1, 17, 15, 31), ('Casting Office', 17, 17, 31, 31),
  ('Makeup & Prosthetics', 38, 1, 52, 15), ('Wardrobe Department', 54, 1, 68, 15), ('Control Room', 38, 17, 52, 31), ('Prop Storage', 54, 17, 68, 31),
  ('Medical (Closed)', 1, 38, 15, 48), ('Craft Services Annex', 17, 38, 31, 48), ('The Green Room', 1, 50, 20, 68, 'safe'), ('Holding Pen B', 22, 50, 31, 68),
  ('Orientation Theater', 38, 38, 68, 52), ('Stage 3', 38, 54, 52, 68), ('Loading Dock', 54, 54, 68, 68)]

# ---------------- Imp Union Hall: 70 x 70, a grid of halls, exits west and north ----------------
u = G(70, 70)
u.box(0, 0, 69, 69)
for c in (21, 25, 44, 48): u.vwall(c, 0, 69)
for r in (21, 25, 44, 48): u.hwall(r, 0, 69)
u.fill(22, 1, 24, 68, '.'); u.fill(45, 1, 47, 68, '.'); u.fill(1, 22, 68, 24, '.'); u.fill(1, 45, 68, 47, '.')
blocks = [(1, 1, 20, 20), (26, 1, 43, 20), (49, 1, 68, 20), (1, 26, 20, 43), (26, 26, 43, 43), (49, 26, 68, 43), (1, 49, 20, 68), (26, 49, 43, 68), (49, 49, 68, 68)]
UN = ['Break Room', 'Locker Room', 'Grievance Office', 'Time Clock', 'Supply Closet', 'Night Shift Lounge', 'Union Archive', 'Overtime Pit', 'Cubicle Farm', 'Payroll',
      'Mailroom', 'HR (Abandoned)', 'Copy Room', 'Conference Room B', 'Water Cooler', 'Minutes Office', 'Strike Fund']
KIND = {'Break Room': 'break', 'Locker Room': 'locker', 'Grievance Office': 'meet', 'Time Clock': 'lobby', 'Supply Closet': 'store', 'Night Shift Lounge': 'lounge', 'Union Archive': 'files',
        'Overtime Pit': 'cube', 'Cubicle Farm': 'cube', 'Payroll': 'office', 'Mailroom': 'files', 'HR (Abandoned)': 'office', 'Copy Room': 'files', 'Conference Room B': 'meet',
        'Water Cooler': 'break', 'Minutes Office': 'office', 'Strike Fund': 'office'}
ua = [('Union Hall Corridors', 1, 1, 68, 68, 'corridor')]
ni = 0
def furnish(g, kind, c0, r0, c1, r1):
    w, h = c1 - c0 + 1, r1 - r0 + 1
    if kind == 'cube':
        for r in range(r0 + 1, r1, 3):
            for c in range(c0 + 1, c1, 3): g.put(c, r, 'q')
    elif kind == 'office':
        for r in range(r0 + 2, r1, 4):
            for c in range(c0 + 2, c1, 4): g.put(c, r, 'q')
        g.put(c0, r0, 'f'); g.put(c1, r0, 'f'); g.put(c1, r1, 'p')
    elif kind == 'break':
        g.text(c0, r0, 'zZOicz'[:max(1, w - 2)]); g.put(c0 + w // 2, r0 + h // 2, 'm'); g.put(c0 + w // 2 + 1, r0 + h // 2, 'm'); g.put(c1, r1, 'v')
    elif kind == 'locker':
        g.text(c0, r0, 'C' * min(w, 12)); g.text(c0 + 2, r0 + h // 2, 'n' * min(w - 4, 8)); g.put(c1, r1, 'Q')
    elif kind == 'meet':
        g.text(c0 + 3, r0 + h // 2, 'm' * min(w - 6, 10)); g.put(c0, r0 + h // 2, 'y'); g.put(c1, r0, 'p')
    elif kind == 'lobby':
        g.text(c0 + 2, r0 + 1, 'K' * min(w - 4, 8)); g.put(c0, r1, 'u'); g.put(c1, r1, 'u'); g.put(c1, r0, 'p'); g.put(c0 + 1, r0 + h // 2, 'n')
    elif kind == 'store':
        for k in range(min(w, 12)):
            g.put(c0 + k, r0, 'h' if k % 3 else 'x')
        g.put(c0 + 2, r1, '%'); g.put(c1 - 2, r1, 'x'); g.put(c1, r0 + h // 2, 'R')
    elif kind == 'lounge':
        g.put(c0 + w // 2, r0, 'y'); g.put(c0 + w // 2, r0 + 3, 'u'); g.put(c0, r1, 'u'); g.put(c1, r1, 'l'); g.put(c0, r0, 'p'); g.put(c1, r0 + 2, 'c')
    elif kind == 'files':
        for r in range(r0, r1 + 1, 3): g.text(c0 + 2, r, 'f' * min(w - 4, 10))
        g.put(c1, r1, 'x')
for bi, (c0, r0, c1, r1) in enumerate(blocks):
    if bi == 8:  # the Steward's office: the whole corner block
        u.put(58, 48, 'D'); u.put(48, 58, 'D')
        u.text(51, 51, 'tttttt'); u.put(58, 56, 'q'); u.put(57, 62, 'u'); u.put(60, 62, 'u'); u.put(67, 51, 'V'); u.put(50, 66, 'p'); u.put(67, 66, 'p'); u.put(62, 59, 'm'); u.put(63, 59, 'm')
        ua.append(('The Steward\'s Office', 49, 49, 68, 68, 'boss'))
        continue
    mid = (r0 + r1) // 2
    u.hwall(mid, c0, c1)
    for (rr0, rr1) in ((r0, mid - 1), (mid + 1, r1)):
        nm = UN[ni % len(UN)]; ni += 1
        ua.append((nm, c0, rr0, c1, rr1))
        furnish(u, KIND.get(nm, 'office'), c0 + 1, rr0 + 1, c1 - 1, rr1 - 1)
        # a door toward the nearest hall
        dc = (c0 + c1) // 2
        if rr0 == r0 and r0 > 1: u.put(dc, r0 - 1, 'D')
        elif rr1 == r1 and r1 < 68: u.put(dc, r1 + 1, 'D')
        else: u.put(c1 + 1 if c1 < 68 else c0 - 1, (rr0 + rr1) // 2, 'D')
u.windows(6, rows=[0, 69], cols=[0, 69])
u.text(0, 22, 'D'); u.put(0, 23, 'D'); u.put(0, 24, 'D'); u.put(23, 0, 'D'); u.put(22, 0, 'D'); u.put(24, 0, 'D')
out['union'] = u.rows(); areas['union'] = ua

# ---------------- The Flooded Archive: 70 x 74, nine halls of stacks, exits east, north and south ----------------
a = G(70, 74)
a.box(0, 0, 69, 73)
aa = [('Drowned Stacks', 1, 1, 68, 72, 'corridor')]
AN = ['Reading Pool', 'Wet Stacks', 'Card Catalog', 'Filing Sump', 'Microfiche Bog', 'Index Pond', 'Ledger Room', 'Damp Annex']
hw, hh = 19, 20
an = 0
for gi in range(3):
    for gj in range(3):
        c0, r0 = 2 + gi * (hw + 4), 2 + gj * (hh + 4)
        c1, r1 = c0 + hw - 1, r0 + hh - 1
        a.box(c0, r0, c1, r1)
        boss = gi == 0 and gj == 1
        nm = 'The Records Vault' if boss else AN[an]; an += 0 if boss else 1
        aa.append((nm, c0 + 1, r0 + 1, c1 - 1, r1 - 1, 'boss' if boss else 'room'))
        mc, mr = (c0 + c1) // 2, (r0 + r1) // 2
        a.put(mc, r0, 'D'); a.put(mc + 1, r0, 'D'); a.put(mc, r1, 'D'); a.put(mc + 1, r1, 'D'); a.put(c0, mr, 'D'); a.put(c1, mr, 'D')
        if boss:
            for c in range(c0 + 3, c1 - 1, 4): a.put(c, r0 + 3, '|'); a.put(c, r1 - 3, '|')
            a.put(c0 + 2, mr, 'V'); a.put(c1 - 3, mr, 'd'); a.put(c0 + 1, r0 + 1, '6'); a.put(c1 - 1, r1 - 1, '6')
        else:
            for r in range(r0 + 3, r1 - 2, 3):
                for c in range(c0 + 2, c1 - 1):
                    if (c - c0) % 7 not in (0, 1) and c not in (mc, mc + 1): a.put(c, r, 't')
            a.put(c0 + 1, r1 - 1, 'd'); a.put(c1 - 1, r0 + 1, random.choice('%x'))
for c in (1, 68):
    pass
a.windows(8, rows=[0, 73], cols=[0, 69])
a.put(69, 36, 'D'); a.put(69, 37, 'D'); a.put(35, 0, 'D'); a.put(36, 0, 'D'); a.put(35, 73, 'D'); a.put(36, 73, 'D')
out['archive'] = a.rows(); areas['archive'] = aa

# ---------------- The Stairwell Gate: 70 x 70; the Approach runs south to the Gate Concourse ----------------
s = G(70, 70)
s.box(29, 28, 40, 69)                           # the Approach
s.box(16, 4, 52, 28)                            # the Gatehouse
s.box(54, 1, 68, 16)                            # the Stairwell
s.box(52, 8, 54, 12); s.fill(52, 9, 54, 11, '.'); s.put(52, 10, 'D'); s.put(54, 10, 'D')   # a short passage
s.box(12, 42, 29, 56)                           # Last Chance Lounge
s.box(40, 46, 56, 60)                           # The Trophy Room
s.fill(31, 28, 38, 28, 'D')                     # the Gatehouse's great doors
s.put(29, 49, 'D'); s.put(40, 53, 'D')
s.fill(32, 69, 37, 69, 'D')                     # out to the Gate Concourse
s.put(61, 8, '$'); s.put(56, 3, '6'); s.put(66, 3, '6')
for r in range(31, 68, 4): s.put(30, r, '|'); s.put(39, r, '|')
for r in (36, 60): s.put(31, r, '6'); s.put(38, r, '6')
for c in range(20, 50, 5): s.put(c, 8, '|'); s.put(c, 24, '|')
s.put(17, 5, '6'); s.put(51, 5, '6'); s.put(17, 27, '6'); s.put(51, 27, '6'); s.put(34, 6, 'M'); s.put(30, 6, 'M'); s.put(38, 6, 'M')
s.text(13, 43, 'zZOc**'); s.put(13, 55, 'X'); s.put(14, 55, 'Q'); s.text(13, 47, 'b.b.b'); s.put(21, 51, 'm'); s.put(22, 51, 'm'); s.put(28, 43, 'y'); s.put(27, 46, 'u')
s.text(41, 47, 'MM.M.M'); s.put(48, 53, 'A'); s.put(55, 47, 'C'); s.put(55, 59, 'M'); s.put(41, 59, 'x')
s.windows(5, rows=[], cols=[])
out['gate'] = s.rows()
areas['gate'] = [('The Approach', 30, 29, 39, 68, 'hall'), ('The Gatehouse', 17, 5, 51, 27, 'boss'), ('The Stairwell', 55, 2, 67, 15, 'stairs'), ('Gate Passage', 53, 9, 53, 11, 'corridor'),
  ('Last Chance Lounge', 13, 43, 28, 55, 'safe'), ('The Trophy Room', 41, 47, 55, 59, 'room')]

lines = []
for k, rows in out.items():
    assert len({len(x) for x in rows}) == 1, k
    lines.append('      var GEN1_' + k.upper() + ' = ' + json.dumps(rows) + ';')
    ar = ', '.join('{ name: %s, c0: %d, r0: %d, c1: %d, r1: %d%s }' % (json.dumps(x[0]).replace('"', "'") if "'" not in x[0] else json.dumps(x[0]), x[1], x[2], x[3], x[4], (", type: '%s'" % x[5]) if len(x) > 5 else '') for x in areas[k])
    lines.append('      var GEN1_' + k.upper() + '_AREAS = [' + ar + '];')
open(sys.argv[1], 'w').write('\n'.join(lines) + '\n')
for k, v in out.items():
    print(k); print('\n'.join(v)); print()
