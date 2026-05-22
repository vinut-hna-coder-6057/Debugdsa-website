import React, { useState } from "react";
import { motion } from "framer-motion";

const LiveSession = () => {
  const [requesting, setRequesting] = useState(false);

  return (
    <div className="live-container">
      <h2 className="live-title">Live Debug Session</h2>

      <div className="live-buttons">
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={() => setRequesting(true)}
          className="request-btn"
        >
          Request Live Help
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          className="help-btn"
        >
          Help Others
        </motion.button>
      </div>

      {requesting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="session-modal"
        >
          <h3>Waiting for a helper...</h3>
          <div className="loader"></div>
        </motion.div>
      )}
    </div>
  );
};

export default LiveSession;