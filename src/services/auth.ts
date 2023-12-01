import inquirer from 'inquirer';
import {
  IgLoginTwoFactorRequiredError,
  IgApiClient,
  AccountRepositoryLoginResponseLogged_in_user,
} from 'instagram-private-api';

export async function login(
  ig: IgApiClient,
): Promise<AccountRepositoryLoginResponseLogged_in_user | undefined> {
  try {
    const { username } = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Digite seu usuário do Instagram:',
      },
    ]);

    ig.state.generateDevice(username as string);

    const { password } = await inquirer.prompt([
      {
        type: 'input',
        name: 'password',
        message: 'Digite sua senha:',
      },
    ]);

    const login = await ig.account.login(username, password);

    return login;
  } catch (err) {
    if (err instanceof IgLoginTwoFactorRequiredError) {
      const {
        username,
        totp_two_factor_on: method2FA,
        two_factor_identifier: identifier2FA,
      } = err.response.body.two_factor_info;

      const verificationMethod = method2FA ? '0' : '1';

      const { code } = await inquirer.prompt([
        {
          type: 'input',
          name: 'code',
          message: `Digite o código 2FA recebido via ${
            verificationMethod === '1'
              ? 'SMS'
              : 'Autenticador (Google Auth, Authy, etc...)'
          }`,
        },
      ]);

      const login = await ig.account.twoFactorLogin({
        username,
        verificationCode: code,
        twoFactorIdentifier: identifier2FA,
        verificationMethod,
        trustThisDevice: '1',
      });

      return login;
    }

    console.error(
      '❌ Um erro ocorreu ao processar a autenticação de dois fatores.',
      err,
    );
  }
}
