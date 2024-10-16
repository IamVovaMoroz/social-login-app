import fastify from 'fastify';
import fetch from 'node-fetch';
import { adminSdk, QELOS_APP_URL } from './sdk';
import QelosSDK from '@qelos/sdk';
import jwt from 'jsonwebtoken';
require('dotenv').config();

const app = fastify({ logger: true });
const clientId = process.env.LINKEDIN_CLIENT_ID;
const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

app.get('/api/login', async (request, reply) => {
  // Check for the presence of the authorization code
  const { code } = request.query as { code?: string };
  
  // If the code is not provided, send the user the authorization URL
  if (!code) {
    console.log('LinkedIn Client ID:', clientId);
    console.log('LinkedIn Redirect URI:', redirectUri);
    if (!clientId || !redirectUri) {
      console.error('Missing LinkedIn Client ID or Redirect URI');
      return reply.status(500).send({ error: 'Missing LinkedIn Client ID or Redirect URI in environment variables' });
    }

    // Encode the redirect URI for the authorization URL
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    const authorizationUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodedRedirectUri}&scope=openid%20email%20profile&state=${state}`;
    console.log('Authorization URL:', authorizationUrl);

    // Return the authorization URL to the user
    return reply.send({ redirectUrl: authorizationUrl });
  }

  // If the code is provided, continue the authentication process
  console.log('Authorization code received:', code);
  const tokenUrl = `https://www.linkedin.com/oauth/v2/accessToken`;
  const bodyParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri || '',
    client_id: clientId || '',
    client_secret: clientSecret || '',
  });

  try {
    // Fetch the access token from LinkedIn
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
    });

    if (!tokenResponse.ok) {
      console.error('Error fetching access token');
      return reply.status(500).send({ error: 'Failed to retrieve access token' });
    }

    // Parse the token data from the response
    const tokenData = await tokenResponse.json();
    console.log('Token response:', tokenData);

    const idToken = tokenData.id_token;
    let userData;
    try {
      // Decode the ID token to get user data
      userData = jwt.decode(idToken);
      if (!userData || !userData.email) {
        throw new Error('Invalid token data: missing email');
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      return reply.status(500).send({ error: 'Failed to decode token' });
    }

    console.log('userData', userData);
    const email = userData.email;
    const firstName = userData.given_name;
    const lastName = userData.family_name;

    // Initialize Qelos SDK
    const newSdk = new QelosSDK({ fetch: fetch, appUrl: QELOS_APP_URL });
    let authData;

    try {
      // Attempt to authenticate the user in Qelos
      authData = await newSdk.authentication.oAuthSignin({ username: email, password: 'dummyPassword' });
    } catch (err) {
      // If the user does not exist, create a new user in Qelos
      console.log('User not found, creating new user in Qelos');
      try {
        await adminSdk.users.create({
          email,
          roles: ['user'],
          username: email,
          password: 'dummyPassword',
          firstName: firstName || 'FirstName',
          lastName: lastName || 'LastName',
        });
        console.log(`New user ${email} was created`);
      } catch (error) {
        console.error('Error creating user:', error);
      }

      // Retry authentication after user creation
      authData = await newSdk.authentication.oAuthSignin({ username: email, password: 'dummyPassword' });
    }

    // Redirect the user with a refresh token
    const redirectUrl = `${QELOS_APP_URL}/auth/callback?rt=${authData.payload.refreshToken}`;
    console.log('Redirect URL to be sent:', redirectUrl);
    reply.send({ redirectUrl });

  } catch (error) {
    console.error('Failed to retrieve access token from LinkedIn:', error);
    return reply.status(500).send({ error: 'Failed to retrieve access token from LinkedIn' });
  }
});

app.listen({ port: Number(process.env.PORT || 5500), host: 'localhost' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening on ${address}`);
});
