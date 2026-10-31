import { Link } from "react-router-dom";

const TILES = [
  { to: "/hindu-wedding", label: "Hindu Wedding", img: "/thumbs/cd18.jpg" },
  { to: "/christian-wedding", label: "Christian Wedding", img: "/thumbs/cd13.jpg" },
  { to: "/muslim-wedding", label: "Muslim Wedding", img: "/thumbs/cd22.jpg" },
  { to: "/birthday", label: "Birthday", img: "/thumbs/cd03.jpg" },
  { to: "/other-events?category=haldi", label: "Haldi", img: "/thumbs/cd14.jpg" },
  { to: "/other-events?category=sangeet", label: "Sangeet", img: "/thumbs/cd29.jpg" },
  { to: "/other-events?category=engagement", label: "Ring Ceremony", img: "/thumbs/cd26.jpg" },
  { to: "/other-events?category=reception", label: "Reception", img: "/thumbs/cd25.jpg" },
];

export default function CategoryTiles() {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-8">
      {TILES.map((t) => (
        <li key={t.label} className="text-center">
          <Link to={t.to} className="group block">
            <span className="mx-auto block aspect-square w-full max-w-[150px] overflow-hidden rounded-full border border-line bg-blush">
              <img src={t.img} alt="" loading="lazy" className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105" />
            </span>
            <span className="mt-3 inline-block text-sm font-medium group-hover:underline">{t.label} →</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
