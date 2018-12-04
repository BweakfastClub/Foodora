jest.mock('../../../src/models/users_model');
const rewire = require('rewire');
const usersModel = require('../../../src/models/users_model');
const usersController = require('../../../src/controllers/users_controller');

const usersControllerRewire = rewire('../../../src/controllers/users_controller');
/* eslint-disable no-underscore-dangle */
const verifyToken = usersControllerRewire.__get__('verifyToken');


describe('users controller unit tests', () => {
  let status;
  let json;
  let res;
  const email = 'user@email.com';
  const name = 'user';
  const password = '1234';
  const token = 'ADS455Asa432543kjdasj';

  beforeEach((done) => {
    status = jest.fn(() => res);
    json = jest.fn(() => res);
    res = {
      json,
      status,
    };
    done();
  });

  describe('verify token unit tests', () => {
    it('calls verify token', (done) => {
      usersModel.verifyToken.mockImplementation((paramToken, callback) => {
        expect(paramToken).toEqual(token);
        callback();
      });
      verifyToken(token, res);
      done();
    });

    it('recieves error for invalid token', (done) => {
      const invalidToken = 'notV41idt0ke9';
      usersModel.verifyToken.mockImplementation((paramToken, callback) => {
        expect(paramToken).toEqual(invalidToken);
        const expectedError = new Error();
        callback(expectedError);
      });

      verifyToken(invalidToken, res);

      expect(status.mock.calls[0]).toEqual([401]);
      expect(json.mock.calls[0]).toEqual([{
        error: 'Invalid or Missing Token, please include a valid token in the header',
      }]);
      done();
    });
  });

  describe('store users unit tests', () => {
    it('calls store users', (done) => {
      const returnToken = 'v41idt0ke9';
      usersModel.registerUser.mockImplementation(
        (paramName, paramEmail, paramPassword, callback) => {
          expect(paramName).toEqual(name);
          expect(paramEmail).toEqual(email);
          expect(paramPassword).toEqual(password);
          callback(null, returnToken);
        },
      );
      usersController.register({ body: { name, email, password } }, res);
      expect(json.mock.calls[0]).toEqual([{
        token: returnToken,
      }]);
      done();
    });

    it('does not calls store users due to missing password', (done) => {
      usersController.register({ body: { name, email } }, res);
      expect(status.mock.calls[0]).toEqual([400]);
      expect(json.mock.calls[0]).toEqual([{
        error: 'Email, name and Password must be provided',
      }]);
      done();
    });

    it('does not calls store users due to missing email', (done) => {
      usersController.register({ body: { name, password } }, res);
      expect(status.mock.calls[0]).toEqual([400]);
      expect(json.mock.calls[0]).toEqual([{
        error: 'Email, name and Password must be provided',
      }]);
      done();
    });

    it('does not calls store users due to missing name', (done) => {
      usersController.register({ body: { password, email } }, res);
      expect(status.mock.calls[0]).toEqual([400]);
      expect(json.mock.calls[0]).toEqual([{
        error: 'Email, name and Password must be provided',
      }]);
      done();
    });

    it('gives error when storing same user', (done) => {
      usersModel.registerUser.mockImplementationOnce(
        (paramName, paramEmail, paramPassword, callback) => {
          expect(paramName).toEqual(name);
          expect(paramEmail).toEqual(email);
          expect(paramPassword).toEqual(password);
          callback();
        },
      );

      usersModel.registerUser.mockImplementationOnce(
        (paramName, paramEmail, paramPassword, callback) => {
          const expectedError = new Error();
          expectedError.code = 11000;
          callback(expectedError);
        },
      );

      usersController.register({ body: { name, email, password } }, res);
      usersController.register({ body: { name, email, password } }, res);
      expect(status.mock.calls[1]).toEqual([409]);
      expect(json.mock.calls[1]).toEqual([{
        error: `${email} is already used, please use another email.`,
      }]);
      done();
    });

    it('gives error when store users fails', (done) => {
      usersModel.registerUser.mockImplementationOnce(
        (paramName, paramEmail, paramPassword, callback) => {
          expect(paramName).toEqual(name);
          expect(paramEmail).toEqual(email);
          expect(paramPassword).toEqual(password);
          const expectedError = new Error();
          callback(expectedError);
        },
      );

      usersController.register({ body: { name, email, password } }, res);
      expect(status.mock.calls[0]).toEqual([500]);
      done();
    });
  });

  describe('delete users unit tests', () => {
    it('calls delete users', (done) => {
      usersModel.deleteUser.mockImplementation((paramEmail, paramPassword, callback) => {
        expect(paramEmail).toEqual(email);
        expect(paramPassword).toEqual(password);
        callback();
      });
      usersController.deleteUser({ body: { name, email, password } }, res);
      done();
    });

    it('does not calls delete users due to missing password', (done) => {
      usersController.deleteUser({ body: { email } }, res);
      expect(status.mock.calls[0]).toEqual([400]);
      expect(json.mock.calls[0]).toEqual([{
        error: 'Email and Password must be provided',
      }]);
      done();
    });

    it('does not calls delete users due to missing email', (done) => {
      usersController.deleteUser({ body: { password } }, res);
      expect(status.mock.calls[0]).toEqual([400]);
      expect(json.mock.calls[0]).toEqual([{
        error: 'Email and Password must be provided',
      }]);
      done();
    });

    it('gives error when delete users fails', (done) => {
      usersModel.deleteUser.mockImplementation((paramEmail, paramPassword, callback) => {
        expect(paramEmail).toEqual(email);
        expect(paramPassword).toEqual(password);
        const expectedError = new Error();
        callback(expectedError);
      });

      usersController.deleteUser({ body: { email, password } }, res);
      expect(status.mock.calls[0]).toEqual([500]);
      done();
    });
  });

  describe('login users unit tests', () => {
    it('calls login', (done) => {
      const returnToken = 'v41idt0ke9';
      usersModel.login.mockImplementation((paramEmail, paramPassword, callback) => {
        expect(paramEmail).toEqual(email);
        expect(paramPassword).toEqual(password);
        callback(null, returnToken);
      });
      usersController.login({ body: { name, email, password } }, res);
      expect(json.mock.calls[0]).toEqual([{
        token: returnToken,
      }]);
      done();
    });

    it('does not calls login users due to missing password', (done) => {
      usersController.login({ body: { email } }, res);
      expect(status.mock.calls[0]).toEqual([400]);
      expect(json.mock.calls[0]).toEqual([{
        error: 'Email and Password must be provided',
      }]);
      done();
    });

    it('does not calls login users due to missing email', (done) => {
      usersController.login({ body: { password } }, res);
      expect(status.mock.calls[0]).toEqual([400]);
      expect(json.mock.calls[0]).toEqual([{
        error: 'Email and Password must be provided',
      }]);
      done();
    });

    it('gives error when login users fails', (done) => {
      usersModel.login.mockImplementation((paramEmail, paramPassword, callback) => {
        expect(paramEmail).toEqual(email);
        expect(paramPassword).toEqual(password);
        const expectedError = new Error();
        callback(expectedError);
      });

      usersController.login({ body: { email, password } }, res);
      expect(status.mock.calls[0]).toEqual([401]);
      done();
    });
  });

  describe('change users info unit tests', () => {
    const newPassword = 'pa$$word';

    it('calls change users info', (done) => {
      usersModel.verifyToken.mockImplementation((paramToken, callback) => {
        expect(paramToken).toEqual(token);
        callback(null, { email, name });
      });
      usersModel.authorizeUser.mockImplementation((
        { email: paramEmail, password: paramPassword },
        callback,
      ) => {
        expect(paramEmail).toEqual(email);
        expect(paramPassword).toEqual(password);
        callback();
      });
      usersModel.changeUserInfo.mockImplementation(
        (paramEmail, paramNewPassword, paramName, callback) => {
          expect(paramEmail).toEqual(email);
          expect(paramName).toEqual(name);
          expect(paramNewPassword).toEqual(newPassword);
          callback();
        },
      );
      usersController.changeUserInfo({
        body: { name, password, newPassword },
        headers: { token },
      }, res);
      done();
    });

    it('does not calls change users info due to missing password', (done) => {
      usersController.changeUserInfo({
        body: { name, newPassword },
        headers: { token },
      }, res);
      expect(status.mock.calls[0]).toEqual([401]);
      expect(json.mock.calls[0]).toEqual([{
        error: 'Password must be provided.',
      }]);
      done();
    });

    it('does not calls change users info due to missing name and missing new password', (done) => {
      usersController.changeUserInfo({
        body: { password },
        headers: { token },
      }, res);
      expect(status.mock.calls[0]).toEqual([400]);
      expect(json.mock.calls[0]).toEqual([{
        error: 'New password or new name must be provided.',
      }]);
      done();
    });

    it('gives error when verify token fails', (done) => {
      usersModel.verifyToken.mockImplementation((paramToken, callback) => {
        expect(paramToken).toEqual(token);
        const expectedError = new Error();
        callback(expectedError);
      });

      usersController.changeUserInfo({
        body: { name, password, newPassword },
        headers: { token },
      }, res);
      expect(status.mock.calls[0]).toEqual([401]);
      done();
    });

    it('gives error when authorize users fails', (done) => {
      usersModel.verifyToken.mockImplementation((paramToken, callback) => {
        expect(paramToken).toEqual(token);
        callback(null, { email, name });
      });
      usersModel.authorizeUser.mockImplementation((
        { email: paramEmail, password: paramPassword },
        callback,
      ) => {
        expect(paramEmail).toEqual(email);
        expect(paramPassword).toEqual(password);
        const expectedError = new Error();
        callback(expectedError);
      });

      usersController.changeUserInfo({
        body: { name, password, newPassword },
        headers: { token },
      }, res);
      expect(status.mock.calls[0]).toEqual([500]);
      done();
    });

    it('gives error when change users info fails', (done) => {
      usersModel.verifyToken.mockImplementation((paramToken, callback) => {
        expect(paramToken).toEqual(token);
        callback(null, { email, name });
      });
      usersModel.authorizeUser.mockImplementation((
        { email: paramEmail, password: paramPassword },
        callback,
      ) => {
        expect(paramEmail).toEqual(email);
        expect(paramPassword).toEqual(password);
        callback();
      });
      usersModel.changeUserInfo.mockImplementation(
        (paramEmail, paramNewPassword, paramName, callback) => {
          expect(paramEmail).toEqual(email);
          expect(paramName).toEqual(name);
          expect(paramNewPassword).toEqual(newPassword);
          const expectedError = new Error();
          callback(expectedError);
        },
      );

      usersController.changeUserInfo({
        body: { name, password, newPassword },
        headers: { token },
      }, res);
      expect(status.mock.calls[0]).toEqual([500]);
      done();
    });
  });
});
