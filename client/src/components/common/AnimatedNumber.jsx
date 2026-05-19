import { useSpring, animated } from "@react-spring/web";

export default function AnimatedNumber({ value, duration = 800 }) {
  const spring = useSpring({
    from: { value: 0 },
    to: { value },
    config: { duration, easing: (t) => 1 - Math.pow(1 - t, 3) },
  });

  return <animated.span>{spring.value.to(Math.round)}</animated.span>;
}
