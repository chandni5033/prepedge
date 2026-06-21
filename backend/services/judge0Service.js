const axios = require('axios');

const JUDGE0_URL  = 'https://judge0-ce.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.JUDGE0_API_KEY;

const headers = {
  'Content-Type':      'application/json',
  'X-RapidAPI-Key':    RAPIDAPI_KEY,
  'X-RapidAPI-Host':   'judge0-ce.p.rapidapi.com',
};


const LANGUAGE_IDS = {
  cpp:        54,  // C++ (GCC 9.2.0)
  python:     71,  // Python (3.8.1)
  java:       62,  // Java (OpenJDK 13.0.1)
  javascript: 63,  // JavaScript (Node.js 12.14.0)
};

// Status IDs returned by Judge0
const STATUS = {
  IN_QUEUE:   1,
  PROCESSING: 2,
  ACCEPTED:   3,
  WRONG:      4,
};


exports.runCode = async ({ source_code, language, stdin = '', expected_output = '' }) => {
  const language_id = LANGUAGE_IDS[language];
  if (!language_id) throw Object.assign(new Error(`Unsupported language: ${language}`), { statusCode: 400 });

  // 1. Create submission
  const { data: submission } = await axios.post(
    `${JUDGE0_URL}/submissions?base64_encoded=false`,
    {
      source_code,
      language_id,
      stdin:           stdin           || null,
      expected_output: expected_output || null,
      cpu_time_limit:  5,   
      memory_limit:    128000, 
    },
    { headers }
  );

  const token = submission.token;
  if (!token) throw new Error('Judge0 did not return a submission token');

  
  const MAX_POLLS = 20;
  const POLL_INTERVAL_MS = 1000;

  for (let i = 0; i < MAX_POLLS; i++) {
    await sleep(POLL_INTERVAL_MS);

    const { data: result } = await axios.get(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=false&fields=stdout,stderr,compile_output,status,time,memory`,
      { headers }
    );

    const statusId = result.status?.id;

    if (statusId === STATUS.IN_QUEUE || statusId === STATUS.PROCESSING) {
      continue; 
    }

    
    return {
      status:          result.status,
      stdout:          result.stdout          || '',
      stderr:          result.stderr          || '',
      compile_output:  result.compile_output  || '',
      time:            result.time            || null,
      memory:          result.memory          || null,
      
      passed: expected_output
        ? statusId === STATUS.ACCEPTED
        : null,
    };
  }

  throw Object.assign(new Error('Code execution timed out after 20 seconds'), { statusCode: 408 });
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}