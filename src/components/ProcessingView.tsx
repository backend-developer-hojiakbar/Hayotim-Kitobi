import { motion } from 'motion/react';
import { BookText } from 'lucide-react';

export default function ProcessingView() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-cream flex flex-col items-center justify-center space-y-12"
    >
      <div className="relative">
        {/* Animated Book Flipping */}
        <motion.div
          animate={{
            rotateY: [0, -180, -360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ perspective: 1000, transformStyle: "preserve-3d" }}
          className="w-32 h-44 bg-warm-brown rounded-r-lg shadow-2xl relative flex items-center justify-center border-l-8 border-deep-blue"
        >
          <BookText className="w-12 h-12 text-cream" />
          
          <motion.div 
            className="absolute inset-0 bg-white rounded-r-lg origin-left"
            animate={{ rotateY: [0, -180, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>

        {/* Floating Sparks */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-warm-brown rounded-full"
            animate={{
              x: [0, (i % 2 === 0 ? 100 : -100) * Math.random()],
              y: [0, -100 * Math.random()],
              opacity: [1, 0],
              scale: [1, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight text-deep-blue">Kitobingiz sahifalanmoqda...</h2>
        <p className="text-deep-blue/60 font-light flex items-center justify-center space-x-2">
          <span>AI xotiralaringizni adabiy matnga aylantirmoqda</span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            ● ● ●
          </motion.span>
        </p>
      </div>
    </motion.div>
  );
}
