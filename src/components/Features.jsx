import { motion } from 'framer-motion';
import { Lock, Zap, FileImage, Users, MessageCircle, Activity } from 'lucide-react';

const features = [
  {
    icon: <Lock className="w-6 h-6 text-purple-500" />,
    title: "End-to-End Encrypted",
    description: "Your messages stay private always. We use industry-standard encryption to keep your data safe."
  },
  {
    icon: <Zap className="w-6 h-6 text-yellow-500" />,
    title: "Real-Time Messaging",
    description: "Instant delivery with zero delay. See when others are typing and read receipts instantly."
  },
  {
    icon: <FileImage className="w-6 h-6 text-blue-500" />,
    title: "File & Image Sharing",
    description: "Share anything up to 10MB. Images, documents, and videos supported natively."
  },
  {
    icon: <Users className="w-6 h-6 text-green-500" />,
    title: "Group Rooms",
    description: "Create rooms for teams and communities. Manage members and keep conversations organized."
  },
  {
    icon: <MessageCircle className="w-6 h-6 text-pink-500" />,
    title: "Private DMs",
    description: "One on one private conversations. Search for users and start chatting instantly."
  },
  {
    icon: <Activity className="w-6 h-6 text-red-500" />,
    title: "Online Presence",
    description: "See who is online in real time. Know exactly when your team is available."
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-24 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything You Need to Chat</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            NexChat provides all the tools you need for seamless communication, whether for work or personal use.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-[#111111] p-8 rounded-2xl border border-white/5 hover:border-purple-500/50 transition-all group"
            >
              <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
