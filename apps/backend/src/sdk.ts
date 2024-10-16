import QelosAdministratorSDK from '@qelos/sdk/dist/administrator'

export const QELOS_APP_URL = 'http://localhost:3000';
export const adminSdk = new QelosAdministratorSDK({ fetch: fetch, appUrl: QELOS_APP_URL });

adminSdk.authentication.oAuthSignin({ username: 'test@test.com', password: 'admin' }).then(() => {
  console.log('signin success to qelos')
})