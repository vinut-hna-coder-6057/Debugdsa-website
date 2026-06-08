import axios from "axios";

//////////////////////////////////////////////////
// CONSTANTS
//////////////////////////////////////////////////

const MAX_CODE_LENGTH = 10000;
const MAX_INPUT_LENGTH = 5000;
const JUDGE0_TIMEOUT = 15000;

//////////////////////////////////////////////////
// RUN CODE
//////////////////////////////////////////////////

export const runCode = async (req, res) => {
  try {

    const {
      code,
      language,
      input
    } = req.body;

    //////////////////////////////////////////////////
    // LANGUAGE MAP
    //////////////////////////////////////////////////

    const languageMap = {
      javascript: 63,
      python: 71,
      java: 62,
      cpp: 54
    };

    //////////////////////////////////////////////////
    // VALIDATION
    //////////////////////////////////////////////////

    if (!code || !language) {
      return res.status(400).json({
        message: "Code and language are required"
      });
    }

    if (!languageMap[language]) {
      return res.status(400).json({
        message: "Unsupported language"
      });
    }

    //////////////////////////////////////////////////
    // CODE SIZE LIMIT
    //////////////////////////////////////////////////

    if (code.length > MAX_CODE_LENGTH) {
      return res.status(400).json({
        message: "Code exceeds maximum allowed size"
      });
    }

    //////////////////////////////////////////////////
    // INPUT SIZE LIMIT
    //////////////////////////////////////////////////

    if (input && input.length > MAX_INPUT_LENGTH) {
      return res.status(400).json({
        message: "Input exceeds maximum allowed size"
      });
    }

    //////////////////////////////////////////////////
    // JUDGE0 API
    //////////////////////////////////////////////////

    const response = await axios.post(
      "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
      {
        source_code: code,
        language_id: languageMap[language],
        stdin: input || ""
      },
      {
        timeout: JUDGE0_TIMEOUT
      }
    );

    //////////////////////////////////////////////////
    // RESPONSE
    //////////////////////////////////////////////////

    return res.status(200).json(response.data);

  } catch (err) {

    if (err.code === "ECONNABORTED") {

      return res.status(504).json({
        message: "Code execution timed out"
      });

    }

    console.error(
      "CODE EXECUTION ERROR:",
      err.message
    );

    return res.status(500).json({
      message: "Execution failed"
    });

  }
};