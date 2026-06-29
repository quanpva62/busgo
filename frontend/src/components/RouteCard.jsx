import iconClock from "../assets/icons/clock.svg";
import iconArrow from "../assets/icons/right-arrow.svg";

export default function RouteCard({ from, to, hours, price, badge, img }) {
  return (
    <div className="group bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant hover:border-primary transition-colors">
      <div className="relative h-52 overflow-hidden bg-surface-container-high">
        {img && <img src={img} alt={to} className="w-full h-full object-cover" />}
        {badge && (
          <div className="absolute top-3 left-3 bg-white px-3 py-1 rounded-md text-xs font-bold text-primary z-10">
            {badge}
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-on-surface mb-1">
          {from} → {to}
        </h3>
        <p className="text-secondary text-sm flex items-center gap-1">
          <img src={iconClock} alt="" className="w-4 h-4" />
          {hours} giờ di chuyển
        </p>
        <div className="flex items-center justify-between mt-5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm text-secondary">Chỉ từ</span>
            <span className="text-xl font-bold text-primary">{price}</span>
          </div>
          <button className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center group-hover:bg-primary transition-colors">
            <img
              src={iconArrow}
              alt=""
              className="w-5 h-5 group-hover:brightness-0 group-hover:invert transition-all"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
