import React from "react";
import { motion } from "motion/react";

interface DialogueBoxProps {
  messages: string[];
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({ messages }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="dialogue-box flex flex-col">
      <div className="dialogue-label">Archive Dialogue</div>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-hide py-2"
      >
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="font-mono text-[13px] uppercase leading-tight text-retro-dark"
            >
              {msg}
            </motion.p>
          ))}
        </div>
      </div>
    </div>
  );
};
