#!/usr/bin/env python3
"""Single source of truth for the optimized One80 English speedometer mark."""
import math, os

NAVY="#13205A"; NAVY_BG="#0E2A6E"; RED="#E4222B"; WHITE="#FFFFFF"
MUTE_NAVY="#8FA0CC"; MUTE_LIGHT="#AAB4D6"
cx, cy, R = 140, 132, 80
def f(x): return f"{x:.2f}".rstrip('0').rstrip('.')
def pt(r, deg):
    a=math.radians(deg); return (cx+r*math.cos(a), cy-r*math.sin(a))

def mark(arc, accent, hub_in, tick, sw_arc=7, sw_tick=3):
    ticks=""
    for d in (150,120,90,60,30):
        i=pt(64,d); o=pt(73,d)
        ticks+=f'<line x1="{f(i[0])}" y1="{f(i[1])}" x2="{f(o[0])}" y2="{f(o[1])}"/>'
    e1=pt(R,180); e2=pt(R,0)
    ang=math.radians(-10); L=80; w=7
    tip=(cx+L*math.cos(ang), cy-L*math.sin(ang))
    pa=math.radians(-10+90)
    p1=(cx+w*math.cos(pa), cy-w*math.sin(pa))
    p2=(cx-w*math.cos(pa), cy+w*math.sin(pa))
    ta=math.radians(-10+180); tl=15
    tail=(cx+tl*math.cos(ta), cy-tl*math.sin(ta))
    needle=f'M{f(tail[0])} {f(tail[1])} L{f(p1[0])} {f(p1[1])} L{f(tip[0])} {f(tip[1])} L{f(p2[0])} {f(p2[1])} Z'
    return f'''<g fill="none" stroke="{tick}" stroke-width="{sw_tick}" stroke-linecap="round">{ticks}</g>
<path d="M{f(e1[0])} {f(e1[1])} A{R} {R} 0 0 1 {f(e2[0])} {f(e2[1])}" fill="none" stroke="{arc}" stroke-width="{sw_arc}" stroke-linecap="round"/>
<path d="{needle}" fill="{accent}" stroke="{accent}" stroke-width="1" stroke-linejoin="round"/>
<circle cx="{cx}" cy="{cy}" r="8" fill="{accent}"/><circle cx="{cx}" cy="{cy}" r="3.1" fill="{hub_in}"/>'''

FONT='<style>@import url("https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800&amp;display=swap");text{font-family:"Inter","Segoe UI",Arial,sans-serif}</style>'
def label180(c):
    return f'<text x="228" y="150" font-size="24" font-weight="800" fill="{c}" letter-spacing="-0.5">180<tspan font-size="13" dy="-8">°</tspan></text>'
def english(c):
    return f'<text x="140" y="206" text-anchor="middle" font-size="26" font-weight="700" fill="{c}" letter-spacing="13" dx="6.5">ENGLISH</text>'
def svg(vb, body, w=None, h=None):
    wh=f'width="{w}" height="{h}" ' if w else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" {wh}viewBox="{vb}" role="img" aria-label="One80 English">{FONT}{body}</svg>\n'

os.makedirs("optimized", exist_ok=True)
def write(n,c): open(f"optimized/{n}","w").write(c); print("wrote",n)

SYM_VB="44 42 244 120"; LOCK_VB="34 42 258 188"
write("lockup-reversed.svg", svg(LOCK_VB, mark(WHITE,RED,NAVY_BG,MUTE_NAVY)+label180(RED)+english(WHITE)))
write("lockup-light.svg",    svg(LOCK_VB, mark(NAVY,RED,WHITE,MUTE_LIGHT)+label180(RED)+english(NAVY)))
write("lockup-navy-tile.svg",svg("0 0 320 250", f'<rect width="320" height="250" rx="28" fill="{NAVY_BG}"/><g transform="translate(6,4)">'+mark(WHITE,RED,NAVY_BG,MUTE_NAVY)+label180(RED)+english(WHITE)+'</g>'))
write("symbol-reversed.svg", svg(SYM_VB, mark(WHITE,RED,NAVY_BG,MUTE_NAVY)+label180(RED)))
write("symbol-light.svg",    svg(SYM_VB, mark(NAVY,RED,WHITE,MUTE_LIGHT)+label180(RED)))
write("mono-white.svg",      svg(SYM_VB, mark(WHITE,WHITE,NAVY_BG,WHITE)+label180(WHITE)))
write("mono-navy.svg",       svg(SYM_VB, mark(NAVY,NAVY,WHITE,NAVY)+label180(NAVY)))
write("favicon.svg",         svg("0 0 300 300", f'<rect width="300" height="300" rx="60" fill="{NAVY_BG}"/><g transform="translate(-45,14) scale(1.4)">'+mark(WHITE,RED,NAVY_BG,MUTE_NAVY)+'</g>'))

# ---- construction / grid sheet (how pros present geometry) -------------
def construction():
    g="#C9D2EC"; gd="#9AA7D0"
    body=f'<rect x="40" y="36" width="208" height="170" fill="#FBFCFF" stroke="#E6EBF7"/>'
    body+=f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="{g}" stroke-width="1"/>'
    body+=f'<circle cx="{cx}" cy="{cy}" r="64" fill="none" stroke="{g}" stroke-width="1" stroke-dasharray="3 3"/>'
    body+=f'<line x1="{cx-100}" y1="{cy}" x2="{cx+108}" y2="{cy}" stroke="{g}" stroke-width="1"/>'
    body+=f'<line x1="{cx}" y1="{cy-100}" x2="{cx}" y2="{cy+20}" stroke="{g}" stroke-width="1"/>'
    for d in (150,120,90,60,30):
        o=pt(R+10,d)
        body+=f'<line x1="{cx}" y1="{cy}" x2="{f(o[0])}" y2="{f(o[1])}" stroke="{gd}" stroke-width="0.7" stroke-dasharray="2 3"/>'
    body+=mark(NAVY,RED,WHITE,MUTE_LIGHT)
    body+=f'<circle cx="{cx}" cy="{cy}" r="2" fill="{gd}"/>'
    return svg("40 32 216 180", body)
write("construction.svg", construction())
