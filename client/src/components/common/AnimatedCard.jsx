import { motion } from "framer-motion";

export default function AnimatedCard({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      whileHover={{ scale: 1.01 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}