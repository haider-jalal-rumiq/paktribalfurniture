# Reference-led home motion

Status: complete  
Baseline: `c464e18`

## Goal

Translate the supplied furniture-film language into a responsive, accessible home-page sequence: a compact image expansion, masked editorial type, alternating catalogue reveals, an oversized material rail, and opposing custom-furniture panels. Preserve Pak Tribal Furniture's palette, content, routes, and the deliberately tight section spacing already present in the worktree.

## Reference breakdown

The 14.6-second reference uses five recurring devices: a small centered image expanding into the frame, oversized type arriving after the image establishes itself, image crops entering in opposite directions, modular product/detail tiles, and a full-bleed product scene backed by very large moving words. The site adaptation keeps those relationships but compresses the opening so navigation and calls to action are fully available within roughly 1.8 seconds.

## Implementation

### Shared motion — `src/components/motion/index.tsx`

- Use explicit entrance and morphing curves: `cubic-bezier(0.23, 1, 0.32, 1)` for reveals and `cubic-bezier(0.77, 0, 0.175, 1)` for panel/image movement.
- Keep animation on `transform` and `opacity` only.
- Add masked-line, tile, opposing-panel, and scroll-rail primitives; retain the existing generic reveal, stagger, and parallax APIs.
- Keep list staggering between 50 and 70 ms.
- Under `prefers-reduced-motion`, settle content immediately with no spatial transform.

### Hero — `src/components/home/hero.tsx`

- Replace the static split composition with an ink-backed editorial stage.
- Expand the centered living-room image from `scale(0.3)` to full size over about 1.05 seconds with the morphing curve.
- Reveal the two headline lines through overflow masks after the image establishes itself; follow with supporting copy and calls to action.
- Use a subtle information card entrance from the opposite side to echo the film's modular crops.
- Preserve the existing copy, links, image, and reduced top/bottom spacing intent.

### Supporting sections

- `category-showcase.tsx`: alternate tile origins and scale from `0.95` to `1` over 0.8 seconds.
- `materials.tsx`: introduce an oversized, decorative wood-name rail driven by scroll progress; mask-reveal each material row.
- `craft-and-custom.tsx`: bring the image and copy panels in from opposing vertical directions over 0.9 seconds.
- `featured-products.tsx`: reuse tile reveals while retaining its current compact section padding.
- `header.tsx` and `mobile-nav.tsx`: use a transparent, light-on-dark home state until the page scrolls, then return to the existing compact canvas header.

## Accessibility and performance boundaries

- No autoplay media, scroll hijacking, content delay, or new runtime dependency.
- All semantic content remains available in the DOM from first render.
- Reduced-motion mode removes expansion, parallax, and spatial reveals while keeping a short opacity settle.
- Decorative marquee text is hidden from assistive technology.
- Existing focus, contrast, mobile navigation, and route behavior remain unchanged.

## Verification

1. Run `npm run lint` and `npm run typecheck`.
2. Run `npm run build`.
3. Run `npm run verify` at its configured desktop, tablet, mobile, and reduced-motion profiles.
4. Inspect generated home-page screenshots for crop, headline contrast, tile rhythm, and horizontal overflow.
