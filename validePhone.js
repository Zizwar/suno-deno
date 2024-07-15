const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const fetchEnvironment = async () => {
  try {
    const response = await axios.get('https://clerk.suno.com/v1/environment?__clerk_framework_hint=nextjs&__clerk_framework_version=13.5.6&_clerk_js_version=4.73.3');
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

const fetchSignIn = async (phoneNumber) => {
  try {
    const response = await axios.post('https://clerk.suno.com/v1/client/sign_ins?_clerk_js_version=4.73.3', `identifier=%2B${phoneNumber}`);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

const prepareFirstFactor = async (signInAttemptId, phoneNumberId) => {
  try {
    const response = await axios.post('https://clerk.suno.com/v1/client/sign_ins/sia_2jFEafyR1ThceYjAVEj56niV7Iz/prepare_first_factor?_clerk_js_version=4.73.3', `phone_number_id=${phoneNumberId}&strategy=phone_code`);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

const attemptFirstFactor = async (signInAttemptId, code) => {
  try {
    const response = await axios.post('https://clerk.suno.com/v1/client/sign_ins/sia_2jFEafyR1ThceYjAVEj56niV7Iz/attempt_first_factor?_clerk_js_version=4.73.3', `strategy=phone_code&code=${code}`);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

const sendSegmentEvent = async (event) => {
  try {
    const response = await axios.post('https://segapi.clerk.com/v1/p', event);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

const main = async () => {
  const environment = await fetchEnvironment();
  console.log('Environment:', environment);

  rl.question('Enter phone number: ', async (phoneNumber) => {
    const signInAttempt = await fetchSignIn(phoneNumber);
    console.log('Sign in attempt:', signInAttempt);

    const preparedFirstFactor = await prepareFirstFactor(signInAttempt.response.id, signInAttempt.response.supported_first_factors[0].phone_number_id);
    console.log('Prepared first factor:', preparedFirstFactor);

    rl.question('Enter verification code: ', async (code) => {
      const attemptedFirstFactor = await attemptFirstFactor(signInAttempt.response.id, code);
      console.log('Attempted first factor:', attemptedFirstFactor);

      // Send Segment event
      const event = {
        timestamp: new Date().toISOString(),
        integrations: {
          "Segment.io": true
        },
        type: "page",
        properties: {
          path: "/sign-in/factor-one",
          referrer: "",
          search: "?redirect_url=https%3A%2F%2Fsuno.com%2Fcreate",
          title: "My account | Suno",
          url: "https://accounts.suno.com/sign-in/factor-one?redirect_url=https%3A%2F%2Fsuno.com%2Fcreate",
          surface: "Account Portal"
        },
        context: {
          // ... other context data
        },
        messageId: `ajs-next-${Date.now()}-8e320219-9a2b-49d1-b5cd-6a0ab9161e68`,
        anonymousId: `82818e32-0219-4a2b-89d1-75cd6a0ab916`,
        writeKey: "GHC5j9EImlsFgFvR5x9jlj4XissduHpH",
        userId: null,
        sentAt: new Date().toISOString()
      };
      const segmentResponse = await sendSegmentEvent(event);
      console.log('Segment event sent:', segmentResponse);

      rl.close();
    });
  });
};

main();