function inWindow(target: Element): boolean {
  const { top, bottom } = target.getBoundingClientRect();
  return top < window.innerHeight && bottom > 0;
}

/* Motion loads once the page is idle, after the visitor has seen it painted. An entrance therefore plays only for content not seen yet: out of the window, it waits in its first state and plays as the content enters; in the window, the content keeps the state the page painted, since hiding it to play its entrance would replay what was already read. Returns the cleanup. */
export function enterUnseen(
  target: Element | null,
  buildEntrance: () => gsap.core.Animation,
): (() => void) | undefined {
  if (target === null || inWindow(target)) {
    return undefined;
  }
  const entrance = buildEntrance().pause();
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      entrance.play();
    }
  });
  observer.observe(target);
  return () => {
    observer.disconnect();
  };
}
