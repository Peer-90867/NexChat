import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    quote: "NexChat is the best chat app I have ever used. Fast, clean and secure!",
    name: "Alex M",
    title: "Designer",
    initials: "AM",
    color: "bg-blue-500"
  },
  {
    quote: "Finally a chat app that respects privacy. Love the DM and group room feature!",
    name: "Sarah K",
    title: "Developer",
    initials: "SK",
    color: "bg-purple-500"
  },
  {
    quote: "Our whole team switched to NexChat. The file sharing is a game changer.",
    name: "James R",
    title: "Team Lead",
    initials: "JR",
    color: "bg-green-500"
  }
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Loved by Users Worldwide</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            See what our community has to say about their experience with NexChat.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#111111] p-8 rounded-2xl border border-white/5"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-300 text-lg italic mb-8">"{testimonial.quote}"</p>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${testimonial.color}`}>
                  {testimonial.initials}
                </div>
                <div>
                  <h4 className="text-white font-semibold">{testimonial.name}</h4>
                  <p className="text-gray-500 text-sm">{testimonial.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
