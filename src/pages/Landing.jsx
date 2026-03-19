import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { Testimonials } from '../components/Testimonials';
import { Footer } from '../components/Footer';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { UserPlus, MessageCircle, Send } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <UserPlus className="w-8 h-8 text-purple-500" />,
      title: "Create Account",
      description: "Sign up in seconds for free with your email or Google account."
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-blue-500" />,
      title: "Join or Create Rooms",
      description: "Start group chats or find friends to connect with instantly."
    },
    {
      icon: <Send className="w-8 h-8 text-green-500" />,
      title: "Start Chatting",
      description: "Send messages, files, images, and more instantly."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#111111]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Get Started in 3 Simple Steps</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            It's incredibly easy to start using NexChat. Follow these simple steps to begin.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative flex flex-col items-center text-center z-10"
            >
              <div className="w-24 h-24 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6 border-4 border-[#111111] shadow-xl">
                {step.icon}
              </div>
              <div className="absolute top-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {index + 1}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
              <p className="text-gray-400">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Stats = () => {
  return (
    <section className="py-20 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Active Users", value: "10K+" },
            { label: "Messages Sent", value: "1M+" },
            { label: "Uptime", value: "99.9%" },
            { label: "Encryption", value: "256-bit" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#111111] p-8 rounded-2xl border border-white/5 text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-purple-500 mb-2">{stat.value}</div>
              <div className="text-gray-400 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTABanner = () => {
  return (
    <section className="py-24 bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-purple-900 to-purple-600 rounded-3xl p-12 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to start chatting?</h2>
            <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto">
              Join thousands of users already on NexChat. Experience secure, fast, and reliable communication today.
            </p>
            <Link
              to="/signup"
              className="inline-block px-10 py-4 text-lg font-bold text-purple-900 bg-white rounded-xl hover:bg-gray-100 transition-colors shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Get Started Free
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export const Landing = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500/30">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Stats />
      <CTABanner />
      <Footer />
    </div>
  );
};
