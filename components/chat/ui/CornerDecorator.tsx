export default function CornerDecorator() {
  return (
    <div className="absolute bottom-0 top-0 w-full pointer-events-none">
      <div className="fixed right-0 top-0 max-sm:hidden">
        <div className="absolute top-3.5 h-32 w-full origin-top transition-all ease-snappy bg-noise bg-gradient-noise-top">
          <svg
            className="absolute -right-8 h-9 origin-top-left skew-x-[30deg] overflow-visible"
            version="1.1"
            viewBox="0 0 128 32"
            xmlnsXlink="http://www.w3.org/1999/xlink"
          >
            <line
              stroke="hsl(var(--gradient-noise-top\/80))"
              strokeWidth="2px"
              shapeRendering="optimizeQuality"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeMiterlimit="10"
              x1="1"
              y1="0"
              x2="128"
              y2="0"
            />
            <path
              stroke="hsl(var(--chat-border))"
              fill="hsl(var(--gradient-noise-top))"
              shapeRendering="optimizeQuality"
              strokeWidth="1px"
              strokeLinecap="round"
              strokeMiterlimit="10"
              vectorEffect="non-scaling-stroke"
              d="M0,0c5.9,0,10.7,4.8,10.7,10.7v10.7c0,5.9,4.8,10.7,10.7,10.7H128V0"
            />
          </svg>
        </div>
      </div>
    </div>
  );
} 