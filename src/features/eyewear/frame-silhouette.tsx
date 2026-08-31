import type { Frame } from "@/features/eyewear/frames";
import { cn } from "@/lib/utils";

/**
 * Drawn stand-in for frame photography.
 *
 * The shop has no product photos yet, and a grey box reads as broken. This
 * draws the actual silhouette of each frame shape over a palette-matched wash,
 * so an un-photographed catalogue still looks deliberate — and it tells the
 * customer something true about the frame while they wait for the real shot.
 *
 * Delete this the day real photography lands: set `image` on the frame and
 * FrameCard will prefer it automatically.
 */

const LEFT = 108;
const RIGHT = 212;
const CY = 100;

/** Lens outline for one eye, centred on `cx`. */
function Lens({ shape, cx }: { shape: string; cx: number }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 3.2,
    strokeLinejoin: "round" as const,
  };

  switch (shape) {
    case "Round":
      return <circle cx={cx} cy={CY} r={38} {...common} />;

    case "Oval":
      return <ellipse cx={cx} cy={CY} rx={41} ry={30} {...common} />;

    case "Square":
      return (
        <rect x={cx - 38} y={CY - 33} width={76} height={66} rx={10} {...common} />
      );

    case "Rectangle":
      return (
        <rect x={cx - 42} y={CY - 27} width={84} height={54} rx={8} {...common} />
      );

    case "Cat eye":
      // Upswept outer top corner is the whole point of the shape.
      return (
        <path
          d={`M${cx - 40} ${CY - 14}
             C${cx - 40} ${CY - 34} ${cx - 22} ${CY - 32} ${cx + 6} ${CY - 30}
             L${cx + 44} ${CY - 36}
             C${cx + 46} ${CY - 16} ${cx + 42} ${CY + 6} ${cx + 24} ${CY + 24}
             C${cx + 4} ${CY + 38} ${cx - 34} ${CY + 32} ${cx - 40} ${CY - 14}Z`}
          {...common}
        />
      );

    case "Aviator":
      return (
        <path
          d={`M${cx - 42} ${CY - 26}
             L${cx + 42} ${CY - 26}
             C${cx + 44} ${CY + 4} ${cx + 26} ${CY + 34} ${cx - 2} ${CY + 34}
             C${cx - 30} ${CY + 34} ${cx - 44} ${CY + 6} ${cx - 42} ${CY - 26}Z`}
          {...common}
        />
      );

    case "Browline":
      return (
        <g>
          <path
            d={`M${cx - 42} ${CY - 24} L${cx + 42} ${CY - 24}`}
            stroke="currentColor"
            strokeWidth={9}
            strokeLinecap="round"
          />
          <path
            d={`M${cx - 40} ${CY - 22}
               C${cx - 40} ${CY + 12} ${cx - 24} ${CY + 30} ${cx} ${CY + 30}
               C${cx + 24} ${CY + 30} ${cx + 40} ${CY + 12} ${cx + 40} ${CY - 22}`}
            {...common}
            strokeWidth={2.4}
          />
        </g>
      );

    case "Wrap":
      return (
        <path
          d={`M${cx - 44} ${CY - 22}
             C${cx - 20} ${CY - 32} ${cx + 24} ${CY - 32} ${cx + 44} ${CY - 20}
             C${cx + 44} ${CY + 8} ${cx + 26} ${CY + 30} ${cx - 2} ${CY + 30}
             C${cx - 30} ${CY + 30} ${cx - 44} ${CY + 6} ${cx - 44} ${CY - 22}Z`}
          {...common}
        />
      );

    default:
      return (
        <rect x={cx - 40} y={CY - 28} width={80} height={56} rx={12} {...common} />
      );
  }
}

/** Category drives the wash, so the grid reads as varied rather than repeated. */
const WASH: Record<string, string> = {
  "Native Visions": "from-sage/25 via-canvas-deep to-ember/20",
  "Women's": "from-ember/20 via-canvas-deep to-clay/15",
  "Men's": "from-stone/25 via-canvas-deep to-sage/15",
  Sunglasses: "from-clay/25 via-canvas-deep to-ink/15",
  "Kids'": "from-ember/25 via-canvas-deep to-sage/20",
};

export function FrameSilhouette({
  frame,
  className,
}: {
  frame: Frame;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center bg-gradient-to-br p-6",
        WASH[frame.category] ?? "from-canvas-deep to-canvas",
        className,
      )}
    >
      <svg
        viewBox="0 0 320 200"
        className="w-full max-w-[19rem] text-ink/55"
        role="img"
        aria-label={`Illustration of the ${frame.name}, a ${frame.shape.toLowerCase()} frame`}
      >
        {/* Temple arms, folded back behind the lenses. */}
        <path
          d={`M${LEFT - 42} ${CY - 14} L${LEFT - 66} ${CY - 22} L${LEFT - 74} ${CY + 16}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={`M${RIGHT + 42} ${CY - 14} L${RIGHT + 66} ${CY - 22} L${RIGHT + 74} ${CY + 16}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Bridge. */}
        <path
          d={`M${LEFT + 42} ${CY - 16} C${LEFT + 58} ${CY - 26} ${RIGHT - 58} ${CY - 26} ${RIGHT - 42} ${CY - 16}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={3.2}
          strokeLinecap="round"
        />

        <Lens shape={frame.shape} cx={LEFT} />
        <Lens shape={frame.shape} cx={RIGHT} />
      </svg>

      <span className="absolute bottom-3 right-4 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-ink/30">
        Photo coming soon
      </span>
    </div>
  );
}
