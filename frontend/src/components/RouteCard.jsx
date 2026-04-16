import iconClock from "../assets/icons/clock.svg";
import iconArrow from "../assets/icons/right-arrow.svg";

export default function RouteCard({ from, to, hours, price, badge, img }) {
  return (
    <div className="group bg-surface-container-lowest rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-500 border border-transparent hover:border-outline-variant/20">
      <div className="relative h-64 overflow-hidden bg-surface-container-high">
        {img && (
          <img
            src={img}
            alt={to}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        )}
        {badge && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-primary uppercase z-10">
            {badge}
          </div>
        )}
      </div>

      <div className="p-8">
        <h3 className="text-2xl font-bold text-on-surface mb-1">
          {from} → {to}
        </h3>
        <p className="text-secondary text-sm flex items-center gap-1">
          <img src={iconClock} alt="" className="w-4 h-4" />
          {hours} giờ di chuyển
        </p>
        <div className="flex items-center justify-between mt-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-secondary tracking-widest uppercase">
              CHỈ TỪ
            </span>
            <span className="text-2xl font-black text-primary">{price}</span>
          </div>
          <button className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
            <img
              src={iconArrow}
              alt=""
              className="w-5 h-5 group-hover:brightness-0 group-hover:invert transition-all duration-300"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
