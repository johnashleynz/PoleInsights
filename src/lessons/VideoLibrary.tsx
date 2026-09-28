import { useEffect, useRef, useState } from "react";
import "./studio.css";
interface Film {
  id: string;
  title: string;
  subtitle: string;
  duration: number;
  chapters: { title: string; text: string; duration: number }[];
}
export default function VideoLibrary({onClose,showDetect=true}:{onClose:()=>void;showDetect?:boolean}) {
  const [films, setFilms] = useState<Film[]>([]),
    [selected, setSelected] = useState(0),
    [error, setError] = useState(""),
    video = useRef<HTMLVideoElement>(null),
    close = useRef<HTMLButtonElement>(null),
    previous = useRef<HTMLElement | null>(null);
  useEffect(() => {
    previous.current = document.activeElement as HTMLElement;
    close.current?.focus();
    fetch(import.meta.env.BASE_URL + "videos/manifest.json")
      .then((r) => {
        if (!r.ok) throw Error("Video library unavailable");
        return r.json();
      })
      .then(setFilms)
      .catch((e) => setError(e.message));
    return () => previous.current?.focus();
  }, []);
  const visible = showDetect ? films : films.filter((f)=>!/(ub1000|safe2climb|ultrasound)/i.test(`${f.id} ${f.title} ${f.subtitle}`)),
    film = visible[selected] ?? visible[0],
    base = import.meta.env.BASE_URL + "videos/";
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="modal video-library"
        role="dialog"
        aria-modal="true"
        aria-label="Narrated videos"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Tab") {
            const items = Array.from(
              e.currentTarget.querySelectorAll<HTMLElement>(
                "button,a,video,summary",
              ),
            ).filter((el) => el.getClientRects().length);
            const i = items.indexOf(document.activeElement as HTMLElement);
            if (e.shiftKey && i === 0) {
              e.preventDefault();
              items.at(-1)?.focus();
            } else if (!e.shiftKey && i === items.length - 1) {
              e.preventDefault();
              items[0]?.focus();
            }
          }
        }}
      >
        <button ref={close} className="close-video" onClick={onClose}>
          Close videos
        </button>
        <h2>Watch and explore</h2>
        <p>Short films from the Pole Laboratory · UK narration</p>
        <div className="video-select">
          {visible.map((f, i) => (
            <button
              key={f.id}
              className={film?.id === f.id ? "selected" : ""}
              aria-pressed={film?.id === f.id}
              onClick={() => {
                setSelected(i);
                setError("");
              }}
            >
              <strong>{f.title}</strong>
              <small>{Math.round(f.duration)} seconds</small>
            </button>
          ))}
        </div>
        {film && (
          <>
            <video
              ref={video}
              key={film.id}
              controls
              playsInline
              preload="metadata"
              poster={base + film.id + ".jpg"}
              aria-label={film.title}
              onError={() =>
                setError(
                  "This video could not be loaded. Try the MP4 download below.",
                )
              }
            >
              <source src={base + film.id + ".mp4"} type="video/mp4" />
              <track
                kind="captions"
                src={base + film.id + ".vtt"}
                srcLang="en"
                label="English"
              />
            </video>
            <div className="video-meta">
              <span>{film.subtitle}</span>
              <a href={base + film.id + ".mp4"} download>
                Download MP4
              </a>
            </div>
            <details className="video-transcript">
              <summary>Transcript and chapters</summary>
              {film.chapters.map((c, i) => (
                <div key={c.title}>
                  <h3>
                    <button
                      onClick={() => {
                        if (video.current) {
                          video.current.currentTime = film.chapters
                            .slice(0, i)
                            .reduce((a, q) => a + q.duration, 0);
                          void video.current.play();
                        }
                      }}
                    >
                      {c.title}
                    </button>
                  </h3>
                  <p>{c.text}</p>
                </div>
              ))}
            </details>
            <p className="field-note">
              P26 films · P25 app footage. Example inputs
              {showDetect && ", simulated ultrasound and prototype inspection records"} remain identified. These
              demonstrations do not provide fracture predictions or climbing
              clearance.
            </p>
          </>
        )}
        {error && <p role="alert">{error}</p>}
      </section>
    </div>
  );
}
