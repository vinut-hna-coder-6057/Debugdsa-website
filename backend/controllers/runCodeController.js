import axios from "axios";

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
    // JUDGE0 API
    //////////////////////////////////////////////////

    const response = await axios.post(
      "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
      {
        source_code: code,
        language_id: languageMap[language],
        stdin: input || ""
      }
    );

    //////////////////////////////////////////////////
    // RESPONSE
    //////////////////////////////////////////////////

    res.json(response.data);

  } catch (err) {

    console.error(
      "CODE EXECUTION ERROR:",
      err.message
    );

    res.status(500).json({
      message: "Execution failed"
    });

  }
};