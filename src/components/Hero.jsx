import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Image as ImageIcon } from 'lucide-react';

export const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-[#0a0a0a]">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Chat Securely. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                Connect Instantly.
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0">
              A modern real-time chat platform with end-to-end encryption, file sharing, and private messaging — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link 
                to="/signup" 
                className="px-8 py-4 text-lg font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a 
                href="#features" 
                className="px-8 py-4 text-lg font-medium text-white border border-white/20 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center"
              >
                See How it Works
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="w-full max-w-md mx-auto bg-[#111111] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2 bg-[#1a1a1a]">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="p-6 space-y-4">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">JD</div>
                  <div className="bg-[#1a1a1a] p-3 rounded-2xl rounded-tl-none text-sm text-gray-200">
                    Hey team! The new design looks amazing 🚀
                  </div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2 }}
                  className="flex gap-3 flex-row-reverse"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">ME</div>
                  <div className="bg-purple-600 p-3 rounded-2xl rounded-tr-none text-sm text-white">
                    Thanks! I'll upload the assets now.
                  </div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 3 }}
                  className="flex gap-3 flex-row-reverse"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">ME</div>
                  <div className="bg-purple-600 p-3 rounded-2xl rounded-tr-none text-sm text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> design-v2.fig
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
