import { HeartHandshake, Volume2, VolumeX } from "lucide-react";

export default function Header({ audioOn, onToggleAudio, onBrandClick }) {
  return (
    <header className="header">
      <a
        className="brand"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onBrandClick();
        }}
        aria-label="ApniBaat"
      >
        <span className="brand-icon">
          <HeartHandshake size={25} />
        </span>
        <span>
          ApniBaat<small>हर कदम पर, आपके साथ</small>
        </span>
      </a>
      <div className="header-actions">
        <span className="language">हिंदी</span>
        <button
          className={`audio-toggle ${audioOn ? "active" : ""}`}
          onClick={onToggleAudio}
          aria-pressed={audioOn}
        >
          {audioOn ? <Volume2 size={19} /> : <VolumeX size={19} />}
          <span>आवाज़ {audioOn ? "चालू" : "बंद"}</span>
        </button>
      </div>
    </header>
  );
}
