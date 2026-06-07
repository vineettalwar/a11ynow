import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function registerScrollTrigger(): void {
  if (typeof window === "undefined" || registered) return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}
