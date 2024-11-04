let IS_PROD = true;
const server = IS_PROD
  ? "https://deploy-w9cr.onrender.com/"
  : "http://localhost:8000";


export default server;
